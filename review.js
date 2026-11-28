/* Difficulties and free review. The immutable journal is separate from money and scores. */
(function(root){
'use strict';
const key='slovarium.review.v1',reasons={error:'Ошибка в проверке',help:'Использована помощь',reveal:'Показан ответ',oral:'Нужно повторить с родителем',manual:'Хочу повторить',practice:'Трудность в тренировке',success:'Самостоятельно'};
const recordId=(kind,entry)=>`${kind}_${entry}`;
const eventId=e=>`${recordId(e.kind,e.entry)}_${e.session}_${e.type}`;
function sessionId(){return root.crypto?.randomUUID?.()||`s${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;}
function validEvent(e,entries){return Boolean(e&&['words','sentences'].includes(e.kind)&&entries.some(t=>t.id===e.entry)&&typeof e.session==='string'&&/^[A-Za-z0-9-]{1,80}$/.test(e.session)&&typeof e.cycle==='string'&&e.cycle.length<220&&Number.isInteger(e.oralIndex)&&((e.type==='bad'&&['error','help','reveal','oral'].includes(e.reason))||(e.type==='ok'&&e.reason==='success')||(e.type==='manual'&&e.reason==='manual')||(e.type==='practice'&&e.reason==='practice')));}
function empty(kind,entry){return {kind,entry,cycle:'',successes:[],failures:0,reasons:[],revision:0,lastEvent:''};}
function transition(old,e,failed=false){
 const state=old||empty(e.kind,e.entry),next={...state,successes:[...state.successes],reasons:[...state.reasons],revision:state.revision+1,lastEvent:eventId(e)};
 const active=Boolean(state.cycle)&&state.successes.length<2;
 if(e.type==='bad'||(e.type==='manual'&&!active)){
  next.cycle=eventId(e);next.successes=[];if(e.type==='bad')next.failures++;
 }else if(e.type==='ok'&&active&&e.cycle===state.cycle&&!failed&&!state.successes.includes(e.session))next.successes.push(e.session);
 else if(e.type==='practice'&&active)next.failures++;
 if(e.type!=='ok'&&!next.reasons.includes(e.reason))next.reasons.push(e.reason);
 return next;
}
function event(kind,entry,session,type,reason,cycle='',oralIndex=-1){return {kind,entry,session,type,reason,cycle,oralIndex};}
function choose(state,entries,moduleId,kind,count,random=Math.random){
 return Object.values(state).filter(r=>r.kind===kind&&r.cycle&&r.successes.length<2&&entries.some(e=>e.id===r.entry&&e.moduleId===moduleId)).map(r=>({r,tie:random()})).sort((a,b)=>a.r.successes.length-b.r.successes.length||b.r.failures-a.r.failures||time(a.r.updatedAt)-time(b.r.updatedAt)||a.tie-b.tie).slice(0,count).map(x=>x.r.entry);
}
function time(t){return t?.toMillis?.()??(t?.seconds? t.seconds*1000:typeof t==='number'?t:0);}
class LocalReview{
 constructor(storage,entries){this.storage=storage;this.entries=entries;this.state={};this.events={};this.listeners=new Set();this.saved=Boolean(storage);this.blocked=false;this.raw=null;
  try{this.raw=storage?.getItem(key)||null;if(this.raw){const data=JSON.parse(this.raw);if(data.version!==1||!Array.isArray(data.events))throw Error();for(const e of data.events){if(!validEvent(e,entries))throw Error();this.apply(e);}}}catch{this.blocked=true;this.saved=false;}
 }
 apply(e){const id=eventId(e);if(this.events[id])return;const rid=recordId(e.kind,e.entry);this.state[rid]={...transition(this.state[rid],e,Boolean(this.events[eventId({...e,type:'bad'})])),updatedAt:e.at||0};this.events[id]=e;}
 send(e){if(this.blocked||!validEvent(e,this.entries)||this.events[eventId(e)])return false;
  if(e.type==='manual'&&this.state[recordId(e.kind,e.entry)]?.cycle&&this.state[recordId(e.kind,e.entry)].successes.length<2)return false;
  if(e.type==='practice'&&(!this.state[recordId(e.kind,e.entry)]?.cycle||this.state[recordId(e.kind,e.entry)].successes.length===2))return false;
  // Re-read before writing so independent local tabs retain all confirmed events.
  try{const raw=this.storage?.getItem(key)||null;if(raw!==this.raw){const d=JSON.parse(raw);if(d.version!==1||!Array.isArray(d.events)||!d.events.every(x=>validEvent(x,this.entries)))throw Error();for(const item of d.events)this.apply(item);}}catch{this.saved=false;this.blocked=true;this.emit();return false;}
  this.apply({...e,at:Date.now()});try{if(!this.storage)throw Error();const raw=JSON.stringify({version:1,events:Object.values(this.events)});this.storage.setItem(key,raw);this.raw=raw;this.saved=true;}catch{this.saved=false;}this.emit();return true;
 }
 get message(){return this.blocked?'История повторения недоступна. Сохранённые данные не перезаписаны.':this.saved?'Повторение сохранено в этом браузере':'Повторение не сохранено. Не закрывай страницу.';}
 watch(fn){this.listeners.add(fn);return ()=>this.listeners.delete(fn);}
 emit(){for(const fn of this.listeners)fn();}
}
function appendHistory(doc,parent,store,r){
 const history=Object.values(store.events||{}).filter(e=>e.kind===r.kind&&e.entry===r.entry).sort((a,b)=>(a.revision||a.at||0)-(b.revision||b.at||0));if(!history.length)return;
 const details=doc.createElement('details'),title=doc.createElement('summary');title.textContent='История повторения';details.append(title);
 for(const e of history){const p=doc.createElement('p');p.textContent=e.type==='ok'?'Ответ без ошибок в отдельном занятии':reasons[e.reason];details.append(p);}parent.append(details);
}
function summary(doc,box,store,modules,entries){
 box.replaceChildren();const add=(parent,tag,text)=>{const n=doc.createElement(tag);n.textContent=text;parent.append(n);return n;};
 add(box,'h2','Повторение');add(box,'p','Учебное закрепление: отдельно от самооценки, результатов уроков и монет.');add(box,'p',store.message);
 for(const m of modules){const list=Object.values(store.state).filter(r=>entries.some(e=>e.id===r.entry&&e.moduleId===m.id));if(!list.length)continue;const d=doc.createElement('details');add(d,'summary',`${m.name} · слова: ${list.filter(r=>r.kind==='words'&&r.successes.length<2).length} · предложения: ${list.filter(r=>r.kind==='sentences'&&r.successes.length<2).length} · закреплено: ${list.filter(r=>r.successes.length===2).length}`);for(const r of list){const e=entries.find(e=>e.id===r.entry);add(d,'p',`${r.kind==='words'?'Слово':'Предложение'}: ${e.en.word} · ${r.successes.length===2?'Закреплено':r.successes.length+' из 2'} · ${r.reasons.map(k=>reasons[k]).join(', ')}`);appendHistory(doc,d,store,r);}box.append(d);}
}
function mount({document:doc,store,entries,onStart,onMaterials}){
 const $=id=>doc.getElementById(id),stops=[];let moduleId=1;
 function listen(id,fn){$(id).addEventListener('click',fn);stops.push(()=>$(id).removeEventListener('click',fn));}
 function render(){const kind=$('review-kind').value||'words',done=$('review-filter').value==='done',list=Object.values(store.state).filter(r=>r.kind===kind&&(r.successes.length===2)===done&&entries.some(e=>e.id===r.entry&&e.moduleId===moduleId));
  $('review-status').textContent=store.message;$('review-list').replaceChildren();$('review-empty').hidden=Boolean(list.length);$('review-count').textContent=`${done?'Закреплено':'Нужно повторить'}: ${list.length}`;
  for(const r of list){const p=doc.createElement('p'),e=entries.find(e=>e.id===r.entry);p.textContent=`${e.en.word} · ${r.successes.length===2?'Закреплено':r.successes.length+' из 2'} · ${r.reasons.map(k=>reasons[k]).join(', ')}`;$('review-list').append(p);appendHistory(doc,$('review-list'),store,r);}
  $('review-start').disabled=!choose(store.state,entries,moduleId,kind,10).length||store.blocked===true;
 }
 for(const id of ['review-kind','review-filter']){const fn=()=>render();$(id).addEventListener('change',fn);stops.push(()=>$(id).removeEventListener('change',fn));}
 listen('review-materials',onMaterials);listen('review-start',()=>{const kind=$('review-kind').value||'words',ids=choose(store.state,entries,moduleId,kind,Number($('review-size').value)||5);if(ids.length)onStart(kind,ids);});
 const stop=store.watch(render);return {open(id){moduleId=id;render();},destroy(){stop();stops.forEach(fn=>fn());}};
}
const api={key,reasons,recordId,eventId,sessionId,validEvent,empty,transition,event,choose,LocalReview,summary,mount};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SlovariumReview=api;
})(typeof window==='undefined'?globalThis:window);
