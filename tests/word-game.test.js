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
 constructor(){this.dataset={};this.children=[];this.hidden=false;this.attributes={};this.events={};this.textContent='';this.classList={toggle(){}};}
 setAttribute(k,v){this.attributes[k]=v;}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=children;}
 querySelectorAll(){return this.children;}
 addEventListener(k,fn){this.events[k]=fn;}
 focus(){}
 click(){this.events.click?.();}
}
function domSession(saved,denied=false){
 const html=fs.readFileSync('index.html','utf8'),elements={};
 for(const [,id] of html.matchAll(/id="([^"]+)"/g))elements[id]=new Element();
 let stored=saved;
 const storage={getItem:()=>stored,setItem:(key,value)=>{stored=value;}};
 const window=denied?Object.defineProperty({},'localStorage',{get(){throw Error('denied');}}):{localStorage:storage};
 const context={window,document:{getElementById:id=>elements[id],createElement:()=>new Element()}};
 vm.runInNewContext(fs.readFileSync('script.js','utf8'),context);
 return {elements,get saved(){return stored;}};
}
test('DOM: home, selection, hidden answers, flip, return, restored set and blocked storage',()=>{
 const session=domSession(null),e=session.elements;
 assert.equal(e.categories.children.length,6);assert.equal(e.home.hidden,false);
 e.categories.children[3].click();assert.equal(session.saved,'school');assert.equal(e.lesson.hidden,false);
 assert.equal(e.options.children.length,3);assert.equal(e.translation.textContent,'');
 assert.equal(e.front.attributes['aria-hidden'],'false');
 assert.ok(e.word.textContent&&e.example.textContent);
 const entry=vocabulary.school.find(item=>item[e.word.lang].word===e.word.textContent);
 e.options.children.find(button=>!button.textContent.startsWith(entry[button.lang].word)).click();assert.equal(e.options.hidden,true);assert.ok(e.translation.textContent);
 assert.equal(e.front.attributes['aria-hidden'],'true');assert.equal(e.advance.hidden,false);
 e['back-home'].click();assert.equal(e.home.hidden,false);assert.equal(e.categories.children[3].attributes['aria-pressed'],'true');
 const restored=domSession(session.saved).elements;assert.equal(restored.home.hidden,true);
 assert.equal(restored.topic.textContent,'Школа');assert.equal(restored.progress.textContent,'Слово 1 из 10 · этап 1 из 2');
 assert.equal(domSession('unknown').elements.home.hidden,false);
 const denied=domSession(null,true).elements;denied.categories.children[0].click();assert.equal(denied.lesson.hidden,false);
});

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
  vm.runInNewContext(source,{Math:random,window:{localStorage:{getItem:()=> 'food',setItem(){}}},document:{getElementById:id=>elements[id],createElement:()=>new Element()}});
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

test('DOM: first correct answer keeps confirmation and immediately opens second translation',()=>{
 for(const category of Object.keys(categories)){
  const {elements:e}=domSession(category);
  const originalWord=e.word.textContent,originalLanguage=e.word.lang;
  const entry=vocabulary[category].find(item=>item[originalLanguage].word===originalWord);
  const firstTarget=e.options.children[0].lang;
  e.options.children.find(b=>b.textContent.split(' /')[0]===entry[firstTarget].word).click();
  assert.equal(e.result.textContent,'Верно!');assert.equal(e.translation.textContent,entry[firstTarget].word);
  assert.equal(e.translation.lang,firstTarget);assert.equal(e.back.attributes['aria-hidden'],'false');
  assert.equal(e.options.hidden,false);assert.equal(e.options.children.length,3);
  assert.equal(e.advance.hidden,true);assert.equal(e.prompt.hidden,false);
  const secondTarget=e.options.children[0].lang;
  assert.notEqual(secondTarget,firstTarget);assert.notEqual(secondTarget,originalLanguage);
  assert.equal(e.word.textContent,originalWord);assert.equal(e.word.lang,originalLanguage);
  const wrong=e.options.children.find(b=>b.textContent.split(' /')[0]!==entry[secondTarget].word);
  wrong.click();assert.equal(e.result.textContent,'Попробуй ещё раз');assert.equal(e.advance.textContent,'Повторить');
  assert.equal(e.translation.textContent,entry[secondTarget].word);assert.equal(e.options.hidden,true);
  e.advance.click();assert.equal(e.translation.textContent,'');assert.equal(e.options.hidden,false);
  assert.equal(e.word.textContent,originalWord);assert.equal(e.options.children[0].lang,secondTarget);
  e.options.children.find(b=>b.textContent.split(' /')[0]===entry[secondTarget].word).click();
  assert.equal(e.result.textContent,'Верно!');assert.equal(e.options.hidden,true);
  assert.equal(e.prompt.hidden,true);assert.equal(e.advance.hidden,false);assert.equal(e.advance.textContent,'Следующее слово');
  e.advance.click();assert.equal(e.progress.textContent,'Слово 2 из 10 · этап 1 из 2');
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

function finishDOM(e,mistakes=[]){
 let task=0;
 while(e.complete.hidden){
  const entry=vocabulary[Object.keys(categories).find(id=>categories[id].name===e.topic.textContent)]
   .find(item=>item[e.word.lang].word===e.word.textContent);
  for(let i=0;i<(mistakes[task]||0);i++){
   e.options.children.find(b=>b.textContent.split(' /')[0]!==entry[b.lang].word).click();
   e.advance.click();
  }
  e.options.children.find(b=>b.textContent.split(' /')[0]===entry[b.lang].word).click();
  if(!e.advance.hidden)e.advance.click();
  task++;
 }
 assert.equal(task,20);
}
test('DOM results: example, restart, category selection and reload without stored scores',()=>{
 const session=domSession('food'),e=session.elements;
 finishDOM(e,[2,1,1]);
 assert.equal(e['first-try-result'].textContent,'Верно с первой попытки: 17 из 20');
 assert.equal(e['errors-result'].textContent,'Ошибок: 4');
 e.restart.click();assert.equal(e.complete.hidden,true);finishDOM(e);
 assert.equal(e['first-try-result'].textContent,'Верно с первой попытки: 20 из 20');
 assert.equal(e['errors-result'].textContent,'Ошибок: 0');
 e['complete-home'].click();e.categories.children[1].click();finishDOM(e,[4]);
 assert.equal(e['first-try-result'].textContent,'Верно с первой попытки: 19 из 20');
 const reloaded=domSession(session.saved).elements;
 assert.equal(reloaded.complete.hidden,true);finishDOM(reloaded);
 assert.equal(reloaded['errors-result'].textContent,'Ошибок: 0');
 assert.equal(reloaded['first-try-result'].textContent,'Верно с первой попытки: 20 из 20');
 const partial=domSession('food').elements;
 const partialEntry=vocabulary.food.find(item=>item[partial.word.lang].word===partial.word.textContent);
 partial.options.children.find(b=>b.textContent.split(' /')[0]!==partialEntry[b.lang].word).click();
 const afterReload=domSession('food').elements;finishDOM(afterReload);
 assert.equal(afterReload['errors-result'].textContent,'Ошибок: 0');
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
test('all sentence topics: same ten concepts, exact language distribution, choices and single gap',()=>{
 for(const [category,tasks] of Object.entries(sentenceBank)){
  assert.deepEqual(tasks.map(t=>t.id),vocabulary[category].map(e=>e.id));
  for(let seed=1;seed<=20;seed++){
   const sg=new SentenceGame(tasks,seeded(seed));
   assert.deepEqual(sg.deck.reduce((counts,t)=>{counts[t.lang]++;return counts;},{en:0,kk:0,ru:0}),{en:4,kk:4,ru:2});
   assert.equal(new Set(sg.deck.map(t=>t.id)).size,10);
  }
  for(const t of tasks){
   assert.equal(t.text.split('___').length,2);assert.equal(new Set(t.choices).size,3);
   assert.equal(t.choices.filter(v=>v===t.answer).length,1);
   const words=t.text.replace('___',t.answer).split(/\s+/).length;
   assert.ok(words<=12&&words>=(t.lang==='kk'?5:7),t.text);
  }
 }
});
test('sentence errors: four in three tasks yields 7/10; no bypass or double answers',()=>{
 const sg=new SentenceGame(sentenceBank.food,seeded(3));
 for(let i=0;i<10;i++){
  const task=sg.task;
  sg.advance();assert.equal(sg.phase,'question');sg.answer('missing');assert.equal(sg.phase,'question');
  for(let n=0;n<([2,1,1][i]||0);n++){
   sg.answer(sg.options.find(v=>v!==task.answer));assert.equal(sg.phase,'feedback');assert.equal(sg.correct,false);
   const errors=sg.errors;sg.answer(task.answer);assert.equal(sg.errors,errors);
   sg.advance();assert.equal(sg.task,task);assert.equal(sg.phase,'question');
  }
  sg.answer(task.answer);assert.equal(sg.correct,true);sg.advance();
 }
 assert.equal(sg.phase,'complete');assert.equal(sg.firstTryCorrect,7);assert.equal(sg.errors,4);
});
test('DOM sentences: threshold, hidden hints, retry, results, restart and reload',()=>{
 for(const score of [15,16,20]){
  const session=domSession('food'),e=session.elements;
  finishDOM(e,Array(20-score).fill(1));
  assert.equal(e['to-sentences'].hidden,score<16);assert.equal(e['unlock-message'].hidden,score>=16);
  if(score<16)continue;
  e['to-sentences'].click();assert.equal(e.exercise.hidden,true);assert.equal(e['sentence-exercise'].hidden,false);
  const counts={en:0,kk:0,ru:0};
  for(let i=0;i<10;i++){
   const text=e['sentence-text'].textContent;
   const task=sentenceBank.food.find(t=>t.text===text);assert.ok(task);counts[task.lang]++;
   assert.equal(e['sentence-options'].children.length,3);assert.equal(e['sentence-text'].lang,task.lang);
   assert.equal(e['sentence-result'].textContent,'');
   for(let j=0;j<([2,1,1][i]||0);j++){
    e['sentence-options'].children.find(b=>b.textContent!==task.answer).click();
    assert.equal(e['sentence-text'].textContent,task.text.replace('___',task.answer));
    assert.equal(e['sentence-options'].hidden,true);assert.equal(e['sentence-advance'].textContent,'Повторить');
    e['sentence-advance'].click();assert.equal(e['sentence-text'].textContent,text);
   }
   e['sentence-options'].children.find(b=>b.textContent===task.answer).click();
   assert.equal(e['sentence-result'].textContent,'Верно!');e['sentence-advance'].click();
  }
  assert.deepEqual(counts,{en:4,kk:4,ru:2});
  assert.equal(e['first-try-result'].textContent,'Верно с первой попытки: 7 из 10');
  assert.equal(e['errors-result'].textContent,'Ошибок: 4');
  assert.equal(e.restart.textContent,'Повторить предложения');
  e.restart.click();assert.equal(e['sentence-exercise'].hidden,false);assert.equal(e.complete.hidden,true);
  const reload=domSession(session.saved).elements;
  assert.equal(reload['sentence-exercise'].hidden,true);assert.equal(reload.topic.textContent,'Еда');
  assert.equal(reload.progress.textContent,'Слово 1 из 10 · этап 1 из 2');
  e['back-home'].click();e.categories.children[0].click();assert.equal(e['sentence-exercise'].hidden,true);
 }
});
