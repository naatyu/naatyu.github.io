# File explorer — 2026-10-06

Nathan requested a Windows/Linux-like file explorer instead of the terminal. Gallery now defaults to this workspace, including historical `explorer=console` and `finder` links. The previous terminal implementation remains recoverable via `explorer=terminal`, with no default terminal/finder choice in the home design controls.

Implemented: category shortcut sidebar, clickable breadcrumbs, back/forward/up folder history, immediate folder contents, fuzzy atlas-wide search, list/grid layouts, selected-note preview, single explorer visibility toggle. The skywine palette is unchanged. Category browsing does not remount the reader; selecting another note disposes the old interactive reader before mounting the new one. Related note links retain the atlas workspace. Initial section hashes scroll to their rendered targets.

The catalog still includes the recoverable original entries alongside v2 drafts, as before this change. This UI work does not certify the taxonomy or retire original notes. The source preservation and production gates remain open.

Verified in native browser: Models → Architectures, back/forward, typo search `mixture of exparts` ranks MoE first, result opening, list/grid switching, selected state, hide/show. Desktop hidden reader spans 1280px. At 390×844 the panes stack, the fixed utility margin stays outside content, and hidden-reader width is 338px plus the 52px utility margin. No page horizontal overflow or browser warning/error logs in this session. Viewport reset after checks.

Pure tests cover immediate-only directory contents, nested navigation data and deterministic sorting. All 46 default script suites pass, including existing search/publication and search-link checks. Native Enter opens a folder and a note; focus transfers to the next directory entry and remains on the selected note after rerender. No original source edits, production changes, commit, push or deployment.

Screenshot: `/Users/nathan/Documents/Codex/2026-07-20/new-chat/atlas-file-explorer.png`.
