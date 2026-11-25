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
    game.answer(id);assert.equal(game.correct,true);game.advance();
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
 e.options.children[0].click();assert.equal(e.options.hidden,true);assert.ok(e.translation.textContent);
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
