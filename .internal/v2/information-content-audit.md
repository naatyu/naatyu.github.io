# Information Theory and Compression — draft audit

## Subnormal mixtures and input validity — 2026-10-11

Previous checkpoint fixed KL ratios,but fresh edge-case inspection reproduced a separate JSD failure:`[Number.MIN_VALUE,1]` versus`[0,1]` produced infinity because the half-mixture rounded its positive first bin to zero. The mixture is now evaluated through `log(max)+log1p(min/max)-log(2)`. Equal bins contribute exactly zero. Contributions accumulate before the final half-factor so two smallest-bit contributions are not prematurely rounded away. An exact smallest-bit assertion complements tolerance-based comparisons.

Tests cover1101cases:12subnormal-support/base comparisons with known disjoint rare-bin contributions and1089binary-distribution pairs checked independently through the entropy identity. Finite bounds,symmetry,exact identical-input zero and invalid bases pass. Six invalid arrays,including holes and undefined entries,are rejected by all four probability functions (24assertions);previously sparse arrays could silently pass normalization because JavaScript iteration skipped holes. No epsilon smoothing or universal output clamp was added.

Full47-script14234 exits0 after the initial log-mixture correction. Sparse-array validation and final half-factor refinement came afterward;final focused topic/math/build36420 exits0 with candidatejuR57u,not a claimed final full-suite rerun. Export counts and nine-inline/21MathML bodies remain unchanged. Public reader prose/layout were not edited this checkpoint;native screenshots from the prior pass are not new evidence for extreme numerical values. No preview process started. Guide now requires intermediate-range and scale-aware checks. Full external-primary/corpus/editorial/accessibility/production gates remain open.

## Log-domain robustness and inline rendering — 2026-10-11

Freshly read the complete current reader/model/tests and all five dedicated source bodies listed below. Definitions, prefix/Kraft proof, fair/biased coins, four-outcome coding example, KL support/direction/teacher conditions, JSD mixture/unit example, sequence/entropy-rate assumptions, compressor adaptation/results/tree caveats, MDL and experimental controls remain in their canonical sections. No original bitmap references were found. This scope does not recertify linked historical papers or cross-topic report sections.

Corrected an actual numerical defect: `log(p/q)` formed an overflowing positive ratio for very small positive q, incorrectly returning infinite KL. The model now subtracts finite log probabilities before weighting. True q=0 on positive P support still returns infinity;zero-P terms remain zero. Thirty-six extreme-support/base cases check both directions against cross-entropy minus entropy,including the smallest positive double. The prose distinguishes representational overflow from missing support and explains why probabilities already rounded to zero cannot be recovered by taking logs.

Typeset five further inline formulas:the entropy subtraction in the decomposition caption,bits/nats conversion,log-likelihood difference,JSD midpoint and incremental compressed length. Actual DOM assertions require21MathML objects/nine inline formulas and exact TeX annotations with no literal interpolation leakage. Twelve display groups remain unchanged. Public updated date2026-10-11;original publication2026-05-06 retained. Each of the five original files now has an executable current-bytes-versus-HEAD recovery check.

Focused topic/math/static80819 exit0;final topic/math61359 exit0 after adding Git recovery assertions. CandidateFzpOOh builds;static exportGREjeh has54readers/206landings/25notices/3235anchors/521displays/14images/541files/zero old dependencies. Raw inline queue234 candidates,none in Information;heuristic exclusions/limitations still apply. The full47-suite was not rerun for this checkpoint;its last complete run preceded these changes.

Native1280×900 and390×844:21MathML objects,zero parser/page overflow and no too-wide inline wrappers. Expanded Kraft proof was inspected at390px,closing its previously recorded narrow-inline inspection gap. Its wide display retains focus and scrolls40px with ArrowRight. Empty warning/error logs. Proofs in task workspace:`information-stability-desktop.png`,`information-stability-mobile.png`,`information-kraft-mobile.png`. Viewport reset;temporary preview28380 stopped(exit130). Full historical-primary,corpus editorial/accessibility and production-switch gates remain;no original retirement,commit,push or deployment.

## Coherence and coding-condition review — 2026-10-09

Final regression19018:all47default scripts exit0. The first run exposed the math inventory’s outdated assumption that Information had no inline formulas;updated the exact expected total to16 and independently asserted four inline wrappers,without relaxing strict TeX/display checks. Display inventory remains519. Git whitespace check passes;v2 remains untracked and its executable checks,not Git diff alone,cover the new files.

Freshly read the complete current reader and all five dedicated original bodies. The reader retains the original definitions,coin/prefix/four-outcome examples,Kraft proof,teacher-gradient condition,JSD midpoint/units,chain rule/entropy-rate assumptions,language-model coding,zip adaptation/baselines/results/tree caveats,MDL and experimental controls. Originals contain no bitmap references;no additional image is missing from this five-source transfer. This review does not re-certify cross-topic report sections or all external historical papers.

Editorial changes connect single-outcome distributions to contextual sequence coding,then explicit probability coding to dictionary-compressor proxies. The zipping section now explains why the self-reference baseline is subtracted before introducing its equation. It states compressed-byte/input-byte units and the factor-eight conversion instead of leaving the KL analogy’s units implicit. Source-label examples make the zero/one-bit JSD endpoints concrete. Stable IDs,source-conditioned historical observations and meaningful related links remain unchanged.

Corrected the prefix-code overhead wording:Shannon ceiling lengths achieve H≤L<H+1 on a finite positive-probability alphabet;arbitrary prefix codes need not satisfy that upper bound. The independent-block extension specifies its assumptions and symbol-count/boundary requirement. The biased-coin example distinguishes0.469ideal bits from a1-bit binary symbol code. Four complex inline formulas now use strict KaTeX/MathML,including Kraft’s sum and the induced q distribution;12display formulas remain. Updated date2026-10-09;original publication2026-05-06 unchanged.

External check:read Ben Lynn’s complete Stanford-hosted Symbol Codes page,especially Kraft-McMillan,Limits of compression and the ceiling-code construction at https://theory.stanford.edu/~blynn/pr/symbol.html. This is an independently authored educational derivation,not a substitute for full Shannon1948/KL1951/LZ1977 primary-paper review. The note links it beside the reviewed proof.

Verification:186 independently enumerated finite binary-block distributions (31biases×6block lengths) satisfy the ceiling-code Kraft/lower/upper/per-symbol bounds. An inefficient valid prefix code supplies a counterexample to a universal upper bound. JSD source-label endpoints and existing101coding states pass. Final topic58148 and static87333 checks exit0:54readers,519display formulas,536files,zero old dependencies. Native updated reader has16MathML nodes,zeroKaTeX errors and1280pxdocument/viewport widths;expanded proof and explorer hide inspected with empty warning/error log. Screenshot `/Users/nathan/Documents/Codex/2026-07-20/new-chat/information-editorial-proof.png`. New inline formulas not separately rechecked on a narrow viewport in this pass. Full primary/editorial corpus/accessibility/production gates remain;no source removal or publication.

## Full body reconciliation and equation pass — 2026-10-06

All five complete source bodies reread. Restored the concrete prefix-code example; expected log-likelihood interpretation and nonmetric KL; applications and the numerical JSD midpoint/two-term calculation; explicit tokenizer-unit comparison; short-snippet adaptation rationale; Fitch–Margoliash, translated corpus and reported family placements; compressor/header sensitivity; and the coding/representation connection. MDL includes model/representation cost: minimizing cluster-label entropy alone does not establish useful grouping. Original overclaims about compression randomness, exact finite-compressor KL, clipping zeros and linguistic ancestry remain corrected.

All inherited external references now survive in the connected sources section, including Su7006, Shannon1951, Kullback–Leibler1951, Lempel–Ziv1977, Olah and both supplied-video references. Primary checks this pass: full zipping HTML body recheck of formulas, adaptation and experimental/table/tree scope; Shannon1951 section3 prediction protocol. Su7006 returns403. This is not a fresh full Shannon1948/1951, KL1951, LZ1977 or video-transcript review. Those limitations remain a factual review gate, not hidden public links to old notes.

The reader has no old-note links or Complete Originals block. Related links go to canonical Losses, Distillation, Tokenization and Probability. Five redundant originals are removed from local catalog/search only after Git tracking and clean HEAD content verification. Existing production sources are untouched. All81 original Markdown heading fragments have reviewed semantic destinations; nine total candidate sources/122 fragments now exist in the corpus ledger. Prototype incoming aliases and generated links use the five reconciled note destinations. Known old fragments resolve precisely; unknown fragments remain visible rather than being falsely mapped. Production redirects remain pending.

All12 displays use strict explicit TeX and MathML, including the new conceptual MDL objective. Existing101-state coding identities and support/unit tests pass. Native 100% correction retains entropy1.750, gives KL0 and CE1.750. Desktop and390px rendering checked; all formulas stay within their reading pane with local scrolling for wide formulas, no page overflow or KaTeX errors. Publication date remains2026-05-06. Screenshot `information-migration.png` saved in the Codex workspace. Earlier draft status below is historical; full production/editorial/primary gates remain open.

Updated 2026-10-04. Local draft `math/information`; no source retirement, aliases, commit, push or deployment. Five planned source bodies read in full. Original publication date 2026-05-06 preserved; prototype excluded from the latest-publication carousel.

## Coverage

| Original source | Draft destination |
| --- | --- |
| `math/probability/entropy` | `#surprise`, `#entropy`: surprise, bits/nats, coin examples, prefix codes, Kraft lower bound, integer/block coding caveats |
| `math/probability/kullback-leibler-divergence` | `#wrong-code`, `#direction`: H+KL proof, four-outcome 1.75/2.625/0.875 example, support and direction, fixed-teacher gradients |
| `math/probability/jensen-shannon-divergence` | `#jsd`: mixture identity, finite bounds, square-root metric, source-label mutual information |
| `ai/foundations/prediction-compression-and-entropy` | `#context`, `#prediction`: context, chain rule, stationary entropy rate, Shannon human prediction, next-token coding, randomness/understanding distinctions |
| `ai/foundations/compression-based-similarity-and-language-trees` | `#zipping`, `#practice`: adapted zip state, incremental cost, directed and symmetric baseline formulas, reference/sample sizes, three experiments, minimal code, leakage/window/order controls, embedding comparison |

The five originals contain no referenced bitmap assets. Their current production bodies remain on disk;the v2 export does not link,publish or search those originals. Historical draft linkage was superseded by the2026-10-06reconciliation above. No production retirement claim:full primary review and production publication/switch checks remain pending.

## Corrections / qualifications

- Entropy is outcome uncertainty under a shared model, not the storage cost of P.
- Ideal fractional code lengths differ from integer symbol codewords and practical file sizes.
- Entropy-rate conditional limits state stationarity; arbitrary text does not automatically satisfy source-coding assumptions.
- Context reduces entropy on average, not necessarily for every particular observed context.
- Compressed-looking randomness is not uniformity or cryptographic security.
- Exact KL uses support conditions, not silent epsilon clipping. JSD handles structural zeros without such clipping.
- The small JSD example is 0.00506 **nats**, approximately 0.00730 bits.
- A compressor’s excess-size proxy can be negative at finite length. Symmetrizing it does not establish a metric.
- In the zip notation A→B predicts B from A, so the ideal KL direction is B‖A.
- Kolmogorov complexity, Shannon entropy and measured zip size are distinct quantities.

## Primary checks

Read all five pages of *Language Trees and Zipping* (arXiv cond-mat/0108530v2, 2001 preprint / 2002 paper). Checked incremental-baseline formulas, sizes, author table, translated corpus and unrooted-tree interpretation. Preserved 84/90 nearest and 89/90 top-two author results. The paper's distance-matrix adjustment is stated; a tree fit is not literal ancestry. Other derivations were checked mathematically against the existing notes; this is not a fresh complete audit of every historical reference.

## Verification

`test-topic-readers.mjs`: normalized distributions, zero probabilities, infinite mismatch, JSD bounds/example units, H+KL at all 101 blend states, exact endpoints, anchors, routes and search. Playback harness covers reduced-motion manual use, pause, offscreen stopping and disposal. Actual browser/OS reduced-motion preference remains untested.

Browser desktop split reader: keyboard range endpoint gives H=1.750, KL=0, total=1.750 bits. Narrow/full-width checks and final console status are recorded in `overnight-review.md`.

## Original fingerprints (SHA-256)

- entropy: `8a8d176c7dadb2c5d0b0a8afde8b2ce7466ed3f51f765deff37aa97642633788`
- KL: `90013b82efe719bb74af2cae851263a4dfe7798cc13004164ffa1abffb05d3c4`
- JSD: `994ef3c5c40e2b32da6bff7a3705b804b4a6681d39af3ade8ebf1678dfe8cd79`
- prediction/compression: `eab66c677217acdca9fcb0e03f9d2b8f50ac4ef18216c1d1ce10ab893bd56a5f`
- language trees: `4e3d519a56ac82cacbf0f1dd961bc4fbe37828b58b637e7f213338d2b133e3b0`
