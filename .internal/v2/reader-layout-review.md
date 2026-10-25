# Shared reading-layout review — 2026-10-07

## Utility margin

Selected Gallery/skywine workspace now reserves a60px right margin for the existing Home, explorer visibility and section-lookup controls. The three targets are44×44px and use their existing accessible names/titles. No top navigation band, hide-note or expand-note control is introduced. Opening section lookup intentionally opens a dismissible popover; persistent controls no longer overlay scrolling prose.

Implementation:`v2/prototypes/reader-utilities.css`, loaded after other reader styles in `directions.html`. Rules are scoped to `body[data-atlas-full=true]`; the home carousel and non-workspace layouts are unchanged. Reader/explorer JS lifecycle and category navigation are unchanged.

## Native evidence

Verified in Backtracking's selected workspace after a section jump, not only at the page top:

| View | Reading pane right | Utility left | Gap | Overflow |
| --- | ---: | ---: | ---: | --- |
|1280px split|1220|1228|8px|None|
|1280px explorer hidden|1220|1228|8px|None|
|390px explorer hidden|330|338|8px|None|
|320px explorer hidden|260|268|8px|None|

All three controls have44px width and height. Desktop proof:`reader-utility-margin.png` in the Codex workspace. Narrow screenshots inspected. At390px the lookup popover spans x68..382 and stays inside the viewport; at1280px x912..1272. Escape closes it and returns focus to the On-this-page summary. Viewport reset; preview retained for continued work.

This verifies the shared margin and menu behavior, not every note/figure/table/mobile combination. Existing narrow tables can still split words into awkward fragments; comprehensive focusable table/figure scrolling, actual OS reduced-motion and final production QA remain gates. No claim of full accessibility conformance or completed migration.

No source-note content,production configuration,publication state,Git commit,push or deployment changed.

Verification: all46 default checks completed successfully after the utility changes (session91020,exit0). Dedicated prototype checks and Git whitespace checks also passed. This is a layout checkpoint,not corpus or production closure.
