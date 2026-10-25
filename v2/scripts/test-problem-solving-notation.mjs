import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {problemSolvingReader} from '../site/readers/problem-solving.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const html=assertGeneratedMarkup(problemSolvingReader(()=>''));
const nodes=[];
function visit(n){nodes.push(n);for(const c of n.childNodes||[])visit(c);}
visit(parseFragment(html));
const text=n=>(n.value||'')+(n.childNodes||[]).map(text).join('');
const annotations=nodes.filter(n=>n.tagName==='annotation').map(text);
const expected=[String.raw`\binom nk=\frac{n!}{k!(n-k)!}`,String.raw`\frac{n!}{(n-k)!}`,String.raw`1-\left(\frac56\right)^{10}`,String.raw`P(B)>0`,String.raw`P(A\mid B)=\frac{P(A\cap B)}{P(B)}`,String.raw`\mathbb E[X]=\sum_x xP(X=x)`,String.raw`\mathbb E[I_i]=P(\text{event }i)`,String.raw`n\cdot\frac1n=1`,String.raw`\frac1n`,String.raw`\mathbb E[\min(T,m)]=\sum_{j=0}^{m-1}P(T>j)`,String.raw`\mu=6\cdot\frac{10}{60}=1`,String.raw`P(\text{at least one call})=1-e^{-1}`,String.raw`\mathbb E[T_k]=\frac{k}{\lambda}`,String.raw`P(T_k\le t)=P(N(t)\ge k)`,String.raw`P(T_1>s+t\mid T_1>s)=P(T_1>t)`,String.raw`\frac{\ln2}{\lambda}`,String.raw`4\cdot\frac14=1`,String.raw`M_t=\frac1{t+1}`,String.raw`t=\frac{D}{v_1+v_2}`,String.raw`\frac12+\frac13=\frac56`,String.raw`\frac65`,String.raw`q^2=0.01`];
for(const a of expected)assert(annotations.includes(a),a);
assert.equal(nodes.filter(n=>n.tagName==='math').length,33);
assert.equal(nodes.filter(n=>n.attrs?.some(a=>a.name==='class'&&a.value==='inline-math')).length,22);
const prose=text(parseFragment(html));
for(const condition of ['nonnegative integer completion time','nonnegative integer cutoff','for nonnegative s and t','finite absolute expectations','single observation does not prove that model','rates add without interference','real lower bound alone are insufficient'])assert(prose.includes(condition),condition);
assert(!prose.includes('inlineMath(String.raw'));
// Independently enumerate a finite law, including completion at zero and m=0.
let tails=0;
for(let a=0;a<=5;a++)for(let b=0;b<=5;b++)for(let m=0;m<=7;m++){
  const direct=(Math.min(a,m)+Math.min(b,m))/2;
  let sum=0;for(let j=0;j<m;j++)sum+=((a>j)+(b>j))/2;
  assert.equal(sum,direct);tails++;
}
// Exhaustive permutations test dependent-indicator expectation; empty is separate.
function perms(a){if(!a.length)return [[]];return a.flatMap((x,i)=>perms(a.filter((_,j)=>j!==i)).map(p=>[x,...p]));}
for(let n=0;n<=7;n++){const p=perms(Array.from({length:n},(_,i)=>i));const fixed=p.reduce((s,a)=>s+a.filter((x,i)=>x===i).length,0);assert.equal(fixed/p.length,n?1:0);}
let memoryless=0;
for(const rate of [.1,1,6,12])for(let s=0;s<=10;s++)for(let t=0;t<=10;t++){
  const conditional=Math.exp(-rate*(s+t))/Math.exp(-rate*s);
  assert(Math.abs(conditional-Math.exp(-rate*t))<1e-12);memoryless++;
}
assert(Math.abs((1/2+1/3)*(6/5)-1)<1e-12);
assert(Math.abs(.1*.1-.01)<1e-12);
console.log(`Problem-solving notation:22 parsed inline formulas,${tails} finite tail identities,dependent permutation indicators and${memoryless} exponential conditional cases pass. No primary/native certification implied.`);
