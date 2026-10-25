# Tokenization and Input Representations — draft audit

## MathML namespace repair — 2026-10-12

Equivalent operator notation fixes HTML-namespace descendants in this topic’s accessible math without changing its calculation,conditions or formula counts. Exact owning-reader annotations and shared1064formula namespace regression pass. Full27874exit0 and scoped1280/390px native checks recorded in `mathml-namespace-audit.md`. Inherited publication date retained;updated2026-10-12. Full source/figure/editorial/dynamic/screen-reader/production gates remain;no original retirement,commit,push or deployment.

## Static teaching completeness — 2026-10-10

Freshly reread all four original bodies, the full implemented reader and its pure model. Found that BPE symbols/count/caption and the three segmentation probabilities were empty in unmounted HTML. The reader now pre-renders initial symbols/count14/caption, all three path probabilities (.286/.238/.476) and the default quantile path a|ba from the same model used during playback. Added an explanatory path-weight/partition paragraph (.048+.040+.080=.168) and an expandable six-state BPE trace. No new empirical claim, original deletion or primary-review closure.

Regression parses the actual unmounted HTML: exact nonempty regions, all three rows, all six corpus states/pair counts, focusable named trace region and minimum table width are asserted. Runtime does not replace the static probability rows. Existing partition/exhaustive/tie/nonoverlap/reconstruction and endpoint tests remain. Full47suite98124 exits zero before final trace-width adjustment; final focused Tokenization and static65218 checks pass afterward. Native quantile Home/End give a|b|a and ab|a; merge End gives step5/count1/four symbols. Native390px review exposed split words in the trace;360px local table with nonwrapping segmented-word lines now scrolls40px with ArrowRight inside220px region. Zero document overflow/parser errors; warnings/errors empty and viewport reset.

Proofs: `/Users/nathan/Documents/Codex/2026-07-20/new-chat/tokenization-static-trace-desktop.png` and `tokenization-static-trace-mobile.png` in the same directory. CandidateJjxYQk on localhost:4329/session29675. This closes the observed unmounted-data gap, not a complete no-JavaScript browser/accessibility or primary-report/figure audit. All original bodies remain unchanged; publication and corpus gates stay open.

Updated 2026-10-06. `models/tokenization`, earliest source date 2026-04-08. All four source bodies (653 lines total) read fully. Four reviewed source identities and all48 old headings now resolve to covered v2 sections locally. Current bodies equal committed HEAD. No physical source deletion, production route activation or production readiness claimed.

## Coverage

| Original | Destination / retained material |
| --- | --- |
| BPE | `#bpe`, `#bytes`, `#chunks`, `#control`, `#evaluation`: ordered train/encode distinction, toy corpus and small loop, UTF-8 examples, both historical regexes, contraction/space/digit/newline branches, special token types, vocabulary/head versus length costs, real mixture, freeze/versioning, normalization, whitespace and digits, metrics and method comparison |
| BytePiece | `#unigram`, `#sampling`, `#lattice`: byte n-gram versus BPE training, product/log path objective, Viterbi max recurrence, sum partition and backward probabilities, stochastic boundaries as augmentation, multilingual/code/number/copy/robustness tradeoffs |
| BLT | `#patches`: causal uncertainty boundaries, local/global/local pipeline, cross-attention direction, FLOP-versus-wall-time scaling qualification and illustrative model sizes |
| LCM | `#concepts`: SONAR sentence pipeline, diffusion and RVQ options, multilingual decoder, segmentation/capping, compute cost and lossy representation limits |

## Corrections / source checks

- Byte completeness does not guarantee valid UTF-8 per token or reversible earlier preprocessing. Coverage is not multilingual equal cost.
- BPE is ranked merge encoding, not corpus-frequency retraining at inference. Tie and nonoverlap rules are explicit in the toy.
- SentencePiece is a framework supporting BPE and unigram, not a synonym for one algorithm.
- Token count is not bit compression; piece NLL, model likelihood and entropy coding are different objectives. BPB specifies the chosen reversible token path, not an automatic marginal over alternate segmentations.
- BLT boundaries are uncertainty decisions, not guaranteed semantic units. Encoder pooling and decoder cross-attention are distinguished from the global transformer. Arbitrary BPE does not guarantee photosynthesis is one token.
- SONAR concepts are learned sentence vectors, not lossless atomic meanings, perfect language invariance or proof of human-like reasoning. Decoders support particular languages/modalities rather than any output modality.

Fresh primary reads: BLT introduction, patching/incremental boundary rules, local/global architecture and cross-attention §§2–3; LCM SONAR/data preparation, RVQ excerpts, embedding fragility and limitations. Not full-paper/figure/appendix audits. Read BytePiece official README's training principles; direct original 9752/9768 articles returned 403, so detailed original-blog verification remains pending. The existing bytepiece body is fully preserved. Read tiktoken cl100k source; reader explicitly labels the inherited regex as historical/family style, not the current exact implementation (which uses further optimized possessive branches). ACL BPE publication abstract/date checked, not the entire PDF.

## Interactive QA

- Original opt-in six-state BPE explanation shows actual recomputed pair counts. Tests check tie order, nonoverlapping aaa→aa|a, strictly reduced symbol counts, every word's exact reconstruction and terminal one-symbol input.
- Tiny aba lattice weights are .048, .040, .080; partition .168; normalized paths .286/.238/.476. Max path ab|a differs from selected quantile path. DP best/partition compared with exhaustive paths for seven small strings. Enumeration is explicitly not the production algorithm.
- Reader anchors, related routes, historical regex backslashes and fuzzy body search pass. The four reconciled originals no longer appear as duplicate local catalog notes; physical originals remain in the production tree until the validated switch.
- Browser 390×844: merge endpoint and quantile endpoints work, probability rows reflow, document width remains 390. Desktop 1280×900 lattice readable; screenshot `tokenization-v2.png` saved in Codex task directory. No browser warnings/errors at final check. Shared reduced-motion/lifecycle tests pass; real OS preference remains pending.

## Reconciliation and equation pass — 2026-10-06

All four source bodies reread completely; no source image or custom-component assets. Restored explicit fertility/split-word/unknown-token/tokens-per-code-line metrics, WordPiece continuation markers and conditional English-to-French SONAR decoding example. Reversibility, byte coverage, latent loss and compute caveats remain explicit. Removed the public original-note block and connected canonical topics.

Four formulas use explicit TeX/MathML: path weight and Viterbi objective, maximum/sum DP, backward sampling/path probabilities and BPB. State conditions include unreachable states, positive reachable partitions, the empty path and stable log-sum-exp. Desktop and390px checks show four MathML formulas, no errors and no document overflow. Keyboard endpoints show fifth BPE merge and ab|a quantile path. Old BytePiece #5-viterbi-sampling resolves to canonical #sampling. Browser warnings/errors empty; viewport reset. Proof: /Users/nathan/Documents/Codex/2026-07-20/new-chat/tokenization-typeset.png. Dedicated numerical/reader/math tests and all46 default scripts pass after navigation integration.

The exact48 heading maps and four committed hashes are recorded privately. Official BytePiece README reread; inaccessible original blogs remain a primary-review limitation, not an excuse to drop their existing source content. Full primary review is not claimed.

## Remaining gates

Fine-grained full primary/figure checks, original-blog access, production static rendering/routes/assets and deployed accessibility. Draft is implemented, not migrated production. No source deletion or archive.

## SHA-256

- BPE: `7fb0deb3491c7a00b71e8207de8d09e51328cc4156fdd7b03a4a707f8a1d6207`
- BytePiece: `ad9901ff9c92c18fbf0bae230964cb98d0b5ccbd1ea7b2feacbc649a094f36c6`
- BLT: `816934154347f2fcd40f36e721ec74270643b848b77d4ebb56b3e77ce8a88862`
- LCM: `538efc8eaf3ae1b0fb78d782003e71beeea16c07d4abe22b5ae51d501e0aa151`
