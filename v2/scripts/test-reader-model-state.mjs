import assert from 'node:assert/strict';
import {mountBalanceLab,mountTokenJourney} from '../site/readers/moe.js';
import {captureReaderModels,restoreReaderModels,validReaderModels,registerReaderState} from '../site/readers/reader-state.js';
function element(){const events=new Map();return {events,dataset:{},hidden:false,innerHTML:'',textContent:'',value:'0.05',classList:{toggle(){}},setAttribute(){},addEventListener:(name,fn)=>events.set(name,fn),click(){events.get('click')?.();}};}
function fixture(){const nodes=new Map(),events=new Map();const article={isConnected:true,querySelector:s=>{if(!nodes.has(s))nodes.set(s,element());return nodes.get(s);},addEventListener:(name,fn)=>{if(!events.has(name))events.set(name,[]);events.get(name).push(fn);},emit:name=>events.get(name)?.forEach(fn=>fn())};return {article,nodes};}
const {article,nodes}=fixture();mountBalanceLab(article);
for(let i=0;i<4;i++)nodes.get('[data-balance-step]').click();
nodes.get('[data-speed]').value='0.10';nodes.get('[data-balance-step]').click();
const balance=captureReaderModels(article),rendered=nodes.get('[data-load-output]').innerHTML;
assert.equal(balance[0].state.step,5);
nodes.get('[data-balance-reset]').click();nodes.get('[data-speed]').value='0.25';
assert(restoreReaderModels(article,balance));assert.equal(nodes.get('[data-load-output]').innerHTML,rendered,'Restore exact biases, not a replay with the latest speed');
const snapshot=JSON.stringify(balance);nodes.get('[data-balance-step]').click();assert.equal(JSON.stringify(balance),snapshot);
assert(!validReaderModels(article,[{key:'moe-load-bias',state:{step:0,bias:[0,0,Infinity,0]}}]));
assert(!validReaderModels(article,[{key:'wrong-key',state:balance[0].state}]));
assert.throws(()=>registerReaderState(article,'moe-load-bias',{read(){},validate(){},write(){}}),/Duplicate/);
const before=nodes.get('[data-load-output]').innerHTML;assert(!restoreReaderModels(article,[]));assert.equal(nodes.get('[data-load-output]').innerHTML,before);

const original={matchMedia:globalThis.matchMedia,setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval};
try{
  const intervals=new Map();let next=0,removed=0;
  const motion={matches:false,addEventListener(name,fn){this.change=fn;},removeEventListener(){removed++;}};
  globalThis.matchMedia=()=>motion;
  globalThis.setInterval=fn=>{intervals.set(++next,fn);return next;};globalThis.clearInterval=id=>intervals.delete(id);
  const journey=fixture();mountTokenJourney(journey.article);const n=journey.nodes;
  n.get('[data-journey-next]').click();n.get('[data-journey-next]').click();
  const saved=captureReaderModels(journey.article);assert.equal(saved[0].state.step,2);
  n.get('[data-journey-prev]').click();assert(restoreReaderModels(journey.article,saved));assert.equal(n.get('[data-token-journey]').dataset.stage,'2');
  n.get('[data-journey-play]').click();assert.equal(intervals.size,1);[...intervals.values()][0]();
  assert.equal(n.get('[data-token-journey]').dataset.stage,'1');
  journey.article.emit('atlas-reader-suspend');assert.equal(intervals.size,0);
  n.get('[data-journey-next]').click();assert.equal(n.get('[data-token-journey]').dataset.stage,'2');
  n.get('[data-journey-play]').click();assert.equal(intervals.size,1);
  motion.matches=true;motion.change();assert.equal(intervals.size,0);assert.equal(n.get('[data-journey-play]').hidden,true);
  n.get('[data-journey-play]').click();assert.equal(intervals.size,0);
  motion.matches=false;motion.change();assert.equal(n.get('[data-journey-play]').hidden,false);
  journey.article.emit('atlas-reader-dispose');n.get('[data-journey-play]').click();assert.equal(intervals.size,0);assert.equal(removed,1);
}finally{for(const [name,value]of Object.entries(original)){if(value===undefined)delete globalThis[name];else globalThis[name]=value;}}
console.log('Reader model state: exact mixed-speed MoE bias restoration, independent snapshots, journey resume/suspend, dynamic reduced motion and permanent timer disposal pass.');
