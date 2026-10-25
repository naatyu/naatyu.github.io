import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {agentsReader,agentsAliases} from '../prototypes/readers/agents.js';
import {reviewedFragments,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
const root=new URL('../../',import.meta.url),html=agentsReader(s=>s);
const ledger=JSON.parse(readFileSync(new URL('.internal/v2/agents-harness-closure.json',root),'utf8'));
assert.equal(ledger.sources.length,1);const e=ledger.sources[0],path='docs/'+e.slug+'.md',body=readFileSync(new URL(path,root),'utf8');
assert.equal(createHash('sha256').update(body).digest('hex'),e.sha256);
assert.equal(e.recovery.state,'private-snapshot-committed');assert.equal(e.recovery.gitRecoverable,true);assert.equal(e.recovery.retire,false);
assert.equal(e.recovery.snapshot,'.internal/v2/recovery/multi-harness-agentic-rl.md');
assert.equal(readFileSync(new URL(e.recovery.snapshot,root),'utf8'),body,'Private recovery snapshot must preserve exact original bytes');
assert.equal(e.recovery.snapshotGitState,'committed');
const stored=spawnSync('git',['show','HEAD:'+e.recovery.snapshot],{cwd:root,encoding:'utf8'});assert.equal(stored.status,0);assert.equal(stored.stdout,body);
// Tracking an archived original does not publish it in the new site's artifact.
const legacy=spawnSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'});if(legacy.status===0)assert.equal(legacy.stdout,body);
const g=new GithubSlugger(),ids=[...body.matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));
assert.deepEqual(Object.keys(e.headings),ids);assert.equal(ids.length,13);assert.deepEqual(reviewedFragments[e.slug],e.headings);
assert(agentsAliases.includes(e.slug));assert(!html.includes(e.slug));assert(!/!\[|<img\b|<PaperFigure\b|^import /m.test(body));
for(const old of ids){const d=resolveReviewedNote(e.slug+'#'+old);assert.equal(d.slug,'post-training/agents');assert(html.includes('id="'+d.anchor+'"'));}
for(const url of new Set([...body.matchAll(/https:\/\/[^\s)]+/g)].map(m=>m[0])))assert(html.includes(url),url);
assert.equal((html.match(/class="katex-display"/g)||[]).length,14);assert.equal((html.match(/<math /g)||[]).length,18);
for(const text of ['CSV-script repair','unsupported tool','processed sampling probabilities','Prompt tokens and tool observations','rewritten context','42.2%','54.2%','52.3%','1.9 percentage-point','one seed','unequal data exposure','different compute','All four evaluation harnesses','31%','both the base and multi-harness models solve','No LFM ablation','same task and harness','Equal episode counts','equal gradient influence','bounded bonus','not verified FineEnvs results'])assert(html.includes(text),text);
assert(!html.includes('Original notes and report context'));
console.log('Multi-harness closure: unchanged SHA,13 exact headings,all citations,14 display formulas and Git-equal private recovery snapshot pass. No public original or historical-publication claim.');
