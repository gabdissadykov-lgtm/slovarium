/* Shared pure operations: browser and Node tests use the same rules. */
(function(root){
'use strict';
const emptyWallet=()=>({version:1,words:[],sentences:[],exchanges:[]});
const earned=w=>w.words.length*10+w.sentences.length*20;
const balance=w=>earned(w)-(w.version===2?w.spent:w.exchanges.reduce((sum,e)=>sum+e.amount,0));
const migrateWallet=w=>w.version===2?w:{...w,version:2,spent:w.exchanges.reduce((sum,e)=>sum+e.amount,0),hints:{},lastHint:''};
const hintKey=(entry,lang,position)=>`${entry}_${lang}_${position}`;
function buyHint(w,entry,lang,position){
 if(!/^m[1-9]-r\d{3}$/.test(entry)||!['kk','ru'].includes(lang)||!Number.isInteger(position)||position<0||position>199)throw Error('Неверная подсказка');
 const next=migrateWallet(w),key=hintKey(entry,lang,position);
 if(Object.hasOwn(next.hints,key))return next;
 if(balance(next)<5)throw Error('Для подсказки нужно 5 словари');
 return {...next,spent:next.spent+5,lastHint:key,hints:{...next.hints,[key]:{entry,lang,position}}};
}
function addReward(w,kind,id){
 if(!['words','sentences'].includes(kind))throw Error('Неверный тип награды');
 return w[kind].includes(id)?w:{...w,[kind]:[...w[kind],id]};
}
function exchange(w,expected,date){
 if(balance(w)<=0||balance(w)!==expected)throw Error('Баланс изменился. Проверьте сумму и подтвердите обмен заново.');
 return {...w,...(w.version===2?{spent:w.spent+expected}:{}),exchanges:[...w.exchanges,{amount:expected,date}]};
}
function better(old,candidate){
 return !old||candidate.firstTryCorrect>old.firstTryCorrect||candidate.firstTryCorrect===old.firstTryCorrect&&candidate.errors<old.errors;
}
function mergeResults(old,next){
 const result={...old};
 for(const level of ['cards','sentences','legacySentences'])if(next[level]&&better(result[level],next[level]))result[level]=next[level];
 return {...result,signature:next.signature};
}
const accessVersion=profile=>profile.accessVersion??0;
const isActive=profile=>Boolean(profile)&&profile.archived!==true&&profile.deleting!==true;
function requireActive(profile,expectedVersion=accessVersion(profile||{})){
 if(!isActive(profile)||accessVersion(profile)!==expectedVersion)throw Error('Доступ к профилю отключён. Обратитесь к родителю.');
 return profile;
}
function participantName(value){
 const name=typeof value==='string'?value.trim():'';
 if(!name||name.length>40)throw Error('Введите имя от 1 до 40 символов');
 return name;
}
function archiveParticipant(profile,archived){
 if(profile.deleting===true)throw Error('Удаление профиля уже началось');
 if(typeof archived!=='boolean')throw Error('Неверное состояние участника');
 if((profile.archived===true)===archived)return profile;
 return {...profile,archived,accessVersion:accessVersion(profile)+(archived?1:0)};
}
function beginDeletion(profile){
 return profile.deleting===true?profile:{...profile,deleting:true,archived:true,accessVersion:accessVersion(profile)+1};
}
function profileQueueKey(key,family,child){
 return key.startsWith('slovarium.pending:')&&key.replace(/:v\d+$/,'').endsWith(`:${family}:${child}`);
}
const api={emptyWallet,earned,balance,migrateWallet,hintKey,buyHint,addReward,exchange,better,mergeResults,accessVersion,isActive,requireActive,participantName,archiveParticipant,beginDeletion,profileQueueKey};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.SlovariumCloudModel=api;
})(typeof window==='undefined'?globalThis:window);
