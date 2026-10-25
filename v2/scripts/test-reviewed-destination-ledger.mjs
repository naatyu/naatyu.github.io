import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse} from 'parse5';
import {auditReviewedDestinationLedger} from './reviewed-destination-ledger.mjs';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';

const plan=JSON.parse(await readFile(new URL('../../.internal/v2/dense-preservation.json',import.meta.url),'utf8'));
const reviewed=JSON.parse(await readFile(new URL('../../.internal/v2/reviewed-route-destinations.json',import.meta.url),'utf8'));
const pages=new Map(readerMetas.map(meta=>{
  const ids=new Set(),queue=[parse(renderDenseReader(meta.slug,s=>'/atlas/'+s))];
  while(queue.length){const node=queue.pop();const id=node.attrs?.find(a=>a.name==='id')?.value;if(id)ids.add(id);queue.push(...node.childNodes||[]);}
  return [meta.slug,{ids}];
}));
assert.deepEqual(auditReviewedDestinationLedger(plan,reviewed,pages),{validReviewedPrimaryDestinations:206,reviewedPrimaryDestinationErrors:[]});

// Independent tiny fixtures make each failure observable, not just a count.
const source={source:'docs/example.md',publicBody:true,sha256:'fingerprint',originalRoute:'/atlas/old',primaryDestination:'/atlas/topic#historical',reviewedPrimaryDestination:'/atlas/topic#mechanism'};
const fixture={sourceLedger:[source,{source:'docs/retired.md',publicBody:false}]};
const routes={entries:[{source:source.source,sha256:source.sha256,originalRoute:source.originalRoute,destination:source.reviewedPrimaryDestination}]};
const rendered=new Map([['topic',{ids:new Set(['mechanism','another'])}]]);
assert.equal(auditReviewedDestinationLedger(fixture,routes,rendered).validReviewedPrimaryDestinations,1);
const snapshot=JSON.stringify(fixture);
const check=(mutate,reason)=>{
  const p=structuredClone(fixture),r=structuredClone(routes),pages=new Map([['topic',{ids:new Set(['mechanism','another'])}]]);
  mutate(p,r,pages);
  assert(auditReviewedDestinationLedger(p,r,pages).reviewedPrimaryDestinationErrors.some(e=>e.reason===reason),reason);
};
check(p=>delete p.sourceLedger[0].reviewedPrimaryDestination,'reviewed destination must name an atlas section');
check(p=>p.sourceLedger[0].reviewedPrimaryDestination='/atlas/topic#another','reviewed destination differs from private route review');
check((p,r)=>{p.sourceLedger[0].reviewedPrimaryDestination=r.entries[0].destination='/atlas/topic';},'reviewed destination must name an atlas section');
check((p,r,pages)=>pages.get('topic').ids.delete('mechanism'),'reviewed destination section is not rendered');
check((p,r)=>r.entries[0].sha256='changed','reviewed source identity or fingerprint differs');
check((p,r)=>r.entries[0].originalRoute='/atlas/other','reviewed source identity or fingerprint differs');
check((p,r)=>r.entries=[],'retained source lacks private route review');
check((p,r)=>r.entries.push({...r.entries[0]}),'duplicate reviewed identity');
check(p=>p.sourceLedger.push({...p.sourceLedger[0]}),'duplicate source ledger identity');
check((p,r)=>r.entries.push({...r.entries[0],source:'docs/unknown.md'}),'reviewed identity is not a retained source');
check(p=>p.sourceLedger[1].reviewedPrimaryDestination='/atlas/topic#mechanism','retired source has a content-preserving destination');
check((p,r)=>r.entries.push({...r.entries[0],source:'docs/retired.md'}),'reviewed identity is not a retained source');
assert.equal(JSON.stringify(fixture),snapshot,'diagnostics must not rewrite the proposal');
assert.equal(fixture.sourceLedger[0].primaryDestination,'/atlas/topic#historical');
console.log('Reviewed primary destinations: 206 rendered sections agree; 12 deliberate drift cases rejected. Historical proposals remain separate.');
