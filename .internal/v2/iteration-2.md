# Prototype iteration 2 — 2026-10-02

## User-approved direction

Finder-style progressive browsing, fuzzy search, topic main explainers with deep-dive note links, and smoother visual surfaces. The full content reorganization remains a corpus-wide review, not an accumulation of ad hoc prototype merges.

## Implemented locally

- Finder columns with arbitrary category depth, breadcrumbs, shareable category URLs, and native browser Back/Forward.
- Provisional subject reassignment across the current public catalog. Interview preparation is no longer a top-level subject; NeetCode is a tag-backed collection of algorithm notes.
- Shared ranked search with aliases and bounded edit distance including adjacent transpositions. Titles rank above summary/tag matches. Searches in the main explorer span the Atlas (or the active collection) rather than silently staying in one subject.
- A main MoE explainer linking to a routing deep-dive preview and the original stability/sparse-looped-model notes. Clear return-to-parent and next-note navigation in the routing preview.
- A tree DFS example with 12 enter/return events, recursive-stack state, recorded preorder, manual Previous/Next/Reset controls, and a static worked explanation.
- Softer tokens, surfaces, rounded controls, and less hard-bordered presentation in all three existing candidate designs. This is an iteration, not a claim that the design choice is settled.
- Separate prototype package scope and built-in Node tests; no production dependency or deployment changes.

## Verified

- Node search/mapping tests pass: `mixture of exparts`, `mixtuer of experts`, and `MoE` rank the main explainer first; abbreviated DFS and misspelled speculative decoding return relevant source notes.
- Browser checks confirmed both search interfaces return the expected typo result, and the main MoE → routing → parent links work.
- Browser category navigation followed AI → Architectures → Mixture of Experts; Back and Forward restored the expected category URLs.
- NeetCode explorer contains 19 tagged entries and shows Algorithms as its domain.
- DFS finishes with A → B → D → E → C → F and an empty stack. Next disables at completion; Reset restores the empty start.
- All 15 home/Finder/MoE/routing/DFS views fit a 390px viewport without document-wide horizontal overflow.
- No browser warning/error log entries observed in these checks.

## Still pending

### Navigation follow-up

Category, breadcrumb, and collection links now update the Finder in place via History API rather than reloading the document. Vertical position, horizontal column position, search input, and sort choice are preserved. Modified clicks and opening notes retain normal link behavior. A native visible category click and browser Back were verified at the same scroll position (245.5px), with the fuzzy query retained; no browser errors observed.

The complete editorial/factual pass has NOT happened. Category mapping is currently based on source paths, tags, and explicit prototype exceptions; it is not a substitute for reading each source. No source note was merged, moved, or deleted. The new MoE/routing/DFS samples are NOT marked as completed migrations.

The next editorial deliverable is one corpus-wide mapping: each source's reader goal and unique material, proposed subject and parent/collection relations, keep/merge/split/expand/move decision, and preserved-route plan. Review the proposal before substantive removal, then implement the accepted visual learning conversions coherently. Production still needs static rendering, full-text indexing, metadata and route validation, interaction fallbacks, and complete visual/factual QA.
