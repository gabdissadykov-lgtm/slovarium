'use strict';
// Run only against a local demo emulator loaded with this repository's rules.
const {test}=require('node:test'),assert=require('node:assert/strict');
const host=process.env.FIRESTORE_EMULATOR_HOST;
test('Firestore Rules: family isolation, archived reads/writes, generation revocation and atomic batches',{skip:!host},async()=>{
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
 const rewarded={...wallet,words:['m1-r001']};
 ok(await write(profile,{wallet:rewarded,activity:true},kid,true));
 const score={signature:'rules-test',cards:{total:20,firstTryCorrect:20,errors:0}};
 ok(await write(profile+'/results/m1-l1',score,kid));
 ok(await write(profile+'/exchanges/0',{amount:1,at:'test'},owner));
 denied(await write(profile+'/exchanges/1',{amount:1,at:'test'},kid));
 denied(await write(profile,{archived:true},owner,true)); // Archive must revoke generation atomically.
 ok(await write(profile,{archived:true,accessVersion:1},owner,true));
 ok(await read(profile,owner));ok(await read(profile+'/results/m1-l1',owner));
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
});
