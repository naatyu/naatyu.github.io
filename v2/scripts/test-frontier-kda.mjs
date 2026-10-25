import assert from 'node:assert/strict';
import {kdaStep,kdaDemoStep,poolKey,poolPositions} from '../prototypes/readers/glm-flash-model.js';
import {glmFlashMechanisms,kdaSceneBody,glmFlashPooling,poolSceneBody} from '../prototypes/readers/glm-flash-mechanisms.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
let cases=0;
for(const a of [-2,0,3])for(const b of [-1,0,2])for(const dx of [0,.25,1])for(const dy of [0,.5,1])for(const beta of [0,.5,1]){
 const state=[[a,b],[b,a]],key=[.6,.8],value=[4,-1],decay=[dx,dy],query=[1,0],f=kdaStep(state,key,value,decay,beta,query);
 for(let j=0;j<2;j++){const pred=.6*dx*state[0][j]+.8*dy*state[1][j];close(f.prediction[j],pred);for(let i=0;i<2;i++){const expected=decay[i]*state[i][j]+beta*key[i]*(value[j]-pred);close(f.updated[i][j],expected);}close(f.output[j],f.updated[0][j]/Math.sqrt(2));}
 assert.deepEqual(state,[[a,b],[b,a]]);cases++;
}
const f=kdaDemoStep();assert.deepEqual(f.forgotten,[[1,.5],[0,.75]]);assert.deepEqual(f.prediction,[1,.5]);assert.deepEqual(f.residual,[4,3.5]);assert.deepEqual(f.updated,[[3,2.25],[0,.75]]);
assert.notDeepEqual(f.updated,[[2.5,2],[0,.75]],'Undecayed-prediction bug must remain visible');
assert.throws(()=>kdaStep([[1]],[1],[1],[2],.5,[1]),RangeError);
assert.throws(()=>kdaStep([[1]],[1],[1],[1],.5,[1,2]),RangeError);
const html=glmFlashMechanisms(s=>s);assert.equal((html.match(/class="katex-mathml"/g)||[]).length,5);
for(let i=0;i<4;i++)assert.ok(kdaSceneBody(i).includes('data-kda-caption'));
assert.ok(html.includes('decayed state'));assert.ok(html.includes('FP32'));
console.log(`GLM KDA: ${cases} independent scalar-reference cases,zero-decay/write boundaries,caller ownership,old-order counterexample,three display and two inline formulas and four explanatory states pass.`);
const pooled=poolKey([[0,0],[4,4],[8,8],[12,12]],[[0,0],[0,0],[0,0],[Math.log(3),0]]);
close(pooled.pooled[0],8);close(pooled.pooled[1],6);
for(let c=0;c<2;c++)close(pooled.weights.reduce((s,r)=>s+r[c],0),1);
for(const shift of [-1000,0,1000]){const p=poolKey([[0],[4],[8],[12]],[[shift],[shift],[shift],[shift]]);close(p.pooled[0],6);}
assert.throws(()=>poolKey([[1]],[[0]]),RangeError);
let selectionCases=0;
for(let n=0;n<=100;n++)for(const budget of [0,4,8,2048]){
 const scores=Array.from({length:25},(_,i)=>i),p=poolPositions(n,scores,budget),complete=Math.floor(n/4),selected=Math.min(complete,budget/4);
 assert.equal(p.raw.length,selected*4);assert.equal(p.tail.length,n%4);assert.equal(new Set(p.positions).size,p.positions.length);assert(p.positions.every(i=>i>=0&&i<n));
 assert.deepEqual(p.tail,Array.from({length:n%4},(_,i)=>complete*4+i));
 assert.deepEqual(p.selected,Array.from({length:selected},(_,i)=>complete-1-i));selectionCases++;
}
assert.deepEqual(poolPositions(6,[1,3,2],4).positions,[0,1,2,3,4,5]);
assert.deepEqual(poolPositions(8,[1,3,2],4).positions,[4,5,6,7]);
assert.throws(()=>poolPositions(4,[1],3),RangeError);
for(let n=0;n<=11;n++)assert(poolSceneBody(n).includes('Main attention reads raw positions'));
assert.equal((glmFlashPooling(s=>s).match(/class="katex-mathml"/g)||[]).length,1);
console.log(`IndexPool: ${selectionCases} causal-prefix/budget references,feature-softmax normalization and shift stability,raw expansion/tail bounds and all twelve scene states pass.`);
