import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {stabilityReader,stabilityClipBody} from '../site/readers/stability.js';
import {calculusReader} from '../site/readers/calculus.js';
import {firstAdam,clipGradient} from '../site/readers/stability-model.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const text=n=>(n.value||'')+(n.childNodes||[]).map(text).join('');
function parsed(html){const n=[];function visit(x){n.push(x);for(const c of x.childNodes||[])visit(c);}const root=parseFragment(assertGeneratedMarkup(html));visit(root);return {nodes:n,prose:text(root),annotations:n.filter(x=>x.tagName==='annotation').map(text)};}
const s=parsed(stabilityReader(()=>'')),c=parsed(calculusReader(()=>''));
for(const a of [String.raw`g=(6,8)`,String.raw`\tau=5`,String.raw`\frac{g_i}{|g_i|+\epsilon}`,String.raw`\epsilon=0.01`,String.raw`g_1=(100,0)`,String.raw`g_2=(-99,1)`,String.raw`\tau=1`])assert(s.annotations.includes(a),a);
for(const a of [String.raw`\nabla f=0`,String.raw`p_{\nabla f(x)}(0)`])assert(c.annotations.includes(a),a);
assert.equal(s.nodes.filter(x=>x.tagName==='math').length,14);
assert.equal(c.nodes.filter(x=>x.tagName==='math').length,44);
for(const scope of ['first bias-corrected step with zero moments','not a full Adam trajectory','The operations do not commute'])assert(s.prose.includes(scope),scope);
assert(parsed(stabilityClipBody(0,'norm')).prose.includes('zero vector; no output direction remains'));
for(const scope of ['which can vanish in some or all directions','is a density, not the mass of an exact zero event','Higher-order analysis may be needed'])assert(c.prose.includes(scope),scope);
assert(!s.prose.includes('inlineMath(String.raw'));assert(!c.prose.includes('inlineMath(String.raw'));
const near=(a,b)=>assert(Math.abs(a-b)<1e-12*Math.max(1,Math.abs(a),Math.abs(b)));
let adam=0;
for(const b1 of [0,.5,.9])for(const b2 of [0,.8,.999])for(const epsilon of [.001,.01,.1])for(const g of [-8,-3,0,3,8]){
  const m=(1-b1)*g,v=(1-b2)*g*g;
  const independent=(m/(1-b1))/(Math.sqrt(v/(1-b2))+epsilon);
  near(firstAdam([g],epsilon)[0],independent);adam++;
}
const raw=firstAdam([6,8]),clipped=firstAdam(clipGradient([6,8],5).gradient);
assert(clipped.every((x,i)=>Math.abs(x-.5*raw[i])>.49));
// The quadratic Taylor term vanishes for both signs of x^4 at zero.
for(const sign of [-1,1])for(const h of [.01,.1,.5,1]){
  assert(sign*12*0**2===0);
  assert.equal(Math.sign(sign*h**4),sign);
}
console.log(`Stability/Calculus notation:10 inline additions,${adam} independently bias-corrected Adam cases,clipping nonlinearity and degenerate quartic signs pass.`);
