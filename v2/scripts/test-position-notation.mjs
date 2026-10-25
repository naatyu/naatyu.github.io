import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {positionReader} from '../site/readers/position.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const html=assertGeneratedMarkup(positionReader(s=>s),'Position notation');
const annotations=[],tables=[],parts=[];
const text=n=>(n.nodeName==='#text'?n.value:'')+(n.childNodes||[]).map(text).join('');
function walk(n){if(n.tagName==='annotation')annotations.push(text(n));if(n.tagName==='table')tables.push(n);if(n.nodeName==='#text')parts.push(n.value);for(const c of n.childNodes||[])walk(c);}walk(parseFragment(html));
assert.equal((html.match(/<math /g)||[]).length,42);
for(const tex of ["i>0","\\omega_0=1","m\\omega_i","\\dfrac{m}{s}\\omega_i","s=\\dfrac{L_{\\mathrm{target}}}{L_{\\mathrm{train}}}","m\\,b_{\\mathrm{new}}^{-2i/d}","\\dfrac{QK^\\top}{\\sqrt{d_h}}","\\Delta=t-s","a=s-t\\ge0","0","I","-\\lambda I","e^{-\\lambda a}I","\\begin{bmatrix}0&-\\omega\\\\\\omega&0\\end{bmatrix}","R(\\omega a)","-\\lambda I+\\begin{bmatrix}0&-\\omega\\\\\\omega&0\\end{bmatrix}","e^{-\\lambda a}R(\\omega a)","N=\\begin{bmatrix}0&1\\\\0&0\\end{bmatrix},\\quad N^2=0","I+aN=\\begin{bmatrix}1&a\\\\0&1\\end{bmatrix}","[x,v]\\mapsto[x+av,v]","u\\pm\\mathrm{i}\\omega","e^{ua}"])assert(annotations.includes(tex),tex);
for(const phrase of ['not a fundamental constant or a maximum context length','not the maximum uniquely represented token index','not an implementation specification','Singular transformations','query minus key','key minus query','Pure imaginary eigenvalues alone do not guarantee','not a reported winning architecture','not all imaginable positional encodings'])assert(parts.join(' ').includes(phrase),phrase);
const table=tables.find(n=>text(n).includes('Closed-form blocks under an age convention'));assert(table);assert(table.attrs.some(a=>a.name==='style'&&a.value==='min-width:640px'));
const cells=[];function collect(n){if(n.tagName==='td')cells.push(n);for(const c of n.childNodes||[])collect(c);}collect(table);assert.equal(cells.length,15);
assert.equal((html.match(/class="inline-math"/g)||[]).length,27);
// Independent nilpotent product and sign-convention checks, not kernel benchmarks.
const mul=(a,b)=>a.map(row=>b[0].map((_,j)=>row.reduce((s,x,k)=>s+x*b[k][j],0)));
const N=[[0,1],[0,0]];assert.deepEqual(mul(N,N),[[0,0],[0,0]]);
for(let a=-20;a<=20;a++)for(let b=-5;b<=5;b++){const A=[[1,a],[0,1]],B=[[1,b],[0,1]];assert.deepEqual(mul(A,B),[[1,a+b],[0,1]]);}
let signCases=0;for(let query=0;query<=10;query++)for(let key=0;key<=query;key++)for(const lambda of [.1,.5,1]){const age=query-key,delta=key-query;assert(age===-delta);assert.equal(Math.exp(-lambda*age),Math.exp(lambda*delta));assert(Math.exp(-lambda*age)<=1);signCases++;}
console.log(`Position notation:22inline additions, real generator matrices, parsed scope conditions,451nilpotent composition and${signCases}causal sign cases pass. Model/primary/native scopes remain separate.`);
