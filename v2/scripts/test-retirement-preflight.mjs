import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {retirementPreflight,inspectRetirementPreflight} from './retirement-preflight.mjs';
const bytes=Buffer.from('unique knowledge\n'),commit='a'.repeat(40),source='docs/topic/original.md';
const entry={source,originalRoute:'/atlas/topic/original',originalSlug:'topic/original',action:'absorb-topic',publicBody:true,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,reviewedPrimaryDestination:'/atlas/models/example#mechanism',targets:['models/example']};
const input={entries:[entry],commit,readCurrent:async()=>bytes,readCommitted:async()=>bytes,routeFor:()=>({kind:'moved',destination:entry.reviewedPrimaryDestination}),destinations:new Set([entry.reviewedPrimaryDestination]),actualSources:[source]};
const run=overrides=>retirementPreflight({...input,...overrides});
const good=await run({});assert.equal(good.gitEqual,1);assert.deepEqual(good.blockedSources,[]);assert.equal(good.readyForRemoval,false);assert.equal(good.removalAuthorized,false);
assert.deepEqual(good.rows[0].recovery.gitShowArgs,['show',commit+':'+source]);
const snapshot='.internal/v2/recovery/multi-harness-agentic-rl.md';
const privateRecovery=await run({entries:[{...entry,recoverySource:snapshot}],readCommitted:async(ref,p)=>{assert.equal(ref,commit);assert.equal(p,snapshot);return bytes;}});
assert.equal(privateRecovery.gitEqual,1);assert.deepEqual(privateRecovery.blockedSources,[]);
assert.deepEqual(privateRecovery.rows[0].recovery.gitShowArgs,['show',commit+':'+snapshot]);
assert.equal(privateRecovery.readyForRemoval,false);
const pendingSnapshot=await run({entries:[{...entry,recoverySource:snapshot}],readCommitted:async()=>{throw Error('not committed yet');}});
assert(pendingSnapshot.blockedSources[0].blockers.includes('pinned-git-object-unavailable'));
for(const unsafe of ['../secret.md','.internal/v2/recovery/../secret.md','/private/tmp/source.md'])await assert.rejects(run({entries:[{...entry,recoverySource:unsafe}]}),/Unsafe private recovery/);
const before=JSON.stringify(entry);await run({});assert.equal(JSON.stringify(entry),before,'Input ledger must not be mutated');
let mutations=0;
for(const [overrides,blocker] of [
  [{readCurrent:async()=>Buffer.from('edited\n')},'current-source-differs-from-baseline'],
  [{readCommitted:async()=>Buffer.from('old\n')},'current-source-differs-from-pinned-git'],
  [{readCurrent:async()=>{throw Error('missing or symlink');}},'current-source-unreadable-or-unsafe'],
  [{readCommitted:async()=>{throw Error('not in pinned commit');}},'pinned-git-object-unavailable'],
  [{routeFor:()=>null},'reviewed-destination-missing-or-different'],
  [{routeFor:()=>({kind:'moved',destination:'/atlas/models/example#other'})},'reviewed-destination-missing-or-different'],
  [{destinations:new Set()},'reviewed-destination-missing-or-different'],
  [{entries:[{...entry,bytes:entry.bytes+1}]},'current-source-differs-from-baseline'],
]){const bad=await run(overrides);assert(bad.blockedSources[0].blockers.includes(blocker),blocker);assert.equal(bad.readyForRemoval,false);mutations++;}
for(const badPath of ['/docs/original.md','docs/../original.md','docs/topic;echo/original.md','docs/topic/original.md\n','docs/','docs/topic/*']){await assert.rejects(run({entries:[{...entry,source:badPath}]}),/Unsafe/);mutations++;}
await assert.rejects(run({entries:[entry,entry]}),/duplicate/);mutations++;
await assert.rejects(run({commit:'HEAD'}),/pinned full/);mutations++;
await assert.rejects(run({entries:[{...entry,sha256:'bad'}]}),/Invalid baseline/);mutations++;
const extra=await run({actualSources:[source,'docs/new-note.md']});assert.deepEqual(extra.unexpectedSources,['docs/new-note.md']);mutations++;
const retired={...entry,publicBody:false,action:'retire-public-artifact',reviewedPrimaryDestination:undefined};
const notice=await run({entries:[retired],routeFor:()=>({kind:'retired-notice',related:'models/example'})});assert.deepEqual(notice.blockedSources,[]);assert.equal(notice.readyForRemoval,false);
for(const route of [{kind:'moved',destination:entry.reviewedPrimaryDestination},{kind:'retired-notice',related:'models/other'}]){const bad=await run({entries:[retired],routeFor:()=>route});assert(bad.blockedSources[0].blockers.includes('retirement-notice-missing-or-different'));mutations++;}
const nav={...retired,action:'replace-navigation',targets:[]};
assert.deepEqual((await run({entries:[nav],routeFor:()=>({kind:'navigation',destination:'/atlas/'})})).blockedSources,[]);
assert((await run({entries:[nav],routeFor:()=>null})).blockedSources[0].blockers.includes('navigation-replacement-missing'));mutations++;
// Actual repository evidence: exact source paths, pinned recovery, routes and extras.
const actual=await inspectRetirementPreflight();assert.equal(actual.sourceCount,232);assert.equal(actual.gitEqual,232);assert.deepEqual(actual.unexpectedSources,[]);
assert.deepEqual(actual.blockedSources,[]);
assert.equal(actual.rows.filter(r=>r.route?.kind==='moved').length,206);assert.equal(actual.rows.filter(r=>r.route?.kind==='retired-notice').length,25);assert.equal(actual.rows.filter(r=>r.route?.kind==='navigation').length,1);
for(const row of actual.rows){assert.equal(row.currentSha256,row.baselineSha256);assert.equal(row.recovery.commit,actual.recoveryCommit);if(row.recovery.byteEqual)assert.equal(row.recovery.sha256,row.baselineSha256);}
assert.equal(actual.readyForRemoval,false);assert.equal(actual.removalAuthorized,false);
console.log(`Retirement preflight:232exact source bodies,232byte-equal pinned recoveries including the private harness snapshot,206reviewed routes,25notices,one navigation and${mutations}drift/safety mutations pass. No automatic deletion approval implied.`);
