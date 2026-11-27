'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const model=require('../cloud-model.js');
const core=require('../script.js');
test('cloud wallet: replay of two-device reward and exchange preserves unique achievements',()=>{
 let w=model.emptyWallet();
 for(const entry of core.courseLessons['m1-l1'].entries)w=model.addReward(w,'words',entry.id);
 for(const task of core.assemblyTasks.filter(t=>w.words.includes(t.id)).slice(0,2))w=model.addReward(w,'sentences',task.id);
 assert.equal(model.balance(w),140);
 const replay=model.addReward(w,'words',w.words[0]);assert.equal(replay,w);
 const exchanged=model.exchange(w,140,'2026-11-27T10:00:00.000Z');assert.equal(model.balance(exchanged),0);assert.equal(model.earned(exchanged),140);
 assert.equal(model.addReward(exchanged,'words',w.words[0]),exchanged);
 assert.throws(()=>model.exchange(exchanged,140,'date'));
 const concurrent=model.addReward(w,'words',core.courseLessons['m1-l2'].entries[0].id);
 assert.throws(()=>model.exchange(concurrent,140,'date'),/изменился/);
 assert.equal(model.balance(concurrent),150);assert.equal(model.balance(w),140);
});
test('cloud result merge: independent devices retain best levels without mixing one attempt stages',()=>{
 const old={signature:'same',cards:{firstTryCorrect:18,errors:3,total:20},sentences:{firstTryCorrect:16,englishFirstTry:9,translationFirstTry:7,errors:4,total:20}};
 const candidate={signature:'same',cards:{firstTryCorrect:17,errors:3,total:20},sentences:{firstTryCorrect:17,englishFirstTry:7,translationFirstTry:10,errors:3,total:20}};
 const merged=model.mergeResults(old,candidate);assert.deepEqual(merged.cards,old.cards);assert.deepEqual(merged.sentences,candidate.sentences);
 assert.deepEqual(model.mergeResults(merged,old),merged);assert.equal(old.sentences.englishFirstTry,9);
});
test('import: server-compatible backup validates and invalid reward IDs cannot be imported',()=>{
 const source={version:1,words:[core.courseEntries[0].id],sentences:[],exchanges:[]};
 const load=value=>new core.SlovariWallet({getItem:()=>JSON.stringify(value)});
 assert.equal(load(source).balance,10);assert.equal(load({...source,words:['alien']}).blocked,true);
 assert.equal(load({...source,words:[source.words[0],source.words[0]]}).blocked,true);
 assert.equal(load({...source,exchanges:[{amount:20,date:new Date().toISOString()}]}).blocked,true);
});

test('participants: legacy compatibility, archive generation and idempotent restoration preserve data',()=>{
 const wallet=model.addReward(model.emptyWallet(),'words',core.courseEntries[0].id);
 const original={name:'Алия',wallet,activity:true};
 assert.equal(model.isActive(original),true);assert.equal(model.accessVersion(original),0);
 assert.equal(model.participantName('  Әлия  '),'Әлия');
 for(const value of ['', '   ', 'а'.repeat(41),null])assert.throws(()=>model.participantName(value));
 const archived=model.archiveParticipant(original,true);
 assert.equal(archived.archived,true);assert.equal(archived.accessVersion,1);assert.equal(archived.wallet,wallet);
 assert.equal(model.archiveParticipant(archived,true),archived);
 assert.throws(()=>model.requireActive(archived,0),/отключён/);
 const restored=model.archiveParticipant(archived,false);
 assert.equal(restored.accessVersion,1);assert.equal(restored.wallet,wallet);
 assert.throws(()=>model.requireActive(restored,0),/отключён/);
 assert.equal(model.requireActive(restored,1),restored);
 assert.equal(model.archiveParticipant(restored,false),restored);
 assert.equal(model.archiveParticipant(restored,true).accessVersion,2);
 assert.equal(model.balance(restored.wallet),10);
});
