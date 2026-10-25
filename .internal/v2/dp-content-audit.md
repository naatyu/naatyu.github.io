# Dynamic Programming preservation audit

## Two-source preservation closure — 2026-10-07

This entry supersedes the older linked-original statements below. Both complete source bodies were freshly read, byte-equal Git HEAD, and match the fingerprints below. Their unique reusable mechanisms, conditions and code are now represented in the consolidated reader. Exercise lists become state families, not individual problem articles. Physical originals remain unchanged for the coordinated production switch; no public original block remains in this reader.

The top-down template remains explicitly domain-dependent pseudocode, now including its cache import. Bottom-up dependency ordering is represented by the contract and complete prefix/suffix implementations. Restored Word Break prefix feasibility, unobstructed grid paths and the original suffix LCS alongside a complete callable prefix LCS. Separate Grid and Alignment sections keep grid-path counting distinct from string alignment. Grid dimensions are explicitly validated; zero dimensions return zero and obstacles need a different initialization. Dictionary duplicates/empty entries, Unicode code-point units, empty strings and length-versus-reconstruction are explicit. All code regions support keyboard-local scrolling. Canonical Graph/Tree/Backtracking references replace the old article links.

Four actual rendered implementations independently tested:961 LCS pairs against exhaustive subsequences,8128 segmentation cases against enumerated cut sets,121 grids against binomial path counts. Unicode, duplicate/empty words, invalid dimensions and exact100×100 counts pass. No claim that the broader prose-only DP families have complete tested implementations. All27 original headings have reviewed semantic destinations.

Full47-command suite passed(session66896,exit0) after code/route transfer. Final targeted DP/static checks passed after Grid section extraction and destination correction. Corpus76 reviewed source candidates/1075 exact headings;54 static readers/79 legacy routes/23 old-dependent readers. All447 displays parse,including5 DP displays. Source bodies are unchanged; no physical retirement or publication.

Native1280 expanded segmentation/math inspected (dp-preserved.png). At390px all five code regions are focusable,with local widths220–258 and content437–618;Word Break ArrowRight scroll40;zero document overflow/KaTeX errors. All restored details expanded for narrow checks. Viewport reset,tab6 retained. Extended-primary,actual OS reduced motion,corpus accessibility and production/retirement gates remain open. This pass did not freshly claim external textbook review. No commit,push or deployment.

## Mathematical rendering pass — 2026-10-07

Five formulas: ordered-walk bases, full-prefix segmentation, piecewise0/1 knapsack with infeasible take case, strict LIS with empty predecessor, and prefix LCS bases/cases. Time/space mnemonic converted to scoped prose: actual transition costs and simultaneous live storage,not an exact product/sum. Explicit TeX/MathML is rendered during construction; symbols/domains/base cases and versioned dependencies are stated beside the display. Pure scene models unchanged. Existing graph/tree/DP tests and math tests pass:12,288 weighted cases/192 BFS cases,tree/trie checks,1,152 knapsack policies and961 LCS pairs. Native390px:expected2/1/5 MathML counts,zero errors/page overflow; desktop knapsack cases visually inspected. Proof:dp-typeset.png in Codex workspace. Viewport reset,handoff marked. This is not a fresh full-source/primary closure; original/archive links remain pending rather than silently deleting unique code. Shared utility overlap still needs corpus-level correction. Production/source files unchanged,no commit/push/deployment.

Updated 2026-10-04. Local draft `algorithms/dp`. Both assigned bodies read completely; full originals stay linked and unchanged. This audit is not a production or full-primary-review claim.

## Coverage

| Source material | Reader destination |
| --- | --- |
| Recognition by repeated states/count/min/max/feasibility | `#state` |
| Meaning, transition, bases, order and answer location | `#contract` |
| Cached recursion versus tabulation, recursion overhead | `#evaluation` |
| Linear count, nonadjacent take/skip and circular restriction | `#linear` |
| Prefix segmentation and full Word Break implementation | `#segmentation`; full original code linked |
| Unbounded coins, 0/1 capacity, correct update direction | `#reuse`, `#knapsack-lab` |
| LIS ending state O(n²), strict inequality and O(n log n) alternative | `#sequences` |
| Grid paths, suffix/prefix LCS, substring versus subsequence | `#alignment`, `#lcs-lab`, `#edit` |
| Unit-cost insert/delete/replace, empty row/column | `#edit` |
| Interleave, distinct subsequences, increasing grid path and regex states | `#edit` |
| Palindrome intervals, split order and last-removed-boundary reasoning | `#intervals` |
| Old versus current row, saved diagonal, reconstruction tradeoff | `#compression` |
| States × transition work, stack space, hidden key/arithmetic cost | `#practice` |

All original core patterns survive. Practice list names become recurrence/state families, not individual exercise solutions. Added explicit empty/singleton take/skip bases and nonempty-selection distinction. Capacity describes at-most versus exact-fill sentinel contracts. Positive/unique denomination assumptions, combination versus sequence loop nesting, pseudopolynomial dependence, substring creation cost and cycle/cache invalidation are explicit. The prefix LCS implementation is intentionally different from the original suffix implementation; the reader explains both dependency directions rather than mixing them. Short executable fragments/pseudocode are labeled; full original functions remain available.

## Visual and numerical checks

No image/component assets referenced in the original bodies. Two exact original labs: one item (weight 2/value 3/capacity 4) changes only allowed reuse and loop direction; LCS of `ab` and `acb` exposes empty-prefix bases, unknown cells and dependency edges. These are small exact models, not benchmarks.

Full npm suite passes, including 1,152 capacity policies against direct independent reference values and 961 binary-string LCS pairs against exhaustive subsequence enumeration. Every shown LCS dependency has already been computed. Anchor/registry/source-link/search checks pass. Tests are not a verification of all described DP families.

Browser endpoints/intermediate state: one-use optimum 3 versus reusable 6; zero-item table all zeros; LCS initial unknown interior, first diagonal update 1 and completed length 2. Dropdown changes retain bounded step state and do not start playback. Checked 390px and 1280px full-width reader with no document overflow; long code scrolls locally. Fixed low-contrast DP table headers inherited from light reader styling. Final warning/error log empty and viewport reset. Evidence `dp-v2-check.png` in current Codex workspace. Shared lifecycle/reduced-motion harness passes; actual OS preference QA pending.

## Sources and gates

- `docs/interview-prep/neetcode-roadmap/one-dimensional-dynamic-programming.md`: `8dd22eb69eaf8725b2362d6651f1dafbe1cf63584ebe5d69b885597a000c0fa3`
- `docs/interview-prep/neetcode-roadmap/two-dimensional-dynamic-programming.md`: `de77c0081a1b694f7ad0325760b9953524e05832b7fe9f33774e0d6c6b1a0a89`

No new external DP reference was freshly fully reviewed; content derives from owned source bodies plus independently tested lab recurrences. Remaining: final editorial/preservation and primary review of extended mechanisms, production metadata/static routes/search/redirect gates and real reduced-motion QA. Original date 2026-07-24 preserved, update 2026-10-04; local draft excluded from latest-published carousel. No archive, removal, commit, push or deployment.
