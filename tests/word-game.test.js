'use strict';
// Run with Node's built-in runner: node --test tests/word-game.test.js
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {vocabulary,categories,languages,WordGame,loadCategory,saveCategory,storageKey}=require('../script.js');
function seeded(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}

test('60 unique concepts, 180 complete variants, unique answer words',()=>{
 assert.equal(Object.keys(categories).length,6);
 const all=Object.values(vocabulary).flat();assert.equal(all.length,60);
 assert.equal(new Set(all.map(e=>e.id)).size,60);
 for(const lang of languages){
  assert.equal(new Set(all.map(e=>e[lang].word)).size,60);
  for(const entry of all){assert.ok(entry[lang].word);assert.ok(entry[lang].example);assert.equal(Boolean(entry[lang].ipa),lang==='en');}
 }
 for(const entries of Object.values(vocabulary))assert.equal(entries.length,10);
});

test('all topics: mistakes, retries, two stages, ten concepts, completion and restart',()=>{
 const directions=new Set();
 for(const category of Object.keys(categories)){
  const game=new WordGame(seeded(42));game.start(category);const seen=new Set();
  for(let i=0;i<10;i++){
   const id=game.entry.id,source=game.source;assert.ok(!seen.has(id));seen.add(id);
   assert.ok(vocabulary[category].some(e=>e.id===id));
   assert.deepEqual([...game.targets].sort(),languages.filter(l=>l!==source).sort());
   for(let stage=0;stage<2;stage++){
    directions.add(`${source}-${game.target}`);assert.equal(game.stage,stage);
    assert.equal(game.phase,'question');assert.equal(game.options.length,3);
    assert.equal(new Set(game.options.map(e=>e[game.target].word)).size,3);
    assert.equal(game.options.filter(e=>e.id===id).length,1);
    assert.ok(game.options.every(e=>vocabulary[category].includes(e)));
    game.advance();assert.equal(game.phase,'question'); // Cannot bypass either stage.
    game.answer('missing');assert.equal(game.phase,'question');
    game.answer(game.options.find(e=>e.id!==id).id);
    assert.equal(game.correct,false);assert.equal(game.phase,'feedback');
    game.answer(id);assert.equal(game.correct,false); // Double answer ignored.
    game.advance();assert.equal(game.phase,'question');assert.equal(game.stage,stage);
    assert.equal(game.entry.id,id);assert.equal(game.source,source);
    game.answer(id);
    assert.equal(game.cardFeedback.correct,true);
    if(stage===0){assert.equal(game.phase,'question');assert.equal(game.stage,1);assert.equal(game.entry.id,id);assert.equal(game.source,source);}
    else {assert.equal(game.correct,true);game.advance();}
   }
  }
  assert.equal(game.phase,'complete');assert.equal(seen.size,10);
  game.start(category);assert.equal(game.phase,'question');assert.equal(game.index,0);
  game.home();assert.equal(game.phase,'home');assert.equal(game.category,category);
 }
 assert.equal(directions.size,6);
});

test('independent language choice, both target orders for every source, random answer position',()=>{
 const game=new WordGame(seeded(5)),sources=new Set(),orders={},positions=new Set();let adjacent=false,last=null;
 const counts={en:0,kk:0,ru:0};
 for(let i=0;i<3000;i++){
  game.start('food');sources.add(game.source);counts[game.source]++;
  adjacent ||= last===game.source;last=game.source;
  (orders[game.source]??=new Set()).add(game.targets.join(','));
  positions.add(game.options.findIndex(e=>e.id===game.entry.id));
 }
 assert.equal(sources.size,3);assert.ok(adjacent);assert.equal(positions.size,3);
 for(const lang of languages){assert.equal(orders[lang].size,2);assert.ok(counts[lang]>850&&counts[lang]<1150);}
});

test('storage: valid, absent, unknown, inherited names, denied reads/writes',()=>{
 assert.equal(loadCategory({getItem:()=>null}),null);
 assert.equal(loadCategory({getItem:()=> 'food'}),'food');
 for(const id of ['unknown','toString','__proto__'])assert.equal(loadCategory({getItem:()=>id}),null);
 assert.equal(loadCategory({getItem(){throw Error('denied');}}),null);
 assert.doesNotThrow(()=>saveCategory({setItem(){throw Error('denied');}},'food'));
 let stored;saveCategory({setItem:(key,value)=>{stored=[key,value];}},'school');assert.deepEqual(stored,[storageKey,'school']);
});

// Minimal DOM exercises event wiring and visible content; it does not verify browser layout.
class Element {
 constructor(){this.dataset={};this.children=[];this.hidden=false;this.attributes={};this.events={};this._text='';this.classList={toggle(){}};}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 set textContent(value){this._text=value;this.children=[];}
 removeAttribute(k){delete this.attributes[k];}
 setAttribute(k,v){this.attributes[k]=v;}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this._text='';this.children=children;}
 querySelectorAll(){return this.children;}
 addEventListener(k,fn){this.events[k]=fn;}
 focus(){}
 click(){this.events.click?.();}
}
test('DOM unified topics: nine choices, lesson selection, flip, return and restoration',()=>{
 const {e,storage}=courseSession();assert.equal(e.modules.children.length,9);assert.equal(e.home.hidden,false);
 assert.equal(e['catalog-title'].textContent,'Выбери тему');assert.equal(e['course-lessons'].hidden,true);
 e.modules.children[3].click();assert.equal(e['catalog-title'].textContent,'World of Work');
 assert.equal(e['course-lessons'].children.length,11);e['course-lessons'].children[0].click();
 assert.equal(e.lesson.hidden,false);assert.equal(e.options.children.length,3);assert.equal(e.translation.textContent,'');
 const lesson=courseLessons['m4-l1'],entry=lesson.entries.find(x=>x[e.word.lang].word===e.word.textContent && x[e.word.lang].example===e.example.textContent);
 e.options.children.find(b=>b.textContent!==wordLabel(entry[b.lang])).click();
 assert.equal(e.options.hidden,true);assert.ok(e.translation.textContent);assert.equal(e.front.attributes['aria-hidden'],'true');
 e['back-home'].click();assert.equal(e['catalog-title'].textContent,'World of Work');assert.equal(e['course-lessons'].hidden,false);
 const restored=courseSession(storage).e;assert.equal(restored.home.hidden,false);assert.equal(restored['catalog-title'].textContent,'World of Work');
 restored['back-modules'].click();assert.equal(restored.modules.hidden,false);assert.equal(restored.modules.children[3].attributes['aria-pressed'],'true');
 assert.ok(restored.modules.children[3].textContent.includes('Выбрано'));
 const selection=JSON.parse(storage.getItem(courseStorageKey)).selection;assert.equal(selection.screen,'catalog');assert.equal(selection.module,4);
 const denied=courseSession({getItem(){throw Error();},setItem(){throw Error();}}).e;denied.modules.children[0].click();denied['course-lessons'].children[0].click();assert.equal(denied.lesson.hidden,false);
});
function wordLabel(v){return v.word+(v.ipa?` /${v.ipa}/`:'');}

test('local files, UTF-8 and no external resources or network APIs',()=>{
 const html=fs.readFileSync('index.html','utf8');
 for(const [,path] of html.matchAll(/(?:src|href)="([^"]+)"/g))assert.ok(fs.existsSync(path));
 const source=fs.readFileSync('script.js','utf8'),css=fs.readFileSync('styles.css','utf8');
 assert.ok(!/https?:\/\/|fetch\s*\(|XMLHttpRequest|WebSocket|@import/.test(html+source+css));
 assert.ok(!(html+source+css).includes('\uFFFD'));
 assert.ok(css.includes('min-width:44px;min-height:44px'));
});

test('DOM: English IPA in source, caption, answer options and revealed translation only',()=>{
 const source=fs.readFileSync('script.js','utf8');
 const html=fs.readFileSync('index.html','utf8');
 for(const lang of languages){
  const elements={};
  for(const [,id] of html.matchAll(/id="([^"]+)"/g))elements[id]=new Element();
  const random=Object.create(Math);
  // A constant controls source language while allowing normal deterministic shuffling.
  random.random=()=>({en:0.1,kk:0.4,ru:0.8}[lang]);
  vm.runInNewContext(source,{Math:random,window:{addEventListener(){},clearTimeout(){},localStorage:{getItem:key=>key==='slovarium.course.v1'?JSON.stringify({version:2,selection:{mode:'course',module:1,lesson:'m1-l1'}}):null,setItem(){}}},document:{addEventListener(){},createTextNode:text=>{const e=new Element();e.textContent=text;return e;},getElementById:id=>elements[id],createElement:()=>new Element()}});
  const e=elements;
  assert.equal(e.word.lang,lang);
  assert.equal(e.ipa.hidden,lang!=='en');
  assert.equal(e['stage-source'].textContent.includes('/'),lang==='en');
  for(const button of e.options.children)assert.equal(button.textContent.includes('/'),button.lang==='en');
  const target=e.options.children[0].lang;
  assert.equal(e['translation-ipa'].hidden,true);
  e.options.children[0].click();
  assert.equal(e['translation-ipa'].hidden,target!=='en');
  if(target==='en')assert.match(e['translation-ipa'].textContent,/^\/.+\/$/);
 }
});

test('DOM: first correct answer keeps confirmation and opens the second translation in every theme',()=>{
 for(const module of courseModules){
  const id=`m${module.id}-l1`,storage=memoryStorage({[courseStorageKey]:JSON.stringify({version:2,selection:{mode:'course',module:module.id,lesson:id}})});
  const {e}=courseSession(storage),lesson=courseLessons[id];
  const originalWord=e.word.textContent,originalLanguage=e.word.lang;
  const entry=lesson.entries.find(item=>item[originalLanguage].word===originalWord && item[originalLanguage].example===e.example.textContent);
  const firstTarget=e.options.children[0].lang;
  e.options.children.find(b=>b.textContent===wordLabel(entry[firstTarget])).click();
  assert.equal(e.result.textContent,'Верно!');assert.equal(e.translation.textContent,entry[firstTarget].word);
  assert.equal(e.options.hidden,false);assert.equal(e.options.children.length,3);assert.equal(e.advance.hidden,true);
  const secondTarget=e.options.children[0].lang;assert.notEqual(secondTarget,firstTarget);assert.notEqual(secondTarget,originalLanguage);
  assert.equal(e.word.textContent,originalWord);
  e.options.children.find(b=>b.textContent!==wordLabel(entry[secondTarget])).click();assert.equal(e.result.textContent,'Попробуй ещё раз');
  assert.equal(e.options.hidden,true);e.advance.click();assert.equal(e.translation.textContent,'');assert.equal(e.options.hidden,false);
  e.options.children.find(b=>b.textContent===wordLabel(entry[secondTarget])).click();assert.equal(e.options.hidden,true);
  assert.equal(e.advance.hidden,false);e.advance.click();assert.equal(e.progress.textContent,'Слово 2 из 10 · этап 1 из 2');
 }
});

test('results: separate translations, repeated errors, all sources and reset',()=>{
 for(const randomValue of [0.1,0.4,0.8]){
  for(const mistakes of [[],[2,1,1],[4],Array(20).fill(2)]){
   const game=new WordGame(()=>randomValue);game.start('food');
   const source=game.source;let task=0;
   while(game.phase!=='complete'){
    const errors=mistakes[task]||0;
    for(let i=0;i<errors;i++){
     game.answer(game.options.find(e=>e.id!==game.entry.id).id);
     const count=game.errors;
     game.answer(game.entry.id);assert.equal(game.errors,count);
     game.advance();
    }
    game.answer('missing');
    game.answer(game.entry.id);
    if(game.phase==='feedback')game.advance();
    task++;
   }
   assert.equal(task,20);assert.equal(game.source,source);
   assert.equal(game.firstTryCorrect,20-mistakes.filter(Boolean).length);
   assert.equal(game.errors,mistakes.reduce((sum,n)=>sum+n,0));
   game.start('food');assert.equal(game.firstTryCorrect,0);assert.equal(game.errors,0);
   game.answer(game.options.find(e=>e.id!==game.entry.id).id);
   game.home();game.start('school');assert.equal(game.errors,0);assert.equal(game.firstTryCorrect,0);
  }
 }
});

test('DOM results: error counts, restart, changing themes, persisted bests and reset current attempts',()=>{
 const {e,storage}=courseSession();e.modules.children[0].click();e['course-lessons'].children[0].click();
 finishCourseDOM(e,courseLessons['m1-l1'],[2,1,1]);
 assert.equal(e['first-try-result'].textContent,'Верно с первой попытки: 17 из 20');assert.equal(e['errors-result'].textContent,'Ошибок: 4');
 e.restart.click();finishCourseDOM(e,courseLessons['m1-l1']);assert.equal(e['errors-result'].textContent,'Ошибок: 0');
 e['complete-home'].click();e['back-modules'].click();e.modules.children[1].click();e['course-lessons'].children[0].click();
 finishCourseDOM(e,courseLessons['m2-l1'],[4]);assert.equal(e['first-try-result'].textContent,'Верно с первой попытки: 19 из 20');
 const reload=courseSession(storage).e;assert.equal(reload.complete.hidden,true);assert.equal(reload.topic.textContent,'Module 2 · Урок 1');
 finishCourseDOM(reload,courseLessons['m2-l1']);assert.equal(reload['errors-result'].textContent,'Ошибок: 0');
 const stored=JSON.parse(storage.getItem(courseStorageKey));assert.equal(stored.results['m1-l1'].cards.firstTryCorrect,20);assert.equal(stored.results['m2-l1'].cards.firstTryCorrect,20);
});

const {sentenceBank,SentenceGame}=require('../script.js');
function finishGame(game,failedTasks=0){
 let task=0;
 while(game.phase!=='complete'){
  if(task<failedTasks){game.answer(game.options.find(e=>e.id!==game.entry.id).id);game.advance();}
  game.answer(game.entry.id);if(game.phase==='feedback')game.advance();task++;
 }
}
test('sentence access: 15 blocked, 16 and 20 allowed, retries cannot raise threshold; reset',()=>{
 for(const score of [15,16,20]){
  const game=new WordGame(seeded(score));game.start('food');game.startSentences();assert.equal(game.phase,'question');
  finishGame(game,20-score);assert.equal(game.firstTryCorrect,score);assert.equal(game.unlocked,score>=16);
  game.startSentences();assert.equal(game.phase,score>=16?'sentences':'complete');
  game.home();assert.equal(game.unlocked,false);game.startSentences();assert.equal(game.phase,'home');
  game.start('food');assert.equal(game.unlocked,false);
 }
});

const {sentenceParts}=require('../script.js');

const {courseEntries,courseLessons,courseModules,CourseProgress,courseStorageKey,tasksFor}=require('../script.js');
function memoryStorage(initial={}) {
 const values=new Map(Object.entries(initial));
 return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
}
function courseSession(storage=memoryStorage()) {
 const html=fs.readFileSync('index.html','utf8'),elements={};
 for(const [,id] of html.matchAll(/id="([^"]+)"/g)) elements[id]=new Element();
 const window={localStorage:storage,addEventListener(){},clearTimeout(){}};
 const context={window,document:{addEventListener(){},createTextNode:text=>{const e=new Element();e.textContent=text;return e;},getElementById:id=>elements[id],createElement:()=>new Element()}};
 vm.runInNewContext(fs.readFileSync('script.js','utf8'),context);
 return {e:elements,storage};
}
function finishCourseDOM(e,lesson,mistakes=[]) {
 let step=0;
 while(e.complete.hidden) {
  const entry=lesson.entries.find(item=>item[e.word.lang].word===e.word.textContent && item[e.word.lang].example===e.example.textContent);
  assert.ok(entry);
  for(let i=0;i<(mistakes[step]||0);i++) {
   e.options.children.find(b=>b.textContent.split(' /')[0]!==entry[b.lang].word).click();e.advance.click();
  }
  const correct=e.options.children.find(b=>b.textContent.split(' /')[0]===entry[b.lang].word);assert.ok(correct,JSON.stringify({source:e.word.textContent,example:e.example.textContent,entry:entry.id,options:e.options.children.map(b=>({text:b.textContent,lang:b.lang})),target:entry[e.options.children[0]?.lang]?.word}));correct.click();
  if(!e.advance.hidden) e.advance.click();step++;
 }
 assert.equal(step,lesson.entries.length*2);
}
test('course source coverage, permanent lessons, sections, repeats, edits and metadata',()=>{
 const pilotEntries=courseEntries.filter(e=>e.moduleId===1),pilotLessons=Object.fromEntries(Object.entries(courseLessons).filter(([,l])=>l.module===1));
 assert.equal(courseModules.length,9);assert.equal(courseModules.filter(m=>m.ready).length,9);
 assert.equal(courseModules.reduce((n,m)=>n+m.count,0),829);
 assert.equal(pilotEntries.length,90);assert.equal(Object.keys(pilotLessons).length,9);
 assert.equal(new Set(pilotEntries.map(e=>e.id)).size,90);
 assert.deepEqual(Object.values(pilotLessons).flatMap(l=>l.entries.map(e=>e.id)),pilotEntries.map(e=>e.id));
 assert.deepEqual(pilotEntries.reduce((c,e)=>{c[e.source.section]=(c[e.source.section]||0)+1;return c;},{}),{'Module 1':22,'1a':21,'1c':16,'1e':11,'1f':12,'1g':8});
 for(const lesson of Object.values(pilotLessons)) {
  assert.equal(lesson.entries.length,10);
  assert.deepEqual(lesson.entries.map(e=>Number(e.source.number)),Array.from({length:10},(_,i)=>(lesson.number-1)*10+i+1));
 }
 for(const [word,n] of [['metal',2],['castle',2],['huge',3]]) assert.equal(pilotEntries.filter(e=>e.en.word===word).length,n);
 assert.equal(pilotEntries.filter(e=>!e.source.ipa).length,2);
 assert.equal(pilotEntries.filter(e=>e.source.note).length,2);
 assert.equal(pilotEntries.filter(e=>e.en.word.includes(' ')).length,4);
 assert.equal(pilotEntries[47].source.ru,'пусто');assert.equal(pilotEntries[47].ru.word,'пустой');
 assert.equal(pilotEntries[67].source.kk,'мөр');assert.equal(pilotEntries[67].kk.word,'із');
 for(const e of pilotEntries) {
  for(const lang of languages) assert.ok(e[lang].word && e[lang].example);
  assert.ok(e.en.ipa && e.ipaSource && e.source.pos && e.review);
 }
});
test('course invalid storage: JSON, unknown IDs, malformed scores and denied access',()=>{
 for(const raw of ['bad','null','[]','{"version":9}',JSON.stringify({version:1,selection:{mode:'course',module:9,lesson:'bad'},results:{bad:{}}})]) {
  const p=new CourseProgress(memoryStorage({[courseStorageKey]:raw}));assert.deepEqual(p.results,{});assert.equal(p.selection.lesson,null);
 }
 const denied={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};
 const p=new CourseProgress(denied);assert.equal(p.saved,false);
 p.select({mode:'course',module:1,lesson:'m1-l2'});p.record('m1-l2','cards',{phase:'complete',firstTryCorrect:20,errors:0});
 assert.equal(p.results['m1-l2'].cards.firstTryCorrect,20);
 const raw={version:1,selection:{mode:'course',module:1,lesson:'__proto__'},results:{'m1-l1':{signature:courseLessons['m1-l1'].signature,cards:{firstTryCorrect:20,errors:-1,total:20}}}};
 const invalid=new CourseProgress(memoryStorage({[courseStorageKey]:JSON.stringify(raw)}));assert.deepEqual(invalid.results,{});assert.equal(invalid.selection.lesson,null);
});

const {assemblyTasks,assemblyBank,sentenceWords,wordKey,sentenceSignature}=require('../script.js');
function selectTranslation(sg,text=sg.translation.text) {
 sg.clear();
 for(const word of sentenceWords(text)) {
  const id=sg.pool.find(id=>wordKey(sg.tiles[id].text)===wordKey(word));assert.notEqual(id,undefined,word);
  sg.pick(id);
 }
}
function solveSentence(sg) {sg.answer(sg.task.answer);selectTranslation(sg);sg.check();sg.advance();}
function finishSentenceDOM(e,id,wrong=false) {
 const tasks=tasksFor(id),counts={en:0,kk:0,ru:0};let first=true;
 while(e.complete.hidden) {
  const text=e['sentence-text'].textContent,task=tasks.find(t=>t.text===text && e['sentence-options'].children.some(b=>b.textContent===t.answer));assert.ok(task,text);counts.en++;
  assert.equal(e['translation-builder'].hidden,true);
  if(wrong && first) {
   e['sentence-options'].children.find(b=>b.textContent!==task.answer).click();
   assert.equal(e['translation-builder'].hidden,true);assert.equal(e['sentence-advance'].textContent,'Повторить');
   e['sentence-advance'].click();assert.equal(e['sentence-text'].textContent,text);
  }
  e['sentence-options'].children.find(b=>b.textContent===task.answer).click();
  assert.equal(e['sentence-text'].textContent,task.text.replace('___',task.answer));
  assert.equal(e['sentence-advance'].hidden,true);assert.equal(e['translation-builder'].hidden,false);
  const lang=e['translation-pool'].lang;counts[lang]++;
  assert.equal(e['translation-completed'].textContent,'');
  const pool=e['translation-pool'],answer=e['translation-answer'];
  pool.children[0].click();assert.equal(answer.children.length,1);
  answer.children[0].click();assert.equal(answer.children.length,0);
  const sequence=sentenceWords(task.translations[lang].text);
  for(const word of sequence) pool.children.find(b=>wordKey(b.textContent)===wordKey(word)).click();
  assert.equal(e['translation-check'].disabled,false);e['translation-check'].click();
  assert.equal(e['translation-completed'].textContent,task.translations[lang].text);
  assert.equal(e['sentence-advance'].hidden,false);e['sentence-advance'].click();first=false;
 }
 return counts;
}
test('format 2 data: 889 English tasks, equivalent translation bundles, legal variants, unique choices and lesson coverage',()=>{
 assert.equal(assemblyTasks.length,889);assert.equal(Object.keys(assemblyBank).length,92);
 for(const [id,tasks] of Object.entries(assemblyBank)) {
  assert.equal(tasks.length,entriesForTest(id).length);assert.deepEqual(tasks.map(t=>t.id),entriesForTest(id).map(e=>e.id));
  for(const t of tasks) {
   assert.equal(t.lang,'en');assert.equal(t.format,2);assert.equal(t.text.split('___').length,2);
   assert.equal(new Set(t.choices.map(wordKey)).size,3);assert.ok(t.choices.includes(t.answer));
   const count=sentenceWords(t.text.replace('___',t.answer)).length;assert.ok(count>=7 && count<=12,t.text);
   for(const lang of ['kk','ru']) {
    const tr=t.translations[lang],words=sentenceWords(tr.text).map(wordKey).sort();assert.ok(words.length>=3);
    assert.ok(tr.variants.length);assert.equal(tr.variants[0],tr.text);
    for(const variant of tr.variants) assert.deepEqual(sentenceWords(variant).map(wordKey).sort(),words,`${id} ${t.id} ${variant}`);
   }
  }
 }
 function entriesForTest(id){return courseLessons[id]?.entries||vocabulary[id];}
});
test('all 92 trainings: 100 runs each, exact English counts and 8/2 or 7/2 translations',()=>{
 const orders=new Set(),assignments=new Set();
 for(const id of Object.keys(assemblyBank)) {
  const count=tasksFor(id).length;const game=new WordGame(seeded(71));game.start(id);finishGame(game);
  for(let run=0;run<100;run++) {
   game.startSentences();const sg=game.sentenceGame,counts={en:0,kk:0,ru:0},seen=new Set();
   orders.add(sg.deck.map(t=>t.id).join(','));assignments.add(sg.deck.map(t=>t.translationLang).join(','));
   while(sg.phase!=='complete') {
    const t=sg.task;assert.equal(t.lang,'en');counts.en++;counts[t.translationLang]++;seen.add(t.id);
    sg.advance();assert.equal(sg.task,t);assert.equal(sg.phase,'question');
    sg.answer(sg.options.find(v=>v!==t.answer));sg.advance();assert.equal(sg.task,t);
    sg.answer(t.answer);assert.equal(sg.phase,'translation');sg.advance();assert.equal(sg.task,t);
    assert.ok(!sg.translation.variants.some(v=>wordKey(v)===wordKey(sg.pool.map(id=>sg.tiles[id].text).join(' '))),t.id);
    selectTranslation(sg);sg.check();assert.equal(sg.phase,'translated');sg.advance();
   }
   assert.deepEqual(counts,{en:count,kk:count-2,ru:2});assert.equal(seen.size,count);
   assert.equal(sg.englishFirstTry,0);assert.equal(sg.translationFirstTry,count);assert.equal(sg.errors,count);
   game.phase='sentence-complete';
  }
 }
 assert.ok(orders.size>1);assert.ok(assignments.size>1);
});
test('format 2 errors: independent stages, incomplete checks, unchanged submission, edit/clear and no bypass',()=>{
 const sg=new SentenceGame(tasksFor('food'),seeded(8));const task=sg.task;
 sg.answer('missing');assert.equal(sg.phase,'question');sg.advance();assert.equal(sg.phase,'question');
 sg.answer(sg.options.find(v=>v!==task.answer));assert.equal(sg.errors,1);
 sg.answer(task.answer);assert.equal(sg.phase,'feedback');sg.advance();sg.answer(task.answer);
 assert.equal(sg.englishFirstTry,0);assert.equal(sg.phase,'translation');
 sg.check();assert.equal(sg.errors,1);sg.pick(sg.pool[0]);sg.check();assert.equal(sg.errors,1);sg.clear();
 const bad=[...sg.pool];bad.forEach(id=>sg.pick(id));assert.ok(sg.canCheck);sg.check();assert.equal(sg.errors,2);
 assert.equal(sg.phase,'translation');assert.equal(sg.message,'Попробуй ещё раз');
 sg.check();sg.check();assert.equal(sg.errors,2);assert.equal(sg.canCheck,false);
 const last=sg.selected.at(-1);sg.remove(last);sg.pick(last);sg.check();assert.equal(sg.errors,2);
 let secondWrong=null;
 const base=sg.tiles.map(t=>t.id);
 for(let i=0;i<base.length && !secondWrong;i++)for(let j=i+1;j<base.length && !secondWrong;j++) {
  const candidate=[...base];[candidate[i],candidate[j]]=[candidate[j],candidate[i]];
  const key=wordKey(candidate.map(id=>sg.tiles[id].text).join(' '));
  if(key!==sg.lastChecked && !sg.translation.variants.some(v=>wordKey(v)===key))secondWrong=candidate;
 }
 assert.ok(secondWrong);sg.clear();secondWrong.forEach(id=>sg.pick(id));sg.check();assert.equal(sg.errors,3);
 selectTranslation(sg);sg.check();assert.equal(sg.phase,'translated');assert.equal(sg.translationFirstTry,0);
 sg.pick(0);sg.clear();sg.check();assert.equal(sg.errors,3);assert.equal(sg.phase,'translated');
 sg.advance();const next=sg.task;assert.notEqual(next.id,task.id);assert.equal(sg.taskErrors,0);
 solveSentence(sg);assert.equal(sg.englishFirstTry,1);assert.equal(sg.translationFirstTry,1);
 while(sg.phase!=='complete')solveSentence(sg);
 assert.equal(sg.firstTryCorrect,18);assert.equal(sg.englishFirstTry,9);assert.equal(sg.translationFirstTry,9);assert.equal(sg.errors,3);
});
test('translation: repeated tokens remain independent; case/punctuation and alternate natural orders accepted',()=>{
 const task={...tasksFor('food')[0],translations:{kk:{text:'Мен де, сен де кел.',variants:['Мен де, сен де кел.','Сен де, мен де кел.']},ru:{text:'И ты, и я идём.',variants:['И ты, и я идём.']}}};
 for(const lang of ['kk','ru']) {
  const sg=new SentenceGame([task],seeded(2));sg.deck[0].translationLang=lang;sg.answer(task.answer);
  const initial=sg.tiles.length;const duplicate=sg.tiles.filter(t=>wordKey(t.text)===(lang==='kk'?'де':'и'));assert.equal(duplicate.length,2);
  sg.pick(duplicate[0].id);sg.pick(duplicate[0].id);assert.equal(sg.selected.length,1);
  sg.pick(duplicate[1].id);assert.equal(sg.selected.length,2);sg.remove(duplicate[0].id);assert.equal(sg.selected.length,1);
  assert.equal(sg.pool.length+sg.selected.length,initial);sg.clear();assert.equal(sg.pool.length,initial);
  selectTranslation(sg,sg.translation.variants.at(-1).toUpperCase().replace(/[.,]/g,''));sg.check();
  assert.equal(sg.phase,'translated');assert.equal(sg.translationFirstTry,1);
 }
});
test('new help: every token of all 889 full and blank English tasks, compounds, articles and no premature answer',()=>{
 let count=0;
 for(const task of assemblyTasks) for(const answered of [false,true]) {
  const parts=sentenceParts(task,answered);count++;
  assert.equal(parts.map(p=>p.text).join(''),answered?task.text.replace('___',task.answer):task.text);
  for(const p of parts) {
   if(!/^[A-Za-z]/.test(p.text)) {assert.ok(!p.hint);continue;}
   const h=p.hint;assert.ok(h?.ipa,`${task.id}: ${p.text}`);
   if(/^(a|an|the)$/i.test(p.text))assert.ok(h.note);else assert.ok(h.kk && h.ru,`${task.id}: ${p.text}`);
   if(!answered)assert.ok(!new RegExp('\\b'+task.answer.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(JSON.stringify(h)),`${task.id}: ${JSON.stringify(h)}`);
  }
 }
 assert.equal(count,1778);
 const h=sentenceParts(tasksFor('food')[2],true).find(p=>p.text==='glasses').hint;assert.equal(h.ru,'стаканы');
 const compound=tasksFor('m1-l1')[3];assert.ok(sentenceParts(compound,true).some(p=>p.hint?.phrase==='bedside cabinet'));
 assert.ok(sentenceParts(compound,false).every(p=>!p.hint?.phrase?.includes('bedside cabinet')));
});
test('course results: migration keeps old cards and sentence results separate; new scores use 20 stages and split counts',()=>{
 const id='m1-l2',signature=courseLessons[id].signature;
 const old={version:1,selection:{mode:'course',module:1,lesson:id},results:{[id]:{signature,cards:{firstTryCorrect:18,errors:3,total:20},sentences:{firstTryCorrect:8,errors:2,total:10}}}};
 const storage=memoryStorage({[courseStorageKey]:JSON.stringify(old),unrelated:'keep'}),p=new CourseProgress(storage);
 assert.equal(p.selection.lesson,id);assert.equal(p.results[id].sentences,null);assert.equal(p.results[id].cards.firstTryCorrect,18);
 assert.equal(p.results[id].legacySentences.firstTryCorrect,8);assert.equal(p.data().version,2);
 const complete=(englishFirstTry,translationFirstTry,errors,phase='complete')=>({phase,englishFirstTry,translationFirstTry,firstTryCorrect:englishFirstTry+translationFirstTry,errors});
 p.record(id,'sentences',complete(9,9,3));p.record(id,'sentences',complete(10,8,2)); // Tie: fewer errors wins as a whole pair.
 p.record(id,'sentences',complete(8,9,3));p.record(id,'sentences',complete(10,10,0,'translation'));
 p.record(id,'cards',{phase:'complete',firstTryCorrect:17,errors:3});
 const loaded=new CourseProgress(storage),score=loaded.results[id].sentences;
 assert.equal(score.firstTryCorrect,18);assert.equal(score.total,20);assert.equal(score.englishFirstTry,10);assert.equal(score.translationFirstTry,8);assert.equal(score.errors,2);
 assert.equal(loaded.results[id].legacySentences.firstTryCorrect,8);assert.equal(loaded.results[id].cards.firstTryCorrect,18);
 assert.equal(loaded.results['m1-l1'],undefined);assert.equal(storage.getItem('unrelated'),'keep');
 const raw=JSON.parse(storage.getItem(courseStorageKey));raw.results[id].sentences.signature='changed';storage.setItem(courseStorageKey,JSON.stringify(raw));
 const invalid=new CourseProgress(storage);assert.equal(invalid.results[id].sentences,null);assert.ok(invalid.results[id].cards);assert.ok(invalid.results[id].legacySentences);
});
test('new result validation rejects inconsistent sums, bad counts and wrong content without losing cards',()=>{
 const id='m1-l1',signature=sentenceSignature(courseLessons[id]);
 for(const patch of [{englishFirstTry:11},{translationFirstTry:-1},{firstTryCorrect:19},{signature:'other'},{errors:-1},{format:1}]) {
  const storage=memoryStorage({[courseStorageKey]:JSON.stringify({version:2,results:{[id]:{signature:courseLessons[id].signature,cards:{firstTryCorrect:20,errors:0,total:20},sentences:{format:2,signature,firstTryCorrect:20,total:20,englishFirstTry:10,translationFirstTry:10,errors:0,...patch}}}})});
  const p=new CourseProgress(storage);assert.equal(p.results[id].sentences,null);assert.equal(p.results[id].cards.firstTryCorrect,20);
 }
});
test('DOM new workflow: all topics and lessons, both stages, exact language quotas, independent results and repeat',()=>{
 for(const id of Object.keys(courseLessons)) {
  const {e,storage}=courseSession();
  if(courseLessons[id]){e.modules.children[courseLessons[id].module-1].click();e['course-lessons'].children[courseLessons[id].number-1].click();finishCourseDOM(e,courseLessons[id]);}
  e['to-sentences'].click();assert.equal(e['translation-builder'].hidden,true);
  const count=tasksFor(id).length;assert.deepEqual(finishSentenceDOM(e,id,true),{en:count,kk:count-2,ru:2});
  assert.equal(e['first-try-result'].textContent,`Английские предложения: ${count-1} из ${count} с первой попытки`);
  assert.equal(e['translation-first-try-result'].textContent,`Переводы: ${count} из ${count} с первой попытки`);
  assert.equal(e['errors-result'].textContent,'Ошибок: 1');
  if(courseLessons[id])assert.equal(JSON.parse(storage.getItem(courseStorageKey)).results[id].sentences.firstTryCorrect,count*2-1);
  e.restart.click();assert.equal(e['translation-builder'].hidden,true);assert.equal(e['sentence-exercise'].hidden,false);
  assert.deepEqual(finishSentenceDOM(e,id),{en:count,kk:count-2,ru:2});assert.equal(e['errors-result'].textContent,'Ошибок: 0');
 }
});
test('DOM persistence: reload in each stage and after completion resets attempt/access, retains bests and selected mode',()=>{
 const {e,storage}=courseSession(),id='m1-l2';e.modules.children[0].click();e['course-lessons'].children[1].click();finishCourseDOM(e,courseLessons[id]);e['to-sentences'].click();
 const duringEnglish=courseSession(storage).e;assert.equal(duringEnglish['sentence-exercise'].hidden,true);assert.equal(duringEnglish.progress.textContent,'Слово 1 из 10 · этап 1 из 2');
 const task=tasksFor(id).find(t=>t.text===e['sentence-text'].textContent);e['sentence-options'].children.find(b=>b.textContent===task.answer).click();e['translation-pool'].children[0].click();
 const partial=courseSession(storage).e;assert.equal(partial.topic.textContent,'Module 1 · Урок 2');assert.equal(partial['translation-builder'].hidden,true);assert.equal(partial['sentence-exercise'].hidden,true);assert.equal(partial.progress.textContent,'Слово 1 из 10 · этап 1 из 2');
 assert.equal(JSON.parse(storage.getItem(courseStorageKey)).results[id].sentences,null);
 // A fresh run can complete, store both scores, and reload without retaining access.
 finishCourseDOM(partial,courseLessons[id]);partial['to-sentences'].click();finishSentenceDOM(partial,id);
 const finished=courseSession(storage).e;assert.equal(finished['sentence-exercise'].hidden,true);finished['back-home'].click();
 assert.ok(finished['course-lessons'].children[1].textContent.includes('Предложения пройдены'));
 assert.ok(finished['course-lessons'].children[1].textContent.includes('переводы 10/10'));
 finished['back-modules'].click();assert.equal(finished.modules.children[0].attributes['aria-pressed'],'true');assert.equal(courseSession(storage).e.modules.hidden,false);
 const denied=courseSession({getItem(){throw Error();},setItem(){throw Error();}}).e;assert.ok(denied['storage-notice'].textContent.includes('недоступно'));
});
test('old sentence progress is visible but does not mark the new lesson complete',()=>{
 const id='m1-l1',storage=memoryStorage({[courseStorageKey]:JSON.stringify({version:1,selection:{mode:'course',module:1,lesson:null},results:{[id]:{signature:courseLessons[id].signature,cards:{total:20,firstTryCorrect:20,errors:0},sentences:{total:10,firstTryCorrect:10,errors:0}}}})});
 const {e}=courseSession(storage),text=e['course-lessons'].children[0].textContent;
 assert.ok(text.includes('Карточки пройдены'));assert.ok(text.includes('Прежние предложения: 10/10'));
 assert.ok(!text.includes('Предложения пройдены'));assert.ok(e.modules.children[0].textContent.includes('Пройдено 0 из 9'));
});
test('future 9-record engine retains threshold and uses exactly 9 English, 7 Kazakh and 2 Russian translations',()=>{
 const lesson=courseLessons['m1-l1'],original=lesson.entries;
 try {
  lesson.entries=original.slice(0,9);
  for(const score of [14,15]) {
   const game=new WordGame(seeded(42));game.start(lesson.id);finishGame(game,18-score);assert.equal(game.unlocked,score>=15);
   if(game.unlocked)for(let i=0;i<20;i++) {
    game.startSentences();const sg=game.sentenceGame,counts={en:0,kk:0,ru:0};
    while(sg.phase!=='complete'){counts.en++;counts[sg.task.translationLang]++;solveSentence(sg);}
    assert.deepEqual(counts,{en:9,kk:7,ru:2});assert.equal(sg.firstTryCorrect,18);game.phase='sentence-complete';
   }
  }
 }finally{lesson.entries=original;}
 assert.equal(courseModules.filter(m=>m.ready).length,9);
});

test('full course: independently extracted 829 source rows unchanged; all 86 stable lessons and original sections retained',()=>{
 const crypto=require('node:crypto');
 assert.equal(courseEntries.length,829);assert.equal(Object.keys(courseLessons).length,86);
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(courseEntries.map(e=>e.source))).digest('hex'),'5d9a710616e9c1dcfba256a1113e6eaa60a47e6a2994f918c1dbc011d418ef32');
 assert.deepEqual(courseModules.map(m=>m.count),[90,97,95,107,98,102,99,83,58]);
 const counts={9:0,10:0};for(const lesson of Object.values(courseLessons))counts[lesson.entries.length]++;
 assert.deepEqual(counts,{9:31,10:55});
 assert.equal(new Set(courseEntries.map(e=>e.id)).size,829);
 assert.deepEqual(Object.values(courseLessons).flatMap(l=>l.entries.map(e=>e.id)),courseEntries.map(e=>e.id));
 for(const module of courseModules) {
  const lessons=Object.values(courseLessons).filter(l=>l.module===module.id),entries=courseEntries.filter(e=>e.moduleId===module.id);
  assert.equal(lessons.length,module.lessons);assert.equal(entries.length,module.count);assert.equal(module.ready,true);
  assert.deepEqual(lessons.flatMap(l=>l.entries.map(e=>e.source.number)),entries.map(e=>e.source.number));
  for(const lesson of lessons)assert.deepEqual(lesson.sections,[...new Set(lesson.entries.map(e=>e.source.section))]);
 }
 assert.equal(courseEntries.filter(e=>e.source.note).length,113);assert.equal(courseEntries.filter(e=>!e.source.ipa).length,67);
 assert.equal(new Set(courseEntries.map(e=>e.source.english.trim().toLowerCase())).size,706);
 for(const e of courseEntries)assert.ok(e.prepared && e.en.ipa && e.review && e.ipaSource);
 const supplemented=courseEntries.filter(e=>!e.source.ipa && e.moduleId!==1);
 assert.equal(supplemented.length,65);assert.ok(supplemented.every(e=>e.ipaSource.includes('Редакторская')));
 assert.deepEqual(require('../script.js').courseContentIssues,[]);
});
test('all modules: card distractors stay in module, three distinct choices, both translations and no repeated source IDs',()=>{
 const directions=new Set();
 for(const lesson of Object.values(courseLessons))for(let run=0;run<5;run++) {
  const game=new WordGame(seeded(31+run));game.start(lesson.id);const ids=new Set();
  while(game.phase!=='complete') {
   if(game.stage===0){assert.ok(!ids.has(game.entry.id));ids.add(game.entry.id);}
   assert.equal(game.options.length,3);assert.equal(new Set(game.options.map(e=>e[game.target].word.toLowerCase())).size,3);
   assert.ok(game.options.every(e=>e.moduleId===lesson.module));directions.add(game.source+'-'+game.target);
   game.answer(game.entry.id);if(game.phase==='feedback')game.advance();
  }
  assert.equal(ids.size,lesson.entries.length);assert.equal(game.firstTryCorrect,lesson.entries.length*2);
 }
 assert.equal(directions.size,6);
});
test('all 31 actual nine-record lessons: 18 translations, 14 fails and 15 unlocks, full 9 English plus 7/2',()=>{
 const lessons=Object.values(courseLessons).filter(l=>l.entries.length===9);assert.equal(lessons.length,31);
 for(const lesson of lessons)for(const score of [14,15]) {
  const game=new WordGame(seeded(49));game.start(lesson.id);finishGame(game,18-score);
  assert.equal(game.firstTryCorrect,score);assert.equal(game.unlocked,score===15);
  if(score===15)for(let run=0;run<3;run++) {
   game.startSentences();const sg=game.sentenceGame,counts={en:0,kk:0,ru:0};
   while(sg.phase!=='complete'){counts.en++;counts[sg.task.translationLang]++;solveSentence(sg);}
   assert.deepEqual(counts,{en:9,kk:7,ru:2});assert.equal(sg.firstTryCorrect,18);game.phase='sentence-complete';
  }
 }
});
test('new modules: restored module and lesson, separate module progress, invalid cross-module selections rejected',()=>{
 for(const module of courseModules) {
  const storage=memoryStorage(),p=new CourseProgress(storage),lesson=Object.values(courseLessons).filter(l=>l.module===module.id).at(-1);
  p.select({mode:'course',module:module.id,lesson:lesson.id});p.record(lesson.id,'cards',{phase:'complete',firstTryCorrect:lesson.entries.length*2,errors:0});
  const {e}=courseSession(storage);assert.equal(e.topic.textContent,lesson.name);assert.equal(e.progress.textContent,`Слово 1 из ${lesson.entries.length} · этап 1 из 2`);
  e['back-home'].click();assert.equal(e['catalog-title'].textContent,module.name);assert.equal(e['course-lessons'].children.length,module.lessons);
  assert.ok(e['course-lessons'].children.at(-1).textContent.includes('Карточки пройдены'));
  p.select({mode:'course',module:module.id,lesson:module.id===1?'m2-l1':'m1-l1'});assert.equal(p.selection.lesson,null);
 }
 const storage=memoryStorage(),p=new CourseProgress(storage);
 p.record('m9-l1','cards',{phase:'complete',firstTryCorrect:20,errors:0});
 p.record('m9-l1','sentences',{phase:'complete',firstTryCorrect:20,englishFirstTry:10,translationFirstTry:10,errors:0});
 const {e}=courseSession(storage);assert.ok(e.modules.children[8].textContent.includes('Пройдено 1 из 6'));
 assert.ok(e.modules.children[0].textContent.includes('Пройдено 0 из 9'));
});
test('editorial corrections and homographs: notes applied without merging source senses or revealing blanks',()=>{
 const by=n=>courseEntries.find(e=>Number(e.source.number)===n);
 for(const [n,lang,expected] of [[127,'ru','светлый'],[207,'kk','үру'],[252,'ru','говорить правду'],[321,'ru','испытатель водных горок'],[568,'kk','жартас'],[784,'ru','плавучий рынок'],[822,'kk','жауу']])assert.equal(by(n)[lang].word,expected);
 assert.equal(by(270).source.english,'no one more');assert.equal(by(270).en.word,'no more than one');
 assert.equal(by(723).source.english,'keep your eye');assert.equal(by(723).en.word,'keep your eye on');
 assert.notEqual(by(127).ru.word,by(217).ru.word);assert.notEqual(by(563).ru.word,by(753).ru.word);
 const task=assemblyTasks.find(t=>t.id===by(563).id),hint=sentenceParts(task,true).find(p=>p.text==='fast').hint;
 assert.equal(hint.ru,'поститься');assert.equal(hint.kk,'ашығу');
 const ids=courseEntries.filter(e=>e.source.english==='fan').map(e=>e.id);assert.ok(ids.length>=3);assert.equal(new Set(ids).size,ids.length);
});

const {topicDesigns,topicIllustration,validSelection}=require('../script.js');
test('unified catalogue: exactly nine illustrated topic buttons, original names, explanations and counts',()=>{
 const html=fs.readFileSync('index.html','utf8');
 for(const id of ['show-course','show-themes','themes-panel','categories','content-notice'])assert.ok(!html.includes(`id="${id}"`));
 const {e}=courseSession();assert.equal(e.modules.children.length,9);
 assert.equal(new Set(Object.values(topicDesigns).map(t=>t.tone)).size,9);
 for(const m of courseModules) {
  const tile=e.modules.children[m.id-1],design=topicDesigns[m.id];
  assert.equal(tile.type,'button');assert.equal(tile.dataset.module,String(m.id));
  assert.equal(tile.attributes['aria-pressed'],'false');assert.ok(tile.textContent.includes(m.name));
  assert.ok(tile.textContent.includes(design.caption));assert.equal(tile.children.find(c=>c.className==='topic-caption').lang,'kk');assert.ok(tile.textContent.includes(`${m.count} записей · ${m.lessons} уроков`));
  const art=tile.children.find(c=>c.className==='topic-art');assert.equal(art.attributes['aria-hidden'],'true');
  assert.ok(art.innerHTML.includes('<svg'));assert.ok(art.innerHTML.includes('focusable="false"'));
  assert.ok(!/<(?:image|foreignObject|script)|\bon\w+=|(?:href|src)=/.test(topicIllustration(m.id)));
 }
 assert.equal(e['content-notice'],undefined);
});
test('catalogue selection survives returning from lessons and F5 without reopening a lesson',()=>{
 const {e,storage}=courseSession();e.modules.children[7].click();
 assert.equal(e['catalog-title'].textContent,'Sports');
 const inLessons=courseSession(storage).e;assert.equal(inLessons.modules.hidden,true);assert.equal(inLessons['course-lessons'].hidden,false);
 assert.equal(inLessons['catalog-title'].textContent,'Sports');
 inLessons['back-modules'].click();const restored=courseSession(storage).e;
 assert.equal(restored.modules.hidden,false);assert.equal(restored['course-lessons'].hidden,true);
 assert.equal(restored['catalog-title'].textContent,'Выбери тему');
 assert.equal(restored.modules.children.filter(t=>t.attributes['aria-pressed']==='true').length,1);
 assert.equal(restored.modules.children[7].attributes['aria-pressed'],'true');
 assert.equal(restored.modules.children[7].children[0].children.find(t=>t.className==='topic-selected').hidden,false);
 assert.equal(restored.modules.children[0].children[0].children.find(t=>t.className==='topic-selected').hidden,true);
});
test('legacy theme selections open unified catalogue and preserve course results and unrelated keys',()=>{
 const id='m8-l1';
 for(const selection of [{mode:'themes'},null,{mode:'unknown',module:4,lesson:'m4-l1'}]) {
  const storage=memoryStorage({[storageKey]:'food',unrelated:'keep',[courseStorageKey]:JSON.stringify({version:2,selection,results:{[id]:{signature:courseLessons[id].signature,cards:{total:20,firstTryCorrect:18,errors:2}}}})});
  const {e}=courseSession(storage);assert.equal(e.home.hidden,false);assert.equal(e.modules.hidden,false);assert.equal(e.lesson.hidden,true);
  assert.equal(e.modules.children.length,9);assert.ok(e.modules.children.every(t=>t.attributes['aria-pressed']==='false'));
  assert.equal(storage.getItem(storageKey),'food');assert.equal(storage.getItem('unrelated'),'keep');
  assert.equal(JSON.parse(storage.getItem(courseStorageKey)).results[id].cards.firstTryCorrect,18);
 }
 assert.deepEqual(validSelection({mode:'course',module:8,lesson:'m8-l3',screen:'catalog'}),{mode:'course',module:8,lesson:null,screen:'catalog'});
 assert.equal(validSelection({mode:'course',module:8,lesson:'m8-l3'}).screen,'lesson');
 assert.equal(validSelection({mode:'course',module:8,lesson:null}).screen,'lessons');
});
test('migration of previous course selection restores each module lesson with fresh answers and retained best scores',()=>{
 for(const m of courseModules) {
  const id=`m${m.id}-l1`,storage=memoryStorage({[courseStorageKey]:JSON.stringify({version:2,selection:{mode:'course',module:m.id,lesson:id},results:{[id]:{signature:courseLessons[id].signature,cards:{total:20,firstTryCorrect:19,errors:1}}}})});
  const {e}=courseSession(storage);assert.equal(e.topic.textContent,courseLessons[id].name);assert.equal(e.progress.textContent,'Слово 1 из 10 · этап 1 из 2');
  assert.equal(e['sentence-exercise'].hidden,true);assert.equal(e['back-home'].textContent,'К урокам');
  e['back-home'].click();assert.equal(e['catalog-title'].textContent,m.name);assert.ok(e['course-lessons'].children[0].textContent.includes('19/20'));
  e['back-modules'].click();assert.equal(e.modules.children[m.id-1].attributes['aria-pressed'],'true');
 }
});
test('topic palettes: normal text and selected badges have readable contrast on every theme',()=>{
 const css=fs.readFileSync('styles.css','utf8');
 function lum(hex){const rgb=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
 function ratio(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
 for(const d of Object.values(topicDesigns)) {
  const rule=css.match(new RegExp('\\.topic-'+d.tone+'\\{([^}]+)\\}'))[1];
  const bg=rule.match(/--topic-bg:(#[a-f\d]{6})/)[1],ink=rule.match(/--topic-ink:(#[a-f\d]{6})/)[1];
  assert.ok(ratio('#183831',bg)>=4.5,d.tone);assert.ok(ratio('#435e55',bg)>=4.5,d.tone);assert.ok(ratio('#ffffff',ink)>=4.5,d.tone);
 }
});

const {SlovariWallet,walletStorageKey}=require('../script.js');
test('wallet: immediate rewards, per-stage mistakes, retries and persistent deduplication',()=>{
 const storage=memoryStorage(),wallet=new SlovariWallet(storage);
 const game=new WordGame(seeded(51),(kind,id)=>wallet.reward(kind,id));
 game.start('m1-l1');const id=game.entry.id;
 game.answer(id);assert.equal(wallet.balance,0);game.answer(id);assert.equal(wallet.balance,10);
 game.answer(id);assert.equal(wallet.balance,10);
 const restored=new SlovariWallet(storage);restored.reward('words',id);assert.equal(restored.balance,10);
 for(const stage of [0,1]) {
  const trial=new WordGame(seeded(stage+100),(kind,id)=>wallet.reward(kind,id));trial.start('m2-l1');
  if(stage===1)trial.answer(trial.entry.id);
  trial.answer(trial.options.find(e=>e.id!==trial.entry.id).id);trial.advance();
  trial.answer(trial.entry.id);if(stage===0)trial.answer(trial.entry.id);
  assert.equal(wallet.balance,10);
 }
 const retry=new WordGame(seeded(100),(kind,id)=>wallet.reward(kind,id));retry.start('m2-l1');retry.answer(retry.entry.id);retry.answer(retry.entry.id);assert.equal(wallet.balance,20);
});
test('wallet: sentence requires both stages without mistakes and pays only once',()=>{
 for(const failed of ['none','english','translation']) {
  const wallet=new SlovariWallet(memoryStorage());
  const sg=new SentenceGame(tasksFor('m1-l1'),seeded(60),(kind,id)=>wallet.reward(kind,id));const task=sg.task;
  if(failed==='english'){sg.answer(sg.options.find(v=>v!==task.answer));sg.advance();}
  sg.answer(task.answer);assert.equal(wallet.balance,0);
  if(failed==='translation'){[...sg.pool].forEach(id=>sg.pick(id));sg.check();assert.equal(sg.phase,'translation');}
  selectTranslation(sg);sg.check();sg.check();assert.equal(wallet.balance,failed==='none'?20:0);
  const retry=new SentenceGame([task],seeded(1),(kind,id)=>wallet.reward(kind,id));solveSentence(retry);assert.equal(wallet.balance,20);
  assert.equal(wallet.state.sentences.length,1);
 }
});
test('wallet: full exchange preserves achievements, history, total earned and old reward IDs',()=>{
 const storage=memoryStorage(),wallet=new SlovariWallet(storage);
 for(const entry of courseLessons['m1-l1'].entries)wallet.reward('words',entry.id);
 tasksFor('m1-l1').slice(0,2).forEach(t=>wallet.reward('sentences',t.id));
 assert.equal(wallet.balance,140);assert.equal(wallet.exchange(130),false);assert.equal(wallet.exchange(140),true);
 assert.equal(wallet.balance,0);assert.equal(wallet.earned,140);assert.equal(wallet.exchange(140),false);
 const restored=new SlovariWallet(storage);assert.equal(restored.state.exchanges.length,1);assert.equal(restored.state.exchanges[0].amount,140);
 assert.equal(restored.state.words.length,10);assert.equal(restored.state.sentences.length,2);
 restored.reward('words',courseLessons['m1-l1'].entries[0].id);assert.equal(restored.balance,0);
 restored.reward('words',courseLessons['m1-l2'].entries[0].id);assert.equal(restored.balance,10);assert.equal(restored.earned,150);
});
test('wallet: corrupt data, denied reads/writes and stale tabs never overwrite saved state',()=>{
 for(const raw of ['{','null',JSON.stringify({version:1,words:['unknown'],sentences:[],exchanges:[]})]) {
  const storage=memoryStorage({[walletStorageKey]:raw,unrelated:'keep'}),w=new SlovariWallet(storage);
  assert.equal(w.blocked,true);w.reward('words',courseEntries[0].id);assert.equal(w.exchange(10),false);
  assert.equal(storage.getItem(walletStorageKey),raw);assert.equal(storage.getItem('unrelated'),'keep');
 }
 const denied=new SlovariWallet({getItem(){throw Error();}});assert.equal(denied.blocked,true);
 const storage=memoryStorage(),w=new SlovariWallet(storage);w.reward('words',courseEntries[0].id);
 const before=storage.getItem(walletStorageKey);storage.setItem=()=>{throw Error();};
 assert.equal(w.exchange(10),false);assert.equal(w.balance,10);assert.equal(w.saved,false);assert.equal(storage.getItem(walletStorageKey),before);
 const writeDenied=new SlovariWallet({getItem:()=>null,setItem(){throw Error();}});writeDenied.reward('words',courseEntries[0].id);
 assert.equal(writeDenied.balance,0);assert.equal(writeDenied.saved,false);assert.ok(writeDenied.message.includes('не сохранены'));
 const shared=memoryStorage(),a=new SlovariWallet(shared),b=new SlovariWallet(shared);
 a.reward('words',courseEntries[0].id);const latest=shared.getItem(walletStorageKey);
 b.reward('words',courseEntries[1].id);assert.equal(b.blocked,true);assert.equal(shared.getItem(walletStorageKey),latest);
});
test('DOM wallet: awards and F5, cancel, confirm, duplicate confirmation and unchanged course results',()=>{
 const {e,storage}=courseSession();e.modules.children[0].click();e['course-lessons'].children[0].click();
 finishCourseDOM(e,courseLessons['m1-l1']);assert.equal(e['wallet-balance'].textContent,'Баланс: 100 СЛОВАРИ');
 const results=storage.getItem(courseStorageKey);
 e['exchange-toggle'].click();e['exchange-start'].click();e['exchange-cancel'].click();assert.equal(e['wallet-balance'].textContent,'Баланс: 100 СЛОВАРИ');
 e['exchange-start'].click();e['exchange-confirm'].click();e['exchange-confirm'].click();
 assert.equal(e['wallet-balance'].textContent,'Баланс: 0 СЛОВАРИ');assert.equal(e['exchange-history'].children.length,1);
 assert.equal(e['wallet-words'].textContent,'Выучено слов: 10');assert.equal(storage.getItem(courseStorageKey),results);
 const restored=courseSession(storage).e;assert.equal(restored['wallet-balance'].textContent,'Баланс: 0 СЛОВАРИ');
 assert.equal(restored['wallet-earned'].textContent,'Всего заработано: 100 СЛОВАРИ');assert.equal(restored['exchange-history'].children.length,1);
 finishCourseDOM(restored,courseLessons['m1-l1']);assert.equal(restored['wallet-balance'].textContent,'Баланс: 0 СЛОВАРИ');
 restored['to-sentences'].click();assert.deepEqual(finishSentenceDOM(restored,'m1-l1'),{en:10,kk:8,ru:2});
 assert.equal(restored['wallet-balance'].textContent,'Баланс: 200 СЛОВАРИ');assert.equal(restored['wallet-sentences'].textContent,'Освоено предложений: 10');
});
