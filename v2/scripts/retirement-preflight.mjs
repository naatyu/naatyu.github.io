// Read-only source-body retirement preparation. No removal or publication API.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile,realpath,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {parseFragment} from 'parse5';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
import {reviewedNavigation} from '../site/reviewed-navigation.js';
import {retiredNavigation} from '../site/retired-navigation.js';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourcePattern=/^docs\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\.mdx?$/;
export async function retirementPreflight({entries,commit,readCurrent,readCommitted,routeFor,destinations,actualSources}){
  if(!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(commit))throw Error('Recovery requires a pinned full Git commit ID');
  const seen=new Set();
  for(const e of entries){
    if(!sourcePattern.test(e.source)||seen.has(e.source))throw Error('Unsafe or duplicate exact source: '+e.source);
    if(e.recoverySource!==undefined&&!/^\.internal\/v2\/recovery\/[a-z0-9-]+\.mdx?$/.test(e.recoverySource))throw Error('Unsafe private recovery source');
    if(!/^[a-f0-9]{64}$/.test(e.sha256)||!Number.isSafeInteger(e.bytes)||e.bytes<0||typeof e.publicBody!=='boolean')throw Error('Invalid baseline: '+e.source);
    seen.add(e.source);
  }
  const rows=[];
  for(const e of entries){
    const blockers=[];let current=null,saved=null;
    try{current=await readCurrent(e.source);}catch{blockers.push('current-source-unreadable-or-unsafe');}
    const recoverySource=e.recoverySource||e.source;
    try{saved=await readCommitted(commit,recoverySource);}catch{blockers.push('pinned-git-object-unavailable');}
    const currentSha=current===null?null:sha(current),gitSha=saved===null?null:sha(saved);
    if(current!==null&&(currentSha!==e.sha256||current.length!==e.bytes))blockers.push('current-source-differs-from-baseline');
    if(current!==null&&saved!==null&&!current.equals(saved))blockers.push('current-source-differs-from-pinned-git');
    const route=routeFor(e);
    if(e.publicBody){
      if(!route||route.kind!=='moved'||route.destination!==e.reviewedPrimaryDestination||!destinations.has(route.destination))blockers.push('reviewed-destination-missing-or-different');
    }else if(e.action==='replace-navigation'){
      if(!route||route.kind!=='navigation'||route.destination!=='/atlas/')blockers.push('navigation-replacement-missing');
    }else if(!route||route.kind!=='retired-notice'||JSON.stringify(route.related?[route.related]:[])!==JSON.stringify(e.targets))blockers.push('retirement-notice-missing-or-different');
    rows.push({source:e.source,originalRoute:e.originalRoute,action:e.action,baselineSha256:e.sha256,currentSha256:currentSha,recovery:{commit,source:recoverySource,sha256:gitSha,byteEqual:current!==null&&saved!==null&&current.equals(saved),gitShowArgs:saved===null?null:['show',commit+':'+recoverySource]},route:route||null,blockers});
  }
  const unexpectedSources=actualSources.filter(s=>!seen.has(s)).sort();
  return {schemaVersion:1,scope:'Exact original Markdown/MDX bodies only; assets, semantic preservation, hosting and release approval are separate gates.',recoveryCommit:commit,readyForRemoval:false,removalAuthorized:false,sourceCount:rows.length,gitEqual:rows.filter(r=>r.recovery.byteEqual).length,blockedSources:rows.filter(r=>r.blockers.length).map(r=>({source:r.source,blockers:r.blockers})),unexpectedSources,rows};
}

export async function inspectRetirementPreflight(){
  const root=fileURLToPath(new URL('../../',import.meta.url));
  const plan=JSON.parse(await readFile(path.join(root,'.internal/v2/dense-preservation.json'),'utf8'));
  const commit=execFileSync('git',['rev-parse','--verify','HEAD^{commit}'],{cwd:root,encoding:'utf8'}).trim();
  const destinations=new Set();
  for(const meta of readerMetas){
    const html=renderDenseReader(meta.slug,s=>s),prefix='/atlas/'+meta.slug;
    function walk(n){const id=n.attrs?.find(a=>a.name==='id')?.value;if(id)destinations.add(prefix+'#'+id);for(const c of n.childNodes||[])walk(c);}walk(parseFragment(html));
  }
  async function sources(dir){const files=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())files.push(...await sources(p));else if(/\.mdx?$/.test(e.name))files.push(path.relative(root,p));}return files;}
  // User-delegated handling of the sole unpublished local original. The private
  // snapshot must exist in the pinned commit before this check accepts recovery.
  const entries=plan.sourceLedger.map(e=>e.source==='docs/ai/training/optimization/multi-harness-agentic-rl.md'?{...e,recoverySource:'.internal/v2/recovery/multi-harness-agentic-rl.md'}:e);
  return retirementPreflight({entries,commit,destinations,actualSources:await sources(path.join(root,'docs')),
    readCurrent:async source=>{const requested=path.join(root,source);if(await realpath(requested)!==requested)throw Error('Symlink source not accepted');return readFile(requested);},
    readCommitted:async (ref,source)=>execFileSync('git',['show',ref+':'+source],{cwd:root,stdio:['ignore','pipe','pipe']}),
    routeFor:e=>{
      const moved=reviewedNavigation[e.originalSlug],retired=retiredNavigation[e.originalSlug];
      if(moved&&retired)return null;
      if(moved)return {kind:'moved',destination:'/atlas/'+moved.slug+'#'+moved.anchor};
      if(retired)return {kind:'retired-notice',related:retired.related||null};
      if(e.action==='replace-navigation'&&e.originalRoute==='/atlas/')return {kind:'navigation',destination:'/atlas/'};
      return null;
    }});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const report=await inspectRetirementPreflight();const {rows,...summary}=report;
  console.log(JSON.stringify(process.argv.includes('--full')?report:summary,null,2));
  // Report known local-only recovery exceptions, but never advertise deletion readiness.
  if(report.blockedSources.length||report.unexpectedSources.length)process.exitCode=1;
}
