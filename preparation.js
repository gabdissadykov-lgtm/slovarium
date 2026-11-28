/* Preparation is self-assessment, separate from results and money. */
(function(root){
'use strict';
const key='slovarium.preparation.v1';
function markId(kind,entry){return `${kind}_${entry}`;}
function validMark(id,value,entries){return value&&['words','sentences'].includes(value.kind)&&typeof value.known==='boolean'&&entries.some(e=>e.id===value.entry)&&id===markId(value.kind,value.entry);}
class LocalPreparation{
 constructor(storage,entries){this.storage=storage;this.entries=entries;this.state={};this.saved=Boolean(storage);this.listeners=new Set();
  try{const value=JSON.parse(storage?.getItem(key)||'{}');for(const [id,mark] of Object.entries(value))if(validMark(id,mark,entries))this.state[id]=mark;}catch{this.saved=false;}
 }
 getKnown(kind,entry){return this.state[markId(kind,entry)]?.known===true;}
 set(kind,entry,known){const id=markId(kind,entry),value={kind,entry,known};if(!validMark(id,value,this.entries))return;
  this.state[id]=value;try{if(!this.storage)throw Error();this.storage.setItem(key,JSON.stringify(this.state));this.saved=true;}catch{this.saved=false;}this.emit();
 }
 watch(fn){this.listeners.add(fn);return ()=>this.listeners.delete(fn);}
 emit(){for(const fn of this.listeners)fn();}
 get message(){return this.saved?'Подготовка сохранена в этом браузере':'Отметки не сохранены. Хранилище браузера недоступно.';}
}
function mount({document:doc,entries,lessons,tasks,modules,store,onRepeat}){
 const $=id=>doc.getElementById(id),listeners=[],names={en:'English',kk:'Қазақша',ru:'Русский'};
 let moduleId=1,kind='words',lessonId='',language='en',onlyLearning=false,index=0,revealed=false,order=null,target='kk',picked=[],feedback='',poolKey=null,poolOrder=[];
 function listen(id,event,fn){$(id).addEventListener(event,fn);listeners.push(()=>$(id).removeEventListener?.(event,fn));}
 function items(){let list=lessonId?lessons[lessonId]?.entries||[]:entries.filter(e=>e.moduleId===moduleId);list=list.filter(e=>!onlyLearning||!store.getKnown(kind,e.id));if(order)list=[...list].sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));return list;}
 function reset(){index=0;revealed=false;picked=[];feedback='';order=null;poolKey=null;}
 function line(parent,text,lang){const p=doc.createElement('p');p.textContent=text;if(lang)p.lang=lang;parent.append(p);return p;}
 function render(){
  const list=items();index=Math.min(index,Math.max(0,list.length-1));const item=list[index],card=$('material-card');card.replaceChildren();
  $('material-status').textContent=store.message;
  $('material-position').textContent=item?`${index+1} из ${list.length} · ${kind==='words'?'слова':'предложения'}`:'Всё отмечено как «Запомнил». Вернись к списку всех материалов.';
  $('material-source-label').hidden=kind!=='words';$('material-target-label').hidden=kind!=='sentences';
  if($('material-repeat'))$('material-repeat').disabled=!item;
  for(const id of ['material-reveal','material-learning','material-known','material-next','material-prev'])$(id).disabled=!item;
  $('material-prev').disabled=!item||index===0;$('material-next').disabled=!item||index===list.length-1;
  $('material-build').hidden=kind!=='sentences'||!item;
  $('material-answer').replaceChildren();$('material-pool').replaceChildren();$('material-builder-result').textContent=feedback;
  if(!item)return;
  line(card,store.getKnown(kind,item.id)?'Самооценка: запомнил':'Самооценка: ещё учу');
  if(kind==='words'){
   const h=doc.createElement('h3');h.textContent=item[language].word;h.lang=language;card.append(h);
   if(language==='en'&&item.en.ipa)line(card,`/${item.en.ipa}/`,'en');line(card,item[language].example,language);
   if(revealed)for(const lang of ['en','kk','ru'].filter(l=>l!==language)){line(card,`${names[lang]}: ${item[lang].word}${lang==='en'&&item.en.ipa?` /${item.en.ipa}/`:''}`,lang);line(card,item[lang].example,lang);}
   if(item.source?.note)line(card,item.source.note);
  }else{
   const task=tasks.find(t=>t.id===item.id),translation=task.translations[target];
   const h=doc.createElement('h3');h.textContent=task.text.replace('___',task.answer);h.lang='en';card.append(h);
   if(revealed){line(card,`Қазақша: ${task.translations.kk.text}`,'kk');line(card,`Русский: ${task.translations.ru.text}`,'ru');}
   const tokens=translation.text.trim().split(/\s+/);
   if(poolKey!==item.id+'_'+target){poolKey=item.id+'_'+target;poolOrder=tokens.map((_,i)=>i);for(let i=poolOrder.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[poolOrder[i],poolOrder[j]]=[poolOrder[j],poolOrder[i]];}if(poolOrder.length>1&&poolOrder.every((v,i)=>v===i))[poolOrder[0],poolOrder[1]]=[poolOrder[1],poolOrder[0]];}
   for(const [container,ids] of [[$('material-answer'),picked],[$('material-pool'),poolOrder.filter(i=>!picked.includes(i))]]){
    for(const id of ids){const button=doc.createElement('button');button.type='button';button.className='word-tile';button.textContent=tokens[id];button.lang=target;
     button.addEventListener('click',()=>{if(picked.includes(id))picked=picked.filter(i=>i!==id);else picked.push(id);feedback='';render();});container.append(button);}
   }
  }
  $('material-reveal').textContent=revealed?'Скрыть переводы':'Показать переводы';
 }
 function controls(){
  $('material-lesson').replaceChildren();const all=doc.createElement('option');all.value='';all.textContent='Весь модуль';$('material-lesson').append(all);
  for(const lesson of Object.values(lessons).filter(l=>l.module===moduleId)){const o=doc.createElement('option');o.value=lesson.id;o.textContent=`Урок ${lesson.number} · ${lesson.sections.join(', ')}`;$('material-lesson').append(o);}
  $('material-lesson').value=lessonId;
 }
 if($('material-repeat')&&onRepeat)listen('material-repeat','click',()=>{const item=items()[index];if(item){onRepeat(kind,item.id);$('material-status').textContent='Добавлено в повторение. '+store.message;}});
 listen('material-kind','change',()=>{kind=$('material-kind').value;reset();render();});
 listen('material-lesson','change',()=>{lessonId=$('material-lesson').value;reset();render();});
 listen('material-language','change',()=>{language=$('material-language').value;revealed=false;render();});
 listen('material-filter','change',()=>{onlyLearning=$('material-filter').value==='learning';reset();render();});
 listen('material-target','change',()=>{target=$('material-target').value;picked=[];feedback='';render();});
 listen('material-reveal','click',()=>{revealed=!revealed;render();});
 for(const [id,delta]of [['material-next',1],['material-prev',-1]])listen(id,'click',()=>{index+=delta;revealed=false;picked=[];feedback='';render();});
 for(const [id,known]of [['material-learning',false],['material-known',true]])listen(id,'click',()=>{const item=items()[index];revealed=false;picked=[];feedback='';if(item)store.set(kind,item.id,known);});
 listen('material-shuffle','click',()=>{order=items().map(e=>e.id);for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}index=0;picked=[];revealed=false;render();});
 listen('material-clear','click',()=>{picked=[];feedback='';render();});
 listen('material-check','click',()=>{const item=items()[index];if(!item)return;const tr=tasks.find(t=>t.id===item.id).translations[target],tokens=tr.text.trim().split(/\s+/);const normalize=s=>s.toLowerCase().replace(/[.,!?;:«»"']/g,'').replace(/\s+/g,' ').trim();feedback=picked.length===tokens.length&&tr.variants.some(v=>normalize(v)===normalize(picked.map(i=>tokens[i]).join(' ')))?'Верно! Это подготовка, без монет.':'Попробуй ещё раз или посмотри образец.';render();});
 const stop=store.watch(render);
 return {open(id){if(moduleId!==id){moduleId=id;lessonId='';reset();}controls();render();},destroy(){stop();listeners.forEach(fn=>fn());}};
}
function renderSummary(doc,container,store,modules,entries){
 container.replaceChildren();const title=doc.createElement('h2');title.textContent='Подготовка';container.append(title);
 const note=doc.createElement('p');note.textContent='Самооценка ребёнка. Эти отметки не подтверждают знание и не меняют результат проверки.';container.append(note);
 const status=doc.createElement('p');status.textContent=store.message;container.append(status);
 for(const module of modules){const list=entries.filter(e=>e.moduleId===module.id),details=doc.createElement('details'),summary=doc.createElement('summary');summary.textContent=`${module.name} · слова: ${list.filter(e=>store.getKnown('words',e.id)).length}/${list.length} · предложения: ${list.filter(e=>store.getKnown('sentences',e.id)).length}/${list.length}`;details.append(summary);
  for(const entry of list){const p=doc.createElement('p');p.textContent=`${entry.en.word} — слово: ${store.getKnown('words',entry.id)?'запомнил':'ещё учу'}, предложение: ${store.getKnown('sentences',entry.id)?'запомнил':'ещё учу'}`;details.append(p);}container.append(details);
 }
}
const api={key,markId,validMark,LocalPreparation,mount,renderSummary};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SlovariumPreparation=api;
})(typeof window==='undefined'?globalThis:window);
