'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Target{
 constructor(){this.events={};this.children=[];this.dataset={};this.attributes={};this.hidden=false;this._text='';this.classList={toggle(){}};}
 addEventListener(name,fn){(this.events[name]??=[]).push(fn);}
 removeEventListener(name,fn){this.events[name]=(this.events[name]||[]).filter(f=>f!==fn);}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 set textContent(v){this._text=v;this.children=[];}
 setAttribute(k,v){this.attributes[k]=v;}removeAttribute(k){delete this.attributes[k];}
 append(...children){this.children.push(...children);}replaceChildren(...children){this._text='';this.children=children;}
 querySelectorAll(){return this.children;}focus(){}
}
test('real mounted game releases fixed controls and tooltip listeners before another child mounts',()=>{
 const e={};for(const [,id]of fs.readFileSync('index.html','utf8').matchAll(/id="([^"]+)"/g)){e[id]=new Target();e[id].id=id;}
 const doc=new Target();Object.assign(doc,{getElementById:id=>e[id],createElement:()=>new Target(),createTextNode:text=>{const n=new Target();n.textContent=text;return n;},querySelector:()=>new Target()});
 const window=new Target();Object.assign(window,{SlovariumOnline:true,clearTimeout(){},setTimeout(){return 1;}});
 const context={window,document:doc,MutationObserver:class{observe(){}}};vm.runInNewContext(fs.readFileSync('script.js','utf8'),context);
 const core=window.SlovariumCore,store={getItem:()=>null,setItem(){}};
 const session=()=>({role:'child',wallet:new core.SlovariWallet(store),progress:new core.CourseProgress(store)});
 const first=session();core.mount(first);
 assert.equal(e['translation-check'].events.click.length,1);assert.equal(e['exchange-confirm'].events.click.length,1);assert.equal(doc.events.keydown.length,1);assert.equal(window.events.resize.length,1);
 first.dispose();assert.equal(e['translation-check'].events.click.length,0);assert.equal(e['exchange-confirm'].events.click.length,0);assert.equal(doc.events.keydown.length,0);assert.equal(window.events.resize.length,0);
 const second=session();core.mount(second);assert.equal(e['translation-check'].events.click.length,1);assert.equal(e['exchange-confirm'].events.click.length,1);assert.equal(doc.events.keydown.length,1);second.dispose();
 const parent={...session(),role:'parent'};window.SlovariumUI.parent('Родитель');core.mount(parent);assert.equal(e['translation-check'].events.click.length,0);assert.equal(e['exchange-confirm'].events.click.length,1);assert.equal(e.lesson.hidden,true);assert.equal(e.home.hidden,true);parent.dispose();
});
