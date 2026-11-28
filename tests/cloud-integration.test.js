'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('../script.js'),model=require('../cloud-model.js');
class Element{
 constructor(){this.hidden=false;this.children=[];this.value='';this.files=[];this.textContent='';this.attributes={};}
 setAttribute(name,value){this.attributes[name]=String(value);}
 addEventListener(name,fn){this[name]=fn;}append(...items){this.children.push(...items);}replaceChildren(...items){this.children=items;}focus(){}scrollIntoView(){}removeAttribute(name){delete this.attributes[name];}removeEventListener(){}click(){if(!this.disabled)return this.onclick?.();}
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function settle(){for(let i=0;i<12;i++)await tick();}
function storage(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k),get length(){return map.size;},key:i=>[...map.keys()][i]??null,map};}
function backend(){
 const docs=new Map(),listeners=[],controls={batch:0,failBatchAt:0,onQuery:null};let serial=Promise.resolve(),nextDoc=0;
 const snap=ref=>({id:ref.path.split('/').at(-1),ref,exists:()=>docs.has(ref.path),metadata:{fromCache:false,hasPendingWrites:false},data:()=>structuredClone(docs.get(ref.path))});
 const get=(ref)=>ref.type==='collection'?{docs:[...docs.keys()].filter(k=>k.startsWith(ref.path+'/')&&k.split('/').length===ref.path.split('/').length+1).map(path=>snap({path})).filter(d=>!ref.filters||ref.filters.every(f=>d.data()[f.field]===f.value)).slice(0,ref.max??Infinity)}:snap(ref);
 const notify=()=>listeners.slice().forEach(l=>queueMicrotask(()=>{if(listeners.includes(l))l.fn(get(l.ref));}));
 const api={getFirestore:()=>({}),doc:(_, ...path)=>{const p=_.path?_.path+'/'+(path[0]||'session-'+(++nextDoc)):path.join('/');return {type:'doc',path:p,id:p.split('/').at(-1)};},collection:(_, ...path)=>({type:'collection',path:path.join('/')}),where:(field,op,value)=>({field,value}),limit:max=>({max}),query:(ref,...filters)=>({...ref,filters:filters.filter(f=>f.field),max:filters.find(f=>f.max)?.max}),
  async getDocFromServer(ref){return get(ref);},
  async getDocsFromServer(ref){const result=get(ref);controls.onQuery?.(ref,result);return result;},
  writeBatch(){const refs=[];return {delete:ref=>refs.push(ref),async commit(){controls.batch++;if(controls.batch===controls.failBatchAt)throw Object.assign(Error('Сбой сети'),{code:'unavailable'});for(const ref of refs)docs.delete(ref.path);notify();}};},
  serverTimestamp:()=>({server:true}),Timestamp:{fromDate:d=>d.toISOString()},
  onSnapshot(ref,options,callback){const fn=typeof options==='function'?options:callback;const l={ref,fn};listeners.push(l);queueMicrotask(()=>fn(get(ref)));return ()=>listeners.splice(listeners.indexOf(l),1);},
  runTransaction(db,fn){const task=serial.then(async()=>{const writes=[];const tx={get:async ref=>snap(ref),set:(ref,value)=>writes.push([ref,value]),update:(ref,value)=>writes.push([ref,{...docs.get(ref.path),...value}]),delete:ref=>writes.push([ref,null])};await fn(tx);for(const [ref,value]of writes){if(value===null)docs.delete(ref.path);else docs.set(ref.path,structuredClone(value));}notify();if(controls.loseNextAck){controls.loseNextAck=false;throw Object.assign(Error('Нет подтверждения'),{code:'unavailable'});}});serial=task.catch(()=>{});return task;},
  async addDoc(ref,value){const id='kid'+(docs.size+1),path=ref.path+'/'+id;docs.set(path,structuredClone(value));notify();return {id,path};},
  async updateDoc(ref,value){docs.set(ref.path,{...docs.get(ref.path),...value});notify();}
 };
 return {docs,api,notify,controls};
}
async function session(back,user,options={}){
 const elements={};for(const [,id]of fs.readFileSync('index.html','utf8').matchAll(/id="([^"]+)"/g))elements[id]=new Element();
 const local=options.local||storage(),sessionStore=options.session||storage(),events={};let mounted;
 const auth={currentUser:user};
 const A={getAuth:()=>auth,browserLocalPersistence:{},setPersistence:async()=>{},onAuthStateChanged:(auth,fn)=>queueMicrotask(()=>fn(auth.currentUser)),signOut:async()=>{auth.currentUser=null;},GoogleAuthProvider:class{}};
 const walletElement=new Element();
 const context={console,structuredClone,queueMicrotask,TextEncoder,Blob,URL,crypto:require('node:crypto').webcrypto,setTimeout:()=>0,setInterval:()=>0,navigator:{onLine:true},localStorage:local,sessionStorage:sessionStore,
  location:{protocol:'https:',reload(){context.reloads++;}},reloads:0,
  MutationObserver:class{observe(){}},
  document:{querySelectorAll:()=>[],getElementById:id=>elements[id],querySelector:()=>walletElement,createElement:()=>new Element()},
  __app:{initializeApp:()=>({})},__auth:A,__firestore:back.api};
 context.window={SlovariumOnline:true,SlovariumFirebaseConfig:{},SlovariumCloudModel:model,SlovariumCore:{...core,mount:x=>{mounted=x;x.repaint=()=>{};x.dispose=()=>{x.disposed=true;};context.window.SlovariumUI.setReady();context.window.SlovariumUI.open('learning');}},addEventListener:(k,fn)=>{const prior=events[k];events[k]=()=>{prior?.();fn();};},removeEventListener:()=>{},confirm:()=>true};
 const uiSource=fs.readFileSync('script.js','utf8');vm.runInNewContext(uiSource.slice(uiSource.indexOf('function initializeInterface()'),uiSource.indexOf('\nfunction mount(online='))+'\nwindow.SlovariumUI=initializeInterface();',context);
 vm.runInNewContext(fs.readFileSync('oral-check.js','utf8'),context);
 let source=fs.readFileSync('cloud.js','utf8');
 for(const [name,key]of [['app','__app'],['auth','__auth'],['firestore','__firestore']])source=source.replace(`import('https://www.gstatic.com/firebasejs/13.4.0/firebase-${name}.js')`,`Promise.resolve(${key})`);
 vm.runInNewContext(source,context);await settle();
 return {elements,context,local,sessionStore,events,get active(){return mounted;}};
}
test('online child: pending pairing, parent attachment, replay on two devices and offline queue retry',async()=>{
 const back=backend(),family='parent-uid',child='child-1',uid='anonymous-uid-123456789012345';
 back.docs.set(`families/${family}/children/${child}`,{name:'Алия',wallet:model.emptyWallet(),activity:false});
 const first=await session(back,{uid,isAnonymous:true});assert.equal(first.active,undefined);assert.equal(first.elements['device-code'].textContent,uid);
 back.docs.set('devices/'+uid,{family,child});back.notify();await settle();assert.ok(first.active);assert.equal(first.active.role,'child');
 const id=core.courseEntries[0].id;first.active.wallet.reward('words',id);await settle();assert.equal(first.active.wallet.balance,10);assert.equal(first.active.wallet.saved,true);
 const second=await session(back,{uid,isAnonymous:true});assert.equal(second.active.wallet.balance,10);second.active.wallet.reward('words',id);await settle();assert.equal(first.active.wallet.balance,10);
 first.context.navigator.onLine=false;first.events.offline();first.active.wallet.reward('sentences',id);assert.equal(first.active.wallet.balance,10);assert.equal(first.active.wallet.saved,false);
 assert.ok([...first.local.map.values()].some(v=>v.includes('sentences')));
 first.context.navigator.onLine=true;first.events.online();await settle();assert.equal(first.active.wallet.balance,30);assert.equal(second.active.wallet.balance,30);
 assert.equal(await first.active.wallet.exchange(30),false);assert.equal(first.active.wallet.balance,30);
});
test('online parent: isolated profile data, full exchange, stale amount and retained history',async()=>{
 const back=backend(),family='parent-uid',child='child-1';let w=model.addReward(model.emptyWallet(),'words',core.courseEntries[0].id);
 back.docs.set(`families/${family}/children/${child}`,{name:'Алия',wallet:w,activity:true});
 const sess=storage();sess.setItem('slovarium.selectedChild',child);
 const parent=await session(back,{uid:family,isAnonymous:false},{session:sess});assert.equal(parent.active.wallet.balance,10);assert.equal(parent.active.role,'parent');
 assert.equal(await parent.active.wallet.exchange(20),false);await settle();assert.equal(parent.active.wallet.balance,10);
 assert.equal(await parent.active.wallet.exchange(10),true);await settle();assert.equal(parent.active.wallet.balance,0);assert.equal(parent.active.wallet.earned,10);
 const saved=back.docs.get(`families/${family}/children/${child}`);assert.equal(saved.wallet.words.length,1);assert.equal(saved.wallet.exchanges.length,1);
 assert.ok(back.docs.has(`families/${family}/children/${child}/exchanges/0`));
 assert.equal(await parent.active.wallet.exchange(10),false);
});
test('Firestore allowed-ID expression matches exactly all 829 course entries',()=>{
 const rules=fs.readFileSync('firestore.rules','utf8'),expression=rules.match(/return id.matches\('([^']+)'\)/)[1],re=new RegExp('^(?:'+expression+')$');
 const expected=new Set(core.courseEntries.map(e=>e.id));let actual=0;
 for(let module=1;module<=9;module++)for(let row=0;row<=999;row++){
  const id=`m${module}-r${String(row).padStart(3,'0')}`;assert.equal(re.test(id),expected.has(id),id);if(re.test(id))actual++;
 }
 assert.equal(actual,829);assert.equal(re.test('m1-r001-extra'),false);
});
test('online import: empty profile only, one family fingerprint and no loss on replay',async()=>{
 const back=backend(),family='parent-uid';
 for(const child of ['first','second'])back.docs.set(`families/${family}/children/${child}`,{name:child,wallet:model.emptyWallet(),activity:false});
 const firstSelection=storage();firstSelection.setItem('slovarium.selectedChild','first');
 const first=await session(back,{uid:family,isAnonymous:false},{session:firstSelection});await openChild(first,'first');
 const id=core.courseEntries[0].id,lesson=core.courseLessons['m1-l1'];
 const value={format:'slovarium-backup',version:1,wallet:{version:1,words:[id],sentences:[id],exchanges:[{amount:10,date:'2026-11-27T10:00:00.000Z'}]},course:{version:2,results:{'m1-l1':{signature:lesson.signature,cards:{firstTryCorrect:20,errors:0,total:20}}}}};
 const file={size:1000,text:async()=>JSON.stringify(value)};
 first.elements['import-file'].files=[file];await first.elements['import-file'].onchange();assert.equal(first.elements['import-preview'].hidden,false);
 await first.elements['import-confirm'].onclick();await settle();assert.equal(first.active.wallet.balance,20);assert.equal(first.active.wallet.earned,30);
 assert.equal(back.docs.get(`families/${family}/children/first/results/m1-l1`).cards.firstTryCorrect,20);
 const secondSelection=storage();secondSelection.setItem('slovarium.selectedChild','second');
 const second=await session(back,{uid:family,isAnonymous:false},{session:secondSelection});await openChild(second,'second');
 second.elements['import-file'].files=[file];await second.elements['import-file'].onchange();await second.elements['import-confirm'].onclick();await settle();
 assert.equal(second.active.wallet.balance,0);assert.match(second.elements['account-status'].textContent,/уже перенесена/);
 assert.equal(back.docs.get(`families/${family}/children/first`).wallet.exchanges.length,1);
});

function buttonIn(root,label){
 if(root.textContent===label&&root.onclick)return root;
 for(const child of root.children||[]){const found=buttonIn(child,label);if(found)return found;}
}

async function openChild(parent,name,container='family-children'){
 const row=parent.elements[container].children.find(r=>r.children[0].children[0].textContent===name);assert.ok(row,'Child row exists: '+name);
 buttonIn(row,'Открыть профиль').click();await settle();
}
function deletionSteps(parent,name){parent.elements['participant-delete-next'].click();parent.elements['participant-delete-name'].value=name;parent.elements['participant-delete-name'].oninput();}
async function confirmDeletion(parent,name){deletionSteps(parent,name);await parent.elements['participant-confirm'].click();await settle();}

test('deletion: rename and cancel preserve data; permanent delete cleans all pages, devices, queues and import links',async()=>{
 const back=backend(),family='parent-uid',child='child-1',uid='anonymous-uid-123456789012345';
 const path=`families/${family}/children/${child}`,wallet=model.addReward(model.emptyWallet(),'words',core.courseEntries[0].id);
 back.docs.set(path,{name:'Алия',wallet,activity:true});back.docs.set(path+'/results/m1-l1',{signature:'test'});
 for(let i=0;i<205;i++)back.docs.set(path+'/exchanges/'+i,{amount:1});
 back.docs.set('devices/'+uid,{family,child});back.docs.set(`families/${family}/imports/fingerprint`,{child,createdAt:'date'});
 const other={name:'Другой ребёнок',wallet:model.emptyWallet(),activity:false};back.docs.set(`families/${family}/children/other`,other);
 back.docs.set('families/other-family/children/child-1',other);
 const local=storage();local.setItem(`slovarium.pending:old:${family}:${child}:v9`,'obsolete');local.setItem(`slovarium.pending:old:${family}:other`,'keep');local.setItem(`slovarium.pending:old:other-family:${child}`,'keep');
 const parent=await session(back,{uid:family,isAnonymous:false},{local}),kid=await session(back,{uid,isAnonymous:true});
 kid.context.navigator.onLine=false;kid.active.wallet.reward('sentences',core.courseEntries[0].id);
 await openChild(parent,'Алия');buttonIn(parent.elements['child-profile-actions'],'Изменить имя').click();parent.elements['participant-name'].value='  Әлия  ';
 await parent.elements['participant-rename-form'].onsubmit({preventDefault(){}});await settle();assert.equal(back.docs.get(path).name,'Әлия');assert.deepEqual(back.docs.get(path).wallet,wallet);
 buttonIn(parent.elements['child-profile-actions'],'Удалить ребёнка').click();parent.elements['participant-cancel'].click();await parent.elements['participant-confirm'].click();assert.ok(back.docs.has(path));
 buttonIn(parent.elements['child-profile-actions'],'Удалить ребёнка').click();await confirmDeletion(parent,'Әлия');
 assert.equal(back.docs.has(path),false);assert.ok(![...back.docs.keys()].some(k=>k.startsWith(path+'/')));
 assert.deepEqual(back.docs.get('devices/'+uid),{family:'',child:''});assert.deepEqual(back.docs.get(`families/${family}/imports/fingerprint`),{used:true});
 assert.deepEqual(back.docs.get(`families/${family}/children/other`),other);assert.deepEqual(back.docs.get('families/other-family/children/child-1'),other);
 assert.equal(kid.active.wallet.blocked,true);assert.ok(![...kid.local.map.keys()].some(k=>model.profileQueueKey(k,family,child)));
 assert.ok(![...local.map.keys()].some(k=>model.profileQueueKey(k,family,child)));assert.equal(local.map.size,2);
 kid.context.navigator.onLine=true;kid.events.online();await settle();assert.equal(back.docs.has(path),false);
 assert.ok(back.controls.batch>=4);assert.equal(parent.elements['archived-children'].children.length,0);
});
test('deletion: deleting the open and last child closes the exercise without interrupting cleanup; same name creates a fresh ID',async()=>{
 const back=backend(),family='parent-uid',child='child-1',path=`families/${family}/children/${child}`;
 back.docs.set(path,{name:'Алия',wallet:model.addReward(model.emptyWallet(),'words',core.courseEntries[0].id),activity:true});back.docs.set(path+'/results/m1-l1',{signature:'test'});
 const selection=storage();selection.setItem('slovarium.selectedChild',child);
 const parent=await session(back,{uid:family,isAnonymous:false},{session:selection}),oldWallet=parent.active.wallet;
 await openChild(parent,'Алия');buttonIn(parent.elements['child-profile-actions'],'Удалить ребёнка').click();await confirmDeletion(parent,'Алия');
 assert.equal(oldWallet.blocked,true);assert.equal(await oldWallet.exchange(10),false);assert.equal(parent.context.reloads,0);assert.equal(selection.getItem('slovarium.selectedChild'),null);
 assert.equal(back.docs.has(path),false);assert.equal(parent.elements['participants-empty'].hidden,false);assert.equal(parent.elements['home'].hidden,true);
 back.docs.set('devices/new-device-123456789012345',{family:'',child:''});parent.elements['child-device-code'].value='new-device-123456789012345';
 parent.elements['child-name'].value='Алия';parent.elements['child-create-form'].onsubmit({preventDefault(){}});await settle();
 const childDocs=[...back.docs.entries()].filter(([k])=>k.startsWith(`families/${family}/children/`));assert.equal(childDocs.length,1);assert.notEqual(childDocs[0][0],path);assert.equal(model.balance(childDocs[0][1].wallet),0);
});
test('deletion: offline confirmation does nothing; partial failure stays locked and can resume after a fresh session',async()=>{
 const back=backend(),family='parent-uid',child='child-1',path=`families/${family}/children/${child}`;
 back.docs.set(path,{name:'Алия',wallet:model.emptyWallet(),activity:false});back.docs.set(path+'/results/m1-l1',{signature:'test'});back.docs.set(path+'/exchanges/0',{amount:1});
 const parent=await session(back,{uid:family,isAnonymous:false});parent.context.navigator.onLine=false;
 await openChild(parent,'Алия');buttonIn(parent.elements['child-profile-actions'],'Удалить ребёнка').click();deletionSteps(parent,'Алия');await parent.elements['participant-confirm'].click();assert.equal(back.docs.get(path).deleting,undefined);
 parent.context.navigator.onLine=true;back.controls.failBatchAt=2;await parent.elements['participant-confirm'].click();await settle();
 assert.equal(back.docs.get(path).deleting,true);assert.equal(back.docs.get(path).accessVersion,1);assert.equal(back.docs.has(path+'/results/m1-l1'),false);assert.equal(back.docs.has(path+'/exchanges/0'),true);
 assert.match(parent.elements['account-status'].textContent,/не завершено/);assert.equal(parent.elements['family-children'].children.length,0);
 const afterRefresh=await session(back,{uid:family,isAnonymous:false});assert.equal(afterRefresh.active,undefined);
 back.controls.failBatchAt=0;await openChild(afterRefresh,'Алия','deleting-children');buttonIn(afterRefresh.elements['child-profile-actions'],'Продолжить удаление').click();await confirmDeletion(afterRefresh,'Алия');assert.equal(back.docs.has(path),false);assert.equal(afterRefresh.elements['deleting-children'].children.length,0);
});
test('deletion: archived profiles delete permanently; repeated workers do not touch a rebound device or another profile',async()=>{
 const back=backend(),family='parent-uid',child='child-1',path=`families/${family}/children/${child}`,uid='anonymous-uid-123456789012345';
 back.docs.set(path,{name:'Алия',wallet:model.emptyWallet(),activity:false,archived:true,accessVersion:3});
 const other={name:'Другой',wallet:model.emptyWallet(),activity:false};back.docs.set(`families/${family}/children/other`,other);back.docs.set('devices/'+uid,{family,child,accessVersion:3});
 back.controls.onQuery=(ref,snap)=>{if(ref.path==='devices'&&snap.docs.length){back.docs.set('devices/'+uid,{family,child:'other',accessVersion:0});back.controls.onQuery=null;}};
 const first=await session(back,{uid:family,isAnonymous:false}),second=await session(back,{uid:family,isAnonymous:false});
 await openChild(first,'Алия','archived-children');await openChild(second,'Алия','archived-children');buttonIn(first.elements['child-profile-actions'],'Удалить ребёнка').click();buttonIn(second.elements['child-profile-actions'],'Удалить ребёнка').click();deletionSteps(first,'Алия');deletionSteps(second,'Алия');
 await Promise.all([first.elements['participant-confirm'].click(),second.elements['participant-confirm'].click()]);await settle();
 assert.equal(back.docs.has(path),false);assert.deepEqual(back.docs.get('devices/'+uid),{family,child:'other',accessVersion:0});assert.deepEqual(back.docs.get(`families/${family}/children/other`),other);
 assert.equal(buttonIn(first.elements['archived-children'],'Вернуть в участники'),undefined);
});
test('deletion: child cannot start cleanup even if a parent confirmation is forced',async()=>{
 const back=backend(),family='parent-uid',child='child-1',uid='anonymous-uid-123456789012345',path=`families/${family}/children/${child}`;
 back.docs.set(path,{name:'Алия',wallet:model.emptyWallet(),activity:false});back.docs.set('devices/'+uid,{family,child});
 const kid=await session(back,{uid,isAnonymous:true});await kid.elements['participant-confirm'].click();assert.ok(back.docs.has(path));assert.equal(back.docs.get(path).deleting,undefined);
});

test('oral: two independent sessions, invitation, readiness, duplicate grade, F5, offline, history and profile cleanup',async()=>{
 const back=backend(),family='oral-parent',child='oral-child',uid='oral-anonymous-device-123456';
 back.docs.set(`families/${family}/children/${child}`,{name:'Әлия',wallet:model.emptyWallet(),activity:false});back.docs.set('devices/'+uid,{family,child});
 const parent=await session(back,{uid:family,isAnonymous:false},{session:(()=>{const s=storage();s.setItem('slovarium.selectedChild',child);return s;})()}),kid=await session(back,{uid,isAnonymous:true});
 const e=parent.elements;e['check-topic'].value='1';e['check-count'].value='5';e['check-language'].value='en';
 e['check-form'].onsubmit({preventDefault(){}});await settle();
 const live=`families/${family}/children/${child}/checkLive/current`,state=()=>back.docs.get(live);
 assert.equal(state().status,'waiting');assert.equal(state().total,10);assert.equal(state().answer,undefined);
 const click=async(s,label)=>{const b=s.elements['check-current'].children.find(e=>e.textContent===label);assert.ok(b,label);await b.click();await settle();};
 await click(kid,'Начать');assert.equal(state().ready,true);await click(parent,'Начать проверку');assert.equal(state().status,'active');
 const grade=e['check-current'].children.find(e=>e.textContent==='Верно');grade.click();grade.click();await settle();assert.equal(state().step,1);
 const secondParent=await session(back,{uid:family,isAnonymous:false},{session:parent.sessionStore});
 const b1=e['check-current'].children.find(e=>e.textContent==='Верно'),b2=secondParent.elements['check-current'].children.find(e=>e.textContent==='Верно');
 await Promise.all([b1.click(),b2.click()]);await settle();assert.equal(state().step,2);
 const fresh=await session(back,{uid,isAnonymous:true});assert.equal(fresh.elements['check-current'].children[1].textContent,state().prompt);
 parent.context.navigator.onLine=false;parent.events.offline();await click(parent,'Верно');assert.equal(state().step,2);
 parent.context.navigator.onLine=true;parent.events.online();await settle();
 for(let i=2;i<10;i++)await click(parent,i===2?'С подсказкой':'Верно');
 assert.equal(state().status,'completed');const saved=[...back.docs.entries()].find(([p])=>p.includes('/checks/'))[1];assert.equal(saved.grades.length,10);
 assert.ok(e['check-report'].children.some(e=>e.textContent==='С подсказкой: 1'));
 assert.deepEqual(back.docs.get(`families/${family}/children/${child}`).wallet,model.emptyWallet());
 await openChild(parent,'Әлия');buttonIn(e['child-profile-actions'],'Удалить ребёнка').click();await confirmDeletion(parent,'Әлия');
 assert.ok(![...back.docs.keys()].some(p=>p.startsWith(`families/${family}/children/${child}/`)));
});

test('one form: invalid, missing, bound and offline codes never create a profile; double submit links once',async()=>{
 const back=backend(),family='parent-uid',uid='free-device-123456789012345';
 const parent=await session(back,{uid:family,isAnonymous:false});
 const form=parent.elements['child-create-form'],name=parent.elements['child-name'],code=parent.elements['child-device-code'];
 const submit=()=>form.onsubmit({preventDefault(){}});
 const profiles=()=>[...back.docs.keys()].filter(k=>k.startsWith(`families/${family}/children/`));
 name.value='Әлия';code.value='bad';submit();await settle();assert.equal(profiles().length,0);assert.equal(name.value,'Әлия');
 code.value=uid;submit();await settle();assert.equal(profiles().length,0);assert.match(parent.elements['account-status'].textContent,/Код не найден/);
 back.docs.set('devices/'+uid,{family:'',child:''});parent.context.navigator.onLine=false;submit();await settle();assert.equal(profiles().length,0);assert.equal(code.value,uid);
 parent.context.navigator.onLine=true;submit();submit();await settle();
 assert.equal(profiles().length,1);const id=profiles()[0].split('/').at(-1);
 assert.equal(back.docs.get('devices/'+uid).child,id);assert.equal(back.docs.get(profiles()[0]).name,'Әлия');assert.equal(name.value,'');assert.equal(code.value,'');assert.equal(parent.elements['child-connect-submit'].disabled,false);
 name.value='Другой ребёнок';code.value=uid;submit();await settle();assert.equal(profiles().length,1);assert.equal(name.value,'Другой ребёнок');assert.equal(back.docs.get('devices/'+uid).child,id);
 const other='other-device-123456789012345';back.docs.set('devices/'+other,{family:'other-family',child:'foreign'});code.value=other;submit();await settle();assert.equal(profiles().length,1);assert.equal(back.docs.get('devices/'+other).child,'foreign');
});
test('one form: lost server acknowledgement survives reload and retries the same profile',async()=>{
 const back=backend(),family='parent-uid',uid='retry-device-123456789012345',local=storage();
 back.docs.set('devices/'+uid,{family:'',child:''});
 const first=await session(back,{uid:family,isAnonymous:false},{local});
 first.elements['child-name'].value='Әлия';first.elements['child-device-code'].value=uid;back.controls.loseNextAck=true;
 first.elements['child-create-form'].onsubmit({preventDefault(){}});await settle();
 assert.equal(first.elements['child-name'].value,'Әлия');assert.ok(local.getItem('slovarium.connectChild:'+family));
 const id=back.docs.get('devices/'+uid).child;
 const retry=await session(back,{uid:family,isAnonymous:false},{local});retry.elements['child-name'].value='Әлия';retry.elements['child-device-code'].value=uid;
 retry.elements['child-create-form'].onsubmit({preventDefault(){}});await settle();
 assert.equal([...back.docs.keys()].filter(k=>k.startsWith(`families/${family}/children/`)).length,1);assert.equal(back.docs.get('devices/'+uid).child,id);assert.equal(retry.elements['child-name'].value,'');assert.equal(local.getItem('slovarium.connectChild:'+family),null);
});
test('one form: two parents racing for one code create one child and cannot move a bound device',async()=>{
 const back=backend(),family='parent-uid',uid='race-device-123456789012345';back.docs.set('devices/'+uid,{family:'',child:''});
 const a=await session(back,{uid:family,isAnonymous:false}),b=await session(back,{uid:family,isAnonymous:false});
 for(const parent of [a,b]){parent.elements['child-name'].value='Әлия';parent.elements['child-device-code'].value=uid;parent.elements['child-create-form'].onsubmit({preventDefault(){}});}
 await settle();const docs=[...back.docs.keys()].filter(k=>k.startsWith(`families/${family}/children/`));assert.equal(docs.length,1);assert.equal(back.docs.get('devices/'+uid).child,docs[0].split('/').at(-1));
 const other='other-child';back.docs.set(`families/${family}/children/${other}`,{name:'Другой',wallet:model.emptyWallet(),activity:false});
 const selected=storage();selected.setItem('slovarium.selectedChild',other);const c=await session(back,{uid:family,isAnonymous:false},{session:selected});
 c.elements['device-input'].value=uid;c.elements['device-pair-form'].onsubmit({preventDefault(){}});await settle();assert.notEqual(back.docs.get('devices/'+uid).child,other);
});

test('compact cabinet and profile: no tools under list, no reload on switching, correct header and old game disabled',async()=>{
 const back=backend(),family='parent-uid';
 for(const [id,name,words] of [['one','Әлия',['m1-r001']],['two','Яссауи',[]]])back.docs.set(`families/${family}/children/${id}`,{name,wallet:{...model.emptyWallet(),words},activity:false});
 const parent=await session(back,{uid:family,isAnonymous:false,displayName:'Гани'}),e=parent.elements;
 assert.equal(e['profile-button'].textContent,'Гани');assert.equal(e['header-balance'].hidden,true);assert.equal(e['profile-tools'].hidden,true);assert.equal(e['oral-check'].hidden,true);
 for(const row of e['family-children'].children){assert.equal(row.children.length,2);assert.equal(row.children[1].textContent,'Открыть профиль');assert.equal(buttonIn(row,'Удалить ребёнка'),undefined);}
 await openChild(parent,'Әлия');const first=parent.active;
 assert.equal(e['child-profile-view'].hidden,false);assert.equal(e['settings-view'].hidden,true);assert.equal(e['child-profile-title'].textContent,'Әлия');assert.equal(e['profile-button'].textContent,'Әлия');assert.equal(e['balance-short'].textContent,'10 $lovari');assert.equal(e['profile-tools'].hidden,false);
 e['profile-cabinet-return'].click();assert.equal(e['child-profile-view'].hidden,true);assert.equal(e['settings-view'].hidden,false);assert.equal(e['profile-tools'].hidden,true);assert.equal(e['oral-check'].hidden,true);assert.equal(e['profile-button'].textContent,'Гани');assert.equal(e['header-balance'].hidden,true);
 await openChild(parent,'Яссауи');assert.equal(parent.context.reloads,0);assert.equal(first.disposed,true);assert.equal(first.wallet.blocked,true);assert.equal(e['child-profile-title'].textContent,'Яссауи');assert.equal(e['profile-button'].textContent,'Яссауи');assert.equal(e['balance-short'].textContent,'0 $lovari');
 first.wallet.reward('words','m1-r002');first.progress.record('m1-l1','cards',{total:20,firstTryCorrect:20,errors:0});await settle();assert.equal(back.docs.get(`families/${family}/children/two`).wallet.words.length,0);assert.equal(back.docs.has(`families/${family}/children/two/results/m1-l1`),false);
 back.notify();await settle();assert.equal(e['child-profile-view'].hidden,false);
 e['profile-cabinet-return'].click();back.notify();await settle();assert.equal(e['settings-view'].hidden,false);assert.equal(e['profile-tools'].hidden,true);assert.equal(e['header-balance'].hidden,true);
});
test('deletion guard: first click, wrong name, cancellation, switching and remote rename never delete',async()=>{
 const back=backend(),family='parent-uid';for(const [id,name] of [['one','Әлия'],['two','Яссауи']])back.docs.set(`families/${family}/children/${id}`,{name,wallet:model.emptyWallet(),activity:false});
 const parent=await session(back,{uid:family,isAnonymous:false}),e=parent.elements;
 await openChild(parent,'Әлия');buttonIn(e['child-profile-actions'],'Удалить ребёнка').click();assert.equal(e['participant-confirmation'].hidden,false);assert.equal(e['participant-confirm'].hidden,true);await e['participant-confirm'].onclick();assert.ok(back.docs.has(`families/${family}/children/one`));
 e['participant-delete-next'].click();e['participant-delete-name'].value='Алия';e['participant-delete-name'].oninput();assert.equal(e['participant-confirm'].disabled,true);await e['participant-confirm'].onclick();assert.ok(back.docs.has(`families/${family}/children/one`));
 e['participant-cancel'].click();assert.equal(e['participant-delete-name'].value,'');assert.equal(e['participant-confirmation'].hidden,true);
 buttonIn(e['child-profile-actions'],'Удалить ребёнка').click();deletionSteps(parent,'Әлия');assert.equal(e['participant-confirm'].disabled,false);
 e['profile-cabinet-return'].click();await openChild(parent,'Яссауи');await e['participant-confirm'].onclick();assert.equal(e['participant-confirmation'].hidden,true);assert.ok(back.docs.has(`families/${family}/children/one`));assert.ok(back.docs.has(`families/${family}/children/two`));
 buttonIn(e['child-profile-actions'],'Удалить ребёнка').click();deletionSteps(parent,'Яссауи');back.docs.get(`families/${family}/children/two`).name='Новое имя';back.notify();await settle();await e['participant-confirm'].onclick();assert.ok(back.docs.has(`families/${family}/children/two`));assert.equal(e['participant-confirmation'].hidden,true);
});

test('switching child during exchange keeps the transaction on its original profile',async()=>{
 const back=backend(),family='parent-uid';
 for(const [id,name] of [['one','Әлия'],['two','Яссауи']])back.docs.set(`families/${family}/children/${id}`,{name,wallet:model.addReward(model.emptyWallet(),'words','m1-r001'),activity:true});
 const parent=await session(back,{uid:family,isAnonymous:false});await openChild(parent,'Әлия');const first=parent.active;
 const exchange=first.wallet.exchange(10);parent.elements['profile-cabinet-return'].click();await openChild(parent,'Яссауи');await exchange;await settle();
 assert.equal(model.balance(back.docs.get(`families/${family}/children/one`).wallet),0);assert.equal(model.balance(back.docs.get(`families/${family}/children/two`).wallet),10);assert.equal(parent.context.reloads,0);
});

test('switching child cancels an unfinished backup preview instead of importing into the next child',async()=>{
 const back=backend(),family='parent-uid';for(const [id,name] of [['one','Әлия'],['two','Яссауи']])back.docs.set(`families/${family}/children/${id}`,{name,wallet:model.emptyWallet(),activity:false});
 const parent=await session(back,{uid:family,isAnonymous:false});await openChild(parent,'Әлия');let finish;
 const file={size:100,text:()=>new Promise(resolve=>{finish=resolve;})};parent.elements['import-file'].files=[file];const read=parent.elements['import-file'].onchange();
 parent.elements['profile-cabinet-return'].click();await openChild(parent,'Яссауи');finish(JSON.stringify({format:'slovarium-backup',version:1,wallet:model.emptyWallet(),course:{version:2,results:{}}}));await read;
 assert.equal(parent.elements['import-preview'].hidden,true);await parent.elements['import-confirm'].onclick();await settle();assert.equal(back.docs.get(`families/${family}/children/two`).imported,undefined);
});
