# Mesh, mixture and decision-reference notation — 2026-10-18

## Scope and changes

The preceding goal turn made verified progress on reader reflow. Current worktree, authoring guide and topic audits were revalidated. This pass transcribes existing relations into mathematical layout; it does not claim new full external-primary, report, figure or whole-topic editorial certification.

- Parallelism#rooflines: four inline expressions for mesh size, the two reciprocal traffic factors and the substituted TP degree. Existing forward-MLP, topology, full-overlap, continuous-candidate and hardware-divisor conditions remain adjacent.
- Data#surrogate: typeset the KL-to-prior expression. Positive proposed mass outside prior support still gives infinite divergence. Smoothing remains an explicit modeling decision, not an automatic numerical repair.
- Decision Models#distributions: nonnegative masses, their indexed sum and the ordered level range now have proper mathematical layout. The 1.2 mean, rubric dependence and distribution-versus-summary distinction remain unchanged.
- Decision objective scene: typeset the known conditional frequency and expected binary Brier formula in its persistent caption. The single-binary-loss convention is explicitly not the two-class sum. Slider-driven numerical output and interpretation are unchanged.

Ten inline additions overall. Parallelism has 11 displays + 10 inline = 21 MathML roots; Data 8 + 4 = 12; Decision Models 7 + 5 = 12. Updated dates become 2026-10-18; original publication dates remain 2026-04-08, 2026-04-08 and 2026-08-05. No code example, model, source body, asset or legacy destination changed.

## Verification

New test-reference-notation.mjs is imported by the default topic-reader suite. Exact parsed annotations, formula counts, support/mesh/rubric/Brier conditions, generated-markup safety and publication lineage pass. Existing independent numerical checks remain distinct: 243 continuous meshes, 567 masked/order/extreme-score softmax cases, 16,512 causal ownership and 89,440 ring states; Data's mass/cap/MinHash/LSH/KL/code tests; Decision's 10,571 numerical cases and 222 generated states. The nine Parallelism, two Data and two Decision core source bodies still pass their existing Git-equality closures.

Initial focused runs exposed stale total-MathML assertions (17→21 Parallelism, 7→12 Decision); the first full run also exposed the shared count expectation. Those expectations and diagnostic text were updated to distinguish displays from inline additions. Final full 47-script run 54007 reached terminal exit 0 in b51801. Dedicated Decision run 9a5b21 exited 0; build 10754/4868b0 exited 0. Tracked whitespace check 81bfb5 exited 0; untracked implementation coverage comes from executable checks, not git diff alone.

Full-suite static artifact kEhPDW: 54 readers, 206 landings, 25 notices, 3,235 anchors, 536 displays, 1,437 namespace-valid MathML roots, 15 media assets, 544 files, zero old-content dependencies, 373 comparison regions and 161 code regions. Fresh raw queue 9ceb3d: 59 manual candidates; none in Parallelism, only scene output in Data and Decision. This is not a complete math/source correctness certificate.

## Native verification

Separate built candidate SEr4lY served on localhost4324. At 1280×900 and 390×844, inspected the reciprocal mesh paragraph, Data's KL support explanation, Decision's indexed probability caption and binary Brier caption. Counts match 21/12/12; no KaTeX errors or document overflow in checked views. Screenshots show real fractions/indices rather than raw slash/subscript text. The mobile probability constraints wrap within the caption; no tiny-font or page-wide overflow workaround was introduced.

Keyboard Home moves the Decision probability slider to 1%; displayed values become reward0.304, log loss3.2266 and binary Brier0.6861, while the caption and known-frequency condition persist. Desktop and narrow caption screenshots were inspected. Warning/error log empty. Initial attempt used native-AX checkbox semantics for the explorer control; fresh DOM state identifies a button, whose click works. No application repair was needed for that automation mismatch. Viewport reset, temporary tab closed and preview27506 stopped (130).

## Remaining migration requirements

This closes four specific raw-text candidate nodes, not all 59 remaining candidates or every dynamic formula. Diffusion's remaining prose candidates and Optimization's assumptions caption are next in the queue. Wider source/figure, semantic/editorial, lifecycle/accessibility and production-switch checks remain scoped by their topic/release audits. All originals and the production workflow are intact. The untracked harness original still lacks pinned Git recovery. No retirement, commit, push or deployment occurred; goal active.
