'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {SentenceGame,tasksFor,wordKey,SlovariWallet,walletStorageKey,courseEntries,CourseProgress,courseLessons}=require('../script.js');
const model=require('../cloud-model.js');
function game(text='бір екі үш төрт бес алты жеті сегіз'){
 const original=tasksFor('m1-l1')[0],task={...original,translations:{kk:{text,variants:[text]},ru:{text,variants:[text]}}};
 const sg=new SentenceGame([task],()=>.37);sg.answer(sg.task.answer);return sg;
}
function wrong(sg){
 const free=sg.tiles.filter(t=>!sg.locked.includes(t.id)).map(t=>t.id);
 for(let i=0;i<free.length;i++)for(let j=i+1;j<free.length;j++){
  const order=[...free];[order[i],order[j]]=[order[j],order[i]];
  const ids=sg.tiles.map(t=>sg.locked.includes(t.id)?t.id:order.shift());
  const key=wordKey(ids.map(id=>sg.tiles[id].text).join(' '));
  if(key===wordKey(sg.translation.text)||sg.translation.variants.some(v=>wordKey(v)===key))continue;
  sg.clear();ids.filter(id=>!sg.locked.includes(id)).forEach(id=>sg.pick(id));
  assert.equal(sg.canCheck,true);sg.check();return;
 }
 throw Error('No wrong assembly remains');
}
test('3/5/8: exact thresholds, locked slots, repeated check, clear, completion and honest score',()=>{
 const sg=game();let awards=0;sg.onReward=()=>awards++;
 for(let n=1;n<=8;n++){
  wrong(sg);assert.equal(sg.translationErrors,n);const errors=sg.errors;sg.check();assert.equal(sg.errors,errors);
  if(n<3)assert.deepEqual(sg.locked,[]);
  if(n>=3&&n<5)assert.deepEqual(sg.locked,[0,7]);
  if(n>=5)assert.deepEqual(sg.locked,[0,7,3]);
  if(n<8){assert.equal(sg.phase,'translation');sg.clear();for(const id of sg.locked){sg.remove(id);assert.equal(sg.selected[id],id);}assert.equal(sg.selected.filter(id=>id!==null).length,sg.locked.length);}
 }
 assert.equal(sg.phase,'translated');assert.equal(sg.revealed,true);assert.equal(sg.revealedTranslations,1);assert.equal(sg.translationFirstTry,0);assert.equal(awards,0);
 sg.advance();assert.equal(sg.phase,'complete');assert.equal(sg.firstTryCorrect,1);
});
test('short and identical-token sentences reveal when no meaningful rearrangement remains',()=>{
 for(const text of ['бір екі','бір екі үш','бір де де екі']){
  const sg=game(text);for(let i=0;i<3;i++)wrong(sg);
  assert.equal(sg.phase,'translated');assert.equal(sg.revealed,true);assert.equal(sg.revealedTranslations,1);
 }
});
test('purchased positions restore once, keep token identity, and count as assisted rather than independent',()=>{
 const sg=game('бір де үш де бес алты жеті сегіз');for(let i=0;i<3;i++)wrong(sg);
 const h={entry:sg.task.id,lang:sg.task.translationLang,position:1};sg.restoreHints({a:h});assert.ok(sg.locked.includes(1));
 sg.pick(2);const before=[...sg.selected];sg.restoreHints({a:h});assert.deepEqual(sg.selected,before);
 sg.clear();sg.tiles.filter(t=>!sg.locked.includes(t.id)).forEach(t=>sg.pick(t.id));sg.check();
 assert.equal(sg.phase,'translated');assert.equal(sg.assistedTranslations,1);assert.equal(sg.translationFirstTry,0);assert.equal(sg.independentTranslations,0);
 sg.advance();assert.equal(sg.phase,'complete');
 const clean=game();clean.tiles.forEach(t=>clean.pick(t.id));clean.check();assert.equal(clean.independentTranslations,1);
});
test('all course lessons can finish with eight failures each, preserve quotas and persist truthful results',()=>{
 for(const lesson of Object.values(courseLessons)){
  const sg=new SentenceGame(tasksFor(lesson.id),()=>.37);const count=lesson.entries.length;
  assert.equal(sg.deck.filter(t=>t.translationLang==='ru').length,2);assert.equal(sg.deck.filter(t=>t.translationLang==='kk').length,count-2);
  let guard=0;while(sg.phase!=='complete'){
   assert.ok(++guard<200);sg.answer(sg.task.answer);
   while(sg.phase==='translation')wrong(sg);
   assert.equal(sg.revealed,true);sg.advance();
  }
  assert.equal(sg.translationFirstTry,0);assert.equal(sg.revealedTranslations,count);
  const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},p=new CourseProgress(storage);
  p.record(lesson.id,'sentences',sg);assert.equal(p.results[lesson.id].sentences.translationFirstTry,0);
  assert.equal(new CourseProgress(storage).results[lesson.id].sentences.firstTryCorrect,count);
 }
});
test('local purchase: version 1 migration, replay, F5, exchange remainder, insufficient funds and denied writes',()=>{
 const task=tasksFor('m1-l1')[0],values=new Map();let old=model.emptyWallet();old=model.addReward(old,'words',courseEntries[0].id);
 values.set(walletStorageKey,JSON.stringify(old));const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 const w=new SlovariWallet(storage);assert.equal(w.buyHint(task.id,'kk',1),true);assert.equal(w.balance,5);assert.equal(w.earned,10);
 assert.equal(w.buyHint(task.id,'kk',1),true);assert.equal(w.balance,5);
 const restored=new SlovariWallet(storage);assert.equal(restored.blocked,false);assert.equal(restored.balance,5);
 assert.equal(restored.exchange(5),true);assert.equal(restored.balance,0);assert.equal(restored.buyHint(task.id,'kk',2),false);
 assert.equal(new SlovariWallet(storage).blocked,false);assert.equal(new SlovariWallet(storage).balance,0);
 assert.equal(w.buyHint(task.id,'kk',2),false);assert.equal(w.blocked,true); // stale tab cannot overwrite an exchange
 const denied=new SlovariWallet({getItem:()=>JSON.stringify(old),setItem(){throw Error('denied');}});
 assert.equal(denied.buyHint(task.id,'kk',1),false);assert.equal(denied.balance,10);
 assert.equal(new SlovariWallet({getItem:()=>JSON.stringify({...restored.state,spent:0})}).blocked,true);
});
