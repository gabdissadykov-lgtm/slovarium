'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('../script.js'),model=require('../cloud-model.js');
class Element{
 constructor(){this.hidden=false;this.children=[];this.value='';this.files=[];this.textContent='';this.attributes={};}
 setAttribute(name,value){this.attributes[name]=String(value);}
 addEventListener(name,fn){this[name]=fn;}append(...items){this.children.push(...items);}replaceChildren(...items){this.children=items;}focus(){}click(){return this.onclick?.();}
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function settle(){for(let i=0;i<12;i++)await tick();}
function storage(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k),map};}
function backend(){
 const docs=new Map(),listeners=[];let serial=Promise.resolve();
 const snap=ref=>({id:ref.path.split('/').at(-1),ref,exists:()=>docs.has(ref.path),data:()=>structuredClone(docs.get(ref.path))});
 const get=(ref)=>ref.type==='collection'?{docs:[...docs.keys()].filter(k=>k.startsWith(ref.path+'/')&&k.split('/').length===ref.path.split('/').length+1).map(path=>snap({path})).filter(d=>!ref.filters||ref.filters.every(f=>d.data()[f.field]===f.value))}:snap(ref);
 const notify=()=>listeners.slice().forEach(l=>queueMicrotask(()=>{if(listeners.includes(l))l.fn(get(l.ref));}));
 const api={getFirestore:()=>({}),doc:(_, ...path)=>({type:'doc',path:path.join('/')}),collection:(_, ...path)=>({type:'collection',path:path.join('/')}),where:(field,op,value)=>({field,value}),query:(ref,...filters)=>({...ref,filters}),
  serverTimestamp:()=>({server:true}),Timestamp:{fromDate:d=>d.toISOString()},
  onSnapshot(ref,fn){const l={ref,fn};listeners.push(l);queueMicrotask(()=>fn(get(ref)));return ()=>listeners.splice(listeners.indexOf(l),1);},
  runTransaction(db,fn){const task=serial.then(async()=>{const writes=[];const tx={get:async ref=>snap(ref),set:(ref,value)=>writes.push([ref,value]),update:(ref,value)=>writes.push([ref,{...docs.get(ref.path),...value}])};await fn(tx);for(const [ref,value]of writes)docs.set(ref.path,structuredClone(value));notify();});serial=task.catch(()=>{});return task;},
  async addDoc(ref,value){const id='kid'+(docs.size+1),path=ref.path+'/'+id;docs.set(path,structuredClone(value));notify();return {id,path};},
  async updateDoc(ref,value){docs.set(ref.path,{...docs.get(ref.path),...value});notify();}
 };
 return {docs,api,notify};
}
async function session(back,user,options={}){
 const elements={};for(const [,id]of fs.readFileSync('index.html','utf8').matchAll(/id="([^"]+)"/g))elements[id]=new Element();
 const local=options.local||storage(),sessionStore=options.session||storage(),events={};let mounted;
 const auth={currentUser:user};
 const A={getAuth:()=>auth,browserLocalPersistence:{},setPersistence:async()=>{},onAuthStateChanged:(auth,fn)=>queueMicrotask(()=>fn(auth.currentUser)),signOut:async()=>{auth.currentUser=null;},GoogleAuthProvider:class{}};
 const walletElement=new Element();
 const context={console,structuredClone,queueMicrotask,TextEncoder,Blob,URL,crypto:require('node:crypto').webcrypto,setTimeout:()=>0,setInterval:()=>0,navigator:{onLine:true},localStorage:local,sessionStorage:sessionStore,
  location:{protocol:'https:',reload(){context.reloads++;}},reloads:0,
  document:{getElementById:id=>elements[id],querySelector:()=>walletElement,createElement:()=>new Element()},
  __app:{initializeApp:()=>({})},__auth:A,__firestore:back.api};
 context.window={SlovariumOnline:true,SlovariumArchiveEnabled:options.archiveEnabled!==false,SlovariumFirebaseConfig:{},SlovariumCloudModel:model,SlovariumCore:{...core,mount:x=>{mounted=x;x.repaint=()=>{};}},addEventListener:(k,fn)=>events[k]=fn,confirm:()=>true};
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
 const first=await session(back,{uid:family,isAnonymous:false},{session:firstSelection});
 const id=core.courseEntries[0].id,lesson=core.courseLessons['m1-l1'];
 const value={format:'slovarium-backup',version:1,wallet:{version:1,words:[id],sentences:[id],exchanges:[{amount:10,date:'2026-11-27T10:00:00.000Z'}]},course:{version:2,results:{'m1-l1':{signature:lesson.signature,cards:{firstTryCorrect:20,errors:0,total:20}}}}};
 const file={size:1000,text:async()=>JSON.stringify(value)};
 first.elements['import-file'].files=[file];await first.elements['import-file'].onchange();assert.equal(first.elements['import-preview'].hidden,false);
 await first.elements['import-confirm'].onclick();await settle();assert.equal(first.active.wallet.balance,20);assert.equal(first.active.wallet.earned,30);
 assert.equal(back.docs.get(`families/${family}/children/first/results/m1-l1`).cards.firstTryCorrect,20);
 const secondSelection=storage();secondSelection.setItem('slovarium.selectedChild','second');
 const second=await session(back,{uid:family,isAnonymous:false},{session:secondSelection});
 second.elements['import-file'].files=[file];await second.elements['import-file'].onchange();await second.elements['import-confirm'].onclick();await settle();
 assert.equal(second.active.wallet.balance,0);assert.match(second.elements['account-status'].textContent,/уже перенесена/);
 assert.equal(back.docs.get(`families/${family}/children/first`).wallet.exchanges.length,1);
});

function buttonIn(root,label){
 if(root.textContent===label&&root.onclick)return root;
 for(const child of root.children||[]){const found=buttonIn(child,label);if(found)return found;}
}
test('participants: rename changes only name; cancel archive keeps data; archive/restore keeps wallet and revokes devices',async()=>{
 const back=backend(),family='parent-uid',child='child-1',uid='anonymous-uid-123456789012345';
 const path=`families/${family}/children/${child}`;
 const wallet=model.addReward(model.emptyWallet(),'words',core.courseEntries[0].id);
 back.docs.set(path,{name:'Алия',wallet,activity:true});back.docs.set('devices/'+uid,{family,child});
 const parent=await session(back,{uid:family,isAnonymous:false}),kid=await session(back,{uid,isAnonymous:true});
 const e=parent.elements;
 buttonIn(e['family-children'],'Изменить имя').click();e['participant-name'].value='  Әлия  ';
 await e['participant-rename-form'].onsubmit({preventDefault(){}});await settle();
 assert.equal(back.docs.get(path).name,'Әлия');assert.deepEqual(back.docs.get(path).wallet,wallet);
 buttonIn(e['family-children'],'Убрать из участников').click();e['participant-cancel'].click();
 await e['participant-confirm'].click();assert.equal(back.docs.get(path).archived,undefined);
 buttonIn(e['family-children'],'Убрать из участников').click();await e['participant-confirm'].click();await settle();
 assert.equal(back.docs.get(path).archived,true);assert.equal(back.docs.get(path).accessVersion,1);
 assert.equal(e['family-children'].children.length,0);assert.equal(e['archived-children'].children.length,1);
 assert.equal(kid.active.wallet.blocked,true);assert.match(kid.elements['account-status'].textContent,/отключён/);
 const oldSession=await session(back,{uid,isAnonymous:true});assert.equal(oldSession.active,undefined);
 await buttonIn(e['archived-children'],'Вернуть в участники').click();await settle();
 assert.equal(back.docs.get(path).archived,false);assert.equal(back.docs.get(path).accessVersion,1);assert.deepEqual(back.docs.get(path).wallet,wallet);
 const stillOld=await session(back,{uid,isAnonymous:true});assert.equal(stillOld.active,undefined);
 back.docs.set('devices/'+uid,{family,child,accessVersion:1});back.notify();await settle();
 const newSession=await session(back,{uid,isAnonymous:true});assert.equal(newSession.active.wallet.balance,10);
 newSession.active.wallet.reward('words',core.courseEntries[0].id);await settle();assert.equal(newSession.active.wallet.balance,10);
});
test('participants: pending rewards from revoked generation are never imported into restored access',async()=>{
 const back=backend(),family='parent-uid',child='child-1',uid='anonymous-uid-123456789012345',local=storage();
 const path=`families/${family}/children/${child}`;back.docs.set(path,{name:'Алия',wallet:model.emptyWallet(),activity:false});back.docs.set('devices/'+uid,{family,child});
 const kid=await session(back,{uid,isAnonymous:true},{local});kid.context.navigator.onLine=false;
 kid.active.wallet.reward('words',core.courseEntries[0].id);assert.equal(kid.active.wallet.balance,0);
 const parent=await session(back,{uid:family,isAnonymous:false});
 buttonIn(parent.elements['family-children'],'Убрать из участников').click();await parent.elements['participant-confirm'].click();await settle();
 await buttonIn(parent.elements['archived-children'],'Вернуть в участники').click();await settle();
 kid.context.navigator.onLine=true;kid.events.online();await settle();assert.equal(model.balance(back.docs.get(path).wallet),0);
 back.docs.set('devices/'+uid,{family,child,accessVersion:1});back.notify();await settle();
 const restored=await session(back,{uid,isAnonymous:true},{local});await settle();assert.equal(restored.active.wallet.balance,0);
 assert.ok([...local.map.keys()].some(k=>!k.endsWith(':v1')));
 restored.active.wallet.reward('words',core.courseEntries[1].id);await settle();assert.equal(restored.active.wallet.balance,10);
 assert.deepEqual(back.docs.get(path).wallet.words,[core.courseEntries[1].id]);
});
test('participants: offline actions fail without mutation; archived selection and stale exchange cannot remain active',async()=>{
 const back=backend(),family='parent-uid',child='child-1',path=`families/${family}/children/${child}`;
 const wallet=model.addReward(model.emptyWallet(),'words',core.courseEntries[0].id);back.docs.set(path,{name:'Алия',wallet,activity:true});
 const selection=storage();selection.setItem('slovarium.selectedChild',child);
 const parent=await session(back,{uid:family,isAnonymous:false},{session:selection}),e=parent.elements;
 parent.context.navigator.onLine=false;buttonIn(e['family-children'],'Убрать из участников').click();await e['participant-confirm'].click();
 assert.equal(back.docs.get(path).archived,undefined);assert.equal(e['participant-confirmation'].hidden,false);assert.match(e['account-status'].textContent,/интернету/);
 parent.context.navigator.onLine=true;await e['participant-confirm'].click();await settle();
 assert.equal(parent.active.wallet.blocked,true);assert.ok(parent.context.reloads>=1);assert.equal(selection.getItem('slovarium.selectedChild'),null);
 assert.equal(await parent.active.wallet.exchange(10),false);assert.equal(model.balance(back.docs.get(path).wallet),10);
 const reloaded=await session(back,{uid:family,isAnonymous:false},{session:selection});assert.equal(reloaded.active,undefined);assert.equal(reloaded.elements['participants-empty'].hidden,false);
});

test('participants rollout: archive is gated until rules deploy; legacy device pairing still works',async()=>{
 const back=backend(),family='parent-uid',child='child-1',uid='anonymous-uid-123456789012345';
 const path=`families/${family}/children/${child}`;back.docs.set(path,{name:'Алия',wallet:model.emptyWallet(),activity:false});back.docs.set('devices/'+uid,{family:'',child:''});
 const selection=storage();selection.setItem('slovarium.selectedChild',child);
 const parent=await session(back,{uid:family,isAnonymous:false},{session:selection,archiveEnabled:false}),e=parent.elements;
 const remove=buttonIn(e['family-children'],'Убрать из участников');assert.equal(remove.disabled,true);assert.equal(e['archive-availability'].hidden,false);
 remove.onclick();await e['participant-confirm'].click();assert.equal(back.docs.get(path).archived,undefined);assert.match(e['account-status'].textContent,/пока недоступно/);
 e['device-input'].value=uid;e['device-pair-form'].onsubmit({preventDefault(){}});await settle();
 assert.deepEqual(back.docs.get('devices/'+uid),{family,child});
 assert.match(fs.readFileSync('firebase-config.js','utf8'),/SlovariumArchiveEnabled=false/);
});
