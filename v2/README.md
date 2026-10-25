# Atlas v2 — local migration workspace

Selected design: Gallery, Burgundy / Baby Blue (`skywine`). The Windows/Linux-style file explorer is the default. Hide it to read a note at full width. The terminal is a historical prototype, not the selected navigation. The homepage carousel shows the three latest original publication dates, not recent edits.

Before writing any note, read `../.internal/v2/authoring-contract.md` completely, then the repository research-learning-notes skill. That internal guide is the single source of truth for content, STE-informed English, mathematical animations, navigation, source preservation and verification. Root `AGENTS.md` enforces this entry point. Historical design experiments are archived internally, not current guidance.

The approved corpus plan has 54 dense topic readers. All 54 readers are implemented locally: Distributed Services and System Design (draft), Serving Models (draft), GPU Communication (draft), Compute, Memory, and Performance (draft), Profiling and Kernel Optimization (draft), GPU Infrastructure (draft), Self-Supervised Vision Learning (draft), Detection and Spatial Predictions (draft), Learning, Abduction, and Scientific Discovery (draft), Diffusion and Score-Based Generation (draft), Structured Decision and Safety Models (draft), Building and Controlling Reasoning Models (draft), Agent Training and Environments (draft), Distillation (draft), Reinforcement Learning (draft), Preference Optimization (draft), Supervised Fine-Tuning and Adaptation (draft), Small and On-Device Model Recipes (draft), Frontier Model Training Recipes (draft), Precision and Quantization (draft), Pretraining: Experiments and Run Design (draft), Training Stability and Generalization (draft), Training Data (draft), Scaling Laws (draft), Optimization (draft), Recurrent and Looped Models (draft), Transformer Architecture (draft), MoE (reviewed pilot), Attention, Information Theory, Losses and Objectives, Distributed Training and Parallelism, Speculative Decoding, Decoding and Sampling, Tokenization and Input Representations, Positional Encodings, Vectors and Geometry, Probability and Distributions, Differentiation and Optimization Geometry, Statistics and Evaluation, Arrays and Hashing, Pointers and Sliding Windows, Stacks and Monotonic Structures, Binary and Monotonic Search, Linked Lists and Pointer Ownership, Graph Algorithms, Trees and Prefix Structures, Dynamic Programming, Backtracking and Search, Greedy and Interval Algorithms, Ordering, Heaps, and Selection, Choosing Algorithms, Bits, Numbers, and Geometric Patterns, and Mathematical Problem Solving (drafts). The plan is not a completed migration; All readers are drafted; final migration gates remain open. Source coverage, factual and production gates are recorded internally. Original production notes remain available. Internal guides, audits and worklists must never enter public search or deployment assets.

From the repository root:

```sh
node v2/scripts/serve.mjs
npm --prefix v2 test
```

Preview: http://localhost:4322/directions.html?design=gallery&view=atlas&palette=skywine&explorer=console&slug=models%2Fmoe

The public reader registry contains 54 canonical readers. The exported site has no old-note content dependencies or public original-note archive. Production still uses Docusaurus until an approved switch. No deployment, source retirement or push is implied by local work.

## Static rendering review

`npm --prefix v2 run build:candidate` writes an isolated temporary review site and prints its path plus remaining legacy dependencies. All54 current readers have complete HTML and MathML before JavaScript; optional interactions hydrate the existing reader modules. The selected homepage and file explorer are integrated. Review pages remain noindex and retain draft labels.

`npm --prefix v2 run preview:candidate -- /absolute/path/from/build` serves that artifact on localhost:4323. Candidate pages and responses are noindex. The output contains only canonical reader pages, restricted metadata and referenced runtime/media assets—not the old catalog, source Markdown, internal audits or unpublished notes.

`npm --prefix v2 run test:static` parses the emitted HTML, checks routes/fragments/resources, and confirms canonical search membership and exclusions. It is also included in the47-command default test chain. Content reconciliation, old-route redirects, final UI integration and full accessibility/production validation remain separate gates.

## Publication preparation

`npm --prefix v2 run build:publication` creates a separate temporary publication-format artifact. It preserves reader content and publication dates, removes review-only labels/noindex from canonical pages, and adds sitemap.xml, robots.txt and .nojekyll. Moved/retired/404 pages remain noindex. This command does not commit, deploy, remove originals or approve content.

`npm --prefix v2 run test:publication` verifies publication packaging independently of the original Markdown and private audit fixtures. The full default suite additionally exercises preservation and numerical models. The candidate preview server intentionally sends noindex headers even when previewing publication-format files; it is not the production host.

The prepared GitHub Pages workflow is `../.internal/v2/deploy-v2.yml`. It is not active. The bounded remaining checklist is `../.internal/v2/release-closure.md`; historical “full primary review pending” paragraphs are not permission to restart open-ended research during release closure.
