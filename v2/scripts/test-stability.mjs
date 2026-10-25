import assert from 'node:assert/strict';
import './test-stability-notation.mjs';
import './test-stability-preservation.mjs';
import {readFile,stat} from 'node:fs/promises';
import {clipGradient,firstAdam,mixtureLoss,checkpoints,transfer,timeline} from '../prototypes/readers/stability-model.js';
import {stabilityClipBody,stabilityMeta,stabilityReader,stabilitySections} from '../prototypes/readers/stability.js';
import {readerMetas,renderDenseReader} from '../prototypes/readers/index.js';
import {previewPath} from './preview-path.mjs';
import {rank} from '../prototypes/search.js';
const near=(a,b)=>assert(Math.abs(a-b)<=1e-11*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
let cases=0;
for(let a=-10;a<=10;a++)for(let b=-10;b<=10;b++)for(let ti=0;ti<=16;ti++){
  const g=[a,b],tau=ti/2,n=Math.sqrt(a*a+b*b),scale=n?Math.min(1,tau/n):1,c=clipGradient(g,tau),v=clipGradient(g,tau,'value');
  c.gradient.forEach((x,i)=>near(x,g[i]*scale));near(c.norm,Math.min(n,tau));near(c.gradient[0]*b,c.gradient[1]*a);assert.equal(c.active,n>tau);
  v.gradient.forEach((x,i)=>near(x,Math.max(-tau,Math.min(tau,g[i]))));assert.equal(v.active,g.some(x=>Math.abs(x)>tau));cases++;
}
near(clipGradient([6,8],5).norm,5);near(clipGradient([6,8],5,'value').norm,Math.sqrt(50));
near(clipGradient([1e308,1e308],1).norm,1);assert(clipGradient([Number.MIN_VALUE,Number.MIN_VALUE],Number.MIN_VALUE).gradient.every(Number.isFinite));
for(let x=-100;x<=100;x++)for(const eps of [.001,.01,1,100])near(firstAdam([x],eps)[0],x/(Math.abs(x)+eps));near(firstAdam([1e308],1e308)[0],.5);
const first=clipGradient([100,0],1).gradient,second=clipGradient([-99,1],1).gradient,mean=[.5,.5];assert.deepEqual(clipGradient(mean,1).gradient,mean);assert(Math.abs((first[1]+second[1])/2-mean[1])>.4);
for(let i=0;i<=100;i++)near(mixtureLoss(i/100),2+2*i/100);
assert.deepEqual(checkpoints.map(c=>c.accuracy),[81,0,81.7]);assert.deepEqual(checkpoints.map(c=>c.tokens),['2.17T','2.19T','2.21T']);near(transfer[0].earlier-transfer[0].later,6.5);near(transfer[1].earlier-transfer[1].later,32);
for(const k of ['fast','slow','nonrecover','gradual','repeat']){const t=timeline(k);assert.equal(t.length,13);for(let i=0;i<13;i++){assert.equal(t[i].step,i);near(t[i].baseline,3-.07*i);assert(Number.isFinite(t[i].loss));}if(k==='fast')near(t[6].loss,t[6].baseline);if(k==='slow')near(t[11].loss,t[11].baseline);if(k==='nonrecover')assert(t[12].loss>t[12].baseline);if(k==='gradual')assert(t[12].loss>t[11].loss);if(k==='repeat'){near(t[8].loss,t[8].baseline-.7);near(t[9].loss,t[9].baseline);}}
for(const f of [()=>clipGradient([],1),()=>clipGradient([NaN],1),()=>clipGradient([Infinity],1),()=>clipGradient([1],-1),()=>clipGradient([1],1,'layer'),()=>firstAdam([1],0),()=>mixtureLoss(2),()=>timeline('unknown')])assert.throws(f);
const html=stabilityReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const[id]of stabilitySections)assert(ids.includes(id));assert.equal(stabilityMeta.date,'2026-05-11');assert(stabilityMeta.prototype);assert(!html.includes('>undefined<'));
const catalog=JSON.parse(await readFile(new URL('../prototypes/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes];for(const[,s,anchor]of html.matchAll(/href="directions\.html\?slug=([^"#]+)(?:#([^"]+))?"/g)){assert(notes.some(n=>n.slug===s),s);if(anchor)assert(renderDenseReader(s,x=>'directions.html?slug='+x)?.includes(`id="${anchor}"`),`${s}#${anchor}`);}
for(const q of ['gradient norm','mode-hopping','checkpoint selection','resume','clipping'])assert(rank(notes,q).some(r=>r.note===stabilityMeta),q);
const root=new URL('../prototypes/',import.meta.url).pathname,img=new URL('../../static/img/',import.meta.url).pathname;
let assets=0;for(const[,relative]of html.matchAll(/<img src="\/img\/([^"]+)"/g)){const target=previewPath('img/'+relative,root,img);assert((await stat(target)).size>0);assets++;}
assert.equal(assets,14);for(const relative of ['../AGENTS.md','img/../../AGENTS.md','img/../secret','/etc/passwd'])assert.equal(previewPath(relative,root,img),null);assert(previewPath('readers/stability.js',root,img).startsWith(root));
console.log(`Stability: ${cases} clipping states, 804 Adam cases, 101 mixtures, 65 timeline states, exact checkpoint/transfer data, 14 figure assets, privacy path guards, sections, routes and search pass.`);

for(const rule of ['norm','value']){const zero=stabilityClipBody(0,rule);assert(zero.includes('direction is undefined'));assert(!zero.includes('preserves the nonzero direction'));}
assert(stabilityClipBody(5,'norm').includes('preserves the nonzero direction'));
