# Gallery refinement

Latest simplification removes global navigation and pane title bands in terminal Atlas, along with Hide note / Expand / Run controls and welcome shortcut buttons. Floating Home link and one Terminal pill remain; Show Finder is a quiet command-row control. The current path stays as unobtrusive terminal text. Terminal uses plum charcoal, dusty-rose username, baby-blue path, and soft neutral output. Hidden terminal still gives the note the full viewport. GNOME and Powerline rounds below are historical.

Current terminal styling supersedes Powerlevel10k: GNOME-inspired charcoal chrome, plain `reader@atlas:/atlas/path $` prompt, no segmented badges. Persistent top-bar terminal pill (icon and status dot) toggles terminal visibility; note occupies the full workspace when hidden. Toggle choice is preserved across in-app note navigation for this page session. Reader content uses the expanded viewport with bounded prose widths and responsive diagrams/cards. Ctrl+L clears output; Ctrl+C clears current input (not a real process interrupt). No real shell access.

Atlas terminal is now a viewport-sized workspace, not a landing page. The hero/title, palette toolbar, footer, and outer margins are removed in this view only. Desktop panes are equal width and independently scroll; small screens split vertically. Hide note / Show note toggles terminal-only mode; Expand / Restore explorer toggles reader-only mode. Prompt uses Powerlevel10k-inspired segments and the current browse path. This is styling of the catalog simulation, not a real shell or installed terminal theme. Homepage design and soft palettes remain unchanged.

Added optional `skywine`: soft Burgundy / Baby Blue. Neutral/light background, burgundy actions and headings, pale-blue page layers and project surfaces, dark slate terminal with baby-blue accents. Existing soft palettes and terminal behavior unchanged.

Latest feedback supersedes saturated palettes below: restored neutral/light Gallery with Jade, Blue, Burgundy, and Butter accents. Default Jade; old Wine/Oxblood/Plum URLs map to soft Burgundy. Terminal remains dark and terminal-first. Current folder is persistent in the terminal header and prompt; command history records the path at invocation. `ls` lists immediate child folders plus notes directly assigned to the current browse path, never descendant notes. Root contains six folders and zero files. Finder's complete descendant list and global search remain unchanged.

Explorer default is now a full command terminal with no filesystem above it. A Show Finder / Terminal only toggle reveals or hides the virtual filesystem without losing command output or the selected preview. Explicit `explorer=finder` still opens the column Finder; legacy Navigator URLs now resolve to terminal mode. The reading preview stays beside the explorer on wide screens and below on small screens.

Current palette round supersedes the mixed light palettes below. User wants rich colored backgrounds, not off-white or almost-black backgrounds: Wine, Oxblood, Plum, Cobalt, Forest, Teal, Espresso. Each uses tonal surfaces and readable pale text; no contrasting yellow/blue cards in the burgundy variants. Select with `palette=wine|oxblood|plum|cobalt|forest|teal|espresso`. Default/fallback: Wine. Palettes apply to Home, Finder, Navigator, Console, and Reader.

User selected Gallery as the visual base. Keep its spacious homepage; further choices concern palette and Atlas exploration rather than replacing the entire design again.

The original palette proposals were replaced by Butter/Burgundy, Baby Blue/Burgundy, Butter/Baby Blue, and Blush/Burgundy after user feedback. These are original web adaptations of current color combinations, not copied brand palettes. References: Anaïk's 2026 color-combination article and Behr's 2026 Modern Heirloom palette.

- Navigator: light clickable category/note browser with optional commands and adjacent preview.
- Console: dark monospaced browser/output area beside a light preview.

Both browse the same complete category lists and metadata. The terminal is a whitelist-based catalog simulation, never a system shell. Arbitrary command execution, filesystem access, and network requests from commands are prohibited. Preserve mouse and keyboard access; visitors must not need shell knowledge.

The homepage carousel now has an explicit purpose: three subject entry points (AI & Models, Algorithms, Computing Systems), each with note counts, a description, example topics, and a clear browse CTA. No auto-rotation.

The upper explorer is a clickable virtual filesystem with ancestor breadcrumbs, folders, and note files. The lower terminal has its own scrollable command output. Search and ls results render as clickable entries inside the output, never replacing the filesystem above. Selecting a result opens the adjacent preview. Numeric open targets the most recently displayed command result list. No commands access the real filesystem.

Still pending: final palette/explorer selection, full editorial audit, finalized taxonomy, and complete interactive-note migration. Source notes and production deployment are untouched.
