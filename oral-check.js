/* Two-device oral assessment. No learning rewards or local write queue. */
(function(root){
'use strict';
const langs=['en','kk','ru'],names={en:'английский',kk:'казахский',ru:'русский'},labels=['Верно','С подсказкой','Пока не знает'];
function shuffled(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function plan(entries,count,source,random=Math.random){
 if(![5,10,15].includes(count)||!['random',...langs].includes(source)||!entries.length)throw Error('Выберите тему, объём и язык');
 return shuffled(entries,random).slice(0,count).flatMap((e,i)=>{const from=source==='random'?langs[Math.floor(random()*3)]:source;return shuffled(langs.filter(l=>l!==from),random).map(to=>({entry:e.id,word:i+1,from,to,prompt:e[from].word,answer:e[to].word}));});
}
function advance(s,expected,grade){
 if(s.status!=='active'||s.step!==expected)throw Error('Задание уже изменилось. Проверьте текущий экран.');
 if(!Number.isInteger(grade)||grade<0||grade>2)throw Error('Выберите оценку');
 const step=s.step+1;return {...s,step,grades:[...s.grades,grade],status:step===s.tasks.length?'completed':'active'};
}
function publicState(s){const t=s.tasks[s.step];return {session:s.id,status:s.status,step:s.step,total:s.tasks.length,ready:s.status!=='waiting',...(t&&['waiting','active'].includes(s.status)?{prompt:t.prompt,from:t.from,to:t.to,word:t.word}: {})};}
function mount({F,db,family,child,role,core,onError,onCompleted=()=>{}}){
 const $=id=>document.getElementById(id),panel=$('oral-check'),isParent=role==='parent';
 const collection=name=>F.collection(db,'families',family,'children',child,name),live=F.doc(collection('checkLive'),'current'),ref=id=>F.doc(collection('checks'),id);
 let state=null,session=null,confirmed=false,busy=false,stopped=false,unsub=null,history=[],message='';
 panel.hidden=false;$('check-setup').hidden=!isParent;$('check-history').hidden=!isParent;
 function button(text,fn){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=text;b.disabled=busy||!confirmed||!navigator.onLine;b.onclick=fn;return b;}
 function draw(){
  if(stopped)return;
  $('check-status').textContent=message||(!navigator.onLine||!confirmed?'Нет связи. Проверка приостановлена':busy?'Сохраняем…':'');
  $('check-setup').hidden=!isParent||Boolean(state&&['waiting','active'].includes(state.status));
  $('check-create').disabled=busy||!confirmed||!navigator.onLine||Boolean(state&&['waiting','active'].includes(state.status));
  const box=$('check-current');box.replaceChildren();
  function p(text){const el=document.createElement('p');el.textContent=text;box.append(el);return el;}
  if(!state){p(isParent?'Выберите тему и пригласите ребёнка.':'Здесь появится приглашение родителя.');return;}
  if(state.status==='waiting'){
   p(isParent?(state.ready?'Ребёнок готов. Начните проверку.':'Ждём, когда ребёнок нажмёт «Начать» на своём устройстве.'):'Родитель приглашает на проверку');
   if(!isParent)box.append(button('Начать',()=>act(async()=>F.runTransaction(db,async tx=>{const snap=await tx.get(live);if(snap.data()?.session!==state.session||snap.data()?.status!=='waiting')throw Error('Приглашение изменилось');tx.update(live,{ready:true});}))));
   if(isParent&&state.ready)box.append(button('Начать проверку',()=>change('start')));
  }else if(state.status==='active'){
   p(`Слово ${state.word} из ${state.total/2} · Переведи на ${names[state.to]}`);
   const word=p(state.prompt);word.className='oral-word';word.lang=state.from;
   if(isParent&&session?.id===state.session&&session.step===state.step){p(`Ответ: ${session.tasks[state.step].answer}`);labels.forEach((label,i)=>box.append(button(label,()=>change('grade',i))));}
   else if(!isParent)p('Ответь вслух. Родитель отметит результат.');
  }else p(state.status==='completed'?'Проверка завершена!':'Проверка отменена');
  if(isParent&&['waiting','active'].includes(state.status))box.append(button('Отменить проверку',()=>{if(root.confirm('Отменить проверку? Частичная попытка не считается завершённой.'))void change('cancel');}));
 }
 async function act(fn){if(busy||!confirmed||!navigator.onLine)return;busy=true;message='';draw();try{await fn();}catch(e){message=e.message;onError(e);}finally{busy=false;draw();}}
 async function change(kind,grade){const expected=state?.step,id=state?.session;return act(()=>F.runTransaction(db,async tx=>{
  const [pub,priv]=await Promise.all([tx.get(live),tx.get(ref(id))]);
  if(!pub.exists()||pub.data().session!==id||!priv.exists())throw Error('Проверка изменилась');
  let s={...priv.data(),id};
  if(s.step!==expected||!['waiting','active'].includes(s.status))throw Error('Задание уже изменилось');
  if(kind==='grade')s=advance(s,expected,grade);
  else if(kind==='start'){if(s.status!=='waiting'||!pub.data().ready)throw Error('Ребёнок ещё не готов');s.status='active';}
  else s.status='cancelled';
  tx.set(ref(id),s);tx.set(live,publicState(s));
 }));}
 function details(s){const box=$('check-report');box.replaceChildren();const title=document.createElement('p');title.textContent=`${s.topic} · ${new Date(s.createdAt).toLocaleString('ru-RU')} · ${s.status==='completed'?'Завершена':s.status==='cancelled'?'Отменена':'Не завершена'}`;box.append(title);
  labels.forEach((label,i)=>{const p=document.createElement('p');p.textContent=`${label}: ${s.grades.filter(g=>g===i).length}`;box.append(p);});
  s.grades.forEach((g,i)=>{if(g===0)return;const p=document.createElement('p'),t=s.tasks[i];p.textContent=`${t.prompt} → ${t.answer} (${names[t.to]}) — ${labels[g]}`;box.append(p);});
 }
 if(isParent){
  $('check-topic').replaceChildren();for(const m of core.courseModules){const o=document.createElement('option');o.value=m.id;o.textContent=m.name;$('check-topic').append(o);}
  $('check-form').onsubmit=e=>{e.preventDefault();void act(async()=>{
   const m=core.courseModules.find(m=>m.id===Number($('check-topic').value)),tasks=plan(core.courseEntries.filter(e=>e.moduleId===m.id),Number($('check-count').value),$('check-language').value),id=F.doc(collection('checks')).id;
   const s={id,topic:m.name,createdAt:new Date().toISOString(),reviewVersion:1,status:'waiting',step:0,tasks,grades:[]};
   await F.runTransaction(db,async tx=>{const old=await tx.get(live);if(old.exists()&&['waiting','active'].includes(old.data().status))throw Error('Сначала завершите или отмените текущую проверку');tx.set(ref(id),s);tx.set(live,publicState(s));});
  });};
  unsub=F.onSnapshot(collection('checks'),{includeMetadataChanges:true},snap=>{history=snap.docs.map(d=>d.data()).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));for(const s of history)if(s.reviewVersion===1&&s.status==='completed')onCompleted(s);session=history.find(s=>s.id===state?.session);const list=$('check-history-list');list.replaceChildren();for(const s of history){const b=button(`${s.topic} · ${new Date(s.createdAt).toLocaleString('ru-RU')}`,()=>details(s));b.disabled=false;list.append(b);}if(session&&['completed','cancelled'].includes(session.status)){details(session);}draw();},onError);
 }
 const stop=F.onSnapshot(live,{includeMetadataChanges:true},snap=>{const previous=state?.session;state=snap.exists()?snap.data():null;confirmed=!snap.metadata.fromCache&&!snap.metadata.hasPendingWrites;session=history.find(s=>s.id===state?.session);message='';draw();if(!isParent&&state&&['waiting','active'].includes(state.status)&&previous!==state.session)root.SlovariumUI?.open('settings-view');},e=>{confirmed=false;draw();onError(e);});
 const network=()=>{confirmed=false;draw();if(navigator.onLine)void F.getDocFromServer(live).then(snap=>{if(stopped)return;state=snap.exists()?snap.data():null;confirmed=true;session=history.find(s=>s.id===state?.session);draw();}).catch(e=>{if(!stopped){message=e.message;draw();}});};root.addEventListener('online',network);root.addEventListener('offline',network);
 return ()=>{stopped=true;stop();unsub?.();root.removeEventListener('online',network);root.removeEventListener('offline',network);panel.hidden=true;$('check-current').replaceChildren();$('check-history-list').replaceChildren();$('check-report').replaceChildren();};
}
const api={plan,advance,publicState,mount};if(typeof module!=='undefined')module.exports=api;else root.SlovariumOral=api;
})(typeof window==='undefined'?globalThis:window);
