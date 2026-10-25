import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chainFrame,partialExample,curvatureFrame,classifyEigenvalues} from '../site/readers/calculus-model.js';
import {calculusMeta,calculusReader,calculusSections} from '../site/readers/calculus.js';
import {readerMetas,readerAliases,renderDenseReader} from '../site/readers/index.js';
import {reviewedNavigation} from '../site/reviewed-navigation.js';
import {rank} from '../site/search.js';
import {inlineMath} from '../site/readers/math.js';
const close=(a,b,tol=1e-9)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
for(const skip of [false,true])for(let i=0;i<=100;i++){const x=i/100,final=chainFrame(x,skip),fn=v=>Math.exp(Math.sin(v*v))+(skip?v*v:0),eps=1e-5;close(final.derivative,(fn(x+eps)-fn(x-eps))/(2*eps),1e-7);close(final.adjoints[0],final.derivative);for(let stage=0;stage<=8;stage++){const f=chainFrame(x,skip,stage);assert.equal(f.ready[1],stage>=1);assert.equal(f.ready[4],stage>=4);if(stage<8)close(f.adjoints[0],0);if(stage===5)close(f.adjoints[1],skip?1:0);if(stage===7)close(f.adjoints[1],Math.exp(Math.sin(x*x))*Math.cos(x*x)+(skip?1:0));}}
close(chainFrame(.5).derivative,1.240882609167237);close(chainFrame(.5,true).derivative,2.240882609167237);close(chainFrame(0,true).derivative,0);assert.throws(()=>chainFrame(NaN));assert.throws(()=>chainFrame(.5,false,9));
assert.deepEqual(partialExample(2,3),{value:30,gradient:[21,16],hessian:[[6,10],[10,4]]});const f=(x,y)=>partialExample(x,y).value;for(const [x,y]of [[2,3],[1,-2],[0,0]]){const e=1e-5,g=partialExample(x,y).gradient;close(g[0],(f(x+e,y)-f(x-e,y))/(2*e),1e-8);close(g[1],(f(x,y+e)-f(x,y-e))/(2*e),1e-8);}
for(const kind of ['minimum','maximum','saddle','quartic'])for(let angle=0;angle<=180;angle++){const frame=curvatureFrame(kind,angle);close(Math.hypot(...frame.direction),1);for(const r of [-1,-.5,0,.5,1]){const slice=curvatureFrame(kind,angle,r);close(slice.value,curvatureFrame(kind,angle,-r).value);if(kind==='minimum'||kind==='quartic')assert(slice.value>=0);if(kind==='maximum')assert(slice.value<=0);if(kind==='quartic')close(slice.k,0);else close(slice.value,.5*slice.k*r*r);}}
close(curvatureFrame('saddle',0).k,1);close(curvatureFrame('saddle',90).k,-1);close(curvatureFrame('saddle',45).k,0);close(curvatureFrame('quartic',45).value,.5);assert.equal(classifyEigenvalues([1,3]).type,'Minimum');assert.equal(classifyEigenvalues([-1,-3]).type,'Maximum');assert.equal(classifyEigenvalues([1,-1]).type,'Saddle');assert.equal(classifyEigenvalues([1,-1,0]).type,'Saddle');assert.equal(classifyEigenvalues([0,0]).zeros,2);assert.throws(()=>curvatureFrame('missing',0));
const catalog=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes.filter(n=>!readerAliases.includes(n.slug)&&!reviewedNavigation[n.slug])],html=calculusReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const [id]of calculusSections)assert(ids.includes(id),id);for(const slug of [...html.matchAll(/slug=([^"#]+)/g)].map(m=>m[1]))assert(notes.some(n=>n.slug===slug),slug);assert(renderDenseReader(calculusMeta.slug,s=>s));for(const query of ['Kac-Rice','Hessian','backpropagation','product rule'])assert(rank(notes,query).some(r=>r.note===calculusMeta),query);
assert(!html.includes('Complete originals'));assert(!/slug=(ai|systems)\//.test(html));
assert.equal((html.match(/class="inline-math"/g)||[]).length,28);
assert.equal((html.match(/<math /g)||[]).length,44);
assert(!html.includes('${inlineMath'));
for(const tex of [String.raw`\frac{df}{dx}=\partial_xf+\partial_yf\,\frac{dy}{dx}`,String.raw`\partial_wL=\frac2n\sum_i(wx_i+b-y_i)x_i`,String.raw`\frac{f(x+\varepsilon)-f(x-\varepsilon)}{2\varepsilon}`,String.raw`0<\eta<\frac2\lambda`,String.raw`u=\frac{x+y}{\sqrt2}`,String.raw`h^\top Hh=\sum_i\lambda_i a_i^2`,String.raw`\frac{\partial L}{\partial x}=1.2409`])assert(html.includes(inlineMath(tex)),tex);
for(const source of Object.keys(reviewedNavigation).filter(s=>reviewedNavigation[s].slug==='math/calculus'))assert(!notes.some(n=>n.slug===source));
console.log('Calculus: 202 graph/input cases and all backward stages, finite differences, partial/Hessian arithmetic, 724 curvature directions, degenerate/mixed signs, links, anchors and search pass.');
