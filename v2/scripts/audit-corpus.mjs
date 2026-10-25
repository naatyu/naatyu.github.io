// Read-only migration diagnostics. Existence is not proof of semantic coverage.
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import GithubSlugger from 'github-slugger';
import {readerMetas,readerAliases,renderDenseReader} from '../prototypes/readers/index.js';
import {reviewedNavigation,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
import {retiredNavigation} from '../prototypes/retired-navigation.js';
import {auditReviewedDestinationLedger} from './reviewed-destination-ledger.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const plan=JSON.parse(await readFile(path.join(root,'.internal/v2/dense-preservation.json'),'utf8'));
const reviewed=JSON.parse(await readFile(path.join(root,'.internal/v2/reviewed-route-destinations.json'),'utf8'));
const pages=new Map(readerMetas.map(meta=>{
  const html=renderDenseReader(meta.slug,s=>'/atlas/'+s);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  return [meta.slug,{meta,html,ids:new Set(ids),duplicates:ids.filter((id,i)=>ids.indexOf(id)!==i)}];
}));
const result={scope:'structural only; no content or production certification',readers:pages.size,plannedReaders:plan.topics.length,missingReaders:[],unexpectedReaders:[],duplicateIds:[],brokenCanonicalLinks:[],sourceChanges:[],newSources:[],missingProposedDestinations:[],validProposedDestinations:0,aliases:readerAliases.length};
Object.assign(result,auditReviewedDestinationLedger(plan,reviewed,pages));
for(const t of plan.topics)if(!pages.has(t.slug))result.missingReaders.push(t.slug);
for(const [slug,page] of pages){
  if(!plan.topics.some(t=>t.slug===slug))result.unexpectedReaders.push(slug);
  if(page.duplicates.length)result.duplicateIds.push({slug,ids:page.duplicates});
  for(const m of page.html.matchAll(/href=(["'])\/atlas\/([^"'?#]+)(?:#([^"'?]+))?\1/g)){
    const target=pages.get(m[2]);
    if(target&&m[3]&&!target.ids.has(m[3]))result.brokenCanonicalLinks.push({from:slug,to:m[2],anchor:m[3]});
  }
}
for(const s of plan.sourceLedger){
  try{
    const body=await readFile(path.join(root,s.source));
    const sha256=createHash('sha256').update(body).digest('hex');
    if(sha256!==s.sha256)result.sourceChanges.push({source:s.source,status:'changed',expected:s.sha256,actual:sha256});
  }catch{result.sourceChanges.push({source:s.source,status:'missing or unreadable'});}
  if(s.primaryDestination?.startsWith('/atlas/')){
    const [slug,anchor]=s.primaryDestination.slice(7).split('#');
    const target=pages.get(slug);
    if(!target||anchor&&!target.ids.has(anchor))result.missingProposedDestinations.push({source:s.source,destination:s.primaryDestination,reason:target?'anchor absent':'reader absent'});
    else result.validProposedDestinations++;
  }
}
result.reviewedCandidates=reviewed.entries.length;
result.invalidReviewedCandidates=[];
result.reviewedFragmentCandidates=0;
const seenSources=new Set();
for(const entry of reviewed.entries){
  const source=plan.sourceLedger.find(s=>s.source===entry.source);
  if(!source||source.sha256!==entry.sha256||source.originalRoute!==entry.originalRoute||seenSources.has(entry.source))result.invalidReviewedCandidates.push({source:entry.source,reason:'identity/fingerprint/duplicate'});
  seenSources.add(entry.source);
  const fragmentMap=entry.oldFragmentDestinations||{};
  if(Object.keys(fragmentMap).length){
    const body=await readFile(path.join(root,entry.source),'utf8'),slugger=new GithubSlugger();
    const headingIds=new Set();let fence=null;
    for(const line of body.split('\n')){
      const boundary=line.match(/^\s{0,3}(`{3,}|~{3,})/);
      if(boundary){if(!fence)fence=boundary[1];else if(boundary[1][0]===fence[0]&&boundary[1].length>=fence.length)fence=null;continue;}
      if(!fence){const heading=line.match(/^#{1,6} (.+)$/);if(heading)headingIds.add(slugger.slug(heading[1]));}
    }
    for(const fragment of Object.keys(fragmentMap)){
      result.reviewedFragmentCandidates++;
      if(!headingIds.has(fragment))result.invalidReviewedCandidates.push({source:entry.source,fragment,reason:'original Markdown heading absent'});
    }
  }
  for(const destination of [entry.destination,...(entry.additionalDestinations||[]),...Object.values(fragmentMap)]){
    const [slug,anchor]=destination.replace(/^\/atlas\//,'').split('#');
    if(!pages.has(slug)||!anchor||!pages.get(slug).ids.has(anchor))result.invalidReviewedCandidates.push({source:entry.source,destination,reason:'destination absent'});
  }
}
async function walk(dir){const all=await readdir(dir,{withFileTypes:true});return (await Promise.all(all.map(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat();}
// The old proposal records historical intended anchors. Actual reviewed routes
// are a distinct gate: an existing reader or empty archive is not enough.
result.retainedSources=plan.sourceLedger.filter(s=>s.publicBody).length;
result.sourceRecovery={gitEqual:0,notGitRecoverable:[],differsFromGit:[],privateSnapshots:[]};
for(const s of plan.sourceLedger){
  const recoverySource=s.source==='docs/ai/training/optimization/multi-harness-agentic-rl.md'?'.internal/v2/recovery/multi-harness-agentic-rl.md':s.source;
  const saved=spawnSync('git',['show','HEAD:'+recoverySource],{cwd:root});
  if(saved.status!==0){result.sourceRecovery.notGitRecoverable.push(s.source);continue;}
  const sha=createHash('sha256').update(saved.stdout).digest('hex');
  if(sha!==s.sha256)result.sourceRecovery.differsFromGit.push({source:s.source,expected:s.sha256,git:sha});
  else{result.sourceRecovery.gitEqual++;if(recoverySource!==s.source)result.sourceRecovery.privateSnapshots.push({source:s.source,recoverySource});}
}
result.unreviewedRetainedRoutes=[];
result.routeReviewDisagreements=[];
result.routesWithoutPrivateReview=[];
result.retiredSources=plan.sourceLedger.filter(s=>!s.publicBody).map(s=>({source:s.source,action:s.action}));
result.retirementNotices=Object.keys(retiredNavigation).length;
result.retirementDisagreements=[];
for(const s of plan.sourceLedger.filter(s=>!s.publicBody&&s.action!=='replace-navigation')){
  const actual=retiredNavigation[s.originalSlug];
  if(!actual||JSON.stringify(actual.related?[actual.related]:[])!==JSON.stringify(s.targets)||reviewedNavigation[s.originalSlug])result.retirementDisagreements.push(s.source);
}
for(const slug of Object.keys(retiredNavigation))if(!plan.sourceLedger.some(s=>!s.publicBody&&s.originalSlug===slug))result.retirementDisagreements.push(slug);
for(const s of plan.sourceLedger.filter(s=>s.publicBody)){
  const old=s.originalRoute.replace(/^\/atlas\//,''),actual=reviewedNavigation[old];
  if(!actual)result.unreviewedRetainedRoutes.push({source:s.source,plannedDestination:s.primaryDestination});
}
for(const entry of reviewed.entries){
  const old=entry.originalRoute.replace(/^\/atlas\//,''),actual=reviewedNavigation[old];
  if(!actual||entry.destination!=='/atlas/'+actual.slug+'#'+actual.anchor)result.routeReviewDisagreements.push({source:entry.source,reason:'default destination differs'});
  for(const [fragment,destination] of Object.entries(entry.oldFragmentDestinations||{})){
    const resolved=resolveReviewedNote(old+'#'+fragment);
    if(destination!=='/atlas/'+resolved?.slug+'#'+resolved?.anchor)result.routeReviewDisagreements.push({source:entry.source,fragment,reason:'fragment destination differs'});
  }
}
for(const old of Object.keys(reviewedNavigation))if(!reviewed.entries.some(e=>e.originalRoute==='/atlas/'+old))result.routesWithoutPrivateReview.push(old);
const baseline=new Set(plan.sourceLedger.map(s=>s.source));
for(const file of await walk(path.join(root,'docs')))if(/\.mdx?$/.test(file)&&!baseline.has(path.relative(root,file)))result.newSources.push(path.relative(root,file));
if(process.argv.includes('--summary')){
  const {missingProposedDestinations,...summary}=result;
  console.log(JSON.stringify({...summary,historicalProposedDestinationGaps:missingProposedDestinations.length},null,2));
}else console.log(JSON.stringify(result,null,2));
// Draft route gaps are reported, not hidden by an alias or silently waived.
if(result.missingReaders.length||result.unexpectedReaders.length||result.duplicateIds.length||result.brokenCanonicalLinks.length||result.sourceChanges.length||result.invalidReviewedCandidates.length||result.reviewedPrimaryDestinationErrors.length||result.routeReviewDisagreements.length||result.routesWithoutPrivateReview.length||result.retirementDisagreements.length||result.sourceRecovery.differsFromGit.length)process.exitCode=1;
