/* Shared pure operations: browser and Node tests use the same rules. */
(function(root){
'use strict';
const emptyWallet=()=>({version:1,words:[],sentences:[],exchanges:[]});
const earned=w=>w.words.length*10+w.sentences.length*20;
const balance=w=>earned(w)-w.exchanges.reduce((sum,e)=>sum+e.amount,0);
function addReward(w,kind,id){
 if(!['words','sentences'].includes(kind))throw Error('Неверный тип награды');
 return w[kind].includes(id)?w:{...w,[kind]:[...w[kind],id]};
}
function exchange(w,expected,date){
 if(balance(w)<=0||balance(w)!==expected)throw Error('Баланс изменился. Проверьте сумму и подтвердите обмен заново.');
 return {...w,exchanges:[...w.exchanges,{amount:expected,date}]};
}
function better(old,candidate){
 return !old||candidate.firstTryCorrect>old.firstTryCorrect||candidate.firstTryCorrect===old.firstTryCorrect&&candidate.errors<old.errors;
}
function mergeResults(old,next){
 const result={...old};
 for(const level of ['cards','sentences','legacySentences'])if(next[level]&&better(result[level],next[level]))result[level]=next[level];
 return {...result,signature:next.signature};
}
const api={emptyWallet,earned,balance,addReward,exchange,better,mergeResults};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.SlovariumCloudModel=api;
})(typeof window==='undefined'?globalThis:window);
