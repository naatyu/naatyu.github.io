import assert from 'node:assert/strict';
import {createReaderLoader} from '../prototypes/reader-loader.js';

const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
let checks=0;
for(const order of ['old-first','new-first'])for(const oldFails of [false,true])for(const newFails of [false,true]){
  const events=[],old=deferred(),latest=deferred();
  const load=createReaderLoader({isConnected:()=>true,onLoading:()=>events.push('loading'),onReady:html=>events.push(html),onError:()=>events.push('error')});
  const first=load(()=>old.promise),second=load(()=>latest.promise);
  const finishOld=()=>oldFails?old.reject(Error('old')):old.resolve('old');
  const finishNew=()=>newFails?latest.reject(Error('new')):latest.resolve('new');
  if(order==='old-first'){finishOld();await first;finishNew();await second;}
  else{finishNew();await second;finishOld();await first;}
  assert.deepEqual(events,['loading','loading',newFails?'error':'new']);checks++;
}
const events=[];let connected=true,renderFails=false;
const load=createReaderLoader({isConnected:()=>connected,onLoading:()=>events.push('loading'),onReady:html=>{if(renderFails)throw Error('render');events.push(html);},onError:()=>events.push('error')});
load(()=>'cached');assert.deepEqual(events,['cached'],'Cached content remains synchronous');
load(()=>{throw Error('read');});assert.equal(events.at(-1),'error');
load(()=>({get then(){throw Error('then getter');}}));assert.equal(events.at(-1),'error');
renderFails=true;load(()=>'broken render');assert.equal(events.at(-1),'error');renderFails=false;
await load(()=>Promise.reject(Error('network')));assert.equal(events.at(-1),'error');
load(()=>'retry');assert.equal(events.at(-1),'retry');
const pending=deferred(),waiting=load(()=>pending.promise);load(()=>'cache overtakes network');pending.resolve('stale');await waiting;assert.equal(events.at(-1),'cache overtakes network');
for(const rejects of [false,true]){
  const task=deferred(),promise=load(()=>task.promise),before=events.length;connected=false;
  if(rejects)task.reject(Error('detached'));else task.resolve('detached');
  await promise;assert.equal(events.length,before);connected=true;checks++;
}
assert(!events.includes('stale')&&!events.includes('broken render'));
console.log(`Reader loader: ${checks} ordered/detached cases, synchronous cache/errors, network failure/retry and cached overtaking pass.`);
