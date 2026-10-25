# Historical Atlas v2 design-phase progress

This is the 2026-10-02 design-phase record, not current migration guidance. Current state is in `corpus-worklist.md` and `migration-progress.md`. The user has since approved Gallery/Skywine and the dense-topic reorganization; the obsolete approval gate below is historical only.

## Completed in the design phase

- Preserved the existing live site and the unpublished local multi-harness note.
- Inventoried 232 source documents: 230 tracked public note entries, one Atlas navigation page, and one unpublished local note.
- Recorded structural flags for 33 documents. These flags are review prompts, not deletion decisions.
- Added three isolated working directions: Research Observatory, Editorial Atlas, Interactive Lab.
- Each direction includes a homepage, an explorer with topic filters/search/sorting, and the same interactive entropy/cross-entropy/KL lesson.
- Created an internal v2 authoring contract preserving scientific rigor, provenance, accessibility, shared metadata, original publication dates, and coherent visual primitives.

## Verification (2026-10-02)

- Node syntax checks for the prototype app, inventory script, and server pass.
- Browser checks: three desktop homepages, three explorer layouts, and the reader.
- All nine views fit a 390px viewport without document-level horizontal overflow.
- Topic filtering and title/summary/tag search return expected results. Global search finds Speculative Decoding.
- Native keyboard slider operation updates the calculation.
- Matched fair coin: entropy 1, KL 0, cross-entropy 1 bit/outcome.
- Matched 90% coin: entropy approximately 0.469, KL 0, cross-entropy approximately 0.469 bit/outcome.
- P(heads)=0.9, Q(heads)=0.1: entropy approximately 0.469, KL approximately 2.536, cross-entropy approximately 3.005 bits/outcome.
- No warning/error entries observed in browser logs during these checks.

## Boundaries and pending work

The complete editorial/factual audit has NOT been performed. Every source entry remains pending substantive review. Candidate merges in the inventory are hypotheses, not approved changes. The entropy page demonstrates a teaching direction; it does not migrate all unique material from the source notes.

These lightweight native HTML/CSS/JavaScript prototypes do not finalize the production stack. The prototype index is generated from existing frontmatter; it searches titles, summaries, and tags, not full note text. Original live links are derived from repository routing metadata, not exhaustively HTTP-verified. Publication visibility is inferred from tracked files and frontmatter, not a deployment check.

Production still needs static rendered content and interaction fallbacks, full-text search, final metadata validation, collection/related-note navigation, redirect coverage, source/asset checks, and a complete review of every retained note. Existing Docusaurus-specific skill instructions will be adapted once v2 becomes the active platform.

## Next gate

Ask the user to select a direction (or specific features to combine). Then complete the editorial reorganization proposal and migration architecture in that design language. Review substantive consolidation decisions with the user before removal. Do not replace deployment or push prototypes without authorization.
