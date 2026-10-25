import assert from 'node:assert/strict';
import './test-reader-loader.mjs';
import {makeTree} from '../prototypes/navigation.js';
import {folderEntries,readingBlocks,readingBookmark,restoreReadingBookmark,preserveReadingPosition,watchReadingReflow} from '../prototypes/file-explorer.js';
const notes=[
  {slug:'models/a',title:'Zebra',topicPath:['models'],tags:[]},
  {slug:'models/b',title:'Attention',topicPath:['models'],tags:[]},
  {slug:'models/child/c',title:'Nested',topicPath:['models','child'],tags:[]},
  {slug:'math/a',title:'Geometry',topicPath:['math'],tags:[]},
];
const root=makeTree(notes);
assert.deepEqual(folderEntries(root,[]).folders.map(n=>n.id),['math','models']);
assert.equal(folderEntries(root,[]).notes.length,0);
assert.deepEqual(folderEntries(root,['models']).notes.map(n=>n.title),['Attention','Zebra']);
assert.deepEqual(folderEntries(root,['models']).folders.map(n=>n.id),['child']);
assert.deepEqual(folderEntries(root,['models','child']).notes.map(n=>n.title),['Nested']);
assert.equal(folderEntries(root,['missing']).folders.length,2);
console.log('File explorer: immediate directory contents, nested folders and deterministic sorting pass.');
let checks=0;
for(const origin of [0,200,800])for(const oldTop of [0,200])for(const newTop of [0,200])for(const oldY of [-40,0,80])for(const delta of [-200,0,300]){
  let paneTop=oldTop,y=oldY;
  const pane={scrollTop:origin,getBoundingClientRect:()=>({top:paneTop,bottom:paneTop+300}),querySelectorAll:()=>[
    {getBoundingClientRect:()=>({top:paneTop-100,bottom:paneTop-20})},
    {getBoundingClientRect:()=>({top:paneTop+y,bottom:paneTop+y+100})}
  ]};
  preserveReadingPosition(pane,()=>{paneTop=newTop;y+=delta;});
  assert.equal(pane.scrollTop,origin+delta);checks++;
}
let calls=0;
preserveReadingPosition(null,()=>calls++);
const empty={scrollTop:42,getBoundingClientRect:()=>({top:0,bottom:100}),querySelectorAll:()=>[]};
preserveReadingPosition(empty,()=>calls++);
assert.equal(calls,2);assert.equal(empty.scrollTop,42);
console.log('Reader layout: '+checks+' block-offset reflow cases plus empty/unmounted panes pass without remounting.');
let resized=0;
for(const shift of [-6000,-100,250,8000]){
  let width=390,y=24,callback,disconnected=0;
  const events=new Map(),articleEvents=new Map();
  const anchor={getBoundingClientRect:()=>({top:y,bottom:y+90})};
  const pane={isConnected:true,_scroll:12000,get scrollTop(){return this._scroll;},set scrollTop(value){y-=value-this._scroll;this._scroll=value;},
    getBoundingClientRect:()=>({top:0,bottom:400,width,height:400}),querySelectorAll:()=>[anchor],
    addEventListener:(key,fn)=>events.set(key,fn),removeEventListener:key=>events.delete(key)};
  const article={addEventListener:(key,fn)=>articleEvents.set(key,fn),removeEventListener:key=>articleEvents.delete(key)};
  class Observer{constructor(fn){callback=fn;}observe(){}disconnect(){disconnected++;}}
  const stop=watchReadingReflow(pane,article,Observer);
  callback();width=1280;y+=shift;
  // A resize-induced scroll event must not replace the saved block.
  events.get('scroll')();callback();assert.equal(y,24);assert.equal(pane.scrollTop,12000+shift);
  // Ordinary reading scroll updates the saved offset for a later resize.
  pane.scrollTop+=15;events.get('scroll')();width=390;y-=shift;callback();assert.equal(y,9);
  articleEvents.get('atlas-reader-dispose')();stop();assert.equal(disconnected,1);assert.equal(events.size,0);assert.equal(articleEvents.size,0);resized++;
}
assert.equal(typeof watchReadingReflow(null,null,null),'function');
console.log('Viewport reflow: '+resized+' pre-resize block restorations, subsequent scrolling and idempotent reader-disposal cleanup pass.');
// Empty search results must not hide the actual decision header/body bookmark.
for(const selector of ['.dense-section>header','.dense-section>label','.dense-section>pre','.dense-section>ul','.dense-section>ol','.decision-explorer>[data-decision-results]','.decision-explorer>[data-decision-body]>*'])assert(readingBlocks.split(',').includes(selector),selector);
const emptyResult={getBoundingClientRect:()=>({top:10,bottom:10})};
const decisionBlock={getBoundingClientRect:()=>({top:24,bottom:180})};
assert.equal(readingBookmark({getBoundingClientRect:()=>({top:0,bottom:400}),querySelectorAll:()=>[emptyResult,decisionBlock]}).anchor,decisionBlock);
let geometryReads=0;
const disconnected={isConnected:false,getBoundingClientRect:()=>{geometryReads++;return {top:0};}};
const stablePane={scrollTop:80,getBoundingClientRect:()=>({top:0})};
restoreReadingBookmark(stablePane,{anchor:disconnected,offset:24});assert.equal(stablePane.scrollTop,80);assert.equal(geometryReads,0);
let keyboardCases=0;
for(const shift of [-6000,-100,250,8000]){
 let width=390,y=24,blocks=[],callback,disconnectedCount=0;
 const events=new Map(),articleEvents=new Map();
 const block={isConnected:true,getBoundingClientRect:()=>({top:y,bottom:y+160})};
 const pane={isConnected:true,_scroll:12000,get scrollTop(){return this._scroll;},set scrollTop(v){y-=v-this._scroll;this._scroll=v;},
  getBoundingClientRect:()=>({top:0,bottom:400,width,height:400}),querySelectorAll:()=>blocks,
  addEventListener:(k,f)=>events.set(k,f),removeEventListener:k=>events.delete(k)};
 const article={addEventListener:(k,f)=>articleEvents.set(k,f),removeEventListener:k=>articleEvents.delete(k)};
 class Observer{constructor(f){callback=f;}observe(){}disconnect(){disconnectedCount++;}}
 const stop=watchReadingReflow(pane,article,Observer);callback();
 // Selecting a branch inserts visible content and focuses it without a scroll event.
 blocks=[block];events.get('focusin')();width=1280;y+=shift;events.get('scroll')();callback();assert.equal(y,24);
 const laterFocus=events.get('focusin');articleEvents.get('atlas-reader-dispose')();stop();
 width=390;y=90;laterFocus();callback();assert.equal(y,90);
 assert.equal(disconnectedCount,1);assert.equal(events.size,0);assert.equal(articleEvents.size,0);keyboardCases++;
}
console.log('Decision reflow: selector coverage,empty-result exclusion,disconnected-anchor guard and '+keyboardCases+' focus-without-scroll resize/disposal cases pass. Native browser coverage remains separate.');
