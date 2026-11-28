'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const R=require('../review.js'),core=require('../script.js');
function storage(){const map=new Map();return {map,getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};}
const send=(s,session,type='bad',reason='error',cycle=s.state['words_m1-r001']?.cycle||'')=>s.send(R.event('words','m1-r001',session,type,reason,cycle));
test('review cycles: two different sessions, replay, late old success, reset, manual idempotency and isolated kinds',()=>{
 const st=storage(),s=new R.LocalReview(st,core.courseEntries);send(s,'initial');const cycle=s.state['words_m1-r001'].cycle;
 send(s,'one','ok','success');send(s,'one','ok','success');assert.equal(s.state['words_m1-r001'].successes.length,1);
 send(s,'two','ok','success');assert.equal(s.state['words_m1-r001'].successes.length,2);assert.equal(R.choose(s.state,core.courseEntries,1,'words',5).length,0);
 send(s,'again');send(s,'late','ok','success',cycle);assert.equal(s.state['words_m1-r001'].successes.length,0);
 send(s,'three','ok','success');const next=s.state['words_m1-r001'].cycle;send(s,'manual','manual','manual');assert.equal(s.state['words_m1-r001'].cycle,next);assert.equal(s.state['words_m1-r001'].successes.length,1);
 s.send(R.event('sentences','m1-r001','separate','bad','reveal'));assert.equal(s.state['sentences_m1-r001'].successes.length,0);assert.equal(s.state['words_m1-r001'].successes.length,1);
 const reload=new R.LocalReview(st,core.courseEntries);assert.equal(reload.saved,true);assert.equal(reload.state['words_m1-r001'].successes.length,1);
});
test('one failed review session cannot later count as clean; practice never creates difficulty or resets earned success',()=>{
 const s=new R.LocalReview(storage(),core.courseEntries);assert.equal(send(s,'p','practice','practice'),false);assert.equal(Object.keys(s.state).length,0);
 send(s,'initial');send(s,'one','ok','success');send(s,'p2','practice','practice');assert.equal(s.state['words_m1-r001'].successes.length,1);
 send(s,'bad');send(s,'bad','ok','success');assert.equal(s.state['words_m1-r001'].successes.length,0);assert.equal(s.state['words_m1-r001'].failures,3);
});
test('local tabs merge journals, denied storage is honest, malformed history preserved, unknown IDs ignored',()=>{
 const st=storage(),a=new R.LocalReview(st,core.courseEntries),b=new R.LocalReview(st,core.courseEntries);send(a,'initial');send(b,'manual','manual','manual');send(a,'one','ok','success');assert.equal(new R.LocalReview(st,core.courseEntries).state['words_m1-r001'].successes.length,1);
 assert.equal(a.send(R.event('words','fake','x','bad','error')),false);
 const denied=new R.LocalReview({getItem:()=>null,setItem(){throw Error();}},core.courseEntries);send(denied,'x');assert.equal(denied.saved,false);assert.match(denied.message,/не сохранено/);
 const corrupt=storage();corrupt.setItem(R.key,'broken');const c=new R.LocalReview(corrupt,core.courseEntries);assert.equal(send(c,'x'),false);assert.equal(corrupt.getItem(R.key),'broken');
});
test('priority chooses unique active IDs in the requested module/kind; all short sentence quotas',()=>{
 const s=new R.LocalReview(storage(),core.courseEntries);for(const [i,e]of core.courseEntries.slice(0,12).entries())s.send(R.event('words',e.id,'a'+i,'bad','error'));
 const ids=R.choose(s.state,core.courseEntries,1,'words',5,()=>.5);assert.equal(ids.length,5);assert.equal(new Set(ids).size,5);assert.equal(R.choose(s.state,core.courseEntries,2,'words',5).length,0);
 for(let n=1;n<=10;n++){const sg=new core.SentenceGame(core.tasksFor('m1-l1').slice(0,n),()=>.3,()=>{},()=>{},true);assert.equal(sg.deck.filter(t=>t.translationLang==='ru').length,Math.round(n*.2));}
});
class Element{
 constructor(){this.events={};this.children=[];this.dataset={};this.hidden=false;this.attributes={};this.value='';this._text='';this.classList={toggle(){}};}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}set textContent(v){this._text=v;this.children=[];}
 append(...c){this.children.push(...c);}replaceChildren(...c){this._text='';this.children=c;}setAttribute(k,v){this.attributes[k]=v;}removeAttribute(k){delete this.attributes[k];}
 addEventListener(k,fn){this.events[k]=fn;}removeEventListener(k,fn){if(this.events[k]===fn)delete this.events[k];}focus(){}querySelectorAll(){return this.children;}click(){if(!this.disabled)this.events.click?.();}
}
function mounted(store=storage()){
 const e={};for(const [,id]of fs.readFileSync('index.html','utf8').matchAll(/id="([^"]+)"/g)){e[id]=new Element();e[id].id=id;}
 const window={localStorage:store,addEventListener(){},removeEventListener(){},clearTimeout(){}};
 const context={window,document:{addEventListener(){},removeEventListener(){},getElementById:id=>e[id],createElement:()=>new Element(),createTextNode:t=>{const x=new Element();x.textContent=t;return x;}}};vm.createContext(context);
 for(const f of ['review.js','preparation.js','script.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);return {e,store,context};
}
function word(e,wrong=false){const item=core.courseEntries.find(x=>x[e.word.lang].word===e.word.textContent&&x[e.word.lang].example===e.example.textContent);for(let j=0;j<2;j++){const correct=item[e.options.children[0].lang].word+(item[e.options.children[0].lang].ipa?' /'+item[e.options.children[0].lang].ipa+'/':'');const b=e.options.children.find(b=>wrong?b.textContent!==correct:b.textContent===correct);b.click();if(wrong)return;}e.advance.click();}
test('mounted review: manual materials, two clean free sessions, no score/wallet/self-assessment mutation and reopening',()=>{
 const {e,store}=mounted();e.modules.children[0].click();e['material-repeat'].click();e['material-repeat'].click();e['module-review'].click();assert.match(e['review-count'].textContent,/1/);e['review-start'].click();assert.match(e['lesson-mode'].textContent,/Повторение/);word(e);assert.match(e['complete-note'].textContent,/Самостоятельно: 1/);e.restart.click();word(e);assert.match(e['complete-note'].textContent,/Закреплено сейчас: 1/);
 const r=new R.LocalReview(store,core.courseEntries);assert.equal(r.state['words_m1-r001'].successes.length,2);assert.equal(new core.SlovariWallet(store).balance,0);assert.deepEqual(JSON.parse(store.getItem(core.courseStorageKey)).results,{});assert.equal(store.getItem('slovarium.preparation.v1'),null);
 e['complete-home'].click();assert.equal(e['review-start'].disabled,true);e['review-materials'].click();e['material-repeat'].click();assert.equal(new R.LocalReview(store,core.courseEntries).state['words_m1-r001'].successes.length,0);
});
test('ordinary failed card is recorded immediately before early exit; practice errors do not create a new difficulty',()=>{
 const {e,store}=mounted();e.modules.children[0].click();e['module-check'].click();e['course-lessons'].children[0].click();word(e,true);assert.equal(Object.keys(new R.LocalReview(store,core.courseEntries).state).length,1);e['back-home'].click();e['module-practice'].click();e['practice-start'].click();word(e,true);assert.equal(Object.keys(new R.LocalReview(store,core.courseEntries).state).length,1);
});

test('short mounted sentence review: exact count, free full sample, honest result, no paid controls and fresh clean restart',()=>{
 const {e,store}=mounted();e.modules.children[0].click();e['material-kind'].value='sentences';e['material-kind'].events.change();e['material-repeat'].click();e['module-review'].click();e['review-kind'].value='sentences';e['review-kind'].events.change();e['review-start'].click();assert.match(e.progress.textContent,/1 из 1/);assert.equal(e['paid-hint'].hidden,true);
 e['practice-help'].click();assert.equal(e['sentence-advance'].hidden,false);e['sentence-advance'].click();assert.match(e['complete-note'].textContent,/Выполнено 1 из 1/);assert.match(e['complete-note'].textContent,/показан ответ: 1/);assert.equal(new R.LocalReview(store,core.courseEntries).state['sentences_m1-r001'].successes.length,0);assert.equal(new core.SlovariWallet(store).balance,0);
 e.restart.click();assert.match(e.progress.textContent,/1 из 1/);assert.equal(e['paid-hint'].hidden,true);e['practice-stop'].click();assert.match(e['complete-note'].textContent,/Выполнено 0 из 1/);
});

test('all modules expose independent word/sentence review lists and helpful history; second clean attempt offers optional help',()=>{
 const {e,store}=mounted();for(let i=0;i<9;i++){e.modules.children[i].click();e['module-review'].click();assert.equal(e['review-panel'].hidden,false);assert.equal(e['review-start'].disabled,true);e['back-modules'].click();}
 e.modules.children[0].click();e['material-repeat'].click();e['module-review'].click();e['review-start'].click();word(e);e.restart.click();assert.equal(e['practice-help'].hidden,true);assert.equal(e['review-open-help'].hidden,false);e['review-open-help'].click();assert.equal(e['practice-help'].hidden,false);e['practice-help'].click();e.advance.click();assert.match(e['complete-note'].textContent,/с помощью: 1/);assert.equal(new R.LocalReview(store,core.courseEntries).state['words_m1-r001'].successes.length,0);
 e['complete-home'].click();assert.ok(e['review-list'].children.some(x=>x.textContent.includes('История повторения')));
});
test('parent summary is read-only and separates difficulty from self-assessment and scores',()=>{
 const r=new R.LocalReview(storage(),core.courseEntries);send(r,'initial');const box=new Element();R.summary({createElement:()=>new Element()},box,r,core.courseModules,core.courseEntries);assert.match(box.textContent,/Учебное закрепление/);assert.match(box.textContent,/слова: 1/);assert.match(box.textContent,/История повторения/);assert.equal(box.children.some(x=>x.events.click),false);
});
