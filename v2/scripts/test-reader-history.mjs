import assert from 'node:assert/strict';
import './test-reader-model-state.mjs';
import {captureReaderState,restoreReaderState} from '../prototypes/reader-history.js';
import {readingBlocks} from '../prototypes/file-explorer.js';
import {registerReaderState} from '../prototypes/readers/reader-state.js';

let checks=0;
for(const offset of [-30,0,75])for(const shift of [-400,0,850])for(const value of ['0','1','500','1000']){
  let y=offset;
  const slider={tagName:'INPUT',type:'range',id:'timeline',name:'',value,checked:false,getAttribute:()=> 'Timeline'};
  const password={...slider,type:'password',value:'do-not-store'};
  const details=[{open:true},{open:false}];
  let revision='a'.repeat(64),modelStep=3;
  const article={getAttribute:()=>revision};
  registerReaderState(article,'button-model',{read:()=>({step:modelStep}),validate:s=>Number.isInteger(s?.step)&&s.step>=0&&s.step<=4,write:s=>{modelStep=s.step;}});
  const block={getBoundingClientRect:()=>({top:y,bottom:y+100})};
  const pane={_scroll:1000,get scrollTop(){return this._scroll;},set scrollTop(v){y-=v-this._scroll;this._scroll=v;},
    getBoundingClientRect:()=>({top:0,bottom:400}),querySelector:()=>article,
    querySelectorAll:selector=>selector===readingBlocks?[block]:selector==='article details'?details:[slider,password],
    closest:()=>({classList:{contains:()=>true}})};
  const saved=captureReaderState(pane,'models/moe');
  assert.equal(saved.version,3);
  assert.equal(restoreReaderState(pane,'models/moe',{...saved,version:2},()=>{throw new Error('Old reading-block indices must not dispatch');}),false);
  assert.equal(saved.controls.length,1);assert(!JSON.stringify(saved).includes('do-not-store'));assert.equal(saved.explorerVisible,false);
  slider.value='0';details[0].open=false;pane.scrollTop=0;y+=shift;
  modelStep=0;
  const old=y;let dispatched=0;
  assert(restoreReaderState(pane,'models/moe',saved,()=>dispatched++));
  assert.equal(slider.value,value);assert.equal(details[0].open,true);assert.equal(y,offset);assert.equal(dispatched,1);
  assert.equal(modelStep,3);
  assert.equal(restoreReaderState(pane,'models/attention',saved,()=>{}),false);
  const changed={...saved,controls:[{...saved.controls[0],signature:'changed'}]};
  assert.equal(restoreReaderState(pane,'models/moe',changed,()=>{}),false);
  assert.equal(restoreReaderState(pane,'models/moe',{...saved,version:99},()=>{}),false);
  revision='b'.repeat(64);slider.value='untouched';modelStep=0;
  assert.equal(restoreReaderState(pane,'models/moe',saved,()=>{throw new Error('Stale state must not dispatch');}),false);
  assert.equal(slider.value,'untouched');assert.equal(modelStep,0);revision=saved.revision;
  assert.equal(restoreReaderState(pane,'models/moe',{...saved,models:[{key:'button-model',state:{step:999}}]},()=>{throw new Error('Invalid model must not dispatch');}),false);
  checks++;
}
assert.equal(captureReaderState(null,'models/moe'),null);
assert.equal(restoreReaderState(null,'models/moe',null),false);
console.log('Reader history: '+checks+' exact value/detail/bookmark/button-model restorations; private exclusions and slug/schema/signature/revision/atomic model-validation guards pass.');
