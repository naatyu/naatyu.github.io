# Reviewed primary destination reconciliation — 2026-10-12

## Scope

This is private structural bookkeeping, not a new content-coverage or publication certification. The interrupted 2026-10-11 turn added 206 `reviewedPrimaryDestination` fields to retained source rows. This continuation confirmed those fields survived, then added enforcement. No public reader, runtime route, original body or production setting changed.

`primaryDestination` remains the historical proposal. `reviewedPrimaryDestination` records the current default section from `reviewed-route-destinations.json`. Fragment and secondary destinations remain in that reviewed route ledger; this work does not collapse them into a single default destination. The old 199 proposed-anchor gaps are retained as historical diagnostics, not renamed as content preserved or erased from history.

## Evidence

- `test-reviewed-destination-ledger.mjs` parses actual HTML from all 54 readers and verifies all 206 reviewed primary sections against private route review.
- Twelve independent fixture mutations verify detection of missing fields, a different valid section, a sectionless URL, a removed rendered anchor, altered fingerprint/old route, missing/duplicate review, duplicate source identity, unknown/retired reviewed identity and a content destination on a retired source. The diagnostic does not mutate the proposal fixture.
- `audit-corpus.mjs --summary`, session 16218, terminal exit 0: 206 matching reviewed primary destinations; 3,235 reviewed fragments; no source changes, route disagreements, duplicate IDs or broken canonical section links. All 232 originals remain readable; 231 are byte-equal to Git. The sole untracked multi-harness original is still not Git-recoverable and must not be removed.
- After stripping only the new reviewed field, the canonical JSON projection hash observed before and after this continuation is `587450e0b1cd796a8b6df445679431f110a8691bd09c4ba5f683e5ee36612f74`. This verifies no further proposal change during this continuation; the pre-interruption stored hash was unavailable and is not claimed as an independently recovered comparison.
- The new check is imported by the existing default static suite. Full 47-script regression session 17932 reached observed terminal exit 0 after the implementation changes. Static candidate `jsNQfy` reports 54 readers, 206 landings, 25 notices, 3,235 anchors, 535 display equations, 15 images, 544 files and zero old-content dependencies.

## Remaining migration work

No reader is promoted to production-ready by these checks. Complete topic-specific primary/figure review, semantic preservation/editorial coherence, inline/scene-math review, native accessibility/lifecycle and final production-host/switch gates remain separate. Physical original retirement still waits for the validated switch and verified recovery. No native rerun is necessary for these internal-only changes; no commit, push or deployment occurred.
