import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {bpeTraining,segmentationLattice,selectSegmentation,toyPieces} from '../site/readers/tokenization-model.js';
import {tokenizationMeta,tokenizationReader,tokenizationSections} from '../site/readers/tokenization.js';
import {readerMetas,readerAliases,renderDenseReader} from '../site/readers/index.js';
import {reviewedNavigation} from '../site/reviewed-navigation.js';
import {rank} from '../site/search.js';
import {parseFragment} from 'parse5';
const close=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} != ${b}`);
const words=['low','lower','lowest'],frames=bpeTraining(words,5);assert.equal(frames.length,6);
assert.deepEqual(frames[1].pair,['l','o']);assert.equal(frames[1].count,3);assert.deepEqual(frames[2].pair,['lo','w']);assert.equal(frames[2].count,3);
for(let i=0;i<frames.length;i++){assert.deepEqual(frames[i].corpus.map(w=>w.join('')),words);if(i)assert(frames[i].corpus.flat().length<frames[i-1].corpus.flat().length);}
assert.deepEqual(bpeTraining(['aaa'],1)[1].corpus,[['aa','a']]);assert.equal(bpeTraining(['x'],10).length,1);assert.throws(()=>bpeTraining([],2));assert.throws(()=>bpeTraining(words,-1));
const lattice=segmentationLattice('aba',toyPieces);close(lattice.z.at(-1),.168);assert.deepEqual(lattice.best,['ab','a']);assert.equal(lattice.alternatives.length,3);close(lattice.alternatives.reduce((s,a)=>s+a.probability,0),1);
for(const a of lattice.alternatives){assert.equal(a.pieces.join(''),'aba');close(a.weight,a.pieces.reduce((p,s)=>p*toyPieces[s],1));}
close(lattice.alternatives[0].probability,.048/.168);assert.deepEqual(selectSegmentation(lattice.alternatives,0).pieces,['a','b','a']);assert.deepEqual(selectSegmentation(lattice.alternatives,1).pieces,['ab','a']);assert.deepEqual(selectSegmentation(lattice.alternatives,.5).pieces,['a','ba']);
assert.throws(()=>segmentationLattice('c',toyPieces));assert.throws(()=>segmentationLattice('x',{x:0}));assert.throws(()=>selectSegmentation(lattice.alternatives,-.1));
// Compare DP with exhaustive paths across varied tiny strings, not just one example.
for(const text of ['a','b','ab','ba','aab','baba','abababa']){const f=segmentationLattice(text,toyPieces);close(f.z.at(-1),f.alternatives.reduce((s,a)=>s+a.weight,0));const bestWeight=f.best.reduce((p,s)=>p*toyPieces[s],1);close(bestWeight,Math.max(...f.alternatives.map(a=>a.weight)));}
const catalog=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes.filter(n=>!readerAliases.includes(n.slug)&&!reviewedNavigation[n.slug])];
const html=tokenizationReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const [id]of tokenizationSections)assert(ids.includes(id),id);for(const slug of [...html.matchAll(/slug=([^"#]+)/g)].map(m=>m[1]))assert(notes.some(n=>n.slug===slug),slug);
assert(html.includes('\\p{N}{1,3}'));assert(renderDenseReader(tokenizationMeta.slug,s=>s));for(const query of ['BytePiece','Viterbi sampling','SONAR','special tokens','bits per byte'])assert(rank(notes,query).some(r=>r.note===tokenizationMeta),query);
for(const slug of ['ai/modalities/nlp/byte-pair-encoding','ai/architectures/transformers/byte-latent-transformer'])assert(!notes.some(n=>n.slug===slug));
assert(!html.includes('Complete originals'));for(const phrase of ['fertility','split-word','unknown-token','##','French'])assert(html.includes(phrase),phrase);
// Inspect the unmounted server-rendered tree: visual evidence must not require JS.
const staticTree=parseFragment(html),all=[];
function walk(node){all.push(node);for(const child of node.childNodes||[])walk(child);}walk(staticTree);
const attr=(node,name)=>node.attrs?.find(a=>a.name===name)?.value;
const text=node=>node.nodeName==='#text'?node.value:(node.childNodes||[]).map(text).join('');
const one=name=>{const nodes=all.filter(n=>attr(n,name)!==undefined);assert.equal(nodes.length,1,name);return nodes[0];};
assert.equal(text(one('data-merge-words')),'lowlowerlowest');
assert.equal(text(one('data-symbol-count')),'14');
assert.equal(text(one('data-merge-caption')),'0 / Start with individual symbols.');
assert.equal(text(one('data-selected-path')),'a | ba');
const rows=all.filter(n=>attr(n,'class')==='probability-row');assert.equal(rows.length,3);
assert.deepEqual(rows.map(text),['a | b | a0.286','a | ba0.238','ab | a0.476']);
assert.equal(all.filter(n=>attr(n,'class')==='probability-track').length,3);
assert(html.includes('Their sum is .168. Divide each weight by this sum'));
const trace=all.find(n=>n.tagName==='table'&&n.childNodes?.some(c=>c.tagName==='caption'&&text(c)==='Complete toy BPE trace'));
assert(trace,'complete static trace');
const body=trace.childNodes.find(n=>n.tagName==='tbody');const traceRows=body.childNodes.filter(n=>n.tagName==='tr');assert.equal(traceRows.length,6);
assert.equal(attr(trace,'style'),'min-width:360px');
for(let i=0;i<frames.length;i++){const cells=traceRows[i].childNodes.filter(n=>n.tagName==='td');assert.equal(text(cells[1]),frames[i].corpus.map(w=>w.join(' | ')).join(''));if(i)assert.equal(text(cells[0]),`${i} · ${frames[i].pair.join(' + ')}${frames[i].count} adjacent occurrences`);}
const traceRegion=all.find(n=>attr(n,'role')==='region'&&attr(n,'aria-label')==='Complete toy BPE trace');assert.equal(attr(traceRegion,'tabindex'),'0');
console.log('Tokenization: merge count/order, nonoverlap, reversibility, lattice partition/best paths, quantiles, regex escaping, anchors, links and search pass.');
