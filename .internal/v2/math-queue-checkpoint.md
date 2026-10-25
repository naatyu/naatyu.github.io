# Remaining raw-math review queue — 2026-10-18

## Subsequent transfer checkpoint

Parallelism's mesh relations, Data's KL support expression and Decision's probability/Brier captions are now typeset and tested; see reference-notation-audit.md. Fresh 9ceb3d reports 59 candidates, with zero Parallelism candidates and only scene-output matches in Data/Decision. Items 1–3 below are historical triage, not still-open work. Diffusion prose and Optimization's assumptions caption are next; the dynamic-state review remains separate.

Fresh read-only run 5bb514: 54 readers, 63 matching text nodes. Distribution: 7 prose, 52 scene, 1 table and 3 caption. These are heuristic matches, not 63 known errors. No detector suppression or public changes were made during this triage.

## Next targeted formatting pass

1. Parallelism#rooflines: the mixed-mesh ownership paragraph still uses raw N=XY, reciprocal X and Y=N/X. Transcribe the existing relations without changing the forward-MLP/topology/overlap scope.
2. Data#surrogate: typeset KL support notation. Retain the positive-mass/zero-prior infinite-divergence condition and explicit smoothing decision.
3. Decision Models#distributions and #objectives: typeset the probability-simplex conditions, ordered-level domain and binary expected Brier loss. Do not change the one-class-versus-two-class convention or confuse mean with reconstruction.
4. Diffusion#marginal and #posterior: inspect the full surrounding parsed sentence, not only the detector fragment. Preserve the clean-state/conditional-moment distinction, unknown clean input at inference and deterministic first-step posterior condition.
5. Optimization#noise-lab: inspect the static caption and runtime renderer together before typesetting the base-rate/batch assumptions. Its 52 scene peers need the same static/runtime separation rather than a bulk replacement.

## Intentional or context-sensitive matches

Attention's two “Why divide by √d?” matches are one heading plus its navigation label. They are not evidence of an unrendered display equation. Decoding's guidance paragraph matches the combination of w=0 and K/V wording; inspect baseline semantics rather than assuming every slash denotes a fraction. Performance's beta=0 is a GEMM accumulation convention, beside units and ownership conditions. Any change must preserve that meaning.

Most scene matches are live values, control labels or generated interpretations. Some deserve real mathematical layout; others are more readable as units/counts. Verify each owning numerical model, its generated-markup guards and desktop/narrow native states before declaring the scene reviewed. The detector excludes SVG/code/typeset math and does not certify split-node, dynamic, semantic or source correctness.

## Latest verified navigation state

Reader reflow repair is recorded in reader-reflow-audit.md. Fresh post-audit focused run 8a72fd exits 0 (file explorer and history), as does tracked whitespace checking. The prior full 47-script run remains valid for the public implementation: only private audit files changed afterward. Original preservation, source recovery exception and production/publication boundaries are unchanged.
