import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {numbersReader,numbersMeta} from '../prototypes/readers/numbers.js';
import {choosingReader,choosingMeta} from '../prototypes/readers/choosing.js';
import {binarySearchReader,binarySearchMeta} from '../prototypes/readers/binary-search.js';
import {orderingReader,orderingMeta} from '../prototypes/readers/ordering.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const text=n=>(n.value||'')+(n.childNodes||[]).map(text).join('');
function inspect(f){
 const html=assertGeneratedMarkup(f(s=>s)),nodes=[];
 function walk(n){nodes.push(n);for(const c of n.childNodes||[])walk(c);}walk(parseFragment(html));
 return {html,nodes,prose:text(parseFragment(html)),tex:nodes.filter(n=>n.tagName==='annotation').map(text),code:nodes.filter(n=>n.tagName==='code'&&n.parentNode?.tagName!=='pre').map(text)};
}
const numbers=inspect(numbersReader),choice=inspect(choosingReader),binary=inspect(binarySearchReader),order=inspect(orderingReader);
for(const[r,total,inline]of[[numbers,14,9],[choice,91,90],[binary,1,0],[order,5,2]]){
 assert.equal(r.nodes.filter(n=>n.tagName==='math').length,total);
 assert.equal((r.html.match(/class="inline-math"/g)||[]).length,inline);
 assert(!r.prose.includes('inlineMath(String.raw'));
}
assert(numbers.tex.includes(String.raw`\frac{48}{6}\cdot18=144`));
for(const a of ['2^{40}','2^{20}','2^{20}=1{,}048{,}576','2^{40}=1{,}099{,}511{,}627{,}776','n=100{,}000','n^2','n^3',String.raw`n\log_2 n`])assert(choice.tex.includes(a),a);
assert(order.tex.includes('k=0'));assert(order.tex.includes('k=n'));
for(const c of ['down = (x // a) * a','up = ((x + a - 1) // a) * a','n % 10','n // 10','reversed = 10 * reversed + digit','r * C + c','r = index // C','c = index % C','C = 0'])assert(numbers.code.includes(c),c);
for(const c of ['row = middle // columns','column = middle % columns'])assert(binary.code.includes(c),c);
for(const s of ['rounds down to 36 and up to 42','rounds down to −12 and up to −6','not rounding toward zero','Other languages can use different signed division rules','not just each row'])if(!numbers.prose.includes(s))assert(binary.prose.includes(s),s);
for(const s of ['globally sorted','Sorting each row individually is insufficient','empty dimensions'])assert(binary.prose.includes(s),s);
for(const s of ['may be workable','nonnegative target','dependencies permit overwriting','not a proof'])assert(choice.prose.includes(s),s);
assert(!order.prose.includes('k=0/k=n'));
const contract=order.nodes.find(n=>n.tagName==='table'&&n.childNodes.some(c=>c.tagName==='caption'&&text(c)==='Choose an algorithm with its real guarantees'));
assert(contract.attrs.some(a=>a.name==='style'&&a.value==='min-width:640px'));
assert.equal(2n**20n,1048576n);assert.equal(2n**40n,1099511627776n);
assert.equal(100000n**2n,10000000000n);
assert.equal(48/6*18,144);
// Independently enumerate multiples around signed x instead of trusting truncation toward zero.
let alignment=0,indices=0;
for(let a=1;a<=16;a++)for(let x=-40;x<=40;x++){
 const multiples=Array.from({length:201},(_,i)=>(i-100)*a);
 assert.equal(Math.floor(x/a)*a,Math.max(...multiples.filter(v=>v<=x)));
 assert.equal(Math.floor((x+a-1)/a)*a,Math.min(...multiples.filter(v=>v>=x)));alignment++;
}
for(let rows=1;rows<=12;rows++)for(let cols=1;cols<=12;cols++)for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
 const i=r*cols+c;assert.equal(Math.floor(i/cols),r);assert.equal(i%cols,c);indices++;
}
assert.equal(numbersMeta.date,'2026-07-24');for(const m of[choosingMeta,binarySearchMeta,orderingMeta])assert.equal(m.date,'2026-04-08');
console.log('Algorithm notation:14 inline additions,floor/modulo syntax preserved as code,exact domains/counts,'+alignment+' signed-multiple and'+indices+' row-major identities pass;not a runtime feasibility guarantee.');
