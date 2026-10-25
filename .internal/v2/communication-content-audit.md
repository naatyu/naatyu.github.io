# GPU Communication — preservation and source audit

## Traffic/scratch notation and readable comparison — 2026-10-12

Previous goal turn fixed sharedMathMLnamespaces. Fresh guide/skill/current tracker,topic audit and Low-Latency original body reread;current comparison/rank domains and pure volume model reviewed. Raw queue had two candidates:a numerical scene summary and an API parameter,not two equations requiring conversion. API parameter now uses inline code;summary deliberately remains text. Instead typeset the ten actual wire/scratch expressions and rank domain. DefineN,M,Dbeside the table,retain per-GPU/outgoing-versus-bidirectional and epoch-versus-allocator boundaries,mark atomic traffic/scratch approximate. No reported result,benchmark condition or mathematical model changed;no new full primary/code review claimed.

Native initial table inspection found squeezed mobile words and tiny inline fractions. Final table uses480pxminimum width,full-size fractions,caption scroll instruction and existing named/focusable wrapper. Dedicated parsed-section test checks allten exact expression annotations in order,N≥2,units/ownership caveats andminimum width. Independent volume tests now also count scratch regions and LLflag bytes over the existing1,134volume settings,including explicit atomic-approximation state. Existing2,031total model cases and326rendered bodies pass. Reader5display+12inline17MathML;publication2026-07-21retained,updated2026-10-12.

Focused56024exit0/buildNX6ihU preceded final fraction/width repair;initial full18086exit0/staticfv3wfu was also before that repair. Final full47-script21853 began after all reader/test edits and reached observed terminal exit0. Static1F6XDI54/206/25/3235/535displays/15images/544files/zero old dependencies;namespace guard covers1075static formulas. Final candidate8dM0vg builds successfully.

Native8dM0vg at1280/390px:final table and both mobile endpoints visually inspected. Mobile wrapper258px/table480px,ArrowRight40px then222pxmaximum with focus;labels/fractions readable,no page/parser overflow andempty warning/error logs. Viewport reset/temporary tabclosed;initial preview41482andfinal73835both stoppedexit130. Rawqueue193manual candidates,Communicationone intentional scene summary. This is not CUDAordering/numerical/GPUperformance,complete external source,screen-reader/lifecycle or production certification. Original fingerprints remain unchanged under dedicated tests;no source retirement,commit,push or deployment;goalactive.

Updated 2026-10-06. Canonical topic `execution/communication`. **Integrated local draft: 43 searchable sections, approximately 5,966 rendered words and four original interactive explanations.** Corpus has 52 local readers (one pilot, 51 drafts), zero production-ready/deployed. Original retirement and old-route aliases remain prohibited until coverage and route checks pass.

## Scope and unchanged originals

Approved source list comes from `dense-preservation.json` and `dense-notes-catalog.md`, not title similarity.

| Original | Lines read to EOF | SHA256 | Publication |
| --- | ---: | --- | --- |
| `docs/systems/parallel-computing/low-latency-gpu-collectives.md` | 255 | `43bfb8254040ac5c4185c25db0f240dec7c461ec64a237d092615daabb264976` | 2026-07-21 |
| `docs/systems/parallel-computing/nccl-internals-protocols-algorithms-and-transports.md` | 385 | `b19e2013b8c883785481c2bd712967814595ab7236c5da1e39c0a3de780c272b` | 2026-08-05 |

640 original lines reviewed. Neither original imports JSX or images. Two text diagrams describe API hierarchy and socket staging; both relationships need a destination. Preserve the earliest publication date, not the migration date. Reader metadata should use English title GPU Communication, browse category Execution and updated date of the reader integration.

Cross-owner check: `parallelism.js` already owns collective semantics from tensor ownership, ring-volume convention, TP/EP motivation, topology placement and overlap. It does not own low-level readiness, transport machinery or buffer-credit implementation. Link to its stable `#collectives`, `#tensor`, `#experts`, `#topology` and `#rooflines` anchors. Performance owns matching bytes to relevant bandwidth and exposed-time accounting; Profiling owns critical-path investigation. Keep communication-specific mechanisms here rather than repeating full model sharding explanations.

## Explanatory spine and explicit preservation destinations

The reader should move from required result to schedule, implementation pipeline, physical path, and small-message readiness. Introduce one-/two-shot only after ring phases and decode critical-path costs are concrete. Explain safety before the experimental low-latency results. Stable lookup sections can be long without becoming disconnected cards.

| Original material / unique detail | Implemented section | Treatment and conditions |
| --- | --- | --- |
| Collective/rank/AllReduce definitions; scale-up not necessarily one host | `question`, `contracts` | Brief result contract plus tensor-owner links. Separate data arrival, visibility, consumption and safe reuse. |
| Decode activation B×width×element bytes; context→KV pressure→smaller batch | `decode-latency` | Explain causal path; not all serving systems reduce batch this way. |
| α+M/β, L×C×collective, repeated tiny operations | `latency-regimes` | Declare effective path and exposed critical path; summing durations does not establish exposed time. |
| Algorithm/protocol/transport/channels four independent dimensions | `four-dimensions` | Aligned comparison with concrete ring/LL128/NVLink example. No six-protocol typo from paper. |
| Communicator APIs, five collectives, Send/Recv, grouped calls | `api-plan` | Preserve ordering/deadlock reasons and enqueue-versus-completion semantics. |
| One process/GPU, one thread/GPU, one thread/multiple GPUs | `launch` | Affinity/isolation/IPC and grouped multi-device calls, not simple guaranteed concurrency ranking. |
| Local communicator topology reuse; predecessor/successor; parent/children | `topology` | Explicit logical versus physical edges. |
| Double binary tree mirrored/shifted; internal-node division | `trees` | Historical NCCL construction; inspect source before exact algorithm code. |
| Channels→blocks; regions; active channel mask; startup metadata warps | `channels`, `cuda-mapping` | No exclusive or unique SM allocation guarantee. CUDA scheduling/resources matter. |
| More channels vs SM/scratch/partial FIFO/QP fragmentation | `channels` | 512KiB Simple slot belongs to analyzed release. Increasing parallelism can hurt payload efficiency. |
| workOffset/channelCount/loopCount/chunkCount and final chunk | `buffer-pipeline` | Original annotated partition diagram; partial regions and explicit offsets. |
| Eight circular slots; Simple/LL/LL128 capacities and payload | `buffer-pipeline` | Preserve exact MiB/KiB table; separate capacity from effective payload. |
| Produced/queued/in-flight/reduced/consumed; head/tail prevents overwrite | `credits` | Exact bounded producer–consumer model; not eight arbitrary concurrent network operations. |
| Vector units, warp-uniform roles, SM/register/cache/HBM contention | `cuda-mapping` | Collective uses GPU resources even if observed bottleneck is network. |
| send/recv/copySend/RCS/RRS/RRC/RRCS/direct variants | `primitives` | Fused receive→local reduction→forward example; retain AllToAll fixed-peer limitation. |
| Ring AR step table; endpoint actions vs rounds | `ring` | 2k−1 primitive actions versus2(k−1) transfer rounds, including k=2 empty intermediate ranges. Exact contribution trace. |
| AG initialize/send/intermediate/finalrecv; RS finalowned shard | `ring-variants` | k−1 hops plus endpoint convention; no accidental double counting. |
| Tree role table; chain-like Ring Broadcast/Reduce; pipelining | `trees`, `pipeline-boundaries` | Across-outer-region classification is not absence of channel/chunk overlap. |
| CollNet/SHARP/NVLS support matrix; TreeAR; laterPAT | `offloads` | Historical release boundary; no comprehensive current support claim. |
| P2P NVLink/PCIe; same-process DIRECT; IPC avoidance; bypassFIFO | `local-paths` | Pointer scope and head/tail remain required. |
| SHM staging can beat poor cross-socket P2P; local NIC path | `local-paths` | Preserve unusual route; CROSS_NIC is not a transport selector. |
| Socket GPU→host→TCP→host→GPU; CPUproxy | `network-paths` | Preserve explicit staging diagram and control/data separation. |
| IB/RoCE RDMA and GDRDMA; peermem/DMA-BUF registration | `rdma` | GPU-NIC topology plus supported stack; not same-switch-only universal restriction. |
| Logical connections, QPs, ECMP entropy, striping | `rdma-queues` | Correct paper's QPS parameter conflation; keep historical two logical bundles distinct from configurable QPs. |
| Bulk WRITE+WITH_IMM; size/notification; CTSaddress/rkey/tag | `rdma-queues` | Control/head-of-line reasoning; version-scoped patterns. |
| Loopback READ flush on receiving communicator | `visibility` | Explicit receive-side PCIe visibility; not remote user-data fetch or sender-only flush. |
| Simple fences, LL4+4/8B, LL128120+8/128B | `protocols` | 50% and93.75% payload ratios; hardware/path visibility requirements not generic 128B CUDA atomic. |
| Historical6/1/2µs; LL25–50%peak; host-residentLLnetwork | `protocols` | Preserve as explanatory historical values, not measured current thresholds or wire ratios. |
| ForcedNCCL_PROTO vs autotuning; one experiment notworkloadwinner | `diagnosis` | Verify supported version combinations and change one variable. |
| Push remote stores vs pull receiver loads; latency/scratch tradeoff | `push-pull` | Original per-GPU actor/ownership trace, same exact reduction. RTT comparison belongs to evaluated fabric. |
| One-shot/allpeerfullreduction vs two-shotRS+AG; scratch/rank scaling | `one-two-shot` | Distinguish perGPU volume from cluster aggregate. Flag overhead separate from algorithm. |
| GB200barrier>1µs;twoof5µs≈40%; no-globalbarriernotno-sync | `readiness` | Scoped source measurement; readiness remains required. |
| Embedded data+epochLL and sentinelnegativeNaN | `readiness`, `sentinels` | Bit-pattern/data restrictions; send/recvtypesmatch; reset visibility before reuse. |
| Double buffering prevents overwrite under bidirectional exchange | `double-buffering` | Receive serves as implicit credit. Show ungated counterexample. Two slots alone insufficient. |
| Atomic LL128 groups8threads×16B;flagcarrier displaced value;496+16threads | `atomic-reduction` | Restore displaced payload; FP16uses8extra; two phases plus completioncount. Hardware-specific kernel, not generic JS/GPU equivalence. |
| Atomic reduction nondeterminism/reproducibility | `atomic-numerics` | Owner reduces then distributes same result; independent atomics at every rank can yield distinct outputs. Precision/error bounds need assumptions. |
| Deviceinitiated APIs; symmetric scratch/VMM/load-storeaccess | `device-api`, `symmetric-memory` | Device initiation removes particular host edges, not all coordination universally. |
| LLBuffer methods and compiletimeunroll;CTA/epoch address;roundRobinFactor | `device-api` | Concise illustrative pseudocode; link exact source for full implementation. |
| NVLSmulticast/reduction smallrankoverhead/largescaling | `offloads` | Hardware semantics and registration gates; not fastest at every size. |
| SoLdata path;2×L2RTT+remote store;assumptions | `sol-bound` |0.306/0.792µs→1.404µs; exclude instruction/reduction/finalstorecompletion as paper does. Not full request-completion bound. |
| GB2002–64microbench;10trialsmeanstd;7%twoGPU | `microbenchmarks` | Version/precision/ranks/baseline availability;64rank~70% is not same observation as2rank7%. |
| LL/sentinelscrossover;two/atomicmedium;MCscaling | `microbenchmarks` | Source-specific regimes; no universal message cutoff. |
|8GPU32MiB64CTA512threads scratchsweep;4MiB/64MiBchosen | `scratch-tuning` | Larger scratch not monotonic improvement; define per-epoch versus complete allocation. |
| vLLMTP4/8,100–200Kcontext,16Koutput,batch8,5trials | `serving-evidence` | TP8 spans two physical nodes inside same NVLinkdomain; baselinelegacykernels. |
|7–13%/9–11%ITL, throughput walltimeincludesprefill | `serving-evidence` | Percent improvement denominator explicit, SymMem changes available kernels. |
|>$11/1Moutput cost estimateDeepSeekV3TP8 | `cost-boundary` | Historical CoreWeave input and simplifiedGPUprice/rate, not current quote/full disaggregated deployment economics. |
| cuSOLVERMp improvements outsideLLM | `hpc-evidence` | Separate GH200/Alpssingle-node setup; preserve5trials/version/matrices; Fig14+7.0%/+1.5% not misattributeGB200. |
| Nine debugging steps and ATLAHS primitive/GOAL simulation | `diagnosis`, `simulation` | <5%error belongs to evaluatedcases, notgenericcertificate. |
| NVIDIA/scale-up scope, hardware dependence, data/scratch/numeric limits | Allmechanismsections + `selection` | Attach caveats to the applicable mechanism after its explanation. |
| Originalrelatedandprimarylinks | `sources` + mechanism sections | Preserve source provenance; use canonicalowner where implemented, legacyroute only whenstillneeded. |

## Primary and figure review evidence

Read the body of [Every Microsecond Matters](https://arxiv.org/html/2607.16100v1) through conclusion and its reference tail. Read [Demystifying NCCL v3](https://arxiv.org/html/2507.04786v3) through conclusion and references; HTML table extraction checked against rendered PDF where it loses column layout. This is not a complete independent verification of every referenced paper or every NCCL device file.

Downloaded PDFs to `/private/tmp/atlas-communication.4DA7UO/` solely for reading. Web screenshots did not expose pixels through the orchestration wrapper; used local Poppler renders and image inspection instead. Reviewed:

- Low-latency PDFp4 Fig4: bidirectional two-buffer epochs; p5 Fig5 andTableI: flagcarrier/displaced payload, perGPUvolumes/scratch; p8 Fig9/10:APIandSoL; p9 Fig11/12:microbench/scratch; p10 benchmark availability and case setup; p11 Fig13/14:serving andGH200eigensolver.
- NCCLPDFp5 Fig2:SocketversusIBpaths; p7 Fig3/TableIV:partition andslots; p8TableV:primitivecounts; p9Fig4:four-rank ring; p10Fig5:tree; p11Fig6:AllReduceprotocolregimes; p14Fig7:othercollectives.
- Fig6's right panel has an apparent unit inconsistency: main intra-node y-axis says ms, inset values have decimal scaling that suggests another convention. Do not silently relabel or deduce exact intra-node latencies from this plot. Retain qualitative comparison and flag the published-axis issue if embedding.
- Original code-native diagrams are preferable to importing whole busy figures. If importing excerpts later, verify the displayed CC-BY-SA4 license/attribution/share-alike requirements and use readable crops with exact captions/axes. No source figure asset is imported yet.

Targeted [current NCCL2.32.3 environment documentation](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/env.html) checked on2026-10-06: CROSS_NIC concerns inter-node rail/NIC choices, QPS_PER_CONNECTION default1, split mode versus round-robin behavior changed after2.19, GDRpathcutoffs notsame-switch-only. [Group documentation](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/groups.html) distinguishes aggregated enqueue, matching issuing order and nonblockingGroupEnd completion state. This is targeted documentation review, not an installation-specific runtime test.

Source [v2.19.1-1 net_ib.cc](https://raw.githubusercontent.com/NVIDIA/nccl/v2.19.1-1/src/transport/net_ib.cc) targeted reads show default QP1 (line465 in displayed source) and `ncclIbIflush` on `recvComm` (lines1171–1199), confirming that logical connection bundles and queue-pair count must not be conflated. The same locations were checked in v2.19.3-1. This is not a complete transport source audit.

## Corrections to preserve explicitly

1. Double buffering needs a causal reuse credit. Without it, fast writes0,1,2 overwrite unread0. The original's unconditional prevention statement is insufficient.
2. TableI low-latency traffic is **per GPU**. Cluster outgoing bytes multiply byN; incoming+outgoing totals need another boundary. One-shot versus two-shot wire cost also depends on flag overhead.
3. “Six protocols” in NCCLpaper is a category typo: listedRing/Tree/CollNet/NVLSarealgorithms. Keep three historical protocol families separate.
4. QPS_PER_CONNECTION is not evidence for two defaultlogicalconnections; inspected source and currentdocsdefault1. Record source disagreement rather than erase the issue.
5. CROSS_NIC is not a general force-network transport switch. GDRcapability is not universally restricted to onePCIeswitch.
6. Flush protects **receive-side**visibility. The paper's sender phrasing conflicts with receivingcommimplementation.
7.128Bcacheline visibility/atomicity assumption is a hardware+path condition; do not teach general CUDA128Batomicstores.
8. Oneactivechannel→oneblock does notmeanoneexclusiveSM. MorechannelsconsumeGPUresourcesandcanfragmentnetworktraffic.
9. “Nonpipelined” is scoped to outerloopregions in the paper. It does not deny slot/channelparallelism. Primitiveactioncounts are nottransferroundcounts.
10.SoL excludes finalstorecompletion/instruction/reductioncost under optimisticcache/parallelpeer assumptions.1.404µsisnot requestlatency or universalfull-completion bound.
11.Serving,HPCandmicrobench evidence use differenthardware/software/baselines. Cost is historicalhypotheticalGPU-rateconversion,notcurrentfinancialguidance.

## Implemented mathematical foundations

`v2/prototypes/readers/communication-model.js` supplies:

- one-/two-shot push/pull traces with explicit initiating actor, offset and exact values;
- ring reduce-scatter plus all-gather with intermediate contributor sets and ownership;
- separate algorithm payload/wire/scratch-per-epoch accounting; atomic values explicitly approximate;
- bounded circular producer/consumer queue with refusal at full/empty and exact epoch slots;
- bidirectional two-peer send/consume exchange with credit and an ungated overwrite counterexample.

`node v2/scripts/test-communication-model.mjs` passes **2,031** independently checked cases. Tests sum input elements separately, enumerate traffic edges, verify every ring intermediate contributor/value, explore reachable queue states and all two-peer interleavings through four epochs, reject invalid sizes, verify unchanged input and both originalSHA256. An initial test exposed JavaScript signedzero in a zero-valued local cell; numerical equality now handles±0 without losing exact integer checks elsewhere.

These are sequentially consistent conceptual models. They do **not** establish CUDA memory ordering, atomic visibility, transport correctness, numerical FP results or kernel performance.

## Reader and visual verification

`communication.js` follows the result contract through schedule, implementation pipeline, physical path, visibility and decode latency before explaining experimental low-latency kernels. Source-scoped benchmark tables remain distinct from conceptual demonstrations. The two original ASCII diagrams have explicit static destinations. Original publication lineage is preserved; aliases remain empty.

`communication-scenes.js` supplies four explanations: exact ring contributions; initiating actors and ownership in one-/two-shot push/pull; receive-buffer epochs with a blocked action; and separately defined payload, wire and scratch accounting. All 326 bounded bodies render in automated tests. Native browser controls exercised all 7 ring, 20 direct, 14 credit and 285 volume settings. Credit matrices and volume results were independently checked in the browser; model tests independently check all ring intermediate values. This is not an independent visual inspection of every SVG value.

Browser QA verified ring play/pause/replay, state retained through section navigation, full-width rendering and a 390×844 layout without document overflow. Keyboard ArrowRight moved the narrow ring region's local scrollLeft to 40px (280px viewport, 724px content). Viewport overrides were reset. Final browser warnings/errors were empty. Review screenshot: `/Users/nathan/Documents/Codex/2026-07-20/new-chat/communication-v2-check.png`. The inherited floating navigation can overlap a scene heading on narrow screens; production accessibility remains open. Actual OS reduced-motion behavior, all cross-navigation cleanup and precise deep-link scroll positioning are not certified by these checks.

## Remaining migration gates

### 2026-10-07 — original-body reconciliation and mathematical rendering

Both complete committed originals freshly reread and compared against all43 integrated sections. Byte equality with HEAD and SHA-256 recovery verified. No original image/JSX assets; both ASCII architecture/data-path relationships remain in the reader. Restored LL128’s network chunk notification boundary and the source-scoped Ring-large/Tree-small benchmark observation. The preservation table above now describes a locally reconciled body, not merely a planned source map. All56 actual Markdown headings have meaningful reviewed destinations; both duplicate local identities removed. MoE’s collectives link now targets the canonical communication reader.

Five displays plus the inline SoL-overhead ratio use explicit TeX/MathML. FIFO epoch domains, additive exposed-latency assumptions, bytes/time units, historical cost boundary and optimistic SoL exclusions are explicit. SoL is aligned over three lines for legible split-pane reading. Dedicated2,031 numerical cases/326 rendered bodies and reader/math checks pass. Native1280/390px:6 MathML expressions,zero parser errors/page overflow; SoL visually inspected and incoming original double-buffering heading resolves correctly. Proof:communication-typeset.png in Codex workspace. No fresh complete source-code/current-runtime certification. Remaining reference/lifecycle/production gates below still apply; physical originals intact.

Final integrated default chain passes all 45 scripts with Communication and Serving present. This does not close primary, legacy-route, accessibility or production gates.

- Inspect remaining primary API/source details (logical connection bundles, symmetric buffer allocation, LLBuffer reset/credit invariants and current device API). Exact2.19.1 QPdefault/receiveflush checks are complete, not a complete source-code verification.
- Complete source-to-section coverage and every original inbound/related route review. Registry, body search, metadata, current canonical related links, dates and prototype visibility pass automated checks; this is not closure of every legacy route.
- Full keyboard/reduced-motion/cleanup/a11y checks; figure licenses if importing; editorial and numerical review of the complete reader.
- Implement and verify both oldURLdestinations only after complete unique coverage. Keep aliasesempty until then.
- Productionstaticreadability, deployment privacy, routes, build and corpus-wide retirement audit remain separate. No original deletion, archive, commit, push or deployment performed.
