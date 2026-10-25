import assert from 'node:assert/strict';
import './test-loss-preservation.mjs';
import './test-loss-probabilities.mjs';
import './test-loss-source-closure.mjs';
import './test-parallelism-details.mjs';
import './test-parallelism-preservation.mjs';
import './test-pipeline-scenes.mjs';
import './test-reference-notation.mjs';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {entropy,crossEntropy,kl,jsd,codingFrame} from '../site/readers/information-model.js';
import {regressionFrame,binaryScores,brierRisk,stableBce} from '../site/readers/loss-model.js';
import {matmul,matrixA,matrixB,contractExample,pipelineFrame,adamStateBytes} from '../site/readers/parallelism-model.js';
import {informationReader,informationSections,informationMeta} from '../site/readers/information.js';
import {lossesReader,lossSections,lossesMeta} from '../site/readers/losses.js';
import {parallelismReader,parallelSections,parallelismMeta} from '../site/readers/parallelism.js';
import {readerMetas,readerAliases,renderDenseReader} from '../site/readers/index.js';
import {rangePlayback} from '../site/readers/topic-tools.js';
import {rank} from '../site/search.js';
import {parseFragment} from 'parse5';
const close=(a,b,tol=1e-10)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
close(entropy([.5,.5]),1);close(entropy([1,0]),0);
assert.equal(kl([1,0],[0,1]),Infinity);assert.equal(crossEntropy([1,0],[0,1]),Infinity);
close(kl([0,1],[0,1]),0);close(jsd([1,0],[0,1]),1);close(jsd([.5,.5],[.4,.6],Math.E),.0050593899289876);
for(let i=0;i<=100;i++){const f=codingFrame(i/100);close(f.h,1.75);close(f.ce,f.h+f.kl);assert(f.kl>=-1e-12);close(f.q.reduce((s,v)=>s+v,0),1);}
close(codingFrame(0).ce,2.625);close(codingFrame(0).kl,.875);close(codingFrame(1).kl,0);
assert.throws(()=>entropy([.5,.2]));assert.throws(()=>kl([1],[.5,.5]));assert.throws(()=>entropy([-1,2]));assert.throws(()=>entropy([1],1));assert.throws(()=>codingFrame(2));
// Positive support remains finite even when the intermediate ratio cannot be
// represented. Check against coding regret, not the implementation's log ratio.
let extremeCases=0;
for(const tiny of [Number.MIN_VALUE,1e-320,1e-310,1e-200])for(const p of [[.5,.5],[1,0],[tiny,1-tiny]])for(const base of [2,Math.E,10]){
  const q=[tiny,1-tiny],actual=kl(p,q,base);
  assert(Number.isFinite(actual));close(actual,crossEntropy(p,q,base)-entropy(p,base),1e-9);
  const reverse=kl(q,p,base),expectedReverse=crossEntropy(q,p,base)-entropy(q,base);
  if(expectedReverse===Infinity)assert.equal(reverse,Infinity);else close(reverse,expectedReverse,1e-9);
  extremeCases++;
}
assert.equal(.5/Number.MIN_VALUE,Infinity);
assert.equal(kl([.5,.5],[0,1]),Infinity);
console.log(`Information numerical stability: ${extremeCases} positive-support/base cases avoid ratio overflow;true missing support stays infinite.`);
// A representable positive bin can have an unrepresentable half-mixture.
// The exact divergence stays finite; never invent missing mixture support.
assert.equal(Number.MIN_VALUE/2,0);
assert.equal(jsd([Number.MIN_VALUE,0,1],[0,Number.MIN_VALUE,1]),Number.MIN_VALUE);
let mixtureCases=0;
for(const tiny of [Number.MIN_VALUE,1e-320,1e-310,1e-200])for(const base of [2,Math.E,10]){
  const p=[tiny,0,1-tiny],q=[0,tiny,1-tiny];
  const expected=tiny*(Math.LN2/Math.log(base)),actual=jsd(p,q,base);
  assert(Number.isFinite(actual));
  assert(Math.abs(actual-expected)<=Math.max(Number.MIN_VALUE,expected*1e-11));
  assert.equal(jsd(p,q,base),jsd(q,p,base));assert.equal(jsd(p,p,base),0);
  mixtureCases++;
}
for(let a=0;a<=32;a++)for(let b=0;b<=32;b++){
  const p=[a/32,1-a/32],q=[b/32,1-b/32],m=p.map((v,i)=>(v+q[i])/2);
  const actual=jsd(p,q),expected=entropy(m)-(entropy(p)+entropy(q))/2;
  close(actual,expected);assert(Number.isFinite(actual)&&actual>=-1e-12&&actual<=1+1e-12);
  close(actual,jsd(q,p));mixtureCases++;
}
assert.throws(()=>jsd([1],[1],1));assert.throws(()=>jsd([1],[1],NaN));
for(const invalid of [[1,,0],[,1],[1,undefined,0],[NaN,1],[Infinity,0],[]]){
  assert.throws(()=>entropy(invalid),RangeError);
  assert.throws(()=>crossEntropy(invalid,invalid),RangeError);
  assert.throws(()=>kl(invalid,invalid),RangeError);
  assert.throws(()=>jsd(invalid,invalid),RangeError);
}
console.log(`Jensen–Shannon: ${mixtureCases} subnormal-support/base and independent entropy-identity cases pass;finite bounds,symmetry and exact identical-input zero preserved.`);
const informationNodes=n=>[n,...(n.childNodes||[]).flatMap(informationNodes)];
const renderedInformation=informationNodes(parseFragment(informationReader(s=>s)));
const informationAttr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
assert.equal(renderedInformation.filter(n=>n.tagName==='math').length,21);
assert.equal(renderedInformation.filter(n=>informationAttr(n,'class')==='inline-math').length,9);
const informationTex=renderedInformation.filter(n=>n.tagName==='annotation').map(n=>n.childNodes.map(c=>c.value||'').join(''));
for(const tex of [String.raw`-\sum_i p_i\log_2 p_i`,String.raw`L_{\mathrm{bits}}=\frac{L_{\mathrm{nats}}}{\ln2}`,String.raw`\log p_i-\log q_i`,String.raw`M=\frac{P+Q}{2}`,String.raw`\Delta_{Ab}=C(A+b)-C(A)`])assert(informationTex.includes(tex),tex);
assert(!informationReader(s=>s).includes('${inlineMath'));
for(const path of ['docs/math/probability/entropy.md','docs/math/probability/kullback-leibler-divergence.md','docs/math/probability/jensen-shannon-divergence.md','docs/ai/foundations/prediction-compression-and-entropy.md','docs/ai/foundations/compression-based-similarity-and-language-trees.md']){
  const original=await readFile(new URL('../../'+path,import.meta.url));
  const committed=execFileSync('git',['show','HEAD:'+path],{cwd:fileURLToPath(new URL('../../',import.meta.url))});
  assert(original.equals(committed),`Original changed or lacks verified Git recovery: ${path}`);
}
// Independent finite-block construction: verify the ceiling-code claim, not
// just the text or one plotted endpoint. Other valid prefix codes can be worse.
let codeCases=0;
for(let numerator=1;numerator<32;numerator++)for(let n=1;n<=6;n++){
  const p=numerator/32;
  let probabilities=[1];
  for(let i=0;i<n;i++)probabilities=probabilities.flatMap(v=>[v*p,v*(1-p)]);
  const lengths=probabilities.map(v=>Math.ceil(-Math.log2(v)));
  const kraft=lengths.reduce((s,l)=>s+2**(-l),0);
  const expected=probabilities.reduce((s,v,i)=>s+v*lengths[i],0);
  const joint=-probabilities.reduce((s,v)=>s+v*Math.log2(v),0);
  close(joint,n*entropy([p,1-p]));
  assert(kraft<=1+1e-12);
  assert(expected>=joint-1e-12&&expected<joint+1);
  assert(expected/n<entropy([p,1-p])+1/n);
  codeCases++;
}
assert(2*2**(-10)<=1&&10>entropy([.5,.5])+1,'A valid inefficient prefix code need not meet the achievable upper bound');
close(jsd([1,0],[0,1]),1);close(jsd([.2,.8],[.2,.8]),0);
assert(informationReader(s=>s).includes('extra compressed bytes per input byte'));
assert(informationReader(s=>s).includes('not a guarantee for every prefix code'));
console.log(`Information editorial: ${codeCases} finite-block ceiling-code/Kraft/entropy cases,inefficient-code counterexample and source-label endpoints pass.`);
const r=regressionFrame(10);close(r.mean,2);close(r.mseMean,16);close(r.mseMedian,20);close(r.maeMean,3.2);close(r.maeMedian,2);
for(let a=0;a<=12;a++){const f=regressionFrame(a);assert(f.mseMean<=f.mseMedian);assert(f.maeMedian<=f.maeMean+1e-10);}
// Differentiate through sigmoid, not directly in probability space.
for(const q of [.001,.01,.1,.5,.99]){const z=Math.log(q/(1-q)),eps=1e-5,sig=x=>1/(1+Math.exp(-x));const f=binaryScores(q);close((binaryScores(sig(z+eps)).ce-binaryScores(sig(z-eps)).ce)/(2*eps),f.ceGradient,1e-7);close((binaryScores(sig(z+eps)).brier-binaryScores(sig(z-eps)).brier)/(2*eps),f.brierGradient,1e-7);}
const p=[.2,.3,.5],q=[.5,.1,.4];close(brierRisk(p,q),1-p.reduce((s,x)=>s+x*x,0)+q.reduce((s,x,i)=>s+(x-p[i])**2,0));
close(stableBce(1000,0),1000);close(stableBce(-1000,1),1000);close(stableBce(0,.3),Math.log(2));assert.throws(()=>stableBce(0,2));
assert.deepEqual(matmul(matrixA,matrixB),[[12,1],[9,-2]]);assert.deepEqual(contractExample().partial0,[[1,2],[2,0]]);assert.deepEqual(contractExample().partial1,[[11,-1],[7,-2]]);assert.deepEqual(contractExample().result,matmul(matrixA,matrixB));assert.throws(()=>matmul([[1]],[[1,2],[3,4]]));
for(let p=1;p<=8;p++)for(let m=1;m<=8;m++){const f=pipelineFrame(p,m,0);close(f.utilization+f.idleFraction,1);assert.equal(f.cells.flat().filter(c=>c.batch!==null).length,p*m);for(let t=0;t<f.clocks;t++){const a=pipelineFrame(p,m,t).cells.flat().filter(c=>c.active);assert(a.length<=Math.min(p,m));assert(new Set(a.map(c=>c.batch)).size===a.length);}}
close(pipelineFrame(4,6,8).utilization,2/3);assert.throws(()=>pipelineFrame(0,1,0));
close(adamStateBytes(1000,4,0).total,16000);close(adamStateBytes(1000,4,1).total,7000);close(adamStateBytes(1000,4,2).total,5500);close(adamStateBytes(1000,4,3).total,4000);
const catalog=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8'));
const notes=[...readerMetas,...catalog.notes.filter(n=>!readerAliases.includes(n.slug))];
for(const [meta,render,sections] of [[informationMeta,informationReader,informationSections],[lossesMeta,lossesReader,lossSections],[parallelismMeta,parallelismReader,parallelSections]]){
  const html=render(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const [id] of sections)assert(ids.includes(id),id);
  for(const slug of [...html.matchAll(/slug=([^"#]+)/g)].map(m=>m[1]))assert(notes.some(n=>n.slug===slug),slug);
  assert(renderDenseReader(meta.slug,s=>s));assert(meta.prototype===false&&meta.visibility==='public');assert(meta.learningGoals.length>=3);
}
for(const [query,meta] of [['Kraft inequality',informationMeta],['Fenchel Young',lossesMeta],['ZeRO',parallelismMeta],['context parallelism',parallelismMeta]])assert(rank(notes,query).some(r=>r.note===meta),query);
// Only unresolved originals stay in the local inventory; reconciled Losses sources are excluded.
for(const s of ['math/probability/entropy'])assert(notes.some(n=>n.slug===s));
assert(readerAliases.includes('systems/parallel-computing/data-parallelism'));
assert(!notes.some(n=>n.slug==='systems/parallel-computing/data-parallelism'));
assert(readerAliases.includes('ai/training/losses/cross-entropy-loss'));
assert(!notes.some(n=>n.slug==='ai/training/losses/cross-entropy-loss'));
// Component lifecycle harness: reduced motion, manual state, pause, offscreen, disposal.
const keys=['matchMedia','IntersectionObserver','requestAnimationFrame','cancelAnimationFrame','performance'],saved=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
try{
  const node=()=>({events:{},addEventListener(t,fn){this.events[t]=fn;},textContent:'',hidden:false});
  const slider={...node(),value:'0',min:'0',max:'100'},play=node(),reset=node();let disconnected=0,removed=0,callback,frameCallback,frameCount=0,time=0;const listeners={};
  const media={matches:true,addEventListener(t,fn){listeners[t]=fn;},removeEventListener(){removed++;}};
  globalThis.matchMedia=()=>media;globalThis.IntersectionObserver=class{constructor(fn){callback=fn;}observe(){}disconnect(){disconnected++;}};
  globalThis.requestAnimationFrame=fn=>{frameCallback=fn;return ++frameCount;};globalThis.cancelAnimationFrame=()=>{};globalThis.performance={now:()=>time};
  const article=node(),lab={querySelector:s=>s.startsWith('input')?slider:s==='[data-play]'?play:reset};let actual=-1;
  rangePlayback(article,lab,v=>{actual=v;},1000);assert(play.hidden);play.events.click();assert.equal(frameCount,0);slider.value='50';slider.events.input();assert.equal(actual,50);
  media.matches=false;listeners.change();assert(!play.hidden);play.events.click();frameCallback(500);assert.equal(actual,100);assert.equal(play.textContent,'Play');reset.events.click();assert.equal(actual,0);
  play.events.click();callback([{isIntersecting:false}]);assert.equal(play.textContent,'Play');article.events['atlas-reader-dispose']();assert.equal(disconnected,1);assert.equal(removed,1);const old=frameCount;play.events.click();assert.equal(frameCount,old);
  // Multi-parameter scenes must animate the selected range, not the first range.
  const chosen={...node(),value:'5',min:'0',max:'10'},first={...node(),value:'99',min:'0',max:'100'},multiPlay=node(),multiReset=node(),multiArticle=node(),multiLab={querySelector:s=>s.startsWith('input')?first:s==='[data-play]'?multiPlay:multiReset};let chosenValue,observed;
  globalThis.IntersectionObserver=class{constructor(fn){callback=fn;}observe(el){observed=el;}disconnect(){disconnected++;}};
  rangePlayback(multiArticle,multiLab,v=>{chosenValue=v;},1000,chosen);assert.equal(observed,multiLab);assert.equal(chosenValue,5);chosen.value='7';chosen.events.input();assert.equal(chosenValue,7);assert.equal(first.value,'99');multiReset.events.click();assert.equal(chosenValue,0);assert.equal(first.value,'99');multiArticle.events['atlas-reader-dispose']();assert.equal(disconnected,2);
}finally{for(const k of keys){if(saved[k]===undefined)delete globalThis[k];else globalThis[k]=saved[k];}}
console.log('Information, losses and parallelism: numeric endpoints, gradients, state accounting, pipeline conservation, anchors, routes, search and animation lifecycle pass.');
