# Atlas v2 — complete content proposal

> Superseded on 2026-10-03 by [the dense-topic proposal](dense-notes-blueprint.md). The 149-reader structure below is retained as planning history, not the current migration instruction.

Prepared 2026-10-03. This is a corpus-wide editorial **proposal**, not a completed migration or factual audit. No existing note has been moved, merged, deleted, or published by this work.

## The proposed result

Turn the current collection into Nathan's personal visual knowledge atlas: compact concept references, selectively deeper technical pages, and optional connected reading paths. His own research, recall, exploration and implementation are the primary use cases; teaching a public audience is secondary. The website is authored by an assistant. There is no need for a CMS or a restrictive Markdown-only authoring workflow.

Use visual explanations where they help him understand or revisit a concept, not to turn every note into a beginner lesson. Keep direct access to equations, technical details, source evidence and implementation caveats. Suggested paths remain optional; do not force a curriculum. The homepage carousel shows the last three published notes with previews and direct access, not subject introductions. The organizational and preservation proposals below remain useful, but should be judged by personal retrieval and reference value rather than visitor onboarding.

The baseline contains **232 entries**: 230 tracked public notes, the old Atlas navigation entry, and one local untracked note. This proposal defines **149 initial learning pages**, including 13 preserved model studies, with 20 existing exercise notes integrated as worked examples. This is not a reduction target: add another deep dive whenever preserving important content requires it.

Read alongside:

- [Every proposed page, its scope, visual, and sources](notes-v2-page-catalog.md).
- [Every original entry and its destination](notes-v2-source-map.md).
- [Machine-readable preservation ledger](notes-v2-preservation.json).

### What has actually been reviewed

The complete existing inventory, summaries, and heading structure were examined to propose placements and identify overlap. Source files were mechanically scanned for fingerprints, links, Markdown images, formulas and fenced code. Selected overlapping sources were inspected in more detail, including loss-family notes, the old algorithm overview, an unfinished security write-up and the reasoning-model book note.

That does **not** mean every paragraph of the approximately 1.78 MB corpus has been read or every technical claim verified. Full-body comparison, primary-source checking, JSX/component-asset review and section-level retention sign-off remain explicit migration gates. Do not label the editorial audit complete on the strength of this mapping.

## 1. Subject taxonomy

The main browsing roots are **AI, Systems, Algorithms, Mathematics, Engineering, and Security**. Folder depth follows the subject, not publication date or the circumstances that motivated writing.

| Root | Main branches |
| --- | --- |
| AI | Foundations; Architectures; Language; Training; Post-training; Reasoning; Vision; Generative models; Evaluation; Classical ML; RL foundations; Decision models; Research |
| Systems | Distributed training; GPU communication; Kernels; Performance; Training operations; RL systems; Distributed services; Networking; Serving; Hardware; System design |
| Algorithms | Data structures; Patterns; Graphs; Problem solving |
| Mathematics | Calculus; Geometry; Probability; Information theory; Statistics; Optimization; Problem solving |
| Engineering | Profiling; Debugging; Network analysis |
| Security | Memory safety; Concurrency |

Meaningful depth examples:

- AI → Architectures → Mixture of Experts → Routing / Stability.
- AI → Post-training → RL → Group updates / Rewards / Exploration.
- AI → Inference → Speculative decoding → Architectures / Implementation / DSpark.
- Systems → Distributed training → Parallelism → Tensor / Pipeline / Long sequences / State sharding.
- Algorithms → Patterns → Dynamic programming, with distinct example states inside the note.
- Mathematics → Information theory → Compression-based similarity.

Cross-disciplinary notes have one canonical page and a primary browsing home, with links and secondary topic tags elsewhere. FlashAttention primarily belongs to kernels while remaining discoverable from attention; asynchronous RL belongs to systems while remaining linked from post-training. Do not duplicate pages to satisfy both subjects.

The page catalog is authoritative for individual browse paths. A slug is a stable identity, not an instruction to recreate its path verbatim as visible folders.

## 2. Collections are not subjects

Keep these useful perspectives as selectable collections:

- NeetCode roadmap: all 19 original roadmap sections remain represented, including the algorithm-selection guide.
- Interview preparation: algorithm exercises, mathematical problem solving, system design, pretraining design, and RL question sets.
- Model reports: all 13 original report notes remain standalone studies.
- Build a Reasoning Model: the purchased-book learning path, connected to canonical evaluator/decoding/RL/distillation material.
- From-scratch implementation paths and the Smol training playbook.

A collection can order notes across subjects without copying their content. Interview questions remain useful material but “interview prep” stops being an all-purpose category.

Model studies remain original-source narratives with full architecture and training coverage. Their browsing homes reflect their primary technical subject; a Model Reports collection provides the complete list. Report dates, scope and claims never become unqualified general facts by being copied into a concept note.

## 3. Main pages, deep dives, and examples

A main page answers a coherent question, explains the essentials itself, and provides a small number of clear routes into depth. It is not a list of links.

A deep dive is justified by a distinct mechanism, derivation, implementation problem or body of evidence. It has a visible “part of” connection and useful sibling links. It does not re-explain the entire parent.

Worked examples live with their pattern unless independently substantial. Existing LeetCode URLs resolve to the corresponding example. Preserve solution variants and invariants; don't merely keep an answer code block.

Reader layout:

1. Compact question/title and one-sentence orientation.
2. A useful signature figure near the mechanism it explains.
3. Short explanations, exact equations with symbols, and small worked examples.
4. Optional advanced sections or explicit deep-dive links.
5. Evidence, limitations, related concepts and source provenance.

Use a short section index inside longer readers. Showing or hiding the Atlas terminal must not alter the reading hierarchy or break wide diagrams. Main pages should usually be readable in one short sitting, but no word limit overrides required math or evidence.

## 4. Major editorial decisions

### Losses and information theory

Use **Losses and Objectives** as the practical entry point. Merge CE/BCE and regression essentials. Link information-theoretic derivations rather than duplicating them.

Keep Proper Scoring Rules/Fenchel–Young as a deep dive. Move distillation to post-training. Move vector norms/normalization to geometry, keeping MSE in losses. Put LeJEPA/iBOT/DINO in self-supervised vision and SIGReg in a dedicated regularization deep dive.

Visuals: regression outlier example, distribution bars with entropy plus KL cost, gradient comparison in the advanced scoring note. Verify current claims about L2, collapse, and iBOT objectives instead of inheriting them.

### Mixture of Experts

Main MoE: sparse computation, total/active parameters, routing, capacity, balancing and basic stability. Dedicated routing and stability pages preserve the existing technical depth.

Protect auxiliary/loss-free balancing, quantile balancing, router z-loss and precision, shared/fine-grained experts, expert-first execution, sequence/modal/network balance, optimizer mismatch, padding and dispatch/combine failures.

Visuals: token-to-expert routing, occupancy/capacity, and a balancing control demonstration. Don't confuse router balancing with model-quality improvements.

### Attention and position

Unify foundational attention and scaling; keep a deeper scaling explanation beyond the variance argument. Preserve attention variants as their own comparison and linear attention as a distinct mechanism.

Position main note covers sinusoidal clocks, RoPE and extension/NoPE distinctions. Keep the group-theoretic encoding note intact as a deep dive, including non-rotation cases and stability restrictions.

FlashAttention remains a kernel deep dive. Protect online softmax and the difference between changing memory traffic and changing the attention function.

### Residuals, recurrence and output heads

Preserve Attention Residuals, DeepLoop, Recirculation and Full-Bandwidth latent feedback as distinct mechanisms. A looped-transformer main note connects them but never treats them as interchangeable.

Keep causal timing, weight tying, KV-cache consequences, training objectives, evidence and cost in each relevant deep dive. The softmax bottleneck retains its exact rank/row-shift argument, not just the claim that softmax has limitations.

### Optimization, scaling and data

Use compact optimization/scheduling and stability entry points. Keep Muon mechanics and measured checkpoint-generalization evidence separate.

Scaling main note covers budget allocation, repetition and deployment-aware overtraining. Decomposition, Skaling and hyperparameter transfer stay deep dives because their assumptions and fitting procedures matter.

Data main note introduces novelty, mixture and memorization, with a separate mixture-search deep dive. Preserve token-versus-example weighting, repetition caps, cross-dataset effects, surrogate search and annealing ablations.

### Post-training, RL and agents

Organize SFT/interface contracts, adaptation, preference optimization, distillation and RL as distinct choices.

The RL main note distinguishes reward source, policy optimizer, rollout distribution and systems. Keep GRPO equations and normalization, algorithm comparisons, verifiers/rewards, entropy/coverage, sparse-reward interpretation and groupwise grading in linked deep dives.

Agent training covers executable tasks, environments, verifiers and harnesses. Preserve multi-harness collection/mixture caveats; weighting harness families is a possible research direction, not an established result unless sourced.

On-policy distillation and self-distillation retain distinct pages. Model-report-specific RL variations remain in those reports with links to general concepts.

### Reasoning book and training playbooks

The reasoning-model book remains an end-to-end learning path, not a paragraph of recommendations. Protect evaluation/extraction, benchmark separation, sampling/voting/refinement, token log probabilities, reward computation, GRPO stabilization and distillation.

The Smol playbook and pretraining-design guide retain their connected workflow and source-specific examples. Canonical concept links reduce repeated introductions without erasing the decision sequence, worked design prompt or compact Q&A.

### Inference and speculation

Serving entry point unifies prefill/decode, KV capacity/bandwidth, runtime caching and disaggregation. Keep sampling and reasoning effort as separate conceptual choices.

Speculative decoding retains an exact foundational explanation and history. Separate drafter architecture comparison, implementation/correctness and DSpark for deeper reading. Protect acceptance/residual proof, logit alignment, bonus token, cache rollback, tree verification, scheduler and fair benchmarking.

Watermarking, LoopCD and TTS stream capacity remain distinct topics.

### Parallelism and GPU systems

One parallelism main page explains all dimensions. Tensor layouts/collectives/topology, TP, pipeline schedules, SP/CP and ZeRO retain detail pages as needed.

Protect named mesh shapes, row/column matmul order, communication requirements, SP versus CP, causal zig-zag balance, bubbles/stage imbalance, expert parallelism and optimizer-state ownership. Formula conditions and hardware topology are part of the teaching, not footnotes.

Keep NCCL internals and low-latency collectives separate. Preserve push/pull explanations, protocols versus algorithms versus transports, synchronization/visibility, and measured-versus-theoretical bounds.

### Algorithms and mathematical tools

Remove duplicated heap/tree introductions and unite 1D/2D DP through state design. Preserve the distinct patterns and proof conditions of binary search, windows, greedy, backtracking, graph problems and intervals.

Keep the complete algorithm-selection decision tree and constraint table. A suggested technique is not a proof of correctness, and length limits alone do not determine an algorithm.

Integrate the 20 exercise notes as worked examples with retained original routes. Preserve heap scheduling, top-k, quickselect, k-way merge and streaming median as distinct cases.

The mathematical problem-solving toolkit retains Poisson arrivals, information bounds, invariants and every substantive worked example. Calculus becomes one coherent gradient/backpropagation page; information theory becomes one coherent foundation with its exact assumptions.

### Systems, engineering and security

Consolidate performance metrics and reliability primitives, not every systems subject into one page. Preserve roofline examples, MFU/goodput distinction, capacity worksheets, profiler trace-reading methodology and high-density GPU infrastructure.

Security write-ups and tool references containing unfinished work remain recoverable and clearly unfinished until reviewed. Never invent a successful lab result or silently publish placeholder text.

## 5. Precious-content protection

“Concise” means removing redundant exposition, not removing knowledge.

For every source, retain:

- Distinct derivations/proofs and the assumptions that make them valid.
- Numbers together with model/data/budget/hardware/precision/evaluation conditions.
- Figure source, original asset, caption, interpretation and caveat.
- Worked examples, code variants and implementation traps.
- Negative results, source discrepancies, unknowns and hypotheses.
- Original links, publication history, visibility and old-route continuity.

The preservation ledger records a SHA-256 fingerprint of every current source, its heading checklist, references and Markdown image paths. It is a baseline for comparison, **not proof that all semantic content or JSX assets have been migrated**.

Before rewriting a source, read the whole body and inspect components/assets. Before removing any duplicate passage, record where its unique material survives. If unsure whether something is redundant, keep it in an advanced section or deep dive. Default to preservation; no further user decision is needed for that safe default.

Keep recoverable originals and their assets until the entire route and retention audit passes. Nothing in this proposal authorizes deleting the only copy of an unpublished or valuable note.

Priority protected sources: the reasoning-model book; speculative decoding and DSpark; MiMo/MAI/Kimi/DeepSeek/GLM/Nanbeige/Apple/Gemma and other reports; groupwise grading and RL comparisons; MoE routing/stability; parallelism/layout/NCCL/collective notes; measured checkpoint-selection evidence; advanced scoring/scaling/position derivations.

## 6. Visual and code policy

Use shared primitives for coherence: equation/symbol blocks, annotated diagrams, aligned comparisons, timelines, step explorers, parameter explorers, trace viewers, evidence figures and source references.

An interaction must expose a relationship difficult to see statically. For straightforward references, an annotated example is better than a forced slider. All pages still get an intentional visual learning treatment.

- Show the invariant/state, not only moving objects.
- Label synthetic demonstrations as synthetic.
- Never fabricate empirical curves for a report.
- Keep a readable static explanation alongside dynamic states.
- Keyboard access, visible focus, reduced motion and narrow-screen reading are mandatory.
- Use a consistent skywine-compatible component theme rather than designing each page independently.
- Small code fragments usually explain one operation in 5–15 lines. Split a longer algorithm into a guided sequence; avoid hundred-line walls.
- Preserve implementation-critical ordering, shapes, masks and tests. Shortness must not make implementation advice misleading.
- Existing useful full solutions can live in expanded code walkthroughs or referenced source assets; don't destroy them to meet a snippet target.
- Custom Astro/HTML/components are first-class; all text still participates in search, linking and static rendering.

## 7. Navigation and discovery

Terminal remains default; Finder is the alternative. Root ls lists root folders, not the whole corpus. Category listings show the actual notes in that category, with an explicit optional recursive view.

Fuzzy search indexes aliases, titles, section names and meaningful body text. Old terms like “binary cross entropy”, “GRPO”, “MoE”, “1D DP”, “heap”, and model names must resolve to the correct new page or section even after consolidation.

Main-note relationships are reader links, not an infinitely nested filesystem. A category can have its main explainer and clearly named deeper notes.

NeetCode's sequence remains available as a collection. Published ordering retains original publication semantics; small reference edits do not send an old page to the top.

## 8. Migration sequence — safe defaults, no repeated approval requests

1. Freeze the original content/asset baseline and metadata. Refresh hashes if sources change.
2. Build shared reader/figure/interaction primitives within the selected design.
3. Convert Losses, MoE and Parallelism as complete pilot families.
4. Convert algorithms/mathematical foundations and integrate exercise traces.
5. Convert training/scaling/data, post-training/RL and inference families.
6. Convert protected model reports and book/playbook learning paths, retaining evidence and source narratives.
7. Convert the remaining systems, engineering, security and specialist topics.
8. Validate the entire atlas and only then replace production routing/deployment.

A proposed category or merge is allowed to evolve when full-source reading shows a better boundary. Record the change and preserve material rather than pausing for every small editorial choice.

No build or deployment was performed for this proposal. No commit/push is included.

## 9. Definition of done for each source and for v2

A source is complete only when its ledger has actual destinations for every substantive section, math/code/example/figure/source treatment reviewed, visibility and dates preserved, and old routes verified.

A reader is complete only when it teaches the topic without chat context, follows the visual contract, renders useful static content, supports search/accessibility, and passes interaction/desktop/mobile checks.

The atlas is complete only when:

- Every one of the 232 source entries has a reviewed resolution (the navigation entry becomes navigation).
- No precious unique material is silently lost.
- Proposed redirects/anchors are implemented and tested, including inbound links.
- Internal guidance stays outside public routing and search.
- Every retained reader uses the new visual format, not a Markdown page hidden behind a “migration complete” flag.
- Empirical figures, dates, published ordering and source boundaries survive.
- The existing production site remains intact until these gates pass.

## Proposal validation — 2026-10-03

- 232/232 current Markdown/MDX entries are covered exactly once in the source ledger.
- All 232 source SHA-256 fingerprints match the unchanged originals.
- All 149 proposed page identities are unique; every target and parent resolves inside the proposal, with no parent cycles.
- All 20 exercise sources have proposed destinations in their pattern readers.
- No source notes, production routes, browser prototypes or deployment configuration were changed by this proposal.
- Routes/anchors are not implemented. Full-body/factual audit, asset review and visual learning conversion remain pending.
- Existing tracked diff whitespace check passes; the planning files are local and uncommitted. No build, commit or push was performed.
