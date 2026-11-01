import {section,table as baseTable,cite} from './topic-tools.js';
import {texEq} from './math.js';
import {packingBudget,icepopMask} from './training-methods-model.js';
const smol='https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook';
const intellect='https://arxiv.org/html/2512.16144v1';
const kimi='https://arxiv.org/html/2507.20534v2';
const table=(caption,heads,rows)=>baseTable(caption,heads,rows)
  .replace('<div class="dense-table-wrap">',`<div class="dense-table-wrap" tabindex="0" role="region" aria-label="${caption}">`)
  .replace('<table>','<table style="min-width:620px">');
const a=(link,slug,label)=>`<a href="${link(slug)}">${label} →</a>`;

export function packingComparison(link){
  const plain=packingBudget(),packed=packingBudget({examplesPerSequence:4});
  return section('packing-budget','Packing also changes the optimizer clock',`
<p>After checking attention boundaries, check the optimization budget. A batch of eight packed sequences can contain many more demonstrations than eight padded sequences. Equal sequence batches do not establish equal learning conditions.</p>
${table('Assigned example: 1,024 demonstrations, 128 tokens each, 512-token sequences',['One epoch','Padded: one example/sequence','Packed: four examples/sequence'],[
  ['Sequences',plain.sequences,packed.sequences],['Sequences per update',8,8],['Non-padding tokens per full update',plain.fullUpdateTokens,packed.fullUpdateTokens],['Optimizer updates',plain.updates,packed.updates],['Total non-padding tokens',plain.tokens,packed.tokens],['Allocated token slots',plain.slots,packed.slots]
])}
<p>Both arms see every demonstration once. Packing uses one quarter of the slots but also one quarter of the updates. Keeping 128 packed updates would instead repeat the data four times. Neither comparison isolates a kernel improvement.</p>
<p>To match this example's token batch and update count, use two packed sequences per update, not eight. This arithmetic assumes identical examples, no truncation, and isolated attention. It predicts neither wall-clock time nor quality.</p>
<p>Also count supervised targets. A packed input can contain long user messages with no direct loss. Preserve the target mask and loss reduction, then retune learning rate under a declared budget. Compare quality at fixed exposure and operational value at fixed accelerator time; report both.</p>
<p>The SmolLM3 SFT experiments report 3–5× throughput and up to 33× more non-padding tokens per update. Large-batch quality losses were specific to their model and dataset, not evidence that packing intrinsically harms learning.</p>
<p>${cite(smol,'Smol Training Playbook: To Pack or Not to Pack?')} · ${a(link,'training/practice#matching','Choose the comparison budget')}</p>`);
}

export function intellectRatios(link){return section('intellect-icepop','INTELLECT-3: mask ratio tails, not just stale versions',`
<p>A version limit bounds policy age. It does not bound probability mismatch. INTELLECT-3 reports mismatch even with identical trainer and inference weights. Its in-flight updates can also mix policy versions within one trajectory.</p>
<p>The denominator must describe the distribution that sampled each token. A checkpoint name alone cannot reconstruct that distribution after temperature, candidate filtering, numerical execution or policy versions change.</p>
${texEq(String.raw`\begin{aligned}r_{i,t}&=\frac{\pi_{\rm train}(y_{i,t}\mid x,y_{i,<t})}{\pi_{\rm infer}(y_{i,t}\mid x,y_{i,<t})}\\\mathcal M(r)&=\begin{cases}r,&0.5\le r\le5\\0,&\text{otherwise}\end{cases}\\\widehat A_{i,t}&=S_i-\frac1G\sum_{j=1}^{G}S_j\end{aligned}`,'IcePop as used in the report. S is a rollout reward; G is its same-prompt group size. The report averages masked ratio × advantage over the original rollout-token count, not the surviving-token count.')}
${table('Assigned positive-advantage example: how the ratio coefficient changes',['Ratio','IcePop coefficient','Clamping to the interval instead'],[.4,.5,1,5,6].map(r=>[r,icepopMask(r),Math.min(5,Math.max(.5,r))]))}
<p>A ratio of six contributes zero through this masked term; it does not become five. This differs from clipping a ratio to an endpoint. It also differs from PPO's signed minimum surrogate. The table shows coefficients, not the complete gradient.</p>
<p>The report uses mean-centered rewards without group-standard-deviation normalization in this expression. Equal group rewards therefore give zero advantages. Masking ratio tails intentionally changes the estimator; do not call the masked objective unbiased importance sampling.</p>
<p>Record behavior log probabilities and segment versions before filtering. Monitor rejection by task and length. Aggressive filtering can remove a whole capability from the accepted batch while token throughput stays high. Reference-policy KL is a separate behavioral anchor.</p>
<p>INTELLECT-3 refills completed rollout-group slots and uses round-robin requests across inference clients. Client balancing is not a harness-family mixing policy.</p>
<p>${cite(intellect+'#S2.SS1','INTELLECT-3 §§2.1.2–2.1.5')} · ${cite(intellect+'#S3.SS3','§3.3: masked importance sampling')} · ${a(link,'post-training/agents#weighted-mixture','Explicit harness-family weights')}</p>`);}

export function environmentEvidence(link){return section('tool-factory-evidence','Kimi K2: scale tool coverage without confusing simulation and execution',`
<p>A tool schema describes an action. It does not prove that the action changed the world. Kimi K2 combines real MCP tool specifications with synthetic specifications, generates agents and rubric-backed tasks, then simulates stateful conversations. A judge filters trajectories. Real execution sandboxes complement simulation for coding and software engineering.</p>
${table('From a tool description to a usable demonstration',['Transition','What to retain','What can still go wrong'],[
  ['Tool set → agent and task','Schemas, system prompt, initial state and rubric','A task can require an unavailable action'],
  ['Task → simulated trajectory','Calls, observations and state changes','A simulator can report an impossible success'],
  ['Trajectory → accepted demonstration','Judge outcome and target masks','A judge can accept a convincing false account'],
  ['Demonstration → real execution test','Independent state checks and failure cases','API validity does not establish real-world transfer']
])}
<p>For example, a booking tool can return valid JSON without reserving a seat. A useful verifier checks the reservation state, duplicate bookings and failure handling. This is an illustrative test design, not a reported Kimi experiment.</p>
<p>Keep three outcomes distinct: verified success, verified task failure, and invalid execution. INTELLECT-3 masks coding completions when their sandbox fails instead of treating the failure as a wrong solution.</p>
<p>Infrastructure failures can depend on trajectory length or tool choice. Masking protects the label but can still bias accepted data. Log invalid rates by task family and rerun independently where practical. For simulated tools, audit state invariants and test held-out real tools. These are proposed checks, not measured guarantees from either report.</p>
<p>${cite(kimi+'#S3.SS1.SSS1','Kimi K2 §3.1.1: agentic data synthesis')} · ${cite(intellect+'#S3.SS1.SSS2','INTELLECT-3 §3.1.2: code verification')} · ${a(link,'post-training/sft#mask','Choose imitation targets')}</p>`);}

export function silentFailures(link){return section('silent-failures','SmolLM3: a running job can still implement the wrong experiment',`
<p>SmolLM3 exposed four different faults: cold-shard eviction, a loader index with excessive shared-memory use, insufficient sequence shuffling, and correlated tensor-parallel initialization. Smooth loss did not reveal the last fault; matched tensor-parallel and nonparallel runs did.</p>
<p>Each fault breaks a different contract. Diagnose the broken contract before changing optimization.</p>
${table('Failure diagnosis: reported causes, proposed checks',['Contract','Reported failure','A targeted check'],[
 ['Delivery','Storage evicted shards; input reads stalled','Soak-test the full working set, not a cache-fitting subset'],
 ['Loader scaling','Index construction depended on the configured run horizon','Hold batches fixed and change the planned horizon; inspect host/shared memory'],
 ['Batch diversity','Adjacent sequences from long documents filled batches','Measure document/source concentration within and across batches'],
 ['Logical initialization','Tensor-parallel shards received correlated initialization','Reassemble logical weights; compare reference and sharded initializations and updates']
])}
<p>Do not translate “shared memory” into an unverified GPU page-fault explanation. Do not fix every random-number stream by assigning arbitrary rank-specific seeds. Replicated tensors must agree; partitioned tensors need the intended logical initialization. Dropout and sampling have their own stream contracts.</p>
<p>A useful regression test compares a small reference model with its distributed form at initialization, forward loss, gradients and one update. Specify tolerances and intended stochastic differences. Then test a full-horizon loader configuration and a full-corpus soak run separately.</p>
<p>${cite(smol,'Smol Training Playbook: The Training Marathon')} · ${a(link,'training/parallelism','Distributed ownership')} · ${a(link,'training/data#checks','Version the stream')}</p>`);}

export function experimentCard(link){return section('experiment-card','Write the comparison before launching the sweep',`
<p>Cheap experiments are useful only if they preserve the mechanism that could change the ranking. SmolLM3 used target-size 3B mixture ablations and later branched annealing tests from a shared checkpoint. Smaller proxies do not automatically preserve data rankings.</p>
${table('An experiment card that can reject its own hypothesis',['Field','Example question'],[
 ['Claim','Does packing improve quality per accelerator-hour, or only reduce padding?'],
 ['Fixed contract','Which checkpoint, data IDs, masks, attention boundaries and evaluation stay fixed?'],
 ['Budget','Are exposure, optimizer updates or accelerator-hours matched? What changes?'],
 ['Promotion gate','Does the result survive a larger scale, longer horizon or held-out task family?'],
 ['Failure gate','What loader, verifier, numerical or restart defect invalidates the comparison?'],
 ['Decision','Which predeclared metric and uncertainty justify changing the recipe?']
])}
<p>Use one-factor changes to locate a cause, then test interactions before freezing the recipe. Keep a ledger of failed runs and tuning budgets. A method that received ten learning-rate trials should not be compared with one untuned baseline without saying so.</p>
<p>For late data changes, branch candidates and a baseline continuation from the same parent. Match continuation exposure and schedule. For RL, also version environments, judges and accepted-sample rules. Otherwise a better score can come from an easier world rather than a better policy.</p>
<p>${cite(smol,'Smol Training Playbook: data-mixture and annealing experiments')} · ${a(link,'post-training/sft#packing-budget','Packing-aware budget example')} · ${a(link,'post-training/agents#transfer','Task versus interface transfer')}</p>`);}
