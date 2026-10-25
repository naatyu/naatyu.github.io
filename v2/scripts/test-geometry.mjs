import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {norm,normalize,inner,cross,orientation,areaFrame} from '../site/readers/geometry-model.js';
import {geometryMeta,geometryReader,geometrySections} from '../site/readers/geometry.js';
import {readerMetas,readerAliases,renderDenseReader} from '../site/readers/index.js';
import {reviewedNavigation} from '../site/reviewed-navigation.js';
import {rank} from '../site/search.js';
import {parseFragment} from 'parse5';
const close=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`),vectorClose=(a,b)=>a.forEach((v,i)=>close(v,b[i]));
close(norm([3,4]),5);vectorClose(normalize([3,4]),[.6,.8]);close(norm(normalize([1e308,1e308,1e308,1e308])),1);close(norm(normalize([1e-310,1e-310])),1);
let derivatives=0,rays=0;
for(const a of [-3,-1,0,2])for(const b of [-3,-1,0,2]){
  const x=[a,b];if(norm(x)===0)continue;
  const midpoint=x.map(v=>1.5*v),twice=x.map(v=>2*v);
  close(norm(midpoint),(norm(x)+norm(twice))/2);rays++;
  for(let i=0;i<2;i++){
    const h=1e-5,plus=[...x],minus=[...x];plus[i]+=h;minus[i]-=h;
    assert(Math.abs((norm(plus)-norm(minus))/(2*h)-x[i]/norm(x))<1e-8);
    assert(Math.abs((inner(plus,plus)-inner(minus,minus))/(2*h)-2*x[i])<1e-8);
    derivatives++;
  }
}
for(const a of [[1,0,0],[2,3,-4],[0,0,0]])for(const b of [[0,1,0],[-3,2,5],[0,0,0]]){const c=cross(a,b);close(inner(c,a),0);close(inner(c,b),0);vectorClose(c,cross(b,a).map(x=>-x));close(norm(c)**2,norm(a)**2*norm(b)**2-inner(a,b)**2);vectorClose(cross(a,b.map(x=>3*x)),c.map(x=>3*x));const d=[1,2,3];vectorClose(cross(a,b.map((v,i)=>v+d[i])),cross(a,b).map((v,i)=>v+cross(a,d)[i]));}
for(let angle=-180;angle<=180;angle++){const f=areaFrame(angle),r=angle*Math.PI/180;close(f.dot,6*Math.cos(r));close(f.signed,6*Math.sin(r));close(f.area,Math.abs(f.signed));close(f.triangle,f.area/2);close(f.unitDistanceSquared,norm(normalize(f.a).map((v,i)=>v-normalize(f.b)[i]))**2);assert(f.unitDistanceSquared>=-1e-12&&f.unitDistanceSquared<=4+1e-12);}
close(orientation([0,0],[2,0],[0,3]),6);close(orientation([0,0],[0,3],[2,0]),-6);close(orientation([10,10],[12,10],[10,13]),6);close(orientation([0,0],[1,1],[2,2]),0);
assert.throws(()=>normalize([0,0]));assert.throws(()=>normalize([Infinity,1]));assert.throws(()=>norm([]));assert.throws(()=>inner([1],[1,2]));assert.throws(()=>cross([1,2],[1,2]));assert.throws(()=>orientation([1,2,3],[1,2],[3,4]));assert.throws(()=>areaFrame(NaN));
const catalog=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes.filter(n=>!readerAliases.includes(n.slug)&&!reviewedNavigation[n.slug])],html=geometryReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const [id]of geometrySections)assert(ids.includes(id),id);for(const slug of [...html.matchAll(/slug=([^"#]+)/g)].map(m=>m[1]))assert(notes.some(n=>n.slug===slug),slug);assert(renderDenseReader(geometryMeta.slug,s=>s));for(const query of ['cross product','unit normalization','ridge','signed area'])assert(rank(notes,query).some(r=>r.note===geometryMeta),query);
for(const slug of ['math/linear-algebra/cross-product','ai/training/losses/l2-norm-and-loss'])assert(!notes.some(n=>n.slug===slug));
const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)],nodes=walk(parseFragment(html));
const attr=(n,key)=>n.attrs?.find(a=>a.name===key)?.value;
assert.equal(nodes.filter(n=>n.tagName==='math').length,24);
assert.equal(nodes.filter(n=>attr(n,'class')==='inline-math').length,17);
const annotations=nodes.filter(n=>n.tagName==='annotation').map(n=>n.childNodes.map(c=>c.value||'').join(''));
for(const tex of [String.raw`\nabla\lVert x\rVert_2=\frac{x}{\lVert x\rVert_2}`,String.raw`\nabla\lVert x\rVert_2^2=2x`,String.raw`\frac1n\sum_i(\hat y_i-y_i)^2`,String.raw`\left\lVert\frac{x+2x}{2}\right\rVert_2`,String.raw`\frac{\lVert x\rVert_2+\lVert2x\rVert_2}{2}`])assert(annotations.includes(tex),tex);
const tables=nodes.filter(n=>attr(n,'class')==='dense-table-wrap');assert.equal(tables.length,3);
for(const table of tables){assert.equal(attr(table,'tabindex'),'0');assert.equal(attr(table,'role'),'region');assert(attr(table,'aria-label'));assert.equal(attr(table.childNodes.find(n=>n.tagName==='table'),'style'),'min-width:580px');}
console.log('Geometry: normalization, cosine distance, cross-product identities, signed orientation, 361 angle states, degeneracies, anchors, links and search pass.');
console.log(`Geometry typesetting:17 exact inline formulas,three named keyboard tables,${derivatives} two-gradient differences and${rays} ray equalities pass.`);
