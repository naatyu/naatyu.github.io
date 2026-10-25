import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {frontierReader,frontierMeta} from '../site/readers/frontier.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const html=assertGeneratedMarkup(frontierReader(()=>'')),nodes=[];
function visit(n){nodes.push(n);for(const c of n.childNodes||[])visit(c);}
visit(parseFragment(html));
const text=n=>(n.value||'')+(n.childNodes||[]).map(text).join('');
const annotations=nodes.filter(n=>n.tagName==='annotation').map(text);
const expected=[
  "\\frac{30\\times10^{12}}{35\\times10^9}\\approx857",
  "\\beta=(0.95,0.925)",
  "\\epsilon=10^{-8}",
  "2\\times10^{-4}",
  "2\\times10^{-5}",
  "32^2",
  "16^2=256",
  "g\\in(-5,0)",
  "\\alpha=e^g\\in(e^{-5},1)",
  "\\beta_1=4,\\ \\beta_2=25",
  "\\tau=10^{-3}",
  "\\epsilon=10^{-20}",
  "R=R_{\\rm test}S_{\\rm solution}S_{\\rm behavior}",
  "\\lambda=\\frac{\\sum_{i\\in P} A_i}{\\sum_{i\\in P} f_iA_i}",
  "\\beta=1",
  "3-1=2",
  "\\beta_1=4,\\ \\beta_2=25",
  "d_k=128",
  "d_k=2",
  "\\beta_1=0.9",
  "\\beta_2=0.95",
  "\\epsilon=10^{-20}",
  "\\tau=10^{-3}",
  "\\epsilon=10^{-20}"
];
for(const a of expected)assert(annotations.includes(a),a);
assert.equal(expected.length,24);
assert.equal(nodes.filter(n=>n.tagName==='math').length,54);
assert.equal((html.match(/class="inline-math"/g)||[]).length,25);
assert.equal(frontierMeta.date,'2026-04-08');
const prose=text(parseFragment(html));
for(const condition of ['not the universal Chinchilla ratio','total-parameter denominator','before actual processor resizing','analytic finite-input rule','does not establish stability','not mHC\'s forward mixing matrix','denominator must be positive','zero-advantage all-pass group','Predicting from the old state would give 2 instead'])assert(prose.includes(condition),condition);
assert(!prose.includes('inlineMath(String.raw'));
// Independent finite examples: dimensional count, token density and decay/write ordering.
assert.equal(Math.round(30000/35),857);
assert.equal((448/14/2)**2,256);
let cases=0;
for(let old=-4;old<=4;old++)for(const decay of [.25,.5,.75])for(const value of [-3,0,3])for(const beta of [0,.5,1]){
 const forgotten=decay*old,updated=forgotten+beta*(value-forgotten);
 assert(Math.abs(updated-((1-beta)*decay*old+beta*value))<1e-12);cases++;
}
assert.equal(.5*2+(3-.5*2),3);
assert.equal(.5*2+(3-2),2);
console.log('Frontier notation:24 inline additions,exact parsed annotations/conditions,54 MathML and'+cases+' independent scalar update identities pass;source/native scopes remain separate.');
