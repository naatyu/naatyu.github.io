---
name: research-learning-notes
description: Assess sources and create or enhance research notes in Nathan's interactive Atlas. Use for papers, reports, technical blogs, and supplied explanations; prefer updates to existing dense topics. Assessment alone does not authorize edits or publication.
---

# Research learning notes

Create pages Nathan can return to months later without the original conversation. Read `.internal/v2/authoring-contract.md` for his content and design preferences and `.internal/adding-content.md` for code integration. This skill covers research, evidence and teaching decisions; do not duplicate those guides here.

This skill is versioned alongside the Atlas. Locate the repository from the current workspace or this skill's `.agents/skills/research-learning-notes` location; do not assume every task runs in the Atlas repository.

## Scope and placement

- Distinguish assessment from implementation: “is this worth a note?” calls for reading and a recommendation; create or update after approval. An approved note does not authorize a push unless the user asks.
- Search the live reader registry and topic bodies before writing. Papers normally extend existing topics; a distinct paper or model name alone does not justify another page. Add meaningful section-level cross-links.
- Place material by topic, not by the user's current motivation. A useful coding trick or training concept is not interview preparation merely because it arose during a job search.
- Preserve unrelated changes. If asked to push pending notes, inspect the diff and exact files. Never infer that all untracked files belong to the task.

## Read and establish evidence

- Read the primary paper/report or all requested blog parts, including relevant appendices, figures, captions, tables, and experimental details. Abstracts and generated summaries are discovery aids, not substitutes for reading. State inaccessible or unread material instead of claiming full coverage.
- Use authoritative sources for technical claims. Follow relevant linked reports or implementation code when needed to resolve an important detail. Verify current model names, releases, and specifications rather than trusting memory.
- Identify the actual novelty, closest baseline, experimental scope, and engineering implications. Separate **reported observation**, **author hypothesis**, and **our proposed adaptation**.
- Record numbers with their conditions: model size, dataset, train/test split, token budget, precision, sequence length, evaluation harness, and measured versus estimated compute/time when relevant. Percentage points and relative percentages are different.
- Explain ablations and weaknesses, including small samples, benchmark-specific effects, selected checkpoints, missing reproducibility details, and comparisons that are not compute-matched.
- Do not turn one surprising result into a universal rule. An earlier checkpoint winning in one experiment does not establish that earlier checkpoints always win.

## Teach the mechanism

Choose an organization suited to the material rather than enforcing a fixed template. A useful progression is: problem → intuition → worked example → mechanism → evidence → implementation or implications → limits → related notes and sources.

- Explain what changes, why it helps, and what it costs. Expand unfamiliar terms, define formula symbols, track tensor shapes, and show one small concrete example where it resolves ambiguity.
- Make distinctions visible: pretraining versus post-training, logits versus hidden states, capability versus transfer, observed behavior versus internal mechanism, theoretical FLOPs versus measured serving latency.
- For implementation notes, include enough detail to implement without following links: operation order, shapes, masks, numerical precision, initialization, gradients, edge cases, and checks appropriate to the method. Label pseudocode and untested code.
- For model reports, cover architecture **and** training/post-training when disclosed: attention and positional encoding, dense/MoE layout and routing, data and schedule, SFT/RL, rewards, environment construction and verification, systems choices, and evaluations. Mark undisclosed details as unknown; never fill gaps with invented recipes.
- If transferring an LLM idea to vision or another domain, explain the adaptation and what would need validation. Do not present an extrapolation as a result from the source.
- Keep the page self-contained; avoid “as we discussed.” Preserve exact math in rendering-safe notation and optionally give plaintext equivalents when they materially aid terminal use.

## Design for understanding

Before adding visuals, identify what the reader needs to understand and the one relationship that is hardest to explain in prose. Use that as the page's signature visual. Preserve the site's established typography, navigation, and theme; do not redesign the whole site for one note.

Choose the smallest effective representation:

| Reader's question | Useful representation |
|---|---|
| What changes over training or time? | A measured curve or annotated timeline |
| Where do tensors/data/gradients go? | A shape-labeled flow or architecture diagram |
| What differs between variants? | An aligned comparison or compact table |
| How does a parameter change behavior? | A bounded interactive example with explained outputs |
| What should I notice in this paper graph? | The original figure with a reading guide |
| What is the implementation sequence? | A small process diagram and supporting code |

Avoid decorative dashboards, repeated stat cards, gratuitous animation, or adding an interaction merely because the format allows it. Prefer step-controlled or opt-in animations for changing processes; use static diagrams when motion adds nothing.

### Paper figures

- Select figures that carry an important claim. Download appropriately sized originals or extract readable figures from the PDF. Do not import every plot into the repository.
- Store local assets under `static/img/<note-topic>/`; use stable descriptive filenames. Inspect the downloaded image, not only the filename or paper caption.
- Attach the figure number, source link, descriptive alt text, and a concise **how to read it** explanation: axes, units, legend, panels, takeaway, and relevant caveat. Clearly label conceptual schematics as such.
- Make dense plots available at full resolution. Preserve aspect ratio; constrain tall images; keep figures readable on mobile and white-backed plots legible in dark mode.
- Attribute excerpts accurately and check reuse terms. An arXiv hosting license is not automatically an open reuse license. If reuse is unsuitable, prefer an original explanatory diagram or a clearly labeled redraw with its source and scope.
- Never silently repair an apparent axis typo or relabel a published figure. Flag it; avoid numerical deductions the faulty axis cannot support.

### Original and interactive visuals

- Prefer code-native SVG/HTML/CSS/canvas for exact scientific diagrams and plots. Use image generation only for genuinely illustrative raster material, not to fabricate empirical charts or mathematical evidence.
- Plot reported values accurately. Label sparse observations and connecting guide lines; do not imply interpolation is measured. Give reconstructed charts their source, and mark synthetic examples as illustrations rather than experiments.
- Let interactions expose a meaningful difference: checkpoint choice, method variant, temperature, position, tensor dimension, or inference budget. State what changes and what is held fixed.
- Keep controls keyboard-accessible with native buttons/inputs, visible focus, appropriate labels and selection state. Use accessible chart descriptions and explanatory text; never rely on color alone.
- Keep an intelligible static explanation/table alongside interactive evidence. Numerical claims must remain available without interacting. Avoid layout jumps, client-only blank content, or browser globals during server rendering.
- Support narrow screens and the shared Gallery/skywine palette. Keep playback opt-in and honor reduced-motion preferences.

## Live Atlas integration

- Readers are ES modules in `v2/site/readers/`, registered in `index.js`. Render complete semantic HTML before mounting optional interactions. Do not author new content in legacy `docs/` or React/MDX components.
- Reuse shared math, section, navigation, playback and reader-state helpers. Keep source calculations independently testable. Follow `.internal/adding-content.md` for metadata, lifecycle and verification steps.
- Preserve stable slugs/anchors and original publication dates. Update `updated` for substantive edits. Do not mark new production content as a prototype or maintain a second public search catalog.

## Verify and hand off

- Check facts and reproduced values against sources, figure provenance, internal links, and whether limitations survived the redesign.
- Run `git diff --check`, affected numerical/interaction tests, `npm --prefix v2 test` and `npm --prefix v2 run test:publication`. Confirm routes, rendered math, navigation and searchable text. Legacy Docusaurus/TypeScript commands are not the live validation path.
- For interactions or layout changes, use a browser when available: exercise representative and boundary states, inspect desktop/narrow layouts, figures, focus, accessible labels, reduced motion, browser errors and horizontal overflow. Report unavailable checks accurately.
- Before publishing, inspect the exact staged diff. Push only when asked. If the remote has new commits, fetch and inspect them; integrate without overwriting remote work or force-pushing. Stop on conflicts that require a substantive user decision.
- Hand off briefly: link the note, identify the teaching improvements, state validation results, and distinguish local, committed, pushed, and deployed status. Do not claim deployment solely because a push succeeded.
