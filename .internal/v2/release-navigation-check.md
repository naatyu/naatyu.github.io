# Final navigation and visual checkpoint — 2026-10-25

## Working goal

The requested bounded release objective is recorded in release-closure.md. The persisted app goal reports `usageLimited`;the available goal tools cannot replace its unfinished objective or resume its usage-limited state. No false complete/paused/blocked transition was used to circumvent that limit. Work here is the user's explicitly requested normal turn,not a claimed automatic-goal resumption.

## Actual defect and repair

On publication-formatVqBLZu,reproduced an in-place note-history defect:after opening MoE from Diffusion's finder search,browser Back restored Diffusion's URL but left MoE rendered. The file explorer replaced the current URL rather than creating a native document-history boundary. Existing hash entries therefore referred to stale in-memory selected content. Folder Back is a separate directory-history control and was correctly disabled before any folder movement;its disabled state was not the defect.

Canonical note results now use the same native document navigation as ordinary canonical note links. The outgoing reader state is captured before navigation. The new URL carries folder path and fuzzy-search text but no stale note fragment. The existing revision-validated reader-history mechanism handles restoration. Historical prototype mode retains its prior local behavior. Folder browsing still does not remount the reader.

Changed public runtime files:file-explorer.js and site-shell.js. Added URL-contract regression assertions to test-site-shell.mjs for default route,nested folder path,fuzzy query and escaping of &,?,#. No reader scientific content or original source changed.

## Native verification

Browser access recovered;no longer Mac-locked during this pass. Temporary tab9 on isolated publication-format3ee0hP,desktop1280×900 and narrow390×844:

- Diffusion Shortcut training/evidence:83MathML roots,zero KaTeX errors,no page overflow. Actual desktop/mobile screenshots inspected;equation width361inside232,code582inside258,synthetic table600inside258. Keyboard Right settles40px in all three. Evidence table scroll reveals result columns;all columns also visually inspected on desktop. No mobile all-columns-at-once claim.
- Fuzzy `mixture of exparts` returns Mixture of Experts first. Native note activation opens its own canonical URL with path/models and preserved query. Back returns Diffusion with exactly the prior evidence-heading top131.9921875px and search text preserved;Forward returns MoE with the query preserved. This is observed normal history restoration (`data-atlas-restoration=history`),not BFCache certification.
- Root shows7folders/0direct notes,not every descendant. Folder Back/Forward operates independently of browser note history.
- MoE animation timeline keyboard End reaches1000. Switching folder toTraining and hiding explorer preserves1000;reading section top changes−308.3125→−308.5390625px (0.227px). Desktop/narrow both have document width equal viewport. Scene screenshot inspected at narrow width.
- Section filter and Enter work. Escape closes the section picker and returns focus to its `On this page` summary. Explorer show/hide works at both sizes. Browser warning/error logs empty.
- Actual current reduced-motion query was false. No OS setting changed and no fresh actual reduced-motion/BFCache/screen-reader certification claimed. Existing numerical/lifecycle/reduced-motion fixtures pass in the default suite. These broader certifications remain follow-up,not invented passes.
- Viewport reset,temporary tab9closed. Preview62363 stopped130 before rebuild;final preview27474 stopped130 after checks.

## Automated verification

Focused80361 terminal0:site-shell/file-explorer tests and publication build. Final full47-script80955 terminal0 after all public edits. Final staticfocba6:54readers,206compatibility landings,25notices,3235reviewed anchors,547displays,1452namespace-validMathML,15media,544review files,zero old-content dependencies. Publication build3ee0hP has56indexable canonical pages and the separate publication support files. HTTP70568 terminal0 on285routes plusHome/Atlas and security/fallback checks. No public edits occurred after the suite started. Private log updates do not affect the artifact. gitdiffcheck passes with the existing untracked-file-scope caveat.

## Handoff

The previously interrupted representative visual/navigation gate is closed to the scope above. Exact commit/publication approval and safe recovery of the local untracked multi-harness original remain separate. Prepared deployment workflow is still inactive. No original removed,commit,push or deployment.
