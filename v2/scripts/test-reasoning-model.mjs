import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
import assert from "node:assert/strict";
import {passAtLeastOne,samplingOutcomes,voteState,voteSequence,refinement,budgetTrace,effortRewards,bookInference,bookRefinement,bookRL,bookDistillation} from "../prototypes/readers/reasoning-model.js";
import {samplingBody,votingBody,refinementBody,budgetBody,effortBody} from "../prototypes/readers/reasoning-scenes.js";
let cases=0;
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<t, a+" != "+b);
function bruteSampling(prob,n){
 let vote=0,any=0,ties=0,mass=0;
 function visit(counts,depth,w){
  if(depth===n){mass+=w;if(counts[0])any+=w;let largest=Math.max(...counts),winners=counts.flatMap((c,i)=>c===largest?[i]:[]);if(winners.length>1)ties+=w;if(winners.includes(0))vote+=w/winners.length;return;}
  for(let i=0;i<3;i++){counts[i]++;visit(counts,depth+1,w*prob[i]);counts[i]--;}
 }
 visit([0,0,0],0,1);return {vote,any,ties,mass};
}
for(let k=0;k<=10;k++)for(let n=1;n<=7;n++)for(const split of [false,true]){
 const p=k/10,prob=split?[p,(1-p)/2,(1-p)/2]:[p,1-p,0],b=bruteSampling(prob,n);
 for(const shared of [0,.4,1]){
  const m=samplingOutcomes(p,n,split,shared);near(m.mass,1);near(m.iidVote,b.vote);near(m.iidOracle,b.any);near(m.iidTie,b.ties);near(m.vote,shared*p+(1-shared)*b.vote);near(m.oracle,shared*p+(1-shared)*b.any);assert.ok(m.vote<=m.oracle+1e-12);cases++;
 }
}
for(let k=0;k<=20;k++)for(let n=1;n<=30;n++){const m=samplingOutcomes(k/20,n);near(m.mass,1);assert.ok(m.vote>=-1e-12&&m.vote<=1+1e-12);cases++;}
near(passAtLeastOne(1e-16,10000),1e-12,1e-24);assert.equal(passAtLeastOne(0,8),0);assert.equal(passAtLeastOne(1,8),1);
assert.ok(samplingOutcomes(.4,15,true).vote>samplingOutcomes(.4,1,true).vote);
assert.ok(samplingOutcomes(.4,15,false).vote<samplingOutcomes(.4,1,false).vote);
function sequences(n,prefix=[],out=[]){if(!n){out.push(prefix);return out;}for(const a of ["A","B","C"])sequences(n-1,[...prefix,a],out);return out;}
for(const sequence of [...sequences(4),voteSequence])for(let step=0;step<=sequence.length;step++){
 const m=voteState(step,sequence);assert.equal(Object.values(m.counts).reduce((a,b)=>a+b,0),step);assert.equal(m.history.length,step);
 if(m.canStop)for(const rest of sequences(m.remaining)){const full=voteState(sequence.length,[...sequence.slice(0,step),...rest]);assert.equal(full.leader,m.leader);}
 cases++;
}
function bruteRefinement(p,u,d,n){
 let current=0,best=0,mass=0;
 function visit(correct,seen,t,w){if(t===n){mass+=w;if(correct)current+=w;if(seen)best+=w;return;}const nextP=correct?1-d:u;visit(true,true,t+1,w*nextP);visit(false,seen,t+1,w*(1-nextP));}
 visit(true,true,0,p);visit(false,false,0,1-p);return {current,best,mass};
}
for(const p of [0,.6,1])for(const u of [0,.2,1])for(const d of [0,.3,1])for(let n=0;n<=8;n++){
 const a=refinement(p,u,d,n),b=bruteRefinement(p,u,d,n);near(a.current,b.current);near(a.best,b.best);near(b.mass,1);assert.ok(a.best+1e-12>=a.current);cases++;
}
const decay=refinement(.6,.2,.3,12);assert.ok(decay.current<.6&&decay.best>.6);assert.equal(refinement(.6,0,0).equilibrium,null);
for(let reasoning=1;reasoning<=30;reasoning++)for(let b=0;b<=31;b++){
 const m=budgetTrace(b,reasoning,3,5);assert.equal(m.retained,Math.min(b,reasoning));assert.equal(m.removed+m.retained,reasoning);assert.equal(m.context,5+m.retained+1+3);assert.equal(m.targets,m.retained+3+(b>=reasoning?1:0));assert.equal(m.spans[2].target,b>=reasoning);cases++;
}
for(let k=0;k<=1000;k++){const cost=k/100000,m=effortRewards(cost);for(const r of m.rows)near(r.reward,r.success-cost*r.tokens);assert.ok(m.rows.every(r=>m.choice.reward>=r.reward-1e-12));cases++;}
assert.deepEqual(effortRewards(.004).winners,[0,1]);assert.deepEqual(effortRewards(.001).winners,[1,2]);assert.deepEqual(effortRewards(.00025).winners,[2,3]);
assert.equal(bookInference.length,12);assert.equal(bookRefinement.length,9);assert.equal(bookRL.length,3);assert.equal(bookDistillation.length,6);
assert.deepEqual(bookInference[10],{method:"Vote 10 + step-by-step",model:"Base",accuracy:52,minutes:862.6});assert.equal(bookRefinement[7].accuracy,57.8);assert.equal(bookRL[2].tokens,586.11);assert.equal(bookDistillation[3].epoch,1);
for(const f of [()=>passAtLeastOne(.4,0),()=>samplingOutcomes(.4,31),()=>samplingOutcomes(NaN),()=>samplingOutcomes(.4,3,true,2),()=>voteState(-1),()=>voteState(1,["D"]),()=>refinement(.6,-.1,.3),()=>budgetTrace(1,0),()=>effortRewards(Infinity)])assert.throws(f,RangeError);
console.log("Reasoning models: "+cases+" independently checked sampling, plurality, stopping, refinement, mask and effort cases pass; book observations remain separate.");
let scenes=0;const render=h=>{assertGeneratedMarkup(h,"test-reasoning-model.mjs");assert.ok(!/NaN|undefined/.test(h));scenes++;};
for(let n=1;n<=15;n++)for(const split of [false,true])for(const shared of [0,.5,1])render(samplingBody(n,split,shared));
for(let n=0;n<=8;n++)render(votingBody(n));
for(let n=0;n<=12;n++)for(let d=0;d<=50;d+=5)render(refinementBody(n,d/100));
for(let n=0;n<=12;n++)render(budgetBody(n));
for(let n=0;n<=40;n++)render(effortBody(n/10000));
assert.equal(scenes,296);assert.ok(votingBody(0).includes("leader=none yet"));
assertGeneratedMarkupCount("test-reasoning-model.mjs",scenes);
console.log("Reasoning scene foundations: all 296 bounded state bodies render; browser integration remains pending.");
