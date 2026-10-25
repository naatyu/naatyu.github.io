import assert from 'node:assert/strict';
import {quorumSets,partitionStory,availabilityBudget,downtime,workerBudget,ringOwner} from '../prototypes/readers/services-model.js';
let cases=0;const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-11*Math.max(1,Math.abs(a),Math.abs(b)));
for(let n=1;n<=7;n++)for(let r=1;r<=n;r++)for(let w=1;w<=n;w++){
 const q=quorumSets(n,r,w);assert.equal(q.minOverlap,Math.max(0,r+w-n));assert.equal(q.maxOverlap,Math.min(r,w));
 for(const a of q.reads)for(const b of q.writes){const union=new Set([...a,...b]);const intersection=r+w-union.size;assert.equal(intersection,a.filter(x=>b.includes(x)).length);assert.ok(intersection>=q.minOverlap);cases++;}
}
for(const policy of ['cp','ap']){
 const trace=partitionStory(policy);assert.deepEqual(trace[2].values,[1,1,0]);assert.equal(trace[2].ack,true);
 assert.equal(trace[3].blocked,policy==='cp');assert.equal(trace[3].read,policy==='cp'?null:0);assert.equal(trace[5].read,1);cases+=trace.length;
}
for(let n=1;n<=6;n++)for(const p of [0,.5,.99,1])for(const common of [0,.9,1]){
 const x=availabilityBudget(Array(n).fill(p),common);let series=0,parallel=0;
 for(let mask=0;mask<(1<<n);mask++){let mass=1;for(let i=0;i<n;i++)mass*=mask&(1<<i)?p:1-p;if(mask===(1<<n)-1)series+=mass;if(mask!==0)parallel+=mass;}
 close(x.series,common*series);close(x.parallel,common*parallel);cases++;
}
for(const p of [.99,.999,.9999,.99999]){const x=downtime(p);close(x.yearSeconds,365*24*60*60*(1-p));close(x.monthSeconds,30*24*60*60*(1-p));cases++;}
for(let daily=1;daily<=100;daily++)for(const seconds of [1,30,60,120])for(const utilization of [.5,.7,.9,1]){
 const r=workerBudget({dailyJobs:daily*1e6,serviceSeconds:seconds,utilization});close(r.arrival,daily*1e6/86400);assert.ok(r.workers*utilization+1e-10>=r.inService);assert.ok((r.workers-1)*utilization<r.inService+1e-10);
 const numerator=BigInt(daily)*1000000n*BigInt(seconds)*10n,denominator=86400n*BigInt(Math.round(utilization*10));
 assert.equal(r.workers,Number((numerator+denominator-1n)/denominator));cases++;
}
const old=[{at:0,owner:'A'},{at:.25,owner:'B'},{at:.5,owner:'C'},{at:.75,owner:'D'}],next=[...old,{at:.625,owner:'E'}];
for(let i=0;i<1000;i++){const k=i/1000,a=ringOwner(k,old),b=ringOwner(k,next);assert.equal(a!==b,k>.5&&k<=.625);if(a!==b)assert.equal(b,'E');cases++;}
assert.equal(workerBudget({dailyJobs:50e6,serviceSeconds:60}).workers,34723);
for(const fn of [()=>quorumSets(3,4,1),()=>partitionStory('x'),()=>availabilityBudget([1.1]),()=>workerBudget({dailyJobs:1,serviceSeconds:1,utilization:0}),()=>ringOwner(1,old)])assert.throws(fn,RangeError);
console.log('Services foundations: '+cases+' independent quorum-pair, partition, probability, worker and ring cases pass. Not a consensus/linearizability implementation.');
