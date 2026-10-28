import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {precisionFormats,roundPrecision,precisionCliffFrame,nearMatchGradient} from '../site/readers/softmax-precision-model.js';
import {precisionCliffBody} from '../site/readers/softmax-precision.js';
import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
import {parseFragment} from 'parse5';
let states=0;
for(const format of Object.keys(precisionFormats)){
  const unit=2**-precisionFormats[format].bits;
  assert.equal(roundPrecision(1+unit/2,format),1,'Half-ULP must tie toward the even value');
  assert.equal(roundPrecision(1+unit,format),1+unit);
  const cliff=(precisionFormats[format].bits+1)*Math.LN2;
  assert(precisionCliffFrame(cliff-1,format).standard[0]<0);
  const collapsed=precisionCliffFrame(cliff+1,format);
  assert.equal(collapsed.standard[0],0);assert(collapsed.standard[1]>0);
  assert(collapsed.fixed[0]<0);assert.equal(collapsed.fixedSum,0);
  for(let tick=0;tick<=192;tick++){
    const margin=tick/4,f=precisionCliffFrame(margin,format),residual=Math.exp(-margin),reference=-residual/(1+residual);
    assert(Math.abs(f.fixed[0]/reference-1)<.012,format+' relative gradient error');
    assert.equal(f.fixedSum,0);assert(f.fixedLoss>0);assert(f.standardLoss>=0);
    if(f.denominator===1){assert.equal(f.standard[0],0);assert(f.standardSum>0);}
    for(let phase=0;phase<4;phase++){assertGeneratedMarkup(precisionCliffBody(margin,format,phase),'precision-cliff');states++;}
  }
}
assert.equal(states,2316);assertGeneratedMarkupCount('precision-cliff',states);
for(const [m,f]of [[-1,'fp32'],[49,'fp32'],[NaN,'fp32'],[18,'fp16']])assert.throws(()=>precisionCliffFrame(m,f),RangeError);
assert.throws(()=>precisionCliffBody(18,'fp32',4),RangeError);
assert.throws(()=>roundPrecision(Infinity,'fp32'),RangeError);
const target=[2,1,0];
assert.deepEqual(nearMatchGradient(target,target).gradient,[0,0,0]);
const cases=[];
for(const epsilon of [2**-10,2**-20,2**-30,2**-40,2**-48])for(const teacher of [[2,1,0],[0,0,0],[-3,2,1,0]]){
  const student=teacher.map((z,i)=>z+(i%2?-epsilon:epsilon));cases.push({student,teacher});
}
const references=JSON.parse(execFileSync('python3',['-c',String.raw`import json,sys,decimal
decimal.getcontext().prec=90
D=decimal.Decimal
def softmax(xs):
    xs=[D.from_float(x) for x in xs]
    m=max(xs); weights=[(x-m).exp() for x in xs]; total=sum(weights)
    return [x/total for x in weights]
print(json.dumps([[float(a-b) for a,b in zip(softmax(c['student']),softmax(c['teacher']))] for c in json.load(sys.stdin)]))`],{input:JSON.stringify(cases),encoding:'utf8'}));
for(const [i,c]of cases.entries()){
  const g=nearMatchGradient(c.student,c.teacher).gradient;
  for(const [j,x]of g.entries()){const ref=references[i][j];assert(Math.abs(x-ref)<=Math.max(1e-32,Math.abs(ref)*2e-6),'Decimal near-match gradient');}
  assert(Math.abs(g.reduce((a,b)=>a+b,0))<1e-18);
}
assert.throws(()=>nearMatchGradient([1],[1]),RangeError);
assert.throws(()=>nearMatchGradient([2,0],[0,0]),RangeError);
const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)];
const content=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(content).join('');
const gradientFigure=walk(parseFragment(renderDenseReader('training/objectives',s=>s))).find(n=>n.tagName==='figure'&&content(n).includes('These are exact-arithmetic identities.'));
assert(gradientFigure);assert.equal(walk(gradientFigure).filter(n=>n.tagName==='mtr').length,3,'Target, non-target and zero-sum identities need distinct equation rows');
for(const [slug,id]of [['training/objectives','softmax-precision'],['post-training/distillation','softmax-cancellation'],['training/numerics','softmax-resolution'],['training/stability','softmax-slingshot']]){
  const html=renderDenseReader(slug,s=>'/atlas/'+s),meta=readerMetas.find(m=>m.slug===slug);
  assert(html.includes(`id="${id}"`));assert(html.includes(`href="#${id}"`));assert.equal(meta.updated,slug==='training/stability'?'2026-10-28':'2026-10-25');
  assertGeneratedMarkup(html,'softmax-topic-'+slug);
  assert(meta.searchText.toLowerCase().includes(slug==='post-training/distillation'?'cancellation':slug==='training/numerics'?'resolution':slug==='training/stability'?'slingshot':'precision cliff'));
}
console.log(`Softmax precision: ${states} guarded scene states,three rounding cliffs,15 Decimal-reference near-match gradients,equality/zero-sum/domain checks and four topic integrations pass. Not framework/GPU performance certification.`);
