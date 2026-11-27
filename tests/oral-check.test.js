'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const oral=require('../oral-check.js'),{courseEntries}=require('../script.js');
test('oral plan: 5/10/15 unique records, every source, both target languages and no private fields in public prompt',()=>{
 for(const count of [5,10,15])for(const from of ['en','kk','ru','random']){
  const tasks=oral.plan(courseEntries,count,from);assert.equal(tasks.length,count*2);assert.equal(new Set(tasks.map(t=>t.entry)).size,count);
  for(let i=0;i<tasks.length;i+=2){const a=tasks[i],b=tasks[i+1];assert.equal(a.entry,b.entry);assert.equal(a.from,b.from);assert.notEqual(a.to,b.to);assert.notEqual(a.from,a.to);assert.notEqual(b.from,b.to);if(from!=='random')assert.equal(a.from,from);}
  let s={id:'test',tasks,step:0,grades:[],status:'active'};
  assert.ok(!('tasks' in oral.publicState(s)));assert.ok(!('answer' in oral.publicState(s)));
  for(let i=0;i<tasks.length;i++)s=oral.advance(s,i,i%3);
  assert.equal(s.status,'completed');assert.throws(()=>oral.advance(s,s.step,0));assert.ok(!('prompt' in oral.publicState(s)));
 }
 assert.throws(()=>oral.advance({status:'active',step:2},1,0));
});
