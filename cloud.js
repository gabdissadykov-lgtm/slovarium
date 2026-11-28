/* Cloud integration loads Firebase only on the hosted site; file:// stays local. */
'use strict';
const $=id=>document.getElementById(id);
const core=window.SlovariumCore,model=window.SlovariumCloudModel;
let active=null;
let oralStop=null;
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
 let detailId=null,pendingProfileId=null,selectionToken=0,deleteName=null,deleteStage=0;
 let family=null,selected=null,role=null,children=[],mounted=false,stops=[],profileStop=null,devicesStop=null,importData=null;
 let connectingChild=false,pendingConnection=null;
 let queue=null,queueKey=null,flushing=false,queueDurable=true,historyDates={};
 let profileVersion=0,bindingVersion=0,profileListeners=[],editingId=null,deleteId=null,participantBusy=false,deletionInProgress=null;
 function withHistory(w){return {...w,exchanges:w.exchanges.map((item,i)=>({...item,date:historyDates[i]||item.date}))};}
 function status(text){$('account-status').textContent=text;}
 function closeEditors(){importData=null;$('import-preview').hidden=true;$('import-file').value='';$('device-input').value='';editingId=null;deleteId=null;deleteName=null;deleteStage=0;$('participant-editor').hidden=true;$('participant-confirmation').hidden=true;$('participant-delete-identity').hidden=true;$('participant-delete-name').value='';$('participant-confirm').hidden=true;$('participant-confirm').disabled=true;$('participant-delete-next').hidden=false;}
 function purgeProfileCache(id){
  let cleaned=true;
  try{for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key&&model.profileQueueKey(key,family,id))localStorage.removeItem(key);}}catch{cleaned=false;}
  try{if(sessionStorage.getItem('slovarium.selectedChild')===id)sessionStorage.removeItem('slovarium.selectedChild');}catch{cleaned=false;}
  return cleaned;
 }
 function purgeDetachedQueues(){
  try{const prefix=`slovarium.pending:${auth.currentUser.uid}:`;for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key?.startsWith(prefix))localStorage.removeItem(key);}}catch{}
 }
 function revokeProfile(message,{reload=true,purge=false}={}){
  ++selectionToken;
  oralStop?.();oralStop=null;
  if(purge&&selected)purgeProfileCache(selected);
  if(active){active.wallet.blocked=true;active.wallet.saved=false;}
  active?.dispose?.();active=null;mounted=false;detailId=null;window.SlovariumUI?.detail?.(null);queue={rewards:[],results:{},preparation:{}};importData=null;
  $('import-preview').hidden=true;$('import-file').value='';
  $('backup-export').disabled=true;closeEditors();
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
   selected=null;window.SlovariumUI?.profile('Родитель');$('account-title').textContent='Кабинет родителя';
   if(reload)location.reload();
  }else{window.SlovariumUI?.profile('Доступ отключён');$('child-pairing').hidden=false;}
 }
 function fail(e){
  if(role==='child'&&(e.code?.includes('permission-denied')||e.message?.includes('Доступ к профилю отключён'))){revokeProfile('Доступ к профилю отключён. Обратитесь к родителю.',{purge:true});return;}
  status(friendly(e));
 }
 function repaint(){active?.repaint?.();window.SlovariumUI?.refreshHeader?.();}
 function persistQueue(){try{localStorage.setItem(queueKey,JSON.stringify({...queue,accessVersion:profileVersion}));queueDurable=true;}catch{queueDurable=false;status('Очередь не сохранена в браузере. Не закрывайте страницу до восстановления связи.');}}
 function queueCount(){return queue?queue.rewards.length+Object.keys(queue.results).length+Object.keys(queue.preparation||{}).length:0;}
 function syncStatus(){
  if(!active||active.wallet.blocked)return;
  active.wallet.saved=navigator.onLine&&queueCount()===0;
  active.preparation?.emit();
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
   for(const id of Object.keys(queue.preparation||{})){
    const mark=queue.preparation[id];
    await F.runTransaction(db,async tx=>{
     const profile=await tx.get(childRef(ownerFamily,ownerChild));if(!profile.exists())throw Error('Профиль не найден');model.requireActive(profile.data(),expected);
     tx.set(F.doc(db,'families',ownerFamily,'children',ownerChild,'preparation',id),{...mark,accessVersion:expected,updatedAt:F.serverTimestamp()});
    });
    if(active!==owner)return;
    if(queue.preparation[id]===mark)delete queue.preparation[id];persistQueue();
   }
   syncStatus();
  }catch(e){fail(e);if(active)active.wallet.saved=false;repaint();}
  finally{flushing=false;}
 }
 function queueReward(kind,id){
  if(role!=='child')return;
  if(!active||active.wallet.blocked)return;
  const known=kind==='words'?core.courseEntries:core.assemblyTasks;
  if(!['words','sentences'].includes(kind)||!known.some(t=>t.id===id))return;
  if(active.wallet.state[kind].includes(id)){active.wallet.message=kind==='words'?'Отлично! Ты помнишь это слово':'Отлично! Ты помнишь это предложение';repaint();return;}
  if(!queue.rewards.some(r=>r.kind===kind&&r.id===id))queue.rewards.push({kind,id});
  active.wallet.message='Награда ожидает сохранения';persistQueue();syncStatus();void flush();
 }
 function choose(id,deviceVersion=0,restoreOnly=false){
  if(participantBusy)return;
  closeEditors();
  if(role==='parent'){
   const child=children.find(c=>c.id===id);
   detailId=restoreOnly?null:id;pendingProfileId=id;
   if(child&&!model.isActive(child)){pendingProfileId=null;renderDetails();window.SlovariumUI?.open('child-profile-view');return;}
  }
  if(mounted&&(selected!==id||!active||(role==='child'&&bindingVersion!==deviceVersion))){
   if(!queueDurable&&queueCount()){status('Не удалось сохранить очередь. Дождитесь синхронизации перед сменой ребёнка.');detailId=null;return;}
   if(queueCount()){persistQueue();if(!queueDurable){status('Очередь не сохранена. Дождитесь синхронизации перед сменой ребёнка.');detailId=null;return;}}
   active?.dispose?.();if(active)active.wallet.blocked=true;active=null;mounted=false;
   profileListeners.forEach(stop=>stop());profileListeners=[];oralStop?.();oralStop=null;historyDates={};
  }
  const token=++selectionToken;let firstSnapshot=true;
  bindingVersion=deviceVersion;selected=id;try{sessionStorage.setItem('slovarium.selectedChild',id);}catch{}
  if(role==='parent')renderChildren();
  if(profileStop)profileStop();if(devicesStop)devicesStop();
  profileStop=F.onSnapshot(childRef(family,id),snap=>{
   if(token!==selectionToken)return;
   if(!snap.exists()){revokeProfile('Профиль удалён или недоступен. Обратитесь к родителю.',{purge:true});return;}
   const data=snap.data();pendingProfileId=null;
   if(role==='parent'&&!children.some(c=>c.id===id))children.push({id,...data});
   if(!model.isActive(data)||(role==='child'&&model.accessVersion(data)!==bindingVersion)||(active&&model.accessVersion(data)!==profileVersion)){
    revokeProfile(role==='parent'?(data.deleting?'Удаление началось. Доступ к профилю закрыт.':'Профиль недоступен. Выберите другого ребёнка.'):'Доступ к профилю отключён. Обратитесь к родителю.',{purge:Boolean(data.deleting)||role==='child',reload:!(data.deleting&&deletionInProgress===id)});return;
   }
   window.SlovariumUI?.profile(data.name);
   $('account-title').textContent=role==='parent'?'Кабинет родителя':`Привет, ${data.name}!`;
   $('profile-name').textContent=data.name;
   const firstMount=!mounted;
   if(firstMount)mountProfile(data);
   else{
    const previous=active.wallet.earned;active.wallet.state=withHistory(data.wallet);
    if(active.wallet.earned>previous)active.wallet.message=`+${active.wallet.earned-previous} $lovari!`;
    syncStatus();
   }
   $('child-pairing').hidden=true;$('profile-tools').hidden=role!=='parent'||detailId!==selected;
   if(role==='parent'){renderDetails();if(!detailId){$('oral-check').hidden=true;$('backup-tools').hidden=true;}if(firstSnapshot)window.SlovariumUI?.open(restoreOnly?'settings-view':'child-profile-view');firstSnapshot=false;}
   try{if(role==='parent'&&sessionStorage.getItem('slovarium.openOral')===selected){sessionStorage.removeItem('slovarium.openOral');window.SlovariumUI?.open('child-profile-view');$('oral-check').scrollIntoView({behavior:'smooth'});}}catch{}
  },fail);
  if(role==='parent')devicesStop=F.onSnapshot(F.query(F.collection(db,'devices'),F.where('family','==',family),F.where('child','==',id)),snap=>{
   if(token!==selectionToken)return;
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
  queue={rewards:[],results:{},preparation:{}};
  try{
   const old=role==='child'?JSON.parse(localStorage.getItem(queueKey)):null;
   if(old){
    if((old.accessVersion??0)!==profileVersion||!Array.isArray(old.rewards)||!old.results||typeof old.results!=='object')throw Error('invalid queue');
    queue.rewards=old.rewards.filter(r=>['words','sentences'].includes(r.kind)&&(r.kind==='words'?core.courseEntries:core.assemblyTasks).some(t=>t.id===r.id));
    queue.results=cleanCourse({version:2,results:old.results}).results;
    for(const [id,mark]of Object.entries(old.preparation||{}))if(validPreparation(id,mark))queue.preparation[id]={kind:mark.kind,entry:mark.entry,known:mark.known};
   }
  }catch{status('Очередь повреждена или хранилище недоступно. Не закрывайте страницу; новые результаты могут не сохраниться локально.');queueDurable=false;}
  const wallet={state:withHistory(data.wallet),raw:'cloud',saved:false,blocked:false,message:'',get earned(){return model.earned(this.state);},get balance(){return model.balance(this.state);},reward(kind,id){if(active?.wallet!==this||this.blocked)return;queueReward(kind,id);},
   async buyHint(entry,lang,position){
    if(role!=='child'||!active||active.wallet!==this||this.blocked||!navigator.onLine||queueCount()){this.message='Подсказка доступна после подключения и сохранения результатов';return false;}
    const task=core.assemblyTasks.find(t=>t.id===entry);
    if(!task||!['kk','ru'].includes(lang)||!Number.isInteger(position)||position<0||position>=core.sentenceWords(task.translations[lang].text).length)return false;
    const ownerFamily=family,ownerChild=selected,expectedVersion=profileVersion;
    this.saved=false;repaint();
    try{let purchased;
     await F.runTransaction(db,async tx=>{
      const ref=childRef(ownerFamily,ownerChild),snap=await tx.get(ref);if(!snap.exists())throw Error('Профиль не найден');model.requireActive(snap.data(),expectedVersion);
      const w=snap.data().wallet;
      if(w.version===1&&w.exchanges.length)throw Error('Попроси родителя один раз открыть твой профиль для обновления кошелька. Бесплатная помощь доступна.');
      purchased=model.buyHint(w,entry,lang,position);if(purchased!==w)tx.update(ref,{wallet:purchased,activity:true});
     });
     // The profile snapshot is authoritative; never overwrite a newer parallel snapshot with this transaction's older wallet.
     this.message='Подсказка сохранена. Повторного списания за это слово не будет.';return true;
    }catch(e){this.message=friendly(e);return false;}finally{syncStatus();}
   },
   async exchange(expected){
    if(role!=='parent'||!active||active.wallet!==this||this.blocked||!navigator.onLine||queueCount())return false;
    const ownerFamily=family,ownerChild=selected,expectedVersion=profileVersion;
    this.saved=false;repaint();
    try{await F.runTransaction(db,async tx=>{const ref=childRef(ownerFamily,ownerChild),snap=await tx.get(ref);if(!snap.exists())throw Error('Профиль не найден');model.requireActive(snap.data(),expectedVersion);const w=snap.data().wallet;
      // Record the exchange event with authoritative server time in the same transaction.
      const next=model.exchange(w,expected,new Date().toISOString());
      tx.update(ref,{wallet:next,lastExchangeAt:F.serverTimestamp()});
      tx.set(F.doc(db,'families',ownerFamily,'children',ownerChild,'exchanges',String(w.exchanges.length)),{amount:expected,at:F.serverTimestamp()});
     });this.message='Обмен сохранён. Достижения остались.';return true;
    }catch(e){this.message=friendly(e);return false;}finally{syncStatus();}
   }};
  let owner;
  class OnlineProgress extends core.CourseProgress{
   constructor(){super({getItem:()=>JSON.stringify({version:2,results:queue.results}),setItem(){}});this.cloudReady=true;}
   persist(){this.saved=true;/* Selection stays in this session; results have their own documents. */}
   record(id,level,score){
    if(role!=='child'||active!==owner||!active||active.wallet.blocked)return;
    const before=JSON.stringify(this.results[id]);super.record(id,level,score);
    if(this.cloudReady&&JSON.stringify(this.results[id])!==before){queue.results[id]=JSON.parse(JSON.stringify(this.results[id]));persistQueue();syncStatus();void flush();}
   }
  }
  const preparation={state:{},seen:false,listeners:new Set(),
   getKnown(kind,entry){return this.state[`${kind}_${entry}`]?.known===true;},
   get message(){return !this.seen?'Загружаем подготовку…':!queueDurable?'Отметки не сохранены в браузере. Не закрывайте страницу.':!navigator.onLine?'Нет сети. Отметки ожидают сохранения.':Object.keys(queue.preparation).length?'Отметки ожидают облачного сохранения':'Подготовка сохранена в облаке';},
   watch(fn){this.listeners.add(fn);return ()=>this.listeners.delete(fn);},emit(){for(const fn of this.listeners)fn();},
   set(kind,entry,known){
    const id=`${kind}_${entry}`,mark={kind,entry,known};if(role!=='child'||active!==owner||wallet.blocked||!validPreparation(id,mark))return;
    queue.preparation[id]=mark;this.state[id]=mark;persistQueue();syncStatus();void flush();
   }
  };
  const progress=new OnlineProgress();active={wallet,progress,preparation,role,userUid:auth.currentUser.uid};owner=active;
  if(role==='parent'&&data.wallet.version===1){
   const ownerFamily=family,ownerChild=selected,expectedVersion=profileVersion;
   void F.runTransaction(db,async tx=>{const ref=childRef(ownerFamily,ownerChild),snap=await tx.get(ref);if(!snap.exists())return;model.requireActive(snap.data(),expectedVersion);const w=snap.data().wallet;if(w.version===1)tx.update(ref,{wallet:model.migrateWallet(w)});}).catch(e=>{if(active===owner){wallet.message=friendly(e);repaint();}});
  }
  core.mount(active);$('backup-export').disabled=false;document.querySelector('.wallet[aria-labelledby="wallet-title"]').hidden=false;
  profileListeners.push(F.onSnapshot(F.collection(db,'families',family,'children',selected,'preparation'),snap=>{
   if(active!==owner)return;
   const next={};for(const d of snap.docs)if(validPreparation(d.id,d.data()))next[d.id]=d.data();
   for(const [id,mark]of Object.entries(queue.preparation))next[id]=mark;
   preparation.state=next;preparation.seen=!snap.metadata?.fromCache;preparation.emit();
  },e=>{if(active===owner){preparation.seen=false;preparation.emit();fail(e);}}));
  profileListeners.push(F.onSnapshot(F.collection(db,'families',family,'children',selected,'results'),snap=>{
   for(const d of snap.docs){const cleaned=cleanCourse({version:2,results:{[d.id]:d.data()}}).results[d.id];if(cleaned)progress.results[d.id]=model.mergeResults(progress.results[d.id]||{},cleaned);}
   repaint();
  },fail));
  profileListeners.push(F.onSnapshot(F.collection(db,'families',family,'children',selected,'exchanges'),snap=>{historyDates={};for(const d of snap.docs){const at=d.data().at;if(at?.toDate)historyDates[d.id]=at.toDate().toISOString();}wallet.state=withHistory(wallet.state);repaint();},fail));
  oralStop?.();oralStop=window.SlovariumOral.mount({F,db,family,child:selected,role,core,onError:fail});
  syncStatus();void flush();
 }
 function validPreparation(id,value){return value&&['words','sentences'].includes(value.kind)&&typeof value.known==='boolean'&&id===`${value.kind}_${value.entry}`&&core.courseEntries.some(e=>e.id===value.entry);}
 function cleanCourse(value){
  const store={getItem:()=>JSON.stringify(value),setItem(){}};return new core.CourseProgress(store).data();
 }
 function participantButton(text,action){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=text;b.onclick=action;return b;}
 function askDelete(child){
  if(role!=='parent'||participantBusy)return;
  closeEditors();deleteId=child.id;deleteName=child.name;deleteStage=1;
  $('participant-confirm-title').textContent=child.deleting?'Продолжить удаление ребёнка?':'Удалить ребёнка навсегда?';
  $('participant-confirm-text').textContent=`Удалить «${child.name}» навсегда? Будут удалены профиль, прогресс, $lovari и история обменов. Устройства потеряют доступ. Восстановить данные через кабинет нельзя.`;
  $('participant-confirmation').hidden=false;$('participant-cancel').focus();
 }
 function renderDetails(){
  const child=children.find(c=>c.id===detailId);
  if(role!=='parent'||!child){$('profile-tools').hidden=true;$('child-preparation-summary').hidden=true;return;}
  if(deleteId===child.id&&deleteName!==child.name)closeEditors();
  window.SlovariumUI?.detail?.({name:child.name,balance:model.balance(child.wallet),available:model.isActive(child)&&selected===child.id&&Boolean(active)});
  $('child-profile-title').textContent=child.name;$('profile-name').textContent='Устройства и перенос прогресса';
  $('child-profile-summary').replaceChildren();$('child-profile-actions').replaceChildren();
  for(const text of [`Выучено слов: ${child.wallet.words.length}`,`Освоено предложений: ${child.wallet.sentences.length}`,`Баланс: ${model.balance(child.wallet)} $lovari`,`Всего заработано: ${model.earned(child.wallet)} $lovari`]){const p=document.createElement('p');p.textContent=text;$('child-profile-summary').append(p);}
  const actions=$('child-profile-actions'),live=model.isActive(child)&&selected===child.id&&Boolean(active);
  if(live){
   actions.append(participantButton('Прогресс',()=>window.SlovariumUI?.open('progress-view')));
   actions.append(participantButton('Кошелёк и обмен',()=>window.SlovariumUI?.open('wallet-view')));
   actions.append(participantButton('Проверить знания',()=>{$('oral-check').scrollIntoView({behavior:'smooth'});}));
   actions.append(participantButton('Изменить имя',()=>{closeEditors();editingId=child.id;$('participant-name').value=child.name;$('participant-editor').hidden=false;$('participant-name').focus();}));
  }
  const remove=participantButton(child.deleting?'Продолжить удаление':'Удалить ребёнка',()=>askDelete(child));remove.className+=' danger-link';actions.append(remove);
  for(const button of actions.children)button.disabled=participantBusy;
  $('profile-tools').hidden=!live;$('child-preparation-summary').hidden=!live;$('oral-check').hidden=!live;$('backup-tools').hidden=!live;
 }
 function renderChildren(){
  $('family-children').replaceChildren();$('archived-children').replaceChildren();$('deleting-children').replaceChildren();
  const archived=children.filter(c=>c.archived===true&&!c.deleting),deleting=children.filter(c=>c.deleting===true);
  $('participants-empty').hidden=children.some(model.isActive);
  $('archive-count').textContent=`(${archived.length})`;$('participants-archive').hidden=archived.length===0;
  $('deletions-panel').hidden=deleting.length===0;
  for(const child of children){
   const row=document.createElement('article');row.className='family-child family-child-compact';
   const copy=document.createElement('div'),h=document.createElement('h3');h.textContent=child.name;copy.append(h);
   const summary=document.createElement('p');summary.textContent=child.deleting?'Удаление не завершено':`Слова: ${child.wallet.words.length} · Предложения: ${child.wallet.sentences.length} · ${model.balance(child.wallet)} $lovari`;copy.append(summary);row.append(copy);
   const open=participantButton('Открыть профиль',()=>choose(child.id));open.disabled=participantBusy;row.append(open);
   $(child.deleting?'deleting-children':model.isActive(child)?'family-children':'archived-children').append(row);
  }
  if(detailId&&detailId!==pendingProfileId&&!children.some(c=>c.id===detailId)){detailId=null;closeEditors();window.SlovariumUI?.detail?.(null);window.SlovariumUI?.open('settings-view');}
  renderDetails();
 }
 async function deleteParticipant(id,confirmedName){
  if(participantBusy)return;
  if(role!=='parent'||!navigator.onLine){status('Для удаления нужны родитель и подключение к интернету');return;}
  const ownerFamily=family,ref=childRef(ownerFamily,id);
  participantBusy=true;deletionInProgress=id;$('participant-confirm').disabled=true;$('participant-cancel').disabled=true;
  renderChildren();status('Удаляем профиль и связанные данные…');
  try{
   // Lock first: no new results, rewards, imports, exchanges or bindings can arrive after this transaction.
   await F.runTransaction(db,async tx=>{
    const snap=await tx.get(ref);if(!snap.exists())return;
    const data=snap.data();if(data.name!==confirmedName)throw Error('Имя ребёнка изменилось. Подтвердите удаление заново.');const next=model.beginDeletion(data);
    if(next!==data)tx.update(ref,{deleting:true,archived:true,accessVersion:next.accessVersion});
   });
   const cacheClean=purgeProfileCache(id);
   // All child-owned collections, including oral assessment history.
   for(const name of ['results','exchanges','checks','checkLive','preparation']){
    while(true){
     const snap=await F.getDocsFromServer(F.query(F.collection(db,'families',ownerFamily,'children',id,name),F.limit(100)));
     if(!snap.docs.length)break;
     const batch=F.writeBatch(db);for(const item of snap.docs)batch.delete(item.ref);await batch.commit();
    }
   }
   // A device may have been rebound elsewhere by another parent session: re-read each before clearing it.
   while(true){
    const devices=await F.getDocsFromServer(F.query(F.collection(db,'devices'),F.where('family','==',ownerFamily),F.where('child','==',id),F.limit(100)));
    if(!devices.docs.length)break;
    for(const item of devices.docs)await F.runTransaction(db,async tx=>{
     const snap=await tx.get(item.ref);
     if(snap.exists()&&snap.data().family===ownerFamily&&snap.data().child===id)tx.set(item.ref,{family:'',child:''});
    });
   }
   // Keep only the family-level fingerprint that prevents importing the same backup twice.
   while(true){
    const imports=await F.getDocsFromServer(F.query(F.collection(db,'families',ownerFamily,'imports'),F.where('child','==',id),F.limit(100)));
    if(!imports.docs.length)break;
    for(const item of imports.docs)await F.runTransaction(db,async tx=>{
     const snap=await tx.get(item.ref);if(snap.exists()&&snap.data().child===id)tx.set(item.ref,{used:true});
    });
   }
   // Final deletion happens only after server queries confirmed all known dependent data was cleared.
   await F.runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())return;if(!snap.data().deleting)throw Error('Состояние профиля изменилось');tx.delete(ref);});
   closeEditors();status('Ребёнок и его данные удалены.'+(cacheClean?'':' Локальную очередь очистить не удалось: проверьте доступ к хранилищу браузера.'));
  }catch(e){
   status('Удаление не завершено. Продолжите удаление после восстановления связи. '+friendly(e));
  }finally{
   participantBusy=false;deletionInProgress=null;closeEditors();$('participant-cancel').disabled=false;renderChildren();
  }
 }
 $('participant-edit-cancel').onclick=closeEditors;$('participant-cancel').onclick=closeEditors;
 $('participant-delete-next').onclick=()=>{
  if(role!=='parent'||!deleteId||deleteStage!==1)return;
  deleteStage=2;$('participant-delete-identity').hidden=false;$('participant-delete-next').hidden=true;$('participant-confirm').hidden=false;$('participant-confirm').disabled=true;$('participant-delete-name').focus();
 };
 function deletionConfirmed(){const child=children.find(c=>c.id===deleteId);return role==='parent'&&deleteStage===2&&detailId===deleteId&&child&&child.name===deleteName&&$('participant-delete-name').value===deleteName;}
 $('participant-delete-name').oninput=()=>{$('participant-confirm').disabled=!deletionConfirmed();};
 $('participant-confirm').onclick=()=>{const id=deleteId;if(!deletionConfirmed())return;return deleteParticipant(id,deleteName);};
 $('participant-rename-form').onsubmit=event=>{
  event.preventDefault();const id=editingId;if(!id||participantBusy)return;
  return guarded(async()=>{
   if(role!=='parent'||!navigator.onLine)throw Error('Для изменения имени нужны родитель и подключение к интернету');
   const name=model.participantName($('participant-name').value);participantBusy=true;$('participant-save').disabled=true;
   try{await F.runTransaction(db,async tx=>{const ref=childRef(family,id),snap=await tx.get(ref);if(!snap.exists())throw Error('Участник не найден');model.requireActive(snap.data());tx.update(ref,{name});});closeEditors();status('Имя сохранено.');}
   finally{participantBusy=false;$('participant-save').disabled=false;renderChildren();}
  });
 };
 async function guarded(fn){try{await fn();}catch(e){fail(e);}}
 let loginBusy=false;
 async function login(parent){
  if(auth.currentUser){window.SlovariumUI?.open('settings-view');return;}if(loginBusy)return;
  loginBusy=true;window.SlovariumUI?.loginReady(false);status(parent?'Открываем вход через Google…':'Создаём код устройства…');
  try{await (parent?A.signInWithPopup(auth,new A.GoogleAuthProvider()):A.signInAnonymously(auth));}catch(e){fail(e);}finally{loginBusy=false;window.SlovariumUI?.loginReady(true);}
 }
 window.SlovariumUI?.onView?.(view=>{
  if(role==='parent'&&(view==='settings-view'||view==='welcome')){detailId=null;closeEditors();window.SlovariumUI?.detail?.(null);$('profile-tools').hidden=true;$('child-preparation-summary').hidden=true;$('oral-check').hidden=true;$('backup-tools').hidden=true;}
 });
 $('profile-cabinet-return').onclick=()=>{detailId=null;closeEditors();window.SlovariumUI?.detail?.(null);$('profile-tools').hidden=true;$('child-preparation-summary').hidden=true;$('oral-check').hidden=true;$('backup-tools').hidden=true;window.SlovariumUI?.open('settings-view');};
 $('parent-login').onclick=()=>login(true);
 $('child-login').onclick=()=>login(false);
 $('account-signout').onclick=()=>guarded(async()=>{
  if(queueCount()&&!window.confirm('Есть несохранённые результаты. Они останутся в очереди этого браузера, но после нового анонимного входа потребуется помощь родителя. Выйти?'))return;
  await A.signOut(auth);try{sessionStorage.removeItem('slovarium.selectedChild');}catch{}location.reload();
 });
 $('copy-device').onclick=()=>guarded(async()=>{await navigator.clipboard.writeText(auth.currentUser.uid);status('Код скопирован. Передайте его родителю.');});
 $('child-create-form').onsubmit=event=>{event.preventDefault();if(connectingChild)return;void guarded(async()=>{
  if(role!=='parent'||!navigator.onLine)throw Error('Для подключения ребёнка нужен родитель и подключение к интернету');
  const name=model.participantName($('child-name').value),uid=$('child-device-code').value.trim();
  if(!/^[A-Za-z0-9_-]{20,128}$/.test(uid))throw Error('Проверьте код устройства');
  connectingChild=true;$('child-connect-submit').disabled=true;
  const ownerFamily=family,pendingKey=`slovarium.connectChild:${ownerFamily}`;
  try{
   if(!pendingConnection){try{const saved=JSON.parse(localStorage.getItem(pendingKey));if(saved&&typeof saved.id==='string'&&/^[A-Za-z0-9_-]+$/.test(saved.id)&&saved.uid===uid)pendingConnection=saved;}catch{}}
   if(!pendingConnection||pendingConnection.uid!==uid)pendingConnection={uid,id:F.doc(kidsRef(ownerFamily)).id};
   const attempt=pendingConnection,ref=childRef(ownerFamily,attempt.id);
   try{localStorage.setItem(pendingKey,JSON.stringify(attempt));}catch{}
   status('Подключаем ребёнка…');
   await F.runTransaction(db,async tx=>{
    const device=deviceRef(uid),deviceSnap=await tx.get(device),profile=await tx.get(ref);
    if(!deviceSnap.exists())throw Error('Код не найден. На устройстве ребёнка нажмите «Я ребёнок».');
    const binding=deviceSnap.data();
    if(binding.family||binding.child){
     if(binding.family===ownerFamily&&binding.child===ref.id&&profile.exists()){
      model.requireActive(profile.data());
      if(model.accessVersion(binding)!==model.accessVersion(profile.data()))throw Error('Устройство отключено. Подключите его из существующего профиля.');
      return; // The same attempt was already confirmed by the server.
     }
     throw Error('Устройство уже подключено. Для нового ребёнка используйте свободный код.');
    }
    if(profile.exists())throw Error('Профиль уже существует. Подключите устройство из его профиля.');
    tx.set(ref,{name,wallet:model.emptyWallet(),activity:false,archived:false,accessVersion:0,createdAt:F.serverTimestamp()});
    tx.update(device,{family:ownerFamily,child:ref.id,accessVersion:0});
   });
   pendingConnection=null;try{localStorage.removeItem(pendingKey);}catch{}
   $('child-name').value='';$('child-device-code').value='';status('Ребёнок подключён.');choose(ref.id);
  }finally{connectingChild=false;$('child-connect-submit').disabled=false;}
 });};
 $('device-pair-form').onsubmit=event=>{event.preventDefault();void guarded(async()=>{
  const ownerChild=selected,ownerFamily=family,expectedVersion=profileVersion;
  const uid=$('device-input').value.trim();if(!/^[A-Za-z0-9_-]{20,128}$/.test(uid))throw Error('Проверьте код устройства');
  if(role!=='parent'||!selected||!navigator.onLine)throw Error('Выберите ребёнка и проверьте подключение к интернету');
  await F.runTransaction(db,async tx=>{const ref=deviceRef(uid),snap=await tx.get(ref),profile=await tx.get(childRef(ownerFamily,ownerChild));if(!profile.exists())throw Error('Профиль не найден');model.requireActive(profile.data(),expectedVersion);if(!snap.exists())throw Error('Код не найден. На устройстве ребёнка нажмите «Я ребёнок».');
   if((snap.data().family||snap.data().child)&&(snap.data().family!==ownerFamily||snap.data().child!==ownerChild))throw Error('Устройство уже подключено к другому профилю. Сначала отключите его.');
   const version=model.accessVersion(profile.data());
   tx.update(ref,{family:ownerFamily,child:ownerChild,accessVersion:version});
  });if(selected===ownerChild)$('device-input').value='';status('Устройство подключено к выбранному ребёнку.');
 });};
 $('import-file').onchange=()=>guarded(async()=>{
  const ownerChild=selected,ownerFamily=family;
  if(role!=='parent'||detailId!==selected)return;
  const file=$('import-file').files[0];if(!file)return;if(file.size>2000000)throw Error('Слишком большой файл');
  const value=JSON.parse(await file.text());
  if(selected!==ownerChild||family!==ownerFamily||detailId!==ownerChild)return;
  const checker=new core.SlovariWallet({getItem:()=>JSON.stringify(value.wallet)});
  if(value.format!=='slovarium-backup'||value.version!==1||checker.blocked)throw Error('Файл не является корректной копией Словариума');
  const course=cleanCourse(value.course);importData={wallet:checker.state,course};
  const hashBytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({words:[...checker.state.words].sort(),sentences:[...checker.state.sentences].sort(),exchanges:checker.state.exchanges})));
  if(selected!==ownerChild||family!==ownerFamily||detailId!==ownerChild){importData=null;return;}
  importData.hash=Array.from(new Uint8Array(hashBytes),b=>b.toString(16).padStart(2,'0')).join('');
  $('import-summary').textContent=`Перенести в «${children.find(c=>c.id===ownerChild)?.name||'ребёнок'}»: ${checker.state.words.length} слов, ${checker.state.sentences.length} предложений, ${checker.balance} $lovari, ${checker.state.exchanges.length} обменов? Копия останется в исходном файле.`;
  $('import-preview').hidden=false;
 });
 $('import-cancel').onclick=()=>{importData=null;$('import-preview').hidden=true;$('import-file').value='';};
 $('import-confirm').onclick=()=>guarded(async()=>{
  if(!importData||role!=='parent'||!selected||!navigator.onLine)throw Error('Для переноса нужен родитель и подключение к интернету');
  const ownerFamily=family,ownerChild=selected,expectedVersion=profileVersion,data=importData,ref=childRef(ownerFamily,ownerChild),marker=F.doc(db,'families',ownerFamily,'imports',data.hash);
  download({format:'slovarium-backup',version:1,...data});
  await F.runTransaction(db,async tx=>{
   const [snap,old]=await Promise.all([tx.get(ref),tx.get(marker)]);
   if(old.exists())throw Error('Эта копия уже перенесена в семью. Повторное начисление запрещено.');
   if(!snap.exists())throw Error('Профиль не найден');
   model.requireActive(snap.data(),expectedVersion);
   const w=snap.data().wallet;
   if(w.words.length||w.sentences.length||w.exchanges.length||snap.data().activity)throw Error('Профиль уже содержит прогресс. Выберите пустой профиль; автоматическое объединение отключено.');
   tx.update(ref,{wallet:data.wallet,imported:true,activity:true});tx.set(marker,{child:ownerChild,createdAt:F.serverTimestamp()});
   for(const [id,result] of Object.entries(data.course.results))tx.set(resultRef(ownerFamily,ownerChild,id),result);

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
   window.SlovariumUI?.parent(role==='parent'?(user.displayName?.trim()||'Родитель'):null);
   window.SlovariumUI?.profile(role==='parent'?'Родитель':'Подключение');
   if(role==='parent'){
    family=user.uid;$('account-title').textContent='Кабинет родителя';$('oral-check').hidden=true;$('child-profile-content').append($('oral-check'),$('backup-tools'));$('backup-tools').hidden=true;$('parent-dashboard').hidden=false;status('Загружаем семью…');
    stops.push(F.onSnapshot(kidsRef(family),snap=>{children=snap.docs.map(d=>({id:d.id,...d.data()}));renderChildren();
     if(!selected){let previous;try{previous=sessionStorage.getItem('slovarium.selectedChild');}catch{}
      if(previous&&children.some(c=>c.id===previous&&model.isActive(c)))choose(previous,0,true);
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
     }else if(mounted){if(selected)purgeProfileCache(selected);purgeDetachedQueues();location.reload();}else{purgeDetachedQueues();$('child-pairing').hidden=false;status('Покажите код родителю');}
    },fail));
   }
  });
 });
}
