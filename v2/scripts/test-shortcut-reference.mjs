import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {shortcutTarget} from '../site/readers/diffusion-model.js';
import {diffusionReader,diffusionSections} from '../site/readers/diffusion.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const near=(a,b)=>assert(Math.abs(a-b)<1e-12*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
let cases=0;
// Independent expansion for the nonautonomous affine field a*x+b*t+c.
for(const a of [-2,0,3])for(const b of [-3,0,2])for(const c of [-1,1])
for(const x of [-2,0,4])for(let level=0;level<=6;level++){
  const d=2**level/128,t=(1-2*d)/2,trace=[];
  const result=shortcutTarget((state,time,q)=>{trace.push([state,time,q]);return a*state+b*time+c;},x,t,d);
  const expected=a*x+b*t+c+d*(a*a*x+a*b*t+a*c+b)/2;
  near(result.target,expected);near(result.mid,x+d*(a*x+b*t+c));
  near(result.studentStep,2*d);
  assert.deepEqual(trace,[[x,t,d===1/128?0:d],[result.mid,t+d,d===1/128?0:d]]);
  cases++;
}
const worked=shortcutTarget((x,t)=>x+t,2,.25,.125);
assert.deepEqual(worked,{first:2.25,mid:2.28125,second:2.65625,target:2.453125,studentStep:.25});
assert.notEqual(worked.target,(worked.first+worked.mid+.25)/2);
near((1+2+2*.25)/(1+2)-1,1/6);
for(const args of [[null,0,0,.5],[()=>0,NaN,0,.5],[()=>0,0,-.1,.5],[()=>0,0,.01,.5],[()=>0,0,0,.01],[()=>0,0,0,1],[()=>NaN,0,0,.5],[()=>Infinity,0,0,.5],[()=>Number.MAX_VALUE,Number.MAX_VALUE,0,.5]])assert.throws(()=>shortcutTarget(...args));
const nodes=[];function walk(n){nodes.push(n);for(const c of n.childNodes||[])walk(c);}
walk(parseFragment(assertGeneratedMarkup(diffusionReader(()=>''),'Shortcut reference')));
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const text=n=>(n.value||'')+(n.childNodes||[]).map(text).join('');
const descendants=(n,tag)=>{const out=[];function visit(x){if(x.tagName===tag)out.push(x);for(const c of x.childNodes||[])visit(c);}visit(n);return out;};
const section=id=>{const n=nodes.find(n=>attr(n,'id')===id);assert(n);assert(diffusionSections.some(([s])=>s===id));return n;};
const training=section('shortcut-training'),evidence=section('shortcut-evidence');
for(const phrase of ['75% empirical examples and 25% bootstrap','integration distance remains d','stop target gradients explicitly','0.999','16.7%','chosen before training'])assert(text(training).includes(phrase),phrase);
assert(descendants(training,'annotation').map(text).join(' ').includes('s_{\\mathrm{EMA}}(x\',t+d,q)'));
assert(descendants(training,'code').some(n=>text(n)===shortcutTarget.toString()));
const rows=n=>descendants(n,'tr').slice(1).map(r=>descendants(r,'td').map(text));
assert.deepEqual(rows(evidence),[['Flow matching','17.3','108.2*','324.8*'],['Shortcut','15.5','28.3','40.3'],['Progressive distillation','201.9*','142.5*','35.6']]);
for(const phrase of ['not intended to support','greater compute','800k updates','50k samples','not pixel identity','not evidence of 128× end-to-end speedup'])assert(text(evidence).includes(phrase),phrase);
console.log(`Shortcut: ${cases} independent affine/time-advance/conditioning cases, finite-domain guards and parsed recipe/evidence checks pass; not an autograd or image-model replication.`);
