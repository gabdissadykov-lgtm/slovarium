'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const prep=require('../preparation.js'),core=require('../script.js');
function storage(){const map=new Map();return {map,getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};}
class Element{
 constructor(){this.events={};this.children=[];this.dataset={};this.hidden=false;this.attributes={};this.value='';this._text='';this.classList={toggle(){}};}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}set textContent(v){this._text=v;this.children=[];}
 append(...c){this.children.push(...c);}replaceChildren(...c){this._text='';this.children=c;}setAttribute(k,v){this.attributes[k]=v;}removeAttribute(k){delete this.attributes[k];}
 addEventListener(k,fn){this.events[k]=fn;}removeEventListener(k,fn){if(this.events[k]===fn)delete this.events[k];}focus(){}querySelectorAll(){return this.children;}click(){if(!this.disabled)this.events.click?.();}
}
function session(store=storage()){
 const e={};for(const [,id]of fs.readFileSync('index.html','utf8').matchAll(/id="([^"]+)"/g)){e[id]=new Element();e[id].id=id;}
 const window={localStorage:store,addEventListener(){},removeEventListener(){},clearTimeout(){}};
 const context={window,document:{addEventListener(){},removeEventListener(){},getElementById:id=>e[id],createElement:()=>new Element(),createTextNode:t=>{const x=new Element();x.textContent=t;return x;}}};
 vm.createContext(context);vm.runInContext(fs.readFileSync('preparation.js','utf8'),context);vm.runInContext(fs.readFileSync('script.js','utf8'),context);
 return {e,store};
}
test('local preparation is independent per word/sentence, persists self-assessment and tolerates unavailable storage',()=>{
 const s=storage(),a=new prep.LocalPreparation(s,core.courseEntries);a.set('words','m1-r001',true);a.set('sentences','m1-r001',false);assert.equal(a.getKnown('words','m1-r001'),true);assert.equal(a.getKnown('sentences','m1-r001'),false);
 const b=new prep.LocalPreparation(s,core.courseEntries);assert.equal(b.getKnown('words','m1-r001'),true);a.set('words','invalid',true);assert.equal(Object.keys(a.state).length,2);assert.equal(s.map.size,1);
 const denied=new prep.LocalPreparation({getItem(){throw Error();},setItem(){throw Error();}},core.courseEntries);denied.set('words','m1-r001',true);assert.equal(denied.saved,false);assert.match(denied.message,/не сохранены/);assert.equal(denied.getKnown('words','m1-r001'),true);
});
test('all modules have materials; language, lesson, revealed translations, self-assessment and sentence assembly do not pay',()=>{
 const {e,store}=session();for(let i=0;i<9;i++){e.modules.children[i].click();assert.equal(e['module-hub'].hidden,false);assert.equal(e['materials-panel'].hidden,false);assert.equal(e['course-lessons'].hidden,true);assert.ok(e['material-card'].textContent);e['back-modules'].click();}
 e.modules.children[0].click();e['material-language'].value='kk';e['material-language'].events.change();assert.ok(e['material-card'].children.some(p=>p.lang==='kk'));
 e['material-reveal'].click();assert.match(e['material-card'].textContent,/English:|Русский:/);e['material-known'].click();assert.equal(JSON.parse(store.getItem(prep.key))['words_m1-r001'].known,true);assert.ok(Object.values(JSON.parse(store.getItem(prep.key))).some(v=>v.known));
 e['material-kind'].value='sentences';e['material-kind'].events.change();e['material-reveal'].click();assert.match(e['material-card'].textContent,/Қазақша:/);assert.match(e['material-card'].textContent,/Русский:/);assert.equal(e['material-build'].hidden,false);e['material-pool'].children[0].click();assert.equal(e['material-answer'].children.length,1);e['material-clear'].click();assert.equal(e['material-answer'].children.length,0);
 assert.equal(new core.SlovariWallet(store).balance,0);assert.deepEqual(JSON.parse(store.getItem(core.courseStorageKey)).results,{});
});
function answerCards(e,lesson){
 for(let i=0;i<lesson.entries.length;i++){
  const item=lesson.entries.find(x=>x[e.word.lang].word===e.word.textContent&&x[e.word.lang].example===e.example.textContent);assert.ok(item);
  for(let j=0;j<2;j++){const button=e.options.children.find(b=>b.textContent===item[b.lang].word+(item[b.lang].ipa?` /${item[b.lang].ipa}/`:''));assert.ok(button);button.click();}e.advance.click();
 }
}
test('practice mistakes and sample answers never pay or record; a fresh check can earn the original reward once',()=>{
 const {e,store}=session();e.modules.children[0].click();e['module-practice'].click();e['practice-kind'].value='words';e['practice-start'].click();assert.match(e['lesson-mode'].textContent,/без монет/);
 const entry=core.courseLessons['m1-l1'].entries.find(x=>x[e.word.lang].word===e.word.textContent&&x[e.word.lang].example===e.example.textContent);e.options.children.find(b=>b.textContent!==entry[b.lang].word+(entry[b.lang].ipa?` /${entry[b.lang].ipa}/`:'' )).click();e.advance.click();
 for(let i=0;i<10;i++){e['practice-help'].click();assert.equal(e.options.hidden,true);e.advance.click();}
 assert.match(e['complete-note'].textContent,/10/);assert.equal(new core.SlovariWallet(store).balance,0);assert.deepEqual(JSON.parse(store.getItem(core.courseStorageKey)).results,{});
 e['practice-to-check'].click();assert.match(e['lesson-mode'].textContent,/Проверка/);answerCards(e,core.courseLessons['m1-l1']);assert.equal(new core.SlovariWallet(store).balance,100);assert.equal(JSON.parse(store.getItem(core.courseStorageKey)).results['m1-l1'].cards.errors,0);
 e.restart.click();answerCards(e,core.courseLessons['m1-l1']);assert.equal(new core.SlovariWallet(store).balance,100);
});
test('sentence practice is available without a card threshold, samples allow completion and exact 8/2 and 7/2 quotas persist',()=>{
 for(const id of ['m1-l1','m2-l8']){
  const {e,store}=session(),lesson=core.courseLessons[id];e.modules.children[lesson.module-1].click();e['module-practice'].click();e['practice-lesson'].value=id;e['practice-kind'].value='sentences';e['practice-start'].click();const counts={kk:0,ru:0};
  for(let i=0;i<lesson.entries.length;i++){e['practice-help'].click();assert.equal(e['translation-completed'].hidden,false);counts[e['translation-completed'].lang]++;e['sentence-advance'].click();}
  assert.equal(counts.kk,lesson.entries.length-2);assert.equal(counts.ru,2);assert.equal(new core.SlovariWallet(store).balance,0);assert.deepEqual(JSON.parse(store.getItem(core.courseStorageKey)).results,{});assert.equal(e['to-sentences'].hidden,true);
 }
});
test('practice can stop early, repeat cleanly and return to check without carrying errors or help',()=>{
 const {e,store}=session();e.modules.children[0].click();e['module-practice'].click();e['practice-start'].click();e['practice-help'].click();e['practice-stop'].click();assert.match(e['complete-title'].textContent,/завершена/);assert.match(e.progress.textContent,/1 из 10/);e.restart.click();assert.match(e['lesson-mode'].textContent,/Тренировка/);e['practice-stop'].click();assert.match(e['complete-note'].textContent,/0/);e['practice-to-check'].click();assert.equal(e['practice-actions'].hidden,true);assert.equal(e['practice-help-text'].hidden,true);assert.deepEqual(JSON.parse(store.getItem(core.courseStorageKey)).results,{});
});

test('parent preparation summary labels self-assessment, lists separate kinds and contains no training controls',()=>{
 const store=new prep.LocalPreparation(storage(),core.courseEntries);store.set('words','m1-r001',true);store.set('sentences','m1-r002',true);const container=new Element();prep.renderSummary({createElement:()=>new Element()},container,store,core.courseModules,core.courseEntries);
 assert.match(container.textContent,/Самооценка ребёнка/);assert.match(container.children[3].children[0].textContent,/слова: 1\/90 · предложения: 1\/90/);assert.equal(container.children.filter(c=>c.textContent==='Учиться').length,0);assert.equal(Object.keys(store.state).length,2);
});
