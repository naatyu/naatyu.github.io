# Atlas v2 — dense topic consolidation

Authoritative proposal, revised 2026-10-03. **Supersedes the earlier 149-reader plan.** This is a plan, not an implemented content migration.

Current route reconciliation (2026-10-12): the ledger retains these original proposals in `primaryDestination`. Its 206 retained sources now also record `reviewedPrimaryDestination`, taken from the reviewed route ledger and checked against rendered sections. Use that reviewed field for current default destinations and the reviewed route ledger for fragment/secondary destinations. This addition does not certify complete semantic preservation or a production switch. Planning-pass statements below describe the original proposal, not the latest implementation; consult `migration-progress.md` and `corpus-worklist.md` for current status.

## The result

**54 substantial topic notes** from 232 current entries. Density means breadth and useful detail within coherent subjects, not verbose prose. A topic note can contain basic intuition, exact derivations, research developments, visualizations, implementation details and source-conditioned examples.

Nathan's personal retrieval, recall and implementation are the primary criteria. This is not a course for visitors, a paper archive, or a collection of solutions to interview problems.

- All 13 existing model reports feed topic notes and source-specific recipe profiles; none automatically becomes a separate public report page.
- All 20 LeetCode solution pages and both cybersecurity challenge write-ups are retired from the public atlas at migration.
- Three incomplete references (GDB, Wireshark, knowledge storage) stay in a recoverable internal backlog rather than becoming filler pages.
- The old Atlas index becomes navigation.
- Source notes remain untouched for this planning pass. Private archiving, public retirement, redirects and new readers are not implemented yet.

Read the [54 note outlines](dense-notes-catalog.md), [232-entry destination map](dense-source-map.md), and [preservation ledger](dense-preservation.json).

## One owner per subject

New research updates its topic note by default. Ask “which section does this change?” before “does this need another page?”

Examples:

- Auxiliary-loss-free routing → MoE, with imbalance motivation, old-method limitations, equations, mechanism/visual, evidence and caveats.
- A new speculative drafter → Speculative Decoding, placed in the architecture comparison/history, with training, cache and scheduler consequences.
- A new distributed execution approach → Parallelism, with the relevant layouts/collectives/topology and link to Communication for lower-level mechanics.
- A new policy-gradient objective → RL, aligned against existing algorithms and normalization/clipping decisions.

Create a new note only for a genuinely independent subject, not because a paper arrived or an existing note became long. First improve internal section navigation, grouping and figures.

## Browsing taxonomy

Folders are views over topics, not ownership silos inherited from old source paths.

| Browsing root | Topic notes |
| --- | --- |
| Models | Transformer Architecture; Attention; Positional Encodings; MoE; Recurrent and Looped Models; Tokenization; Compact Model Recipes; Structured Decisions/Safety; Self-Supervised Vision; Detection; Diffusion; Scientific Discovery |
| Training | Objectives; Optimization; Scaling; Data; Stability; Distributed Training/Parallelism; Pretraining Practice; Numerics; Frontier Model Recipes |
| Post-training | SFT/Adaptation; Preferences; RL; Distillation; Agents/Environments; Reasoning |
| Execution | Decoding; Speculation; Serving; Compute/Memory/Performance; GPU Communication; Profiling/Kernels; GPU Infrastructure |
| Mathematics | Information Theory; Probability; Statistics/Evaluation; Calculus/Optimization Geometry; Vectors/Geometry; Mathematical Problem Solving |
| Algorithms | Choosing Algorithms; Arrays/Hashing; Pointers/Windows; Ordering/Heaps/Selection; Stacks; Trees/Tries; Graphs; DP; Greedy/Intervals; Backtracking; Binary Search; Linked Lists; Bits/Numbers/Geometry |
| General Computing | Distributed Services/System Design |

These are the seven proposed roots; the catalog is authoritative for exact titles/slugs. A small root is acceptable when its subject is genuinely independent.

Model parallelism lives in **Training**, together with the models it trains. GPU communication and profiling live in **Execution**, connected directly from Parallelism, Attention, MoE and Serving. Independent DNS/CDN/database-service material stays in General Computing. There is no AI-versus-Systems wall.

Use secondary tags or aliases for discovery from another category; keep one canonical topic body. NeetCode remains an optional collection pointing to pattern sections, not a root of duplicated pages. Interview motivation does not decide a note's subject.

## Dense notes without unreadable walls

Each note gets:

1. A compact orientation and a searchable section index.
2. Direct access to basics, mechanisms, variants, evidence, implementation and limitations.
3. Stable anchors for important concepts, including aliases for retired source titles.
4. Purposeful visualizations adjacent to the explanation they support.
5. Small code fragments per operation; no hundred-line code walls.
6. Selective expandable derivations/reference tables where useful, while essential content remains visible and statically readable.
7. A few contextual cross-topic links, not a garden of generic related cards.

Do not impose a short-page word target. MoE, RL, Attention, Speculative Decoding and Parallelism may be large: their navigable sections are the unit of focused reading. Rich content is intentional.

A section is not a separate “deep-dive note” merely because it is technical. The 54-topic proposal has no automatic main-page/deep-dive hierarchy.

## Canonical boundaries and links

| Explanation owned by | Local context elsewhere |
| --- | --- |
| MoE: routing, balancing, shared experts, collapse/stability | Parallelism shows how expert dispatch executes; Optimization links back for expert-specific consequences. |
| Parallelism: EP layouts, device meshes, scheduling and network traffic | MoE includes a compact EP diagram and links directly to the execution section. |
| Communication: NCCL, protocols/transports, push/pull and visibility | Parallelism/Serving explain why those communications occur and link to mechanisms. |
| Attention: function, variants, online softmax/FlashAttention | Performance/Profiling discuss bottlenecks and investigation, not a second algorithm proof. |
| Speculative Decoding: correctness, history, all drafter families, caches, implementation | MoE links here only where sparse/looped execution or a report's drafter actually connects. No claim that MoE implies speculation. |
| Information Theory: entropy/KL/JSD coding derivations | Objectives keeps the loss/gradient interpretation and a short local decomposition. |
| Optimization: update rules and batch/LR/schedule choices | Stability owns empirical diagnosis and checkpoint behavior. |
| RL: policy-update math, clipping/normalization and rollout distribution | Agents owns environment/harness/task construction and groupwise grader mechanics; RL links to that section. |
| Vision: self-supervised targets and SIGReg | Probability owns characteristic-function foundations; Vision includes the necessary local formula. |

All links should target useful sections: MoE → Parallelism#expert-parallelism, Speculation → Serving#kv-cache-lifecycle, RL → Agents#groupwise-grading, etc. Anchor names here are illustrative until implemented and tested.

## High-value worked structures

### Mixture of Experts

One note with: sparse computation; active/total capacity; router selection and weights; dispatch/expert-first batching; auxiliary losses; loss-free balancing; quantile balancing; capacity/drop policy; shared/fine-grained experts; modality/network constraints; precision; training collapse and optimizer mismatch; monitoring; systems implications; source-conditioned comparisons.

Signature visuals: token routing/occupancy, balancing control versus auxiliary gradient, dispatch/combine across devices. No separate routing or stability note.

### Speculative Decoding

One note with: autoregressive bottleneck; exact acceptance and residual proof; chain/tree; greedy/sampling/alignment/bonus token; history; external/self/feature/MTP/tree/parallel drafters; Medusa/EAGLE/DFlash/DFlash2/DSpark; training; caches and correctness tests; scheduling/benchmarking; implementation progression.

Signature visuals: exact small round, draft tree, feature/block dependency comparison, accepted/rejected KV timeline, DSpark prefix scheduling. DSpark is a section, not a separate note.

### Distributed Training and Parallelism

One note with all DP/TP/PP/SP/CP/EP and ZeRO dimensions, named mesh/layouts, matmul cases, collective costs/overlap, pipeline schedules/bubbles, long-sequence balance, topology, mixed recipes and inference caveats.

Signature visuals: partitioning/device mesh, row/column matmuls, pipeline timeline, causal ring/zig-zag and expert dispatch. Low-level NCCL remains in GPU Communication because it is a different reusable subject.

### RL and Agents

RL includes the update algorithms and their distinctions, rewards/verifiers, entropy/coverage, sparse-reward argument, asynchronous rollout/learner state and numerics. Algorithms are section comparisons, not new pages.

Agents includes task/environment/harness distinctions, synthesis, grouping/mixing, long-running environment lifecycle and groupwise grading/security. This boundary follows independent concepts, not the old AI/Systems folders.

### Model reports and the reasoning book

Keep two useful recipe notes rather than thirteen report pages:

- Frontier Model Training Recipes: eight report profiles, connected to canonical topics.
- Small and On-Device Model Recipes: four report profiles plus existing small-model material.
- Shieldstral joins Structured Decision/Safety Models with Jev/Tev.

A profile retains architecture/training/system/evidence coherence, numbers with conditions, unknowns and source discrepancies. Reusable mechanisms are explained once in the canonical subject. Extracting a concept does not permit deleting unique source-specific detail.

The reasoning-model book joins Building and Controlling Reasoning Models. Preserve the complete end-to-end dependency story and reusable evaluator/log-probability primitives, along with practical sampling, stabilization and distillation details. It must not become just a summary linking away to RL.

## Public artifact retirement

Retire all individual LeetCode and cybersecurity challenge write-ups from public routing/index/search during migration. Do not recreate them as twenty expandable exercise cards, a public archive, or a disguised “examples” inventory.

A small example may survive only when it improves an actual pattern explanation, rewritten around the invariant rather than the exercise identity. Preserve originals and needed assets privately/recoverably.

Old LeetCode URLs can redirect to the related pattern, with an honest retirement notice if needed. Cybersecurity challenge and incomplete-reference URLs should have an explicit retirement response, not a fabricated equivalent destination. Route choices remain to implement; no private archived body should be exposed.

Remove placeholder text instead of preserving it as public content. Preserve useful links/ideas privately until they are substantively reviewed.

## Source integrity and preservation

The ledger covers all 232 originals and retains their baseline fingerprints, headings, source links, image paths, math/code counts, dates and visibility. The previous ledger's raw retention metadata is retained in each revised row.

This is **structural review, not a complete factual/full-body audit**. Secondary report extractions are candidates inferred from source headings. During migration:

- Read each full original body and inspect all Markdown/JSX/component assets.
- Assign every unique derivation, example, source-conditioned result and limitation to a topic section or private archive.
- Verify important formulas and contemporary/report-specific claims against primary evidence.
- Keep uncertain valuable content in the topic or source-scoped profile; never discard it to make a page shorter.
- Preserve observation/hypothesis/adaptation boundaries and unresolved source inconsistencies.
- Check old links, source attribution, assets, search aliases and visibility.
- Only retire originals after recoverable archiving and section-retention review.

The user has authorized the reorganization and public retirement policy, not irreversible deletion, publishing the local untracked harness note, or a push.

## Publication and update behavior

Topic consolidation is not a batch of 54 artificially new publications. Reuse an existing topic's publication date; for a new merged identity record lineage and choose a documented inherited date, normally the earliest substantive contributing note. Retain per-section research/update provenance.

Small updates do not reorder the homepage carousel. The homepage stays a personal showcase with the last three published notes. Burgundy/baby-blue remains the chosen visual system.

## Execution order

1. Freeze refreshed source/asset baseline and archive-retirement plan.
2. Build section navigation, searchable headings/aliases, equation/diagram/interaction primitives.
3. Convert MoE, Speculative Decoding and Parallelism as **complete dense notes**, not preview introductions.
4. Convert Objectives/Information Theory, Attention/Position and Algorithms; retire problem artifacts after archiving.
5. Convert Optimization/Data/Scaling/Practice and RL/Agents/Distillation/Reasoning.
6. Consolidate report recipes and remaining vision/generative/execution/math/general-computing subjects.
7. Review 232/232 source resolutions and all 54 topic readers; validate links, static/search rendering, mobile/keyboard, math, assets and interactions.
8. Replace production only after the corpus passes those gates; commit/push only when requested.

This pass changes internal plans and authoring policy only. Original content, prototypes and production site are not migrated by it.

## Proposal validation — 2026-10-03

- All 232 current Markdown/MDX entries have one explicit ledger resolution, with all 232 baseline fingerprints matching their unchanged originals.
- All 54 proposed topic identities are unique, have source content and section outlines, and resolve their cross-topic links.
- All 19 NeetCode roadmap sections remain represented in pattern notes. No LeetCode/challenge source body is assigned to a retained public topic in this proposal.
- The 22 problem/challenge retirements and three private incomplete-reference backlogs are proposals, not deletions already performed.
- All 13 report sources have preservation homes and candidate concept extractions; precise full-body section assignments still need review.
- JSON parsing and mapping/integrity checks pass. Content migration, actual redirects, full-body/factual/asset audit and visual QA remain pending. No build, commit, push or deployment was performed.
