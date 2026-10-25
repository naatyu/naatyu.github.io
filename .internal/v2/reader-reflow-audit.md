# Reader reflow and interactive reading position — 2026-10-18

## Reproduced defect

The mobile decision explorer could select a branch without producing a reading bookmark. Its header, controls and generated body were absent from the block selector. Resizing preserved raw scroll pixels rather than the visible explanation, so an unrelated static section appeared.

On baseline candidate tiwiYS at 390×844, selecting “No useful state compression; choices split independently” left scrollTop 2070.5 and the decision body at y296.75. At 1280×900, scrollTop remained 2070.5 while that body moved to y−751.9765625. A settled reread and screenshot confirmed the jump.

## Repair

`file-explorer.js` includes section headers, labels, direct code/list blocks and the decision results/body children in the reading-block selector. Zero-height placeholders cannot become bookmarks. Focus changes refresh the bookmark when keyboard selection redraws content without scrolling. Detached anchors are not measured. Cleanup removes scroll/focus listeners and the resize observer.

The history snapshot schema is now version 3: version 2 block indices cannot be reused after expanding the selector. Old snapshots are rejected before dispatch, not applied to a different block. Notes and unrelated storage are not deleted.

## Regression and artifact evidence

Focused run 65b3dc exited 0: existing 108 block-offset and four viewport cases, four new focus-without-scroll cases, empty/detached anchor guards, cleanup checks and 36 history restorations with old-schema rejection. Build ce2b63 exited 0. Full 47-script suite 99681 reached terminal exit 0 (34bb50).

Final native candidate Y3aC95 and full-suite artifact U0kQbc retain 54 readers, 206 moved landings, 25 notices, 3,235 anchors, 536 displays, 1,427 namespace-valid MathML roots, 15 media assets, 544 files and zero old-content dependencies. The full-suite static check retains 373 comparison regions and 161 code regions. The previous raw-math queue of 63 manual candidates was not rerun for this navigation-only change.

Independent comparison d5c839 of tiwiYS and Y3aC95 finds only the two runtime JavaScript files changed; all 54 reader HTML changes are revision stamps only. Scientific text, dates, formulas and model content are unchanged.

## Native scope

On Y3aC95, the same mobile→desktop resize keeps the decision header at y0.265625→0.4375 (less than 0.18px drift) and the chosen explanation visible. After ordinary desktop scrolling, reverse resizing keeps the selected body heading at y16.421875→16.640625 (less than 0.22px drift). Showing the mobile explorer moves the pane to y422 while retaining the same 16.640625px reading offset; hiding it restores full width without losing the branch.

Keyboard search for “negative weights”, branch selection and its mechanism link reach Graphs#negative. Browser Back restores the selected branch visibly in Choosing. This is state/navigation evidence, not proof of exact pre-link offset: link focus scrolls before the app snapshot. No BFCache certification is claimed. Screenshots, zero page overflow, zero KaTeX errors and empty warning/error logs cover these scoped checks. Temporary tab closed, viewport reset; preview sessions 39929 and 33390 stopped (130).

## Remaining gates

This supersedes the specific resize uncertainty in algorithm-notation-audit.md. It does not certify every scene, browser, OS, accessibility interaction or the full editorial/source migration. Originals and production remain intact. The untracked multi-harness source still lacks pinned Git recovery. No source retirement, commit, push or deployment occurred; the overall goal remains active.
