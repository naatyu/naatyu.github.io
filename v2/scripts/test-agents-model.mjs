import assert from "node:assert/strict";
import {executableTask,rubricRewards,redistributeGroup,localCredit,harnessMass,completionMixture,familyMixture,correctnessEfficiency,prefixCapture,recoveryState} from "../site/readers/agents-model.js";
const sum=x=>x.reduce((a,b)=>a+b,0);
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-9*Math.max(1,Math.abs(a),Math.abs(b)),String(a)+" != "+String(b));
let cases=0;
for(let mask=0;mask<16;mask++){
 const bits=Array.from({length:4},(_,i)=>Boolean(mask&(1<<i))),m=executableTask(...bits);
 assert.equal(m.valid,mask===15);cases++;
}
for(let n=1;n<=10;n++)for(let mask=0;mask<(1<<n);mask++){
 const outcomes=Array.from({length:n},(_,i)=>(mask>>i)&1),quality=outcomes.map((_,i)=>(i+1)/(n+1));
 const m=redistributeGroup(outcomes,quality),positive=sum(outcomes)*(1-sum(outcomes)/n);
 near(sum(m.final),0);near(m.positiveMass,positive);near(m.positiveBeforeCenter,positive);near(m.positiveAfterCenter,positive);
 for(let i=0;i<n;i++)if(!outcomes[i])near(m.beforeCenter[i],m.advantages[i]);
 if(mask===0||mask===(1<<n)-1){assert.equal(m.rawLambda,null);assert.ok(m.final.every(x=>x===0));}
 const capped=redistributeGroup(outcomes,quality,[],1);
 near(sum(capped.final),0);assert.ok(capped.positiveBeforeCenter<=positive+1e-12);
 near(capped.shift,sum(capped.beforeCenter)/n);
 // Re-centering does not generally recover the full original positive mass after capping.
 if(capped.capped&&positive>0)assert.ok(capped.positiveAfterCenter<positive+1e-12);
 const grs=rubricRewards(outcomes,quality,quality);
 for(let i=0;i<n;i++)near(grs.rewards[i],outcomes[i]*quality[i]**2);
 near(sum(grs.advantages),0);cases++;
}
const hack=redistributeGroup([1,1,0],[1,.5,1],[0]);
assert.deepEqual(hack.rewards,[0,1,0]);near(hack.mean,1/3);near(hack.advantages[0],-1/3);
assert.ok(redistributeGroup([1,1,0],[.1,1,1],[],1).capped);
const allPass=rubricRewards([1,1,1],[1,.8,.4],[1,1,1]);
assert.ok(allPass.advantages.some(x=>x!==0));
for(let n=1;n<=8;n++)for(let mask=0;mask<(1<<n);mask++)for(const a of [-2,-.1,0,.1,2]){
 const flags=Array.from({length:n},(_,i)=>Boolean(mask&(1<<i))),m=localCredit(a,flags,3);
 if(a>0&&flags.every(Boolean)){assert.equal(m.weights,null);near(m.unallocated,a);}
 else{
 near(m.total,a);assert.equal(m.weights.length,n);
 if(a>0)m.weights.forEach((w,i)=>{assert.ok(w>=0);if(flags[i])near(w,0);});
 if(a<0&&flags.some(Boolean)&&flags.some(x=>!x)){const bad=m.weights[flags.indexOf(true)],good=m.weights[flags.indexOf(false)];near(bad,3*good);}
 }
 cases++;
}
for(let e1=0;e1<=10;e1++)for(let e2=0;e2<=10;e2++)if(e1+e2>0)for(const l of [1,4,16,100]){
 const response=harnessMass([e1,e2],[1,l],"response"),token=harnessMass([e1,e2],[1,l],"token");
 near(response.shares[0],e1/(e1+e2));near(token.shares[1],e2*l/(e1+e2*l));near(sum(response.shares),1);near(sum(token.shares),1);cases++;
}
near(harnessMass([10,10],[10,100],"token").shares[1],10/11);
near(harnessMass([10,10],[10,100],"response").shares[1],.5);
for(let duration=1;duration<=16;duration++)for(let horizon=0;horizon<=64;horizon++){
 const m=completionMixture([1,duration],[2,3],horizon);
 assert.deepEqual(m.completions,[2*horizon,3*Math.floor(horizon/duration)]);
 if(m.shares)near(sum(m.shares),1);near(sum(m.steadyShares),1);cases++;
}
assert.deepEqual(completionMixture([1,4],[1,1],8).completions,[8,2]);
near(completionMixture([1,4],[1,4],8).shares[0],.5);
assert.equal(completionMixture([1,4],[0,0],8).shares,null);
for(let j=0;j<=100;j++){
 const a=j/100,m=familyMixture([{weight:a,conditional:[.25,.75]},{weight:1-a,conditional:[.5,.5]}]);near(sum(m.flat()),1);near(m[0][1],.75*a);
 near(correctnessEfficiency(false,a,.25),0);near(correctnessEfficiency(true,a,.25),1+.25*a);cases++;
}
const nodes=prefixCapture([
 {id:"root",prompt:[1,2],completion:[3],retained:true},
 {id:"left",prompt:[1,2,3,4],completion:[5],retained:true},
 {id:"right",prompt:[1,2,3,6],completion:[7],retained:false},
 {id:"continue",prompt:[1,2,3,4,5,8],completion:[9],retained:true},
 {id:"compact",prompt:[1,20],completion:[21],retained:true}
]);
assert.deepEqual(nodes.map(x=>x.parent),[null,"root","root","left",null]);
assert.deepEqual(nodes.map(x=>x.targetCount),[1,1,0,1,1]);
for(let step=0;step<5;step++){const s=recoveryState(step);near(s.contextTokens,s.targetTokens+s.maskedAssistantTokens+s.toolTokens);cases++;}
assert.deepEqual([recoveryState(4).contextTokens,recoveryState(4).targetTokens],[17,7]);
assert.throws(()=>redistributeGroup([1],[0]),RangeError);
assert.throws(()=>redistributeGroup([1,0],[Number.MIN_VALUE,1]),RangeError);
assert.throws(()=>redistributeGroup([.5],[1]),RangeError);
assert.throws(()=>redistributeGroup([1],[1],[2]),RangeError);
assert.throws(()=>localCredit(1,[]),RangeError);
assert.throws(()=>harnessMass([0,0],[1,2]),RangeError);
assert.throws(()=>harnessMass([1],[0]),RangeError);
assert.throws(()=>completionMixture([0],[1],1),RangeError);
assert.throws(()=>familyMixture([{weight:.5,conditional:[1,0]}]),RangeError);
assert.throws(()=>recoveryState(5),RangeError);
console.log("Agent foundations: "+cases+" task, grading, token-credit, mixture, completion and recovery cases passed.");
