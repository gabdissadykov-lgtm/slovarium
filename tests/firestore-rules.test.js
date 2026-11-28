'use strict';
// Run only against a local demo emulator loaded with this repository's rules.
const {test}=require('node:test'),assert=require('node:assert/strict');
const host=process.env.FIRESTORE_EMULATOR_HOST;
test('Firestore Rules: family isolation, archived reads/writes, generation revocation, permanent deletion and atomic batches',{skip:!host},async()=>{
 assert.match(host,/^(127\.0\.0\.1|localhost):\d+$/,'Only an isolated local emulator is allowed');
 const project='demo-slovarium-rules',base=`http://${host}/v1/projects/${project}/databases/(default)/documents`;
 const parent='rules-parent',other='rules-other',child='rules-child',device='rules-anonymous-device';
 const profile=`families/${parent}/children/${child}`,devicePath=`devices/${device}`;
 function value(x){if(x===null)return {nullValue:null};if(Array.isArray(x))return {arrayValue:{values:x.map(value)}};if(typeof x==='object')return {mapValue:{fields:fields(x)}};if(typeof x==='boolean')return {booleanValue:x};if(typeof x==='number')return {integerValue:String(x)};return {stringValue:x};}
 function fields(x){return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,value(v)]));}
 function token(uid,provider){const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url'),now=Math.floor(Date.now()/1000);return encode({alg:'none',typ:'JWT'})+'.'+encode({iss:`https://securetoken.google.com/${project}`,aud:project,iat:now,exp:now+3600,sub:uid,user_id:uid,auth_time:now,firebase:{identities:{},sign_in_provider:provider}})+'.';}
 const owner={uid:parent,provider:'google.com'},kid={uid:device,provider:'anonymous'},stranger={uid:other,provider:'google.com'};
 async function request(path,method,body,user){const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(user?{Authorization:'Bearer '+token(user.uid,user.provider)}:{})},...(body?{body:JSON.stringify(body)}:{})});const text=await response.text();return {status:response.status,text};}
 const read=(path,user)=>request('/'+path,'GET',null,user);
 const write=(path,data,user,patch=false)=>request('/'+path+(patch?'?'+Object.keys(data).map(k=>'updateMask.fieldPaths='+encodeURIComponent(k)).join('&'):''),'PATCH',{fields:fields(data)},user);
 const ok=r=>assert.ok(r.status>=200&&r.status<300,r.status+' '+r.text);
 const denied=r=>assert.equal(r.status,403,r.text);
 // Clean only this named demo database. This endpoint never contacts production.
 const cleared=await fetch(`http://${host}/emulator/v1/projects/${project}/databases/(default)/documents`,{method:'DELETE'});assert.ok(cleared.ok);
 const wallet={version:1,words:[],sentences:[],exchanges:[]};
 ok(await write(profile,{name:'Әлия',wallet,activity:false},owner));
 denied(await write(`families/${parent}/children/invalid`,{name:'X',wallet,activity:false,archived:true,accessVersion:1},owner));
 ok(await write(devicePath,{family:'',child:''},kid));
 ok(await write(devicePath,{family:parent,child},owner,true)); // Legacy generation zero.
 ok(await read(profile,kid));denied(await read(profile,stranger));denied(await read(profile));
 denied(await write(profile,{name:'Hacked'},kid,true));denied(await write(profile,{archived:true,accessVersion:1},kid,true));
 denied(await write(profile,{name:'Hacked'},stranger,true));
 // New child and device binding commit atomically; an occupied code cannot be moved.
 const freshUid='new-anonymous-device-123456789',freshKid={uid:freshUid,provider:'anonymous'},freshProfile=`families/${parent}/children/atomic-child`;
 ok(await write('devices/'+freshUid,{family:'',child:''},freshKid));
 const createAndPair=(profilePath,uid,user)=>request(':commit','POST',{writes:[
  {update:{name:`projects/${project}/databases/(default)/documents/${profilePath}`,fields:fields({name:'Әлия',wallet,activity:false,archived:false,accessVersion:0})},currentDocument:{exists:false}},
  {update:{name:`projects/${project}/databases/(default)/documents/devices/${uid}`,fields:fields({family:parent,child:profilePath.split('/').at(-1),accessVersion:0})},currentDocument:{exists:true}}
 ]},user);
 denied(await createAndPair(freshProfile,freshUid,kid));
 denied(await createAndPair(freshProfile,freshUid,stranger));
 assert.equal((await read(freshProfile,owner)).status,404);
 ok(await createAndPair(freshProfile,freshUid,owner));ok(await read(freshProfile,freshKid));
 const orphan=`families/${parent}/children/should-not-exist`;
 denied(await createAndPair(orphan,freshUid,owner));assert.equal((await read(orphan,owner)).status,404);
 denied(await write('devices/'+freshUid,{family:parent,child:'missing-profile',accessVersion:0},owner));
 denied(await write('devices/'+freshUid,{family:other,child:'atomic-child',accessVersion:0},stranger));
 denied(await write('devices/'+freshUid,{family:parent,child:'atomic-child',accessVersion:1},owner));
 // A new empty device can still attach to an existing active profile.
 const extraUid='extra-anonymous-device-123456789';ok(await write('devices/'+extraUid,{family:'',child:''},{uid:extraUid,provider:'anonymous'}));
 ok(await write('devices/'+extraUid,{family:parent,child:'atomic-child',accessVersion:0},owner));
 // Oral checks: private plans, minimal current prompt, readiness-only child writes.
 const oralPrivate=profile+'/checks/session',oralLive=profile+'/checkLive/current';
 const invitation={session:'session',status:'waiting',step:0,total:10,ready:false,prompt:'house',from:'en',to:'kk',word:1};
 ok(await write(oralPrivate,{tasks:[{answer:'үй'}],grades:[]},owner));
 ok(await write(oralLive,invitation,owner));
 ok(await read(oralLive,kid));denied(await read(oralPrivate,kid));denied(await read(profile+'/checks',kid));
 denied(await read(oralLive,stranger));denied(await read(oralPrivate,stranger));denied(await read(oralLive));
 denied(await write(oralPrivate,{grades:[0]},kid,true));denied(await write(oralLive,{step:1},kid,true));
 denied(await write(oralLive,{ready:true,prompt:'cheat'},kid,true));
 ok(await write(oralLive,{ready:true},kid,true));
 denied(await write(oralLive,{ready:false},kid,true));
 ok(await write(oralLive,{status:'active'},owner,true));denied(await write(oralLive,{ready:true},kid,true));
 denied(await write(oralLive,{step:2},stranger,true));
 const rewarded={...wallet,words:['m1-r001']};
 ok(await write(profile,{wallet:rewarded,activity:true},kid,true));
 const score={signature:'rules-test',cards:{total:20,firstTryCorrect:20,errors:0}};
 ok(await write(profile+'/results/m1-l1',score,kid));
 ok(await write(profile+'/exchanges/0',{amount:1,at:'test'},owner));
 denied(await write(profile+'/exchanges/1',{amount:1,at:'test'},kid));
 denied(await write(profile,{archived:true},owner,true)); // Archive must revoke generation atomically.
 ok(await write(profile,{archived:true,accessVersion:1},owner,true));
 ok(await read(profile,owner));ok(await read(profile+'/results/m1-l1',owner));
 denied(await read(oralLive,kid));denied(await write(oralLive,{step:1},owner,true));
 denied(await read(profile,kid));denied(await read(profile+'/results/m1-l1',kid));denied(await read(profile+'/exchanges/0',kid));
 denied(await write(profile,{wallet:{...rewarded,words:['m1-r001','m1-r002']},activity:true},kid,true));
 denied(await write(profile+'/results/m1-l2',score,kid));denied(await write(profile+'/results/m1-l2',score,owner));
 denied(await write(profile+'/exchanges/1',{amount:1},owner));
 denied(await write(profile,{wallet},owner,true));denied(await write(devicePath,{family:parent,child,accessVersion:1},owner,true));
 denied(await write(profile,{archived:false,accessVersion:0},owner,true));
 ok(await write(profile,{archived:false,accessVersion:1},owner,true));
 denied(await read(profile,kid)); // Restoring does not revive legacy devices.
 denied(await write(devicePath,{family:parent,child},owner)); // An old client cannot rebind without the new generation.
 ok(await write(devicePath,{family:parent,child,accessVersion:1},owner,true));
 ok(await read(profile,kid));ok(await read(profile+'/results',kid));
 denied(await write(profile,{wallet:{...rewarded,words:['m1-r001','m1-r001']},activity:true},kid,true));
 denied(await write(profile,{accessVersion:0},kid,true));denied(await write(profile,{accessVersion:0},owner,true));
 const after=JSON.parse((await read(profile,owner)).text);assert.equal(after.fields.wallet.mapValue.fields.words.arrayValue.values.length,1);
 // Archiving and mutating a result in one batch is forbidden for the parent too.
 const batch=await request(':commit','POST',{writes:[
  {update:{name:`projects/${project}/databases/(default)/documents/${profile}`,fields:fields({archived:true,accessVersion:2})},updateMask:{fieldPaths:['archived','accessVersion']}},
  {update:{name:`projects/${project}/databases/(default)/documents/${profile}/results/m1-l2`,fields:fields(score)}}
 ]},owner);denied(batch);
 assert.equal(JSON.parse((await read(profile,owner)).text).fields.archived.booleanValue,false);
 // Archived profile state and balances cannot be destroyed by DELETE.
 denied(await request('/'+profile,'DELETE',null,owner));
 ok(await write(profile,{name:'Әлия Новый'},owner,true));ok(await read(profile,kid));
 // Permanent deletion: only a locked profile permits cleanup, and a lock cannot be undone.
 denied(await request('/'+oralPrivate,'DELETE',null,owner));
 const fingerprint=`families/${parent}/imports/opaque-fingerprint`;
 ok(await write(fingerprint,{child,createdAt:'test'},owner));
 denied(await write(fingerprint,{used:true},owner));
 denied(await request('/'+profile+'/results/m1-l1','DELETE',null,owner));
 denied(await write(profile,{deleting:true,archived:true,accessVersion:2},kid,true));
 denied(await write(profile,{deleting:true,archived:true,accessVersion:1},owner,true));
 const invalidLock=await request(':commit','POST',{writes:[
  {update:{name:`projects/${project}/databases/(default)/documents/${profile}`,fields:fields({deleting:true,archived:true,accessVersion:2})},updateMask:{fieldPaths:['deleting','archived','accessVersion']}},
  {update:{name:`projects/${project}/databases/(default)/documents/${profile}/results/m1-l2`,fields:fields(score)}}
 ]},owner);denied(invalidLock);
 ok(await write(profile,{deleting:true,archived:true,accessVersion:2},owner,true));
 denied(await read(oralLive,kid));denied(await write(oralPrivate,{grades:[1]},owner,true));
 ok(await request('/'+oralPrivate,'DELETE',null,owner));ok(await request('/'+oralLive,'DELETE',null,owner));
 denied(await read(profile,kid));denied(await read(profile+'/results',kid));
 denied(await write(profile,{deleting:false,archived:false,accessVersion:2},owner,true));
 denied(await write(profile,{name:'Restored'},owner,true));
 denied(await write(profile,{wallet},owner,true));
 denied(await write(profile+'/results/m1-l2',score,owner));
 denied(await write(profile+'/exchanges/1',{amount:1},owner));
 denied(await write(`families/${parent}/imports/late-import`,{child,createdAt:'late'},owner));
 denied(await write(devicePath,{family:parent,child,accessVersion:2},owner,true));
 denied(await request('/'+profile+'/results/m1-l1','DELETE',null,kid));
 denied(await request('/'+profile+'/results/m1-l1','DELETE',null,stranger));
 denied(await write(fingerprint,{used:true,child},owner));
 ok(await write(fingerprint,{used:true},owner));
 assert.deepEqual(JSON.parse((await read(fingerprint,owner)).text).fields,{used:{booleanValue:true}});
 ok(await request(':commit','POST',{writes:[
  {delete:`projects/${project}/databases/(default)/documents/${profile}/results/m1-l1`},
  {delete:`projects/${project}/databases/(default)/documents/${profile}/exchanges/0`}
 ]},owner));
 ok(await write(devicePath,{family:'',child:''},owner));
 denied(await request('/'+profile,'DELETE',null,stranger));
 ok(await request('/'+profile,'DELETE',null,owner));
 assert.equal((await read(profile,owner)).status,404);
 assert.equal(JSON.parse((await read(profile+'/results',owner)).text).documents,undefined);
 assert.equal(JSON.parse((await read(profile+'/exchanges',owner)).text).documents,undefined);
 denied(await write(profile,{wallet:rewarded,activity:true},kid,true));
 denied(await write(profile+'/results/m1-l1',score,kid));
 ok(await write(`families/${parent}/children/new-child`,{name:'Әлия Новый',wallet,activity:false},owner));
 denied(await read(`families/${parent}/children/new-child`,kid));

});
