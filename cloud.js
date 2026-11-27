/* Cloud integration loads Firebase only on the hosted site; file:// stays local. */
'use strict';
const $=id=>document.getElementById(id);
const core=window.SlovariumCore,model=window.SlovariumCloudModel;
let active=null;
function download(data){
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='slovarium-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function backup(){
 if(window.SlovariumOnline&&!active)throw Error('Откройте активный профиль ребёнка для сохранения копии.');
 if(active)return {format:'slovarium-backup',version:1,wallet:active.wallet.state,course:active.progress.data()};
 const w=new core.SlovariWallet(localStorage);if(w.blocked)throw Error('Кошелёк недоступен. Копия не создана.');
 const raw=localStorage.getItem(core.courseStorageKey);
 return {format:'slovarium-backup',version:1,wallet:w.state,course:raw?JSON.parse(raw):{version:2,results:{}}};
}
$('backup-export').addEventListener('click',()=>{try{download(backup());$('backup-status').textContent='Копия сохранена в файл. Храните её у родителя.';}catch(e){$('backup-status').textContent=e.message;}});
if(window.SlovariumOnline)startCloud().catch(e=>{$('account-status').textContent='Вход временно недоступен. '+friendly(e);$('retry-connection').hidden=false;});
function friendly(e){
 if(e.code?.includes('permission-denied'))return 'Доступ запрещён. Проверьте профиль и правила доступа.';
 if(e.code?.includes('popup-blocked'))return 'Браузер заблокировал окно входа. Разрешите всплывающее окно и повторите.';
 if(e.code?.includes('unauthorized-domain'))return 'Домен сайта пока не добавлен в настройки входа.';
 if(e.code?.includes('popup-closed'))return 'Окно входа закрыто. Можно повторить.';
 if(e.code?.includes('unavailable'))return 'Нет связи с сервером. Попробуем снова после подключения.';
 return e.message||'Не удалось выполнить действие.';
}
async function startCloud(){
 $('backup-export').disabled=true;
 $('account').hidden=false;$('home').hidden=true;$('lesson').hidden=true;document.querySelector('.wallet[aria-labelledby="wallet-title"]').hidden=true;
 // Version pinned to the official Firebase Web SDK documentation.
 const [appSDK,A,F]=await Promise.all([
  import('https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js'),
  import('https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js'),
  import('https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js')
 ]);
 const app=appSDK.initializeApp(window.SlovariumFirebaseConfig),auth=A.getAuth(app),db=F.getFirestore(app);
 await A.setPersistence(auth,A.browserLocalPersistence);
 window.SlovariumUI?.loginReady(true);
 const childRef=(family,id)=>F.doc(db,'families',family,'children',id);
 const kidsRef=family=>F.collection(db,'families',family,'children');
 const deviceRef=uid=>F.doc(db,'devices',uid);
 const resultRef=(family,id,lesson)=>F.doc(db,'families',family,'children',id,'results',lesson);
 let family=null,selected=null,role=null,children=[],mounted=false,stops=[],profileStop=null,devicesStop=null,importData=null;
 let queue=null,queueKey=null,flushing=false,queueDurable=true,historyDates={};
 let profileVersion=0,bindingVersion=0,profileListeners=[],editingId=null,archiveId=null,participantBusy=false;
 function withHistory(w){return {...w,exchanges:w.exchanges.map((item,i)=>({...item,date:historyDates[i]||item.date}))};}
 function status(text){$('account-status').textContent=text;}
 function closeEditors(){editingId=null;archiveId=null;$('participant-editor').hidden=true;$('participant-confirmation').hidden=true;}
 function revokeProfile(message){
  if(active){active.wallet.blocked=true;active.wallet.saved=false;}
  active=null;$('backup-export').disabled=true;closeEditors();
  profileListeners.forEach(stop=>stop());profileListeners=[];
  if(profileStop){profileStop();profileStop=null;}if(devicesStop){devicesStop();devicesStop=null;}
  window.SlovariumUI?.setReady(false);window.SlovariumUI?.open('settings-view');
  $('home').hidden=true;$('lesson').hidden=true;$('profile-tools').hidden=true;
  document.querySelector('.wallet[aria-labelledby="wallet-title"]').hidden=true;
  for(const id of ['progress-summary','progress-results','exchange-history','linked-devices','translation-answer','translation-pool','options','sentence-text'])$(id).replaceChildren();
  for(const id of ['word','translation','example','stage-source','wallet-message','wallet-balance','profile-name'])$(id).textContent='';
  $('balance-short').textContent='— $lovari';$('exchange-confirmation').hidden=true;$('exchange-panel').hidden=true;
  $('exchange-toggle').setAttribute('aria-expanded','false');
  status(message);
  if(role==='parent'){
   try{sessionStorage.removeItem('slovarium.selectedChild');sessionStorage.setItem('slovarium.participantNotice',message);}catch{}
   location.reload();
  }else{window.SlovariumUI?.profile('Доступ отключён');$('child-pairing').hidden=false;}
 }
 function fail(e){
  if(role==='child'&&(e.code?.includes('permission-denied')||e.message?.includes('Доступ к профилю отключён'))){revokeProfile('Доступ к профилю отключён. Обратитесь к родителю.');return;}
  status(friendly(e));
 }
 function repaint(){active?.repaint?.();}
 function persistQueue(){try{localStorage.setItem(queueKey,JSON.stringify({...queue,accessVersion:profileVersion}));queueDurable=true;}catch{queueDurable=false;status('Очередь не сохранена в браузере. Не закрывайте страницу до восстановления связи.');}}
 function queueCount(){return queue?queue.rewards.length+Object.keys(queue.results).length:0;}
 function syncStatus(){
  if(!active||active.wallet.blocked)return;
  active.wallet.saved=navigator.onLine&&queueCount()===0;
  const pending=queueCount();
  if(!queueDurable)status('Очередь не сохранена в браузере. Не закрывайте страницу до отправки.');
  else status(!navigator.onLine?`Нет связи. Ожидают отправки: ${pending}`:pending?`Сохраняем. Ожидают отправки: ${pending}`:'Сохранено');
  repaint();
 }
 async function flush(){
  if(flushing||!active||active.wallet.blocked||!navigator.onLine||!queueCount())return;
  const owner=active,expected=profileVersion,ownerFamily=family,ownerChild=selected;
  flushing=true;
  try{
   while(queue.rewards.length){
    const item=queue.rewards[0];
    await F.runTransaction(db,async tx=>{
     const ref=childRef(ownerFamily,ownerChild),snap=await tx.get(ref);if(!snap.exists())throw Error('Профиль не найден');
     model.requireActive(snap.data(),expected);
     const w=snap.data().wallet,next=model.addReward(w,item.kind,item.id);
     if(next!==w)tx.update(ref,{wallet:next,activity:true});
    });
    if(active!==owner)return;queue.rewards.shift();persistQueue();
   }
   for(const lesson of Object.keys(queue.results)){
    const candidate=queue.results[lesson],ref=resultRef(ownerFamily,ownerChild,lesson);
    await F.runTransaction(db,async tx=>{const snap=await tx.get(ref);const child=childRef(ownerFamily,ownerChild),profile=await tx.get(child);if(!profile.exists())throw Error('Профиль не найден');model.requireActive(profile.data(),expected);tx.set(ref,model.mergeResults(snap.exists()?snap.data():{},candidate));tx.update(child,{activity:true});});
    // Do not drop a better attempt queued while this request was running.
    if(active!==owner)return;
    if(queue.results[lesson]===candidate)delete queue.results[lesson];persistQueue();
   }
   syncStatus();
  }catch(e){fail(e);if(active)active.wallet.saved=false;repaint();}
  finally{flushing=false;}
 }
 function queueReward(kind,id){
  if(!active||active.wallet.blocked)return;
  const known=kind==='words'?core.courseEntries:core.assemblyTasks;
  if(!['words','sentences'].includes(kind)||!known.some(t=>t.id===id))return;
  if(active.wallet.state[kind].includes(id)){active.wallet.message=kind==='words'?'Отлично! Ты помнишь это слово':'Отлично! Ты помнишь это предложение';repaint();return;}
  if(!queue.rewards.some(r=>r.kind===kind&&r.id===id))queue.rewards.push({kind,id});
  active.wallet.message='Награда ожидает сохранения';persistQueue();syncStatus();void flush();
 }
 function choose(id,deviceVersion=0){
  closeEditors();
  if(mounted&&(selected!==id||!active||(role==='child'&&bindingVersion!==deviceVersion))){try{sessionStorage.setItem('slovarium.selectedChild',id);}catch{}location.reload();return;}
  bindingVersion=deviceVersion;selected=id;try{sessionStorage.setItem('slovarium.selectedChild',id);}catch{}
  if(role==='parent')renderChildren();
  if(profileStop)profileStop();if(devicesStop)devicesStop();
  profileStop=F.onSnapshot(childRef(family,id),snap=>{
   if(!snap.exists()){revokeProfile('Профиль недоступен. Обратитесь к родителю.');return;}
   const data=snap.data();
   if(!model.isActive(data)||(role==='child'&&model.accessVersion(data)!==bindingVersion)||(active&&model.accessVersion(data)!==profileVersion)){revokeProfile(role==='parent'?'Участник перенесён в архив. Выберите другой профиль.':'Доступ к профилю отключён. Обратитесь к родителю.');return;}
   window.SlovariumUI?.profile(data.name);
   $('account-title').textContent=role==='parent'?'Кабинет родителя':`Привет, ${data.name}!`;
   $('profile-name').textContent=data.name;
   if(!mounted)mountProfile(data);
   else{
    const previous=active.wallet.earned;active.wallet.state=withHistory(data.wallet);
    if(active.wallet.earned>previous)active.wallet.message=`+${active.wallet.earned-previous} $lovari!`;
    syncStatus();
   }
   $('child-pairing').hidden=true;$('profile-tools').hidden=role!=='parent';
  },fail);
  if(role==='parent')devicesStop=F.onSnapshot(F.query(F.collection(db,'devices'),F.where('family','==',family),F.where('child','==',id)),snap=>{
   $('linked-devices').replaceChildren();
   for(const d of snap.docs){if(model.accessVersion(d.data())!==profileVersion)continue;const row=document.createElement('div'),text=document.createElement('span'),button=document.createElement('button');
    text.textContent=`Устройство ${d.id.slice(0,6)}…`;button.textContent='Отключить';button.className='secondary';
    button.onclick=()=>F.updateDoc(d.ref,{family:'',child:''}).catch(fail);row.append(text,button);$('linked-devices').append(row);
   }
  },fail);
 }
 function mountProfile(data){
  mounted=true;profileVersion=model.accessVersion(data);
  queueKey=`slovarium.pending:${auth.currentUser.uid}:${family}:${selected}${profileVersion?`:v${profileVersion}`:''}`;
  queue={rewards:[],results:{}};
  try{
   const old=JSON.parse(localStorage.getItem(queueKey));
   if(old){
    if((old.accessVersion??0)!==profileVersion||!Array.isArray(old.rewards)||!old.results||typeof old.results!=='object')throw Error('invalid queue');
    queue.rewards=old.rewards.filter(r=>['words','sentences'].includes(r.kind)&&(r.kind==='words'?core.courseEntries:core.assemblyTasks).some(t=>t.id===r.id));
    queue.results=cleanCourse({version:2,results:old.results}).results;
   }
  }catch{status('Очередь повреждена или хранилище недоступно. Не закрывайте страницу; новые результаты могут не сохраниться локально.');queueDurable=false;}
  const wallet={state:withHistory(data.wallet),raw:'cloud',saved:false,blocked:false,message:'',get earned(){return model.earned(this.state);},get balance(){return model.balance(this.state);},reward:queueReward,
   async exchange(expected){
    if(role!=='parent'||!active||active.wallet!==this||this.blocked||!navigator.onLine||queueCount())return false;
    this.saved=false;repaint();
    try{await F.runTransaction(db,async tx=>{const ref=childRef(family,selected),snap=await tx.get(ref);if(!snap.exists())throw Error('Профиль не найден');model.requireActive(snap.data(),profileVersion);const w=snap.data().wallet;
      // Record the exchange event with authoritative server time in the same transaction.
      const next=model.exchange(w,expected,new Date().toISOString());
      tx.update(ref,{wallet:next,lastExchangeAt:F.serverTimestamp()});
      tx.set(F.doc(db,'families',family,'children',selected,'exchanges',String(w.exchanges.length)),{amount:expected,at:F.serverTimestamp()});
     });this.message='Обмен сохранён. Достижения остались.';return true;
    }catch(e){this.message=friendly(e);return false;}finally{syncStatus();}
   }};
  class OnlineProgress extends core.CourseProgress{
   constructor(){super({getItem:()=>JSON.stringify({version:2,results:queue.results}),setItem(){}});this.cloudReady=true;}
   persist(){this.saved=true;/* Selection stays in this session; results have their own documents. */}
   record(id,level,score){
    if(!active||active.wallet.blocked)return;
    const before=JSON.stringify(this.results[id]);super.record(id,level,score);
    if(this.cloudReady&&JSON.stringify(this.results[id])!==before){queue.results[id]=JSON.parse(JSON.stringify(this.results[id]));persistQueue();syncStatus();void flush();}
   }
  }
  const progress=new OnlineProgress();active={wallet,progress,role,userUid:auth.currentUser.uid};
  core.mount(active);$('backup-export').disabled=false;document.querySelector('.wallet[aria-labelledby="wallet-title"]').hidden=false;
  profileListeners.push(F.onSnapshot(F.collection(db,'families',family,'children',selected,'results'),snap=>{
   for(const d of snap.docs){const cleaned=cleanCourse({version:2,results:{[d.id]:d.data()}}).results[d.id];if(cleaned)progress.results[d.id]=model.mergeResults(progress.results[d.id]||{},cleaned);}
   repaint();
  },fail));
  profileListeners.push(F.onSnapshot(F.collection(db,'families',family,'children',selected,'exchanges'),snap=>{historyDates={};for(const d of snap.docs){const at=d.data().at;if(at?.toDate)historyDates[d.id]=at.toDate().toISOString();}wallet.state=withHistory(wallet.state);repaint();},fail));
  syncStatus();void flush();
 }
 function cleanCourse(value){
  const store={getItem:()=>JSON.stringify(value),setItem(){}};return new core.CourseProgress(store).data();
 }
 function participantButton(text,action){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=text;b.onclick=action;return b;}
 function renderChildren(){
  $('family-children').replaceChildren();$('archived-children').replaceChildren();
  const archiveEnabled=window.SlovariumArchiveEnabled===true;
  $('archive-availability').hidden=archiveEnabled;
  const archived=children.filter(c=>!model.isActive(c));
  $('participants-empty').hidden=children.some(model.isActive);
  $('archive-count').textContent=`(${archived.length})`;$('archive-empty').hidden=archived.length>0;
  for(const child of children){
   const isArchived=!model.isActive(child),row=document.createElement('article');row.className='family-child'+(isArchived?' archived':'');
   const h=document.createElement('h3');h.textContent=child.name;row.append(h);
   for(const text of [`Выучено слов: ${child.wallet.words.length}`,`Освоено предложений: ${child.wallet.sentences.length}`,`Баланс: ${model.balance(child.wallet)} $lovari`,`Всего заработано: ${model.earned(child.wallet)} $lovari`]){const p=document.createElement('p');p.textContent=text;row.append(p);}
   const actions=document.createElement('div');actions.className='builder-actions';
   if(isArchived){
    const restore=participantButton('Вернуть в участники',()=>guarded(()=>changeArchive(child.id,false)));restore.disabled=!archiveEnabled;actions.append(restore);
    const note=document.createElement('p');note.className='participant-state';note.textContent='После восстановления подключите устройства заново.';row.append(note);
   }else{
    actions.append(participantButton(child.id===selected?'Открыт этот профиль':'Открыть профиль',()=>choose(child.id)));
    actions.append(participantButton('Изменить имя',()=>{closeEditors();editingId=child.id;$('participant-name').value=child.name;$('participant-editor').hidden=false;$('participant-name').focus();}));
    const remove=participantButton('Убрать из участников',()=>{closeEditors();archiveId=child.id;$('participant-confirm-text').textContent=`Убрать «${child.name}» из участников? Его устройства потеряют доступ. Прогресс и $lovari останутся в архиве.`;$('participant-confirmation').hidden=false;$('participant-cancel').focus();});remove.className+=' danger-link';remove.disabled=!archiveEnabled;actions.append(remove);
   }
   row.append(actions);$(isArchived?'archived-children':'family-children').append(row);
  }
 }
 async function changeArchive(id,archived){
  if(participantBusy)return;
  if(window.SlovariumArchiveEnabled!==true)throw Error('Удаление в архив пока недоступно.');
  if(role!=='parent'||!navigator.onLine)throw Error('Для изменения участников нужны родитель и подключение к интернету');
  participantBusy=true;$('participant-confirm').disabled=true;
  try{
   await F.runTransaction(db,async tx=>{
    const ref=childRef(family,id),snap=await tx.get(ref);if(!snap.exists())throw Error('Участник не найден');
    const data=snap.data(),next=model.archiveParticipant(data,archived);
    if(next!==data)tx.update(ref,{archived:next.archived,accessVersion:next.accessVersion});
   });
   closeEditors();status(archived?'Участник перенесён в архив.':'Участник восстановлен. Подключите устройства заново.');
  }finally{participantBusy=false;$('participant-confirm').disabled=false;}
 }
 $('participant-edit-cancel').onclick=closeEditors;$('participant-cancel').onclick=closeEditors;
 $('participant-confirm').onclick=()=>{const id=archiveId;if(!id)return;return guarded(()=>changeArchive(id,true));};
 $('participant-rename-form').onsubmit=event=>{
  event.preventDefault();const id=editingId;if(!id||participantBusy)return;
  return guarded(async()=>{
   if(role!=='parent'||!navigator.onLine)throw Error('Для изменения имени нужны родитель и подключение к интернету');
   const name=model.participantName($('participant-name').value);participantBusy=true;$('participant-save').disabled=true;
   try{await F.runTransaction(db,async tx=>{const ref=childRef(family,id),snap=await tx.get(ref);if(!snap.exists())throw Error('Участник не найден');model.requireActive(snap.data());tx.update(ref,{name});});closeEditors();status('Имя сохранено.');}
   finally{participantBusy=false;$('participant-save').disabled=false;}
  });
 };
 async function guarded(fn){try{await fn();}catch(e){fail(e);}}
 let loginBusy=false;
 async function login(parent){
  if(auth.currentUser){window.SlovariumUI?.open('settings-view');return;}if(loginBusy)return;
  loginBusy=true;window.SlovariumUI?.loginReady(false);status(parent?'Открываем вход через Google…':'Создаём код устройства…');
  try{await (parent?A.signInWithPopup(auth,new A.GoogleAuthProvider()):A.signInAnonymously(auth));}catch(e){fail(e);}finally{loginBusy=false;window.SlovariumUI?.loginReady(true);}
 }
 $('parent-login').onclick=()=>login(true);
 $('child-login').onclick=()=>login(false);
 $('account-signout').onclick=()=>guarded(async()=>{
  if(queueCount()&&!window.confirm('Есть несохранённые результаты. Они останутся в очереди этого браузера, но после нового анонимного входа потребуется помощь родителя. Выйти?'))return;
  await A.signOut(auth);try{sessionStorage.removeItem('slovarium.selectedChild');}catch{}location.reload();
 });
 $('copy-device').onclick=()=>guarded(async()=>{await navigator.clipboard.writeText(auth.currentUser.uid);status('Код скопирован. Передайте его родителю.');});
 $('child-create-form').onsubmit=event=>{event.preventDefault();void guarded(async()=>{
  if(role!=='parent'||!navigator.onLine)throw Error('Для добавления ребёнка нужен родитель и подключение к интернету');
  const name=model.participantName($('child-name').value);
  const ref=await F.addDoc(kidsRef(family),{name,wallet:model.emptyWallet(),activity:false,archived:false,accessVersion:0,createdAt:F.serverTimestamp()});$('child-name').value='';choose(ref.id);
 });};
 $('device-pair-form').onsubmit=event=>{event.preventDefault();void guarded(async()=>{
  const uid=$('device-input').value.trim();if(!/^[A-Za-z0-9_-]{20,128}$/.test(uid))throw Error('Проверьте код устройства');
  if(role!=='parent'||!selected||!navigator.onLine)throw Error('Выберите ребёнка и проверьте подключение к интернету');
  await F.runTransaction(db,async tx=>{const ref=deviceRef(uid),snap=await tx.get(ref),profile=await tx.get(childRef(family,selected));if(!profile.exists())throw Error('Профиль не найден');model.requireActive(profile.data());if(!snap.exists())throw Error('Код не найден. На устройстве ребёнка нажмите «Я ребёнок».');
   if(snap.data().family&&snap.data().family!==family)throw Error('Устройство уже подключено к другой семье');
   const version=model.accessVersion(profile.data());
   if(version>0&&window.SlovariumArchiveEnabled!==true)throw Error('Подключение восстановленного профиля пока недоступно.');
   tx.update(ref,{family,child:selected,...(window.SlovariumArchiveEnabled===true?{accessVersion:version}:{})});
  });$('device-input').value='';status('Устройство подключено к выбранному ребёнку.');
 });};
 $('import-file').onchange=()=>guarded(async()=>{
  const file=$('import-file').files[0];if(!file)return;if(file.size>2000000)throw Error('Слишком большой файл');
  const value=JSON.parse(await file.text());
  const checker=new core.SlovariWallet({getItem:()=>JSON.stringify(value.wallet)});
  if(value.format!=='slovarium-backup'||value.version!==1||checker.blocked)throw Error('Файл не является корректной копией Словариума');
  const course=cleanCourse(value.course);importData={wallet:checker.state,course};
  const hashBytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({words:[...checker.state.words].sort(),sentences:[...checker.state.sentences].sort(),exchanges:checker.state.exchanges})));
  importData.hash=Array.from(new Uint8Array(hashBytes),b=>b.toString(16).padStart(2,'0')).join('');
  $('import-summary').textContent=`Перенести в «${$('profile-name').textContent}»: ${checker.state.words.length} слов, ${checker.state.sentences.length} предложений, ${checker.balance} $lovari, ${checker.state.exchanges.length} обменов? Копия останется в исходном файле.`;
  $('import-preview').hidden=false;
 });
 $('import-cancel').onclick=()=>{importData=null;$('import-preview').hidden=true;$('import-file').value='';};
 $('import-confirm').onclick=()=>guarded(async()=>{
  if(!importData||role!=='parent'||!selected||!navigator.onLine)throw Error('Для переноса нужен родитель и подключение к интернету');
  const data=importData,ref=childRef(family,selected),marker=F.doc(db,'families',family,'imports',data.hash);
  download({format:'slovarium-backup',version:1,...data});
  await F.runTransaction(db,async tx=>{
   const [snap,old]=await Promise.all([tx.get(ref),tx.get(marker)]);
   if(old.exists())throw Error('Эта копия уже перенесена в семью. Повторное начисление запрещено.');
   if(!snap.exists())throw Error('Профиль не найден');
   model.requireActive(snap.data(),profileVersion);
   const w=snap.data().wallet;
   if(w.words.length||w.sentences.length||w.exchanges.length||snap.data().activity)throw Error('Профиль уже содержит прогресс. Выберите пустой профиль; автоматическое объединение отключено.');
   tx.update(ref,{wallet:data.wallet,imported:true,activity:true});tx.set(marker,{child:selected,createdAt:F.serverTimestamp()});
   for(const [id,result] of Object.entries(data.course.results))tx.set(resultRef(family,selected,id),result);

  });importData=null;$('import-preview').hidden=true;$('import-file').value='';status('Перенос завершён.');
 });
 window.addEventListener('online',()=>{syncStatus();void flush();});window.addEventListener('offline',syncStatus);
 // Retry transient failures without requiring a new answer.
 setInterval(()=>{if(queueCount()&&navigator.onLine)void flush();},15000);
 A.onAuthStateChanged(auth,user=>{
  void guarded(async()=>{
   if(active&&user?.uid!==active.userUid){location.reload();return;}
   stops.forEach(stop=>stop());stops=[];
   $('account-login').hidden=Boolean(user);$('account-signout').hidden=!user;window.SlovariumUI?.authenticated(Boolean(user));
   if(!user){window.SlovariumUI?.open('welcome');status('Выберите способ входа: родитель или ребёнок.');return;}
   window.SlovariumUI?.open('settings-view');
   role=user.isAnonymous?'child':'parent';
   window.SlovariumUI?.profile(role==='parent'?'Родитель':'Подключение');
   if(role==='parent'){
    family=user.uid;$('parent-dashboard').hidden=false;status('Загружаем семью…');
    stops.push(F.onSnapshot(kidsRef(family),snap=>{children=snap.docs.map(d=>({id:d.id,...d.data()}));renderChildren();
     if(!selected){let previous;try{previous=sessionStorage.getItem('slovarium.selectedChild');}catch{}
      if(previous&&children.some(c=>c.id===previous&&model.isActive(c)))choose(previous);
      else {let notice;try{notice=sessionStorage.getItem('slovarium.participantNotice');sessionStorage.removeItem('slovarium.participantNotice');sessionStorage.removeItem('slovarium.selectedChild');}catch{}status(notice||(children.some(model.isActive)?'Выберите профиль ребёнка':'Добавьте первого ребёнка'));}
     }
    },fail));
   }else{
    const ref=deviceRef(user.uid);await F.runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())tx.set(ref,{family:'',child:''});});
    $('device-code').textContent=user.uid;$('child-pairing').hidden=false;status('Ждём подключения родителем');
    stops.push(F.onSnapshot(ref,snap=>{
     const d=snap.data();if(d?.family&&d?.child){
      if(mounted&&(family!==d.family||selected!==d.child)){location.reload();return;}
      family=d.family;choose(d.child,model.accessVersion(d));
     }else if(mounted){location.reload();}else{$('child-pairing').hidden=false;status('Покажите код родителю');}
    },fail));
   }
  });
 });
}
