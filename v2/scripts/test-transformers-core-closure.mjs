import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {transformersReader,transformersAliases} from '../prototypes/readers/transformers.js';
import {reviewedFragments,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
import {normalize} from '../prototypes/readers/transformers-model.js';
const root=new URL('../../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('.internal/v2/transformers-core-closure.json',root),'utf8'));
const html=transformersReader(s=>s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);
let headings=0;
for(const {slug,sha256,headings:destinations} of ledger.sources){
  const p='docs/'+slug+'.md',source=readFileSync(new URL(p,root),'utf8');
  assert.equal(source,execFileSync('git',['show','HEAD:'+p],{cwd:root,encoding:'utf8'}));
  assert.equal(createHash('sha256').update(source).digest('hex'),sha256);
  const g=new GithubSlugger(),actual=[...source.matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));
  assert.deepEqual(Object.keys(destinations),actual);assert.deepEqual(reviewedFragments[slug],destinations);
  assert(transformersAliases.includes(slug));assert(!html.includes(slug));
  assert(!/<img\b|<PaperFigure\b|^import /m.test(source));
  const assets=[...source.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(m=>m[1]);
  const decisions=ledger.assets.filter(a=>a.source===slug);assert.deepEqual(decisions.map(a=>a.url),assets);
  for(const a of decisions){
    const bytes=readFileSync(new URL(a.path,root));
    assert(bytes.equals(execFileSync('git',['show','HEAD:'+a.path],{cwd:root})));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);
    assert(ids.includes(a.anchor));assert(!html.includes(a.url));
  }
  for(const h of actual){const d=resolveReviewedNote(slug+'#'+h);assert.equal(d.slug,'models/transformers');assert(ids.includes(d.anchor));headings++;}
  for(const url of new Set([...source.matchAll(/https:\/\/[^\s)]+/g)].map(m=>m[0])))assert(html.includes(url),url);
}
assert.equal(headings,145);assert.equal(ledger.sources.length,12);assert.equal(ledger.assets.length,6);
assert(!html.includes('Complete originals and further'));
assert(!html.includes('Remaining source notes under review'));
for(const s of ['Feistel-like','mathematical derivative is undefined','two augmented views','running estimates are separate','a=1 leaves the teacher unchanged','normalization therefore changes optimization'])assert(html.includes(s),s);
// Analytic feature Jacobians versus central finite differences, before affine gains.
let jacobianCases=0;
for(let d=2;d<=5;d++)for(let seed=0;seed<9;seed++)for(const epsilon of [.001,.1])for(const kind of ['layer','rms']){
  const x=Array.from({length:d},(_,i)=>(i*3+seed)%7-3),f=normalize(x,kind,epsilon),h=1e-5;
  for(let i=0;i<d;i++)for(let j=0;j<d;j++){
    const centered=kind==='layer'?f.mean:0;
    const analytic=((i===j?1:0)-(kind==='layer'?1/d:0))/f.scale-(x[i]-centered)*(x[j]-centered)/(d*f.scale**3);
    const plus=x.map((v,k)=>v+(k===j?h:0)),minus=x.map((v,k)=>v-(k===j?h:0));
    const numeric=(normalize(plus,kind,epsilon).values[i]-normalize(minus,kind,epsilon).values[i])/(2*h);
    assert(Math.abs(analytic-numeric)<2e-5,`${kind} ${d} ${i} ${j}`);jacobianCases++;
  }
}
for(let n=1;n<=8;n++)for(let f=1;f<=4;f++)for(let seed=0;seed<9;seed++){
  const rows=Array.from({length:n},(_,b)=>Array.from({length:f},(_,j)=>(b*3+j+seed)%7-3));
  for(let j=0;j<f;j++){
    const column=rows.map(row=>row[j]),mu=column.reduce((s,x)=>s+x,0)/n;
    const second=column.reduce((s,x)=>s+x*x,0)/n-mu*mu;
    const actual=normalize(column,'layer',.1);
    assert(Math.abs(actual.second-second)<1e-12);assert(Math.abs(actual.mean-mu)<1e-12);
  }
}
for(let a=0;a<=10;a++)for(let t=-3;t<=3;t++)for(let s=-3;s<=3;s++){
  const momentum=a/10,value=momentum*t+(1-momentum)*s;
  assert(value>=Math.min(t,s)-1e-12&&value<=Math.max(t,s)+1e-12);
  if(a===0)assert.equal(value,s);if(a===10)assert.equal(value,t);
}
console.log(`Transformer core closure:12/12 bodies,${headings} exact headings,6 Git-equal curve replacements,citations and ${jacobianCases} independent Jacobian checks pass. Full primary/production gates stay open.`);
