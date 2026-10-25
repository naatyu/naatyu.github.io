# Detection and Spatial Predictions — source and model foundations

## Detection notation and numerical-domain checkpoint — 2026-10-16

The Detection reader now has nine typeset inline formulas and a static two-row explanation of the nonnested NMS survivor sets. Six displays plus nine inline formulas give 15 MathML roots. This is a constructed threshold counterexample, not measured recall. The original publication date remains 2026-04-16.

Prior scoped desktop/mobile verification inspected the IoU worked fractions and the threshold comparison at 1280×900 and 390×844. The comparison scrolls locally with keyboard focus; no page overflow, parser/namespace failures or browser warnings were observed. That evidence covers the notation/table revision, not a fresh full-reader accessibility certification.

This continuation reproduced NaN from identical boxes with sides 1e200 or 1e-200. The teaching geometry now rejects detected nonrepresentable intermediates and lost nonzero ratios with RangeError. No epsilon clipping or arbitrary-precision guarantee was added. The implementation section explains the finite-input limitation. Tests cover 61 analytic scale pairs, three explicit range failures and eight fail-closed suppression policies with unchanged inputs, alongside the existing 4,664 foundation cases, 808 policy settings and 5,009 rendered states.

Full 47-script suite 56069 exited 0 after the public/model edits. The final test-only suppression-policy assertions were then independently run in d22be2 (exit 0). Static BhGPlA: 54 readers, 206 landings, 25 notices, 3,235 anchors, 536 display equations, 1,337 namespace-valid MathML roots, 15 media assets, 544 files and zero old-content dependencies. Raw math queue: 100 manual candidates, not 100 errors.

Fresh corpus 86585 exited 0 with no reviewed route disagreements or source changes. Read-only retirement check 23841 correctly exited 1: the local multi-harness original remains absent from pinned Git recovery; 231 other bodies are byte-equal. Local HTTP 1935 exited 0 on all 285 routes plus Home/Atlas after an initial sandbox localhost-binding failure. Its server closes in finally. Old preview handle 28151 was already unavailable; no process was terminated by that attempted cleanup.

No originals removed, production switched, commit made, push or deployment performed. Corpus editorial/semantic review, remaining source/figure questions, broader native accessibility/lifecycle checks, recovery and release gates remain open.

2026-10-06. **Integrated local draft**, not production-ready. Canonical slug `models/vision-detection`, inherited date2026-04-16. Original retained; production untouched; aliases empty. Corpus47 local readers (one reviewed pilot,46 drafts),seven not started. Historical foundation observations below precede integration.

## Source

Complete assigned original `docs/ai/modalities/computer-vision/non-maximum-suppression.md` read. SHA-256 `785923798ddadb97a1b584bcd656023a2a56b6319c46b14e4ff4a54d695195f6`, independently checked by foundation test. No images, components or code blocks in the original.

Preserved: duplicate proposal motivation (YOLO/SSD/Faster R-CNN, anchors/windows, multiple scales/locations), coordinate-intersection formulas and IoU, descending greedy selection, hard-suppression rule, worst-case O(N²) time/O(N) working memory, common original .45/.5 example thresholds with no universal recommendation, Gaussian Soft-NMS, score-weighted coordinate combination, DIoU center distance, applications in face/pedestrian/text detection, and related IoU/DIoU/CIoU/anchor/metric concepts. Explicit map follows.

| Original material | Reader destination | Decision |
| --- | --- | --- |
| Summary: remove redundant candidates; strongest score | question, scores, hard-nms | Retain role; qualify universal-architecture and calibrated-probability claims |
| Multiple scales/windows/anchors; nearby responses; redundant boxes | question, applications | Preserve cause and representative detector families; “10+” is possible illustrative multiplicity, not a documented universal count |
| xyxy intersection extrema/clamping/areas/union | coordinates, iou, geometry-experiment | Complete formulas and explicit continuous-coordinate convention; all161 displacement values checked |
| Descending greedy selection; remove and repeat | hard-nms, suppression-animation, implementation | Ordered pool semantics, strict > boundary and original indices retained |
| Example thresholds .45/.5 | thresholds | Keep examples but no universal recommendation |
| O(N²) time/O(N) memory | cost | Preserve production bound; distinguish stored teaching trace and pairwise matrix memory |
| Gaussian Soft-NMS formula/crowding motivation | crowding, soft, soft-order | Retain formula; no recall guarantee; add linear alternative, score floor and current-score re-selection |
| Weighted coordinate combination | fusion | Preserve exact operation; distinguish assigned-cluster average, WBF and NMW policies |
| DIoU center-distance rationale | geometry-experiment, diou | Define normalization, equality and similarity versus loss; retain limitations |
| YOLO/SSD/Faster R-CNN, face, pedestrians, OCR | applications | Preserve applications, correct suppression-versus-merging assertion |
| IoU vs DIoU/CIoU, anchors and metrics related bullets | coordinates, question, diou, evaluation | Explain distinctions locally rather than leave unresolved related titles |

Original has no unique figure, empirical result table, proof or code asset. New coordinate examples, five-box animation, four-box nonmonotonic-count counterexample, eleven-line hard-NMS pseudocode and metric example are labeled/explained original illustrations. No detector, dataset or benchmark is run by the scenes. Scores/coordinates fixed, sigma=.5 and floor=.1 declared. No invented empirical gains replace source evidence.

Corrections to apply in reader:

- “Virtually all modern detectors” is too broad: DETR uses direct set prediction with one-to-one matching and no ordinary NMS stage. Anchors/sliding windows are examples, not a universal architecture.
- Scores rank candidates; do not call arbitrary detector confidence a calibrated probability.
- High predicted-box overlap is not proof of same object identity. Crowded objects are a failure mode. Soft-NMS can mitigate, not guarantee prevention of misses.
- Greedy hard NMS uses > in the original and torchvision; Soft-NMS paper's linear rule and DIoU paper use ≥. Declare equality conventions rather than silently mix them.
- Gaussian score decay applies to every remaining comparable box; select the next maximum after scores change. Distinguish suppression threshold, score floor and ground-truth evaluation threshold.
- Coordinate fusion is not ordinary NMS. “Weighted NMS” is an ambiguous family label; WBF and non-maximum weighting have different grouping/score policies. Assigned-cluster average is not a full WBF implementation.
- Ordinary OCR NMS removes redundant detections; it does not merge text lines or estimate reading order.
- Returned detection count is not necessarily monotone in hard-NMS threshold due to greedy selection interactions. An independently constructed checked counterexample uses xyxy boxes [0,0,4,4], [1,2,5,6], [1,4,5,8], [3,2,7,6] in descending score order: threshold .2 retains indices0/2/3, .3 retains0/1. This is toy algebra, not a cited paper result. Do not claim raising threshold always increases recall/AP. Metrics depend on one-to-one matching and geometry.

## Fresh primary evidence

- Complete torchvision NMS operator contract read: https://docs.pytorch.org/vision/main/generated/torchvision.ops.nms.html. xyxy, shapes, strict overlap boundary, output indices, CPU/GPU equal-score caveat.
- Soft-NMS https://arxiv.org/html/1704.04503: abstract, introduction, methods, evaluation and results read; reference list not exhaustively reviewed. Primary formulas include piecewise linear and Gaussian, re-selection, O(N²), score pruning, and explicit failure cases. No benchmark numbers imported yet.
- Official PDF retrieved after finding exact case-sensitive publication URL: https://openaccess.thecvf.com/content_ICCV_2017/papers/Bodla_Soft-NMS_--_Improving_ICCV_2017_paper.pdf. Local `/private/tmp/atlas-softnms.pdf`. Pages1–2 rendered and visually inspected: horse overlap example and algorithm pseudocode. Native redraw planned, no paper image copied. Poppler emitted noisy font-cache diagnostics but resulting pages were legible; do not rerun without fixing cache configuration or suppressing repeated diagnostics.
- DIoU https://arxiv.org/html/1911.08287: targeted normalized-center penalty, equations6–13, NMS and comparison scope read; full paper/figures not audited. DIoU similarity=IoU−center-distance²/enclosing-diagonal². Do not confuse this similarity with the regression loss1−similarity.
- WBF https://arxiv.org/html/1910.13302: section3 read, with confidence-weighted coordinates, evolving clusters, averaged/rescaled scores and distinction from NMW. Full figures/benchmarks not audited. Its printed precision/AP formulas in section5 are not a reliable source for metric definitions; use established independent metric contracts instead.
- DETR https://arxiv.org/html/2005.12872: abstract/introduction checked only for NMS-free direct set-prediction counterexample. No full-method/results/figure review claimed.
- During integration, fresh torchvision contract and Soft-NMS/DIoU/WBF method passages checked again. COCO official source `https://github.com/cocodataset/cocoapi/blob/master/PythonAPI/pycocotools/cocoeval.py` evaluateImg and accumulate checked for category/image grouping, score order, non-crowd one-to-one matching, ignore handling, TP/(TP+FP), recall, interpolated precision and aggregation. Reader uses only a compact ordinary-instance example, not a reimplementation of full COCO. No fresh benchmark numbers or unreviewed figures imported.

## Mathematical foundations implemented

`v2/prototypes/readers/detection-model.js`: continuous positive-area xyxy intersection/union, normalized center penalty, hard/linear/Gaussian/DIoU greedy traces, class-aware versus agnostic policy, updated-score reselection, declared score floor, deterministic original-index tie-break. Trace snapshots deliberately retain diagnostic state and can use O(N²) storage; do not label the trace generator a production O(N)-memory NMS kernel.

Five assigned boxes include duplicate person boxes, a nearby person candidate, a separate candidate, and an overlapping bag label. No ground-truth labels or real model outputs supplied. Visualization must not call retained candidates true positives without a separate matching example. One assigned-cluster coordinate-average helper explicitly excludes WBF clustering/score aggregation.

`node v2/scripts/test-detection-model.mjs` passes4,664 independent cases: integer-cell geometry enumeration, translation/scale/symmetry, exhaustive subset hard-NMS versus independent cell-set reference, all808 method×threshold×class-policy settings, state conservation, per-comparison score rules, boundary equality, fusion and invalid domains. Original hash unchanged. Foundation suite now imported by integrated `test-detection.mjs`.

## Integrated reader and verification

- `detection.js`:21 unique searchable sections, approximately3,130 rendered words, declared draft/public metadata, original date, empty aliases, related live-reader/original destinations and fuzzy semantic search. No unpublished source promoted into latest-published carousel.
- `detection-scenes.js`:two exact visuals. Geometry slider161 values; four-method ×101 threshold values ×two label policies ×six requested rounds =4,848 trace states. Late rounds explicitly clamp to an already finished algorithm. Gaussian mode disables the irrelevant threshold; changing policy stops playback without resetting the manual round.
- `test-detection.mjs` verifies all5,009 rendered bodies, exact geometric identities, source-preservation terms, next-maximum ordering, registry, section uniqueness, date/visibility, related destinations and search. All39 integrated scripts pass; targeted suite rerun after final prose/style changes. `git diff --check` passes for tracked changes, but the v2 files are untracked and this command alone is not a whitespace audit of them.
- Native browser checks cover all4,848 trace settings against an independent implementation: five candidate scores/statuses and actual round checked at every step. Gaussian threshold values reached through hard mode before switching to disabled Gaussian control. All161 geometry values checked for intersection, union, IoU, center penalty and DIoU. Counts refer to bounded parameter combinations, not5,009 mathematically distinct outputs.
- Play/Pause/Replay inspected; Replay resets/stops. Section navigation retains nondefault stage1, Gaussian policy and geometry displacement160. No autoplay observed. Shared lifecycle tests still apply; actual OS reduced motion/offscreen/disposal for this reader not freshly certified.
- Desktop1280×720, split note640px and narrow390×844 inspected. No document horizontal overflow. Container query stacks diagram/table in narrow reader panes even on a wide desktop. Mobile plot/table use local scroll regions with visible focus; native ArrowRight moves plot and score-table scrollLeft (20.5 and10px respectively).
- Browser warning/error log empty. Screenshot `/Users/nathan/Documents/Codex/2026-07-20/new-chat/detection-v2-check.png`. Preview `http://localhost:4322/directions.html?design=gallery&view=atlas&palette=skywine&explorer=console&slug=models%2Fvision-detection#suppression-animation`.
- DINOv2 stays an original-note fallback until the Vision owning reader exists. No nonexistent `models/vision` link added; update that connection at Vision integration. Original NMS fingerprint unchanged. No retirement, commit, push or deployment.

## Remaining migration gates

### 2026-10-07 — core reconciliation and equation rendering

Fresh complete original reread and comparison against all21 sections confirms the preservation table above. Original SHA-256 unchanged and byte-equal committed HEAD, so recovery exists independently of the local file. No original assets/code blocks require transfer. All10 actual Markdown headings have reviewed semantic destinations in reviewed-navigation.js and the private ledger. The local public duplicate identity is removed; no public original-note block is added. Physical source/production routes remain intact pending the validated switch.

Six display formulas converted to explicit TeX/MathML with positive-area, pool/tie, sigma, boundary, fusion-weight and matching-denominator contracts. Dedicated foundation/reader/math suites pass. Native1280px and390px:6 MathML displays,zero parser errors/document overflow; IoU visually inspected. Incoming original algorithm heading resolves to canonical hard-nms. Proof:detection-typeset.png in the Codex workspace. No new full-paper/figure/benchmark or complete accessibility certification; earlier targeted primary scope remains the limit. Source-body reconciliation is now closed locally, not the remaining production/reference gates below.

Complete sentence-level preservation/editorial closure, targeted reference/figure review where substantive extensions require it, canonical/legacy URL routing and alias policy, source archive decisions, full keyboard/reduced-motion/offscreen/disposal integration, shared mobile floating-navigation overlap polish, production/index/privacy/build verification and explicit publication approval. Reader implementation and passing tests are not completed migration. No original is retired before coverage and old-route gates pass.
