import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseFragment} from 'parse5';
import {recurrenceReader} from '../prototypes/readers/recurrence.js';
import {compactReader} from '../prototypes/readers/compact.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const evidence=JSON.parse(readFileSync(new URL('../../.internal/v2/nanbeige-geometry-verification.json',import.meta.url),'utf8'));
assert.equal(evidence.revision,'b82e54bd609793562a75cbf9337970a93369eab5');
for(const hash of [evidence.configSha256,evidence.implementationSha256])assert(/^[a-f0-9]{64}$/.test(hash));
const {hidden_size:d,num_attention_heads:h,num_key_value_heads:g,head_dim:w,attention_bias:bias,num_hidden_layers:layers,num_loops:loops}=evidence.fields;
assert.deepEqual([d,h,g,w,bias,layers,loops],[3072,48,8,128,false,22,2]);
assert.equal(h*w,6144);assert.equal(g*w,1024);assert.equal(h/g,6);assert.equal(layers*loops,44);assert.notEqual(d/h,w);
const html=assertGeneratedMarkup(recurrenceReader(s=>s),'Nanbeige geometry'),annotations=[],tables=[];
const text=n=>(n.nodeName==='#text'?n.value:'')+(n.childNodes||[]).map(text).join('');
function walk(n){if(n.tagName==='annotation')annotations.push(text(n));if(n.tagName==='table')tables.push(n);for(const c of n.childNodes||[])walk(c);}walk(parseFragment(html));
const table=tables.find(n=>text(n).includes('Nanbeige 4.2 attention projection widths'));assert(table);
assert(table.attrs.some(a=>a.name==='style'&&a.value==='min-width:640px'));
for(const tex of [String.raw`3072\longrightarrow6144`,String.raw`3072\longrightarrow1024`,String.raw`6144\longrightarrow3072`,String.raw`\frac{48}{8}=6`])assert(annotations.includes(tex),tex);
assert.equal(annotations.filter(t=>t===String.raw`3072\longrightarrow1024`).length,2);
const cells=[];function collect(n){if(n.tagName==='td')cells.push(n);for(const c of n.childNodes||[])collect(c);}collect(table);assert.equal(cells.length,12);
assert(html.includes(evidence.configURL)&&html.includes(evidence.implementationURL));assert(!html.includes('pending complete config audit'));
assert(text(parseFragment(html)).includes('not its quality or measured throughput'));
assert(compactReader(s=>s).includes('models/recurrence#nanbeige'));
// Tiny independent dense projection enumeration: output width is independent of residual width.
let cases=0;for(let residual=1;residual<=4;residual++)for(const queryHeads of [1,2,4])for(const kvHeads of [1,2])for(const headWidth of [1,2,3]){
 if(queryHeads%kvHeads)continue;
 const queryWidth=queryHeads*headWidth,kvWidth=kvHeads*headWidth;
 const x=Array.from({length:residual},(_,i)=>i-1);
 const project=(values,out)=>Array.from({length:out},(_,j)=>values.reduce((s,value,i)=>s+value*(i+2*j-1),0));
 const q=project(x,queryWidth),k=project(x,kvWidth),v=project(x,kvWidth),output=project(q,residual);
 assert.equal(q.length,queryWidth);assert.equal(k.length,kvWidth);assert.equal(v.length,kvWidth);assert.equal(output.length,residual);
 assert.equal(q.length/queryHeads,headWidth);assert.equal(k.length/kvHeads,headWidth);
 let parameters=0;for(const [input,out] of [[residual,queryWidth],[residual,kvWidth],[residual,kvWidth],[queryWidth,residual]])for(let i=0;i<input;i++)for(let j=0;j<out;j++)parameters++;
 assert.equal(parameters,2*residual*(queryWidth+kvWidth));cases++;
}
assert.equal(2*d*(h*w+g*w),44040192);
console.log(`Nanbeige geometry: pinned source-review snapshot,12comparison cells,explicit6144/1024/3072maps,six-head groups and${cases}independent tiny projection cases pass. Not remote-model execution or throughput certification.`);
