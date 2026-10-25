import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {overlap,detectionBoxes,suppressionTrace,fuseAssignedCluster} from '../site/readers/detection-model.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,[a,b]);let cases=0;
// Analytic scale checks use dimensionless expected ratios, not an absolute area tolerance.
for(let exponent=-150;exponent<=150;exponent+=5){
 const s=10**exponent,a=[0,0,2*s,2*s],b=[s,0,3*s,2*s];
 const m=overlap(a,b);near(m.iou,1/3);near(m.centerPenalty,1/13);near(m.diou,10/39);
 assert.ok(Object.values(m).every(Number.isFinite));
 near(overlap(a,a).iou,1);assert.equal(overlap(a,a).centerPenalty,0);
}
for(const s of [1e200,1e-200])assert.throws(()=>overlap([0,0,s,s],[0,0,s,s]),{name:'RangeError',message:/floating-point range/});
assert.throws(()=>overlap([1e308,0,1.1e308,1],[1e308,0,1.1e308,1]),RangeError);
for(const method of ['hard','linear','gaussian','diou'])for(const s of [1e200,1e-200]){
 const boxes=['a','b'].map((id,i)=>({id,label:'x',box:[0,0,s,s],score:1-i/10}));
 const before=structuredClone(boxes);
 assert.throws(()=>suppressionTrace(boxes,{method}),RangeError);
 assert.deepEqual(boxes,before);
}
console.log('Detection numeric domain:61 analytic scale pairs,3 explicit range failures and8 fail-closed suppression policies pass;no arbitrary-precision guarantee.');
// Independent integer-cell enumeration for half-open integer xyxy rectangles.
const cells=b=>{const s=new Set();for(let x=b[0];x<b[2];x++)for(let y=b[1];y<b[3];y++)s.add(x+','+y);return s;};
const rectangles=[];for(let x=0;x<3;x++)for(let y=0;y<3;y++)for(let w=1;w<=2;w++)for(let h=1;h<=2;h++)rectangles.push([x,y,x+w,y+h]);
for(const a of rectangles)for(const b of rectangles){const ca=cells(a),cb=cells(b),intersection=[...ca].filter(x=>cb.has(x)).length,union=new Set([...ca,...cb]).size,m=overlap(a,b);near(m.intersection,intersection);near(m.union,union);near(m.iou,intersection/union);near(m.iou,overlap(b,a).iou);assert.ok(m.diou<=m.iou);const shifted=b.map((x,i)=>x+(i%2?11:7));near(overlap(a.map((x,i)=>x+(i%2?11:7)),shifted).iou,m.iou);near(overlap(a.map(x=>x*3),b.map(x=>x*3)).diou,m.diou);cases++;}
function reference(boxes,threshold,classAware){let pending=boxes.map((b,i)=>({...b,i})),kept=[];while(pending.length){const top=Math.max(...pending.map(b=>b.score)),at=pending.findIndex(b=>b.score===top),selected=pending.splice(at,1)[0];kept.push(selected.id);pending=pending.filter(b=>{if(classAware&&selected.label!==b.label)return true;const a=cells(selected.box),c=cells(b.box),j=[...a].filter(x=>c.has(x)).length;return j/(a.size+c.size-j)<=threshold;});}return kept;}
const tiny=rectangles.slice(0,8).map((box,i)=>({box,score:1-i/10,id:String(i),label:i%2?'a':'b'}));
for(let mask=0;mask<256;mask++){const boxes=tiny.filter((_,i)=>mask&(1<<i));for(const t of [0,.25,.5,.75,1])for(const aware of [false,true]){const trace=suppressionTrace(boxes,{threshold:t,classAware:aware,scoreFloor:0});assert.deepEqual(trace.at(-1).kept.map(b=>b.id),reference(boxes,t,aware));cases++;}}
let sceneSettings=0;
for(const method of ['hard','linear','gaussian','diou'])for(let t=0;t<=100;t++)for(const aware of [false,true]){
 const trace=suppressionTrace(detectionBoxes,{method,threshold:t/100,classAware:aware});const end=trace.at(-1);assert.equal(end.remaining.length,0);assert.equal(end.kept.length+end.removed.length,detectionBoxes.length);assert.equal(new Set([...end.kept,...end.removed].map(b=>b.id)).size,detectionBoxes.length);
 for(const snap of trace.slice(1))for(const c of snap.comparisons){if(!c.comparable)near(c.after,c.before);else if(method==='gaussian')near(c.after,c.before*Math.exp(-c.iou*c.iou/.5));else if(method==='linear')near(c.after,c.iou>=t/100?c.before*(1-c.iou):c.before);else near(c.after,c.before);assert.ok(c.after<=c.before);}
 cases++;sceneSettings++;
}
const exact=[{id:'a',label:'x',box:[0,0,2,2],score:.9},{id:'b',label:'x',box:[0,0,1,2],score:.8}];assert.equal(overlap(exact[0].box,exact[1].box).iou,.5);assert.equal(suppressionTrace(exact,{threshold:.5}).at(-1).kept.length,2);assert.equal(suppressionTrace(exact,{threshold:.49}).at(-1).kept.length,1);
assert.deepEqual(fuseAssignedCluster([{box:[0,0,2,2],score:1},{box:[2,2,4,4],score:3}]),[1.5,1.5,3.5,3.5]);
// Fewer conflict edges can let an earlier box survive and eliminate several later boxes.
const nonmonotone=[[0,0,4,4],[1,2,5,6],[1,4,5,8],[3,2,7,6]].map((box,i)=>({id:String(i),box,score:1-i/10,label:'x'}));
assert.deepEqual(suppressionTrace(nonmonotone,{threshold:.2}).at(-1).kept.map(b=>b.id),['0','2','3']);
assert.deepEqual(suppressionTrace(nonmonotone,{threshold:.3}).at(-1).kept.map(b=>b.id),['0','1']);
for(const fn of [()=>overlap([0,0,0,1],[0,0,1,1]),()=>suppressionTrace([], {sigma:0}),()=>suppressionTrace(detectionBoxes,{method:'invalid'}),()=>suppressionTrace([detectionBoxes[0],detectionBoxes[0]]),()=>fuseAssignedCluster([]),()=>fuseAssignedCluster([{box:[0,0,1,1],score:0}])])assert.throws(fn,RangeError);
const original=await readFile(new URL('../../docs/ai/modalities/computer-vision/non-maximum-suppression.md',import.meta.url));assert.equal(createHash('sha256').update(original).digest('hex'),'785923798ddadb97a1b584bcd656023a2a56b6319c46b14e4ff4a54d695195f6');
console.log('Detection foundations: '+cases+' independent geometry/subset/trace cases and '+sceneSettings+' policy settings; original unchanged. Reader integration is checked separately.');
