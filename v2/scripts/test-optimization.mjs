import assert from 'node:assert/strict';
import './test-optimization-core-closure.mjs';
import {readFile} from 'node:fs/promises';
import {ema,emaInterpretation,gradientSequence,adamStep,noiseModel,nsFrames,nsCoefficients,signRms,normClip,schedule,decayHistory} from '../prototypes/readers/optimization-model.js';
import {optimizationReader,optimizationEmaBody,optimizationMeta,optimizationSections} from '../prototypes/readers/optimization.js';
import {readerMetas,renderDenseReader} from '../prototypes/readers/index.js';
import {rank} from '../prototypes/search.js';
const near=(a,b,e=1e-10)=>assert(Math.abs(a-b)<e,`${a} != ${b}`);
// Independent finite weighted sums verify the changing-gradient animation,
// rather than only testing the recurrence against itself.
for(const beta of [0,.5,.9,.99])for(const f of ema(gradientSequence,beta)){
  const expected=gradientSequence.slice(0,f.step).reduce((sum,g,j)=>sum+(1-beta)*beta**(f.step-1-j)*g,0);
  near(f.raw,expected);
  if(f.step)near(f.corrected,expected/(1-beta**f.step));
  const caption=emaInterpretation(f,beta),body=optimizationEmaBody(f.step,beta);
  assert(body.includes(caption));assert(!body.includes('${'));assert(!body.includes('katex-error'));
  assert.equal((body.match(/<math /g)||[]).length,f.step?3:1);
  const delayed=f.step>0&&f.input!==0&&f.raw!==0&&Math.sign(f.raw)!==Math.sign(f.input);
  assert.equal(caption.includes('delay its reversal'),delayed);
  if(f.step){
    for(const tex of [`g_t=${f.input}`,`m_t=${f.raw.toFixed(4)}`,String.raw`\widehat m_t=${f.corrected.toFixed(4)}`])assert(body.includes(`<annotation encoding="application/x-tex">${tex}</annotation>`),tex);
  }else assert(body.includes('corrected estimate is not defined'));
}
assert(emaInterpretation(ema(gradientSequence,.5)[6],.5).includes('current gradient direction'));
assert(emaInterpretation(ema(gradientSequence,.9)[6],.9).includes('delay its reversal'));
assert(emaInterpretation(ema(gradientSequence,.9)[12],.9).includes('retains an earlier direction'));
assert(emaInterpretation(ema([1,-.5],.5)[2],.5).includes('cancel'));
assert(emaInterpretation(ema([0],.9)[1],.9).includes('both zero'));
assert(emaInterpretation(ema([-1],0)[1],0).includes('No memory'));
for(const beta of [0,.1,.5,.9,.95,.99])for(let n=1;n<=50;n++){const fs=ema(Array(n).fill(2),beta);for(let i=1;i<=n;i++){near(fs[i].raw,2*(1-beta**i));near(fs[i].corrected,2);}}
for(let g=-20;g<=20;g++){let m=0,v=0,theta=10;for(let t=1;t<=20;t++){const f=adamStep(theta,g,m,v,t);near(f.mhat,g);near(f.vhat,g*g,1e-8);near(f.adaptive,.01*g/(Math.abs(g)+1e-8));near(f.shrink,.001*theta);near(f.theta,theta-f.adaptive-f.shrink);({m,v,theta}=f);}}
for(let p=0;p<=8;p++){const b=2**p,constant=noiseModel(b),sqrt=noiseModel(b,'sqrt'),linear=noiseModel(b,'linear');near(constant.snr,b/16);near(sqrt.snr,constant.snr);near(linear.snr,constant.snr);near(sqrt.updateVariance,.16);near(linear.dataDrift,-25.6);near(linear.dataVariance,40.96);}
for(const mode of Object.keys(nsCoefficients))for(const values of [[4,.4],[1,1],[4,0],[0,0],[1,.001]]){const fs=nsFrames(values,mode,20),[a,b,c]=nsCoefficients[mode];assert.equal(fs.length,21);assert(fs.every(f=>f.values.every(Number.isFinite)));for(let k=1;k<fs.length;k++)fs[k].values.forEach((s,i)=>near(s,a*fs[k-1].values[i]+b*fs[k-1].values[i]**3+c*fs[k-1].values[i]**5));if(values[1]===0)assert(fs.every(f=>f.values[1]===0));if(mode==='taylor'&&values[1]!==0){assert(fs.at(-1).values.every(s=>Math.abs(s-1)<1e-6));}}
assert(nsFrames([1,1],'fast',5).at(-1).values.some(x=>Math.abs(x-1)>.001));
// Missing array elements must not become an absent step or an identity result.
const missingInputs=[Array(2),[1,,2],[undefined],[NaN],[Infinity],[],null,{}];
for(const xs of missingInputs)for(const fn of [()=>ema(xs,.9),()=>nsFrames(xs),()=>normClip(xs,1),()=>decayHistory(xs,.1)])assert.throws(fn,RangeError);
for(const name of ['constructor','toString','__proto__'])assert.throws(()=>nsFrames([1],name),RangeError);
// Equal singular values normalize to 1/sqrt(n), independent of input scale.
// This checks extreme scales against a closed form, not the same normalization.
let extremeNormalizationCases=0;
for(const n of [1,2,3,8])for(const magnitude of [Number.MIN_VALUE,1e-300,1,1e300,Number.MAX_VALUE])for(const mode of ['taylor','fast']){
  const frames=nsFrames(Array(n).fill(magnitude),mode,8);
  for(const s of frames[0].values)near(s,1/Math.sqrt(n));
  assert(frames.every(f=>f.values.every(Number.isFinite)));
  near(frames[0].values.reduce((sum,s)=>sum+s*s,0),1);
  extremeNormalizationCases++;
}
for(const magnitude of [1e100,1e300,Number.MAX_VALUE])for(const threshold of [0,1,1e100]){
  const clipped=normClip([magnitude,-magnitude],threshold);
  assert(clipped.values.every(Number.isFinite));
  for(const [i,v] of clipped.values.entries())near(v/(threshold||1),(i?-1:1)/Math.sqrt(2)*(threshold?1:0));
  if(threshold)assert(clipped.values[0]>0&&clipped.values[1]<0);
}
assert.equal(normClip([Number.MAX_VALUE,-Number.MAX_VALUE],1).norm,Infinity); // true norm exceeds representable range
assert.deepEqual(normClip([Number.MIN_VALUE],Number.MIN_VALUE).values,[Number.MIN_VALUE]);
assert.deepEqual(nsFrames([0,0],'taylor',0)[0].values,[0,0]);
for(let n=1;n<=20;n++)for(let m=1;m<=20;m++)near(signRms(n,m),1/Math.sqrt(Math.max(n,m)));
for(let t=0;t<=10;t++){const f=normClip([3,4],t);assert(Math.hypot(...f.values)<=t+1e-10);near(f.values[0]*4,f.values[1]*3);near(f.scale,Math.min(1,t/5));}assert.deepEqual(normClip([0,0],1).values,[0,0]);
for(const warmup of [0,5,15])for(const start of [60,80,90])for(const kind of ['wsd','cosine'])for(let t=0;t<=100;t++){const f=schedule(t,{warmup,start,kind});assert(f>=0&&f<=1);if(t===100)near(f,.1);if(t===warmup)near(f,1);if(kind==='wsd'&&t>=warmup&&t<=start)near(f,1);}
near(decayHistory([.1,.1,.1],.2),.98**3);near(decayHistory([0,.1,.2],0),1);
for(const fn of [()=>ema([1],1),()=>adamStep(0,1,0,0,0),()=>noiseModel(0),()=>nsFrames([-1]),()=>signRms(1,2,3),()=>normClip([1],-1),()=>schedule(101),()=>decayHistory([1],1)])assert.throws(fn);
const html=optimizationReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const [id]of optimizationSections)assert(ids.includes(id));assert.equal(optimizationMeta.date,'2026-04-10');assert(optimizationMeta.prototype);assert(!html.includes('undefined'));
const catalog=JSON.parse(await readFile(new URL('../prototypes/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes];for(const [,s,anchor]of html.matchAll(/href="directions\.html\?slug=([^"#]+)(?:#([^"]+))?"/g)){assert(notes.some(n=>n.slug===s),s);if(anchor)assert(renderDenseReader(s,s=>'directions.html?slug='+s)?.includes(`id="${anchor}"`));}for(const q of ['AdamW','Muon','EMA','WSD','learning rate','Newton Schulz'])assert(rank(notes,q).some(r=>r.note===optimizationMeta),q);
console.log(`Optimization: 52 rendered EMA states,300 EMA horizons,820 corrected Adam steps,fixed-data noise identities,10 polynomial traces,${extremeNormalizationCases} extreme normalization cases,32 incomplete-input rejections,400 matrix RMS cases,clipping direction,1,818 schedule points,decay,domains,routes and search pass.`);
