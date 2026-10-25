import assert from 'node:assert/strict';
import './test-algorithm-notation.mjs';
import './test-decision-search.mjs';
import './test-choosing-preservation.mjs';
import {readFile} from 'node:fs/promises';
import {decisionTree,decisionLeaves,findDecision,decisionPath,matchDecisions,workEstimate} from '../site/readers/choosing-model.js';
import {choosingMeta,choosingReader,choosingSections} from '../site/readers/choosing.js';
import {readerMetas,readerAliases,renderDenseReader} from '../site/readers/index.js';
import {rank} from '../site/search.js';
const nodes=[];function visit(node,parent=null){nodes.push(node);assert(node.id&&node.label);if(node.children){assert(node.children.length);for(const child of node.children)visit(child,node);}else for(const key of ['method','condition','counterexample','cost','target'])assert(node[key],node.id+' '+key);const path=decisionPath(node.id);assert.equal(path[0],decisionTree);assert.equal(path.at(-1),node);if(parent)assert.equal(path.at(-2),parent);assert.equal(findDecision(node.id),node);}visit(decisionTree);assert.equal(nodes.length,new Set(nodes.map(n=>n.id)).size);assert.equal(decisionLeaves.length,nodes.filter(n=>!n.children).length);assert.equal(findDecision('missing'),null);assert.equal(decisionPath('missing'),null);assert.deepEqual(matchDecisions('   '),[]);
for(const [query,id]of [['signed sum','signed-sum'],['negative weights','negative'],['running median','running-median'],['prefixes','prefixes'],['original indices','sorted-pair'],['largest-first','safe-local'],['smallest','nonnegative']])assert(matchDecisions(query).some(n=>n.id===id),query);
let count=0;for(let n=1;n<=100;n++)for(let q=0;q<=50;q++){count++;const w=workEstimate(n,q,1);let pairs=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)pairs++;assert.equal(w.pairs,BigInt(pairs));assert.equal(w.scans,BigInt(n*q));assert.equal(w.prefix,BigInt(n+q));assert.equal(w.tableCells,BigInt(n*n));assert.equal(w.tableBytes,w.tableCells);assert.equal(w.cube,BigInt(n)**3n);assert(Math.abs(w.nlogn-n*Math.log2(n))<1e-9);}
const big=workEstimate(100000,100000);assert.equal(big.pairs,4999950000n);assert.equal(big.cube,1000000000000000n);assert.equal(big.scans,10000000000n);assert.equal(big.prefix,200000n);assert.equal(big.tableBytes,80000000000n);assert.equal(workEstimate(1000000,1000000).cube,1000000000000000000n);
for(const [n,q,b]of [[0,1,8],[1,-1,8],[1,1,0],[1.5,1,8],[NaN,1,8],[1,1,257],[1000001,1,8],[1,1000001,8]])assert.throws(()=>workEstimate(n,q,b));
const link=s=>'directions.html?slug='+s,html=choosingReader(link),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const [id]of choosingSections)assert(ids.includes(id));for(const leaf of decisionLeaves){assert(html.includes(leaf.label.replaceAll('&','&amp;')));assert(html.includes(leaf.method.replaceAll('&','&amp;')));}
const catalog=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes.filter(n=>!readerAliases.includes(n.slug))];
for(const [,slug,anchor]of html.matchAll(/href="directions\.html\?slug=([^"#]+)(?:#([^"]+))?"/g)){assert(notes.some(n=>n.slug===slug),slug);if(anchor)assert(renderDenseReader(slug,link)?.includes(`id="${anchor}"`),slug+'#'+anchor);}
for(const query of ['choosing algorithms','constraints','decision tree','meet-in-the-middle','pseudo-polynomial'])assert(rank(notes,query).some(r=>r.note===choosingMeta),query);assert(renderDenseReader(choosingMeta.slug,link));
console.log(`Choosing: ${nodes.length} unique decision nodes, ${decisionLeaves.length} complete static leaves and reversible paths; ${count} work models plus large exact counts, invalid bounds, anchors, destinations and search pass.`);
