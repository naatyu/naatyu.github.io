import assert from 'node:assert/strict';
import {norm,normalize,inner} from '../site/readers/geometry-model.js';
import {lossesReader,lossSections,lossesMeta} from '../site/readers/losses.js';
const close=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} != ${b}`);
assert.deepEqual(normalize([3,4]),[.6,.8]);close(norm([3,4]),5);
assert.throws(()=>normalize([0,0]));
let cases=0;
for(let angle=0;angle<=360;angle++){
  const r=angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r),x=[3,4],rotated=[c*x[0]-s*x[1],s*x[0]+c*x[1]];
  close(norm(rotated),5);close(inner(normalize(x),normalize(rotated)),c);cases++;
}
// The ray counterexample distinguishes a norm function from its squared norm.
close(norm([1.5,0]),(norm([1,0])+norm([2,0]))/2);
assert(norm([1.5,0])**2<(norm([1,0])**2+norm([2,0])**2)/2);
// A rank-deficient X = [[1,1],[2,2]] still yields a positive definite ridge system.
for(const lambda of [.01,.1,1,10])for(let a=-5;a<=5;a++)for(let b=-5;b<=5;b++){
  if(a===0&&b===0)continue;
  const quadratic=(5+lambda)*(a*a+b*b)+10*a*b;
  close(quadratic,5*(a+b)**2+lambda*(a*a+b*b));assert(quadratic>0);cases++;
}
// Epsilon-clamped normalization is not unit normalization below epsilon.
const clipped=(x,eps)=>x.map(v=>v/Math.max(norm(x),eps));
assert.deepEqual(clipped([0,0],.1),[0,0]);close(norm(clipped([.03,.04],.1)),.5);
const html=lossesReader(s=>`/${s}`);
for(const id of ['norm-geometry','ridge-geometry']){assert(lossSections.some(([s])=>s===id));assert.equal([...html.matchAll(new RegExp(`id="${id}"`,'g'))].length,1);}
assert(html.indexOf('id="norm-geometry"')<html.indexOf('id="regression"'));
assert(html.includes('Gram matrix'));assert(html.includes('zero stays zero'));assert(html.includes('not inverse operations'));
assert.equal(lossesMeta.date,'2026-04-20');assert.equal(lossesMeta.updated,'2026-10-09');
console.log(`Loss preservation: ${cases} rotation, cosine and positive-definiteness cases; norm distinctions, epsilon policy, lineage and meaningful anchors pass.`);
