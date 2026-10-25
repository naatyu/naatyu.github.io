# Archived design-review README

Archived 2026-10-03. This is historical iteration evidence, not current authoring instructions.

# Atlas v2 design review

## Current round: Gallery / Canvas / Desk

Latest terminal refinement replaces Powerlevel10k styling with a GNOME-inspired plain prompt and charcoal surfaces. The persistent top-bar Terminal pill hides/shows the terminal; hiding it expands the note across the full workspace. Reader focus also toggles from its own header. Ctrl+L clears output and Ctrl+C cancels current input; arrow-key history and folder completion remain. This is still a safe catalog simulation, not an OS shell.

The Gallery terminal Atlas now fills the viewport under compact site navigation. No landing title, palette toolbar, or footer appears in this workspace. Equal desktop terminal/reader panes scroll independently; Hide note makes the terminal full-width, and Expand makes the reader full-width. Small screens split vertically. Prompt styling is Powerlevel10k-inspired; commands still operate only on the catalog.

Current visual direction restores soft/light Gallery (Jade default; Blue, Burgundy, Butter alternatives), superseding the saturated palette round below. Terminal header and prompt persistently show the current folder. `ls` lists only immediate folders and directly assigned notes; root shows six folders and no files. Search remains global and Finder still includes descendants.

Terminal is now the default Gallery explorer (omit `explorer` or use `explorer=console`). Use Show Finder to reveal visual filesystem browsing in-place; Terminal only hides it again while retaining output and preview. Explicit `explorer=finder` retains the column Finder. Earlier Navigator URLs now open terminal mode.

Current palette controls now offer seven rich-background tonal directions: `wine`, `oxblood`, `plum`, `cobalt`, `forest`, `teal`, and `espresso`. They supersede the earlier mixed light palette options documented below. Open http://localhost:4322/directions.html?design=gallery&view=home&palette=wine&explorer=navigator and use the top palette controls. Backgrounds, cards, navigation, and readers remain within one color family; unknown older palette URLs fall back to Wine.

Latest refinement supersedes the original four palettes: `butterwine` (Butter/Burgundy), `skywine` (Baby Blue/Burgundy), `buttersky` (Butter/Baby Blue), and `rosewine` (Blush/Burgundy). Current entry: http://localhost:4322/directions.html?design=gallery&view=home&palette=skywine&explorer=navigator

Carousel cards now open three actual subject collections, with note counts, descriptions, topic examples, and explicit browse actions. Navigator/Console use a virtual filesystem above a separate terminal. Both `search` and `ls` produce clickable results inside terminal output; the filesystem remains unchanged during search. Its folders, files, and ancestor breadcrumbs can be clicked. Click a command result to preview it, or use `open <number>` for the latest command result list.

Gallery is the selected direction. Its homepage now includes a manually controlled three-card carousel, four palette options (Cloud/Blue, Ivory/Jade, Linen/Clay, Pearl/Ink), and independent explorer choices. Add `palette=jade&explorer=navigator` or `explorer=console` to Gallery URLs to try the new click-and-command explorers beside a note preview. Finder remains available.

Commands are a local catalog interface, not a shell: `ls`, `cd`, `pwd`, `tree`, `search`, `open`/`cat`, `help`, and `clear`. Tab completes an unambiguous child folder and arrow keys recall commands. Numbered opening uses the displayed list, including search results. Command navigation updates the shareable URL in place; it does not create a history entry per command. Carousel rotation is manual (buttons/arrow keys), respects reduced motion, and keeps inactive cards out of keyboard navigation.

Open http://localhost:4322/directions.html to compare the three new working designs. Each includes Home, Finder, and Reader links. Gallery is a light showcase, Canvas an asymmetric dark publication, and Desk a persistent category/list/reader workspace. Previous prototypes remain available at the original index.

The current round freezes content: existing MoE and DFS samples are reused; other notes expose metadata and a link to their complete current version. Category lists include all descendants. Desk preserves the selected category when a note opens and compresses older category columns into breadcrumbs to leave room for the complete note list. Small screens stack the browser and reading pane.

Checked: nine mobile views at 390px, tablet Desk at 900px, desktop compositions at 1280px, typo search, MoE's four-entry list, and note selection. No deployment, source-note edits, or full editorial review occurred in this round.

Three deliberately different candidates share the same repository catalog and the same interactive entropy example. These previews do not alter the production Docusaurus site.

Run from repository root:

```sh
node v2/scripts/audit.mjs
node v2/scripts/serve.mjs
```

Open http://localhost:4322. The comparison index links to each homepage, explorer, and learning page. The explorer searches titles, summaries, and tags for 230 tracked public notes; the navigation page and unpublished local note remain in the internal inventory. Most entries open the original live Atlas; the entropy learning page is a working v2 prototype, not a finished consolidation of entropy/KL/cross-entropy source notes.

Internal progress and the migration contract live in `.internal/v2/`. Do not index that directory in production search.

## Iteration 2

The Atlas now uses progressive Finder columns and a provisional subject mapping. NeetCode is a cross-subject learning collection rather than a top-level domain. Fuzzy search shares ranked aliases and typo handling between the explorer and the global search dialog; try `mixture of exparts`, `mixtuer of experts`, `MoE`, or `dfs`.

Additional reading samples are available with `view=moe`, `view=routing`, and `view=dfs` in each design. They demonstrate parent/deep-dive links and an exact manual DFS call-stack stepper. None is a finished source-note migration. The full content review is still pending.

Run `node v2/scripts/test-prototypes.mjs` from the repository root for search and category-mapping checks. No production dependencies or deployment files have changed.
