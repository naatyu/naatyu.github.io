# Atlas — current note-authoring guide

This is the single source of truth for Nathan's note-writing preferences. Updated 2026-10-25. Read it before note creation or revision. The research-learning-notes skill supplies source-verification and figure-review rules; `.internal/adding-content.md` explains implementation. The site is live: production uses the standalone v2 exporter and `v2/site/`. Historical Docusaurus sources are recovery/test fixtures, not authoring targets. Migration audits are evidence, not a current task queue. Keep this guide out of public navigation and search.

## Reader and author

This is Nathan's personal working atlas first: capture useful knowledge, find it quickly, revisit precise details, and support his own research and implementation. Other people may read it, but creating a course or optimizing visitor onboarding is not the main goal. Do not dilute precious technical content or impose prerequisite sequences for a hypothetical beginner audience.

The assistant authors and maintains source code. Public notes are written in English. There is no CMS requirement. Current notes are ES modules that produce semantic HTML and mount optional interactions; do not assume Astro, React or MDX is installed. Substantial topic notes with concise sections and useful visuals are personal reference aids, not mandatory lessons.

The homepage carousel contains the last three published notes, with title, publication date, preview and a direct note link. It is not a subject/course carousel. Publication ordering ignores reference-only updates.

## Coherence

- Chosen v2 palette: Burgundy / Baby Blue (`skywine`), confirmed by Nathan on 2026-10-03. Use burgundy accents, pale-blue surfaces and a soft neutral background. The file explorer follows these colors. This is the default, not merely an optional prototype variant.
- Gallery is the selected direction. One design system defines fonts, colors, spacing, figure styles, controls, motion and responsive behavior. Earlier Canvas/Desk experiments are historical references, not competing production themes.
- Shared components express a consistent visual language. Custom layouts may vary the teaching sequence without inventing new controls or navigation for each note.
- Use title, description, stable slug, published date, updated date, topics, content kind, visibility, learning goals, related slugs, and optional collection membership for every published entry.
- Search, browsing, related notes, and homepage use one content index. Internal files are excluded by directory and explicit visibility, not hidden only with CSS.
- Latest-published ordering uses the original publication date. Reference-only edits do not move a note to the top.

## Learning conversion

### Language: ASD-STE100-informed English

Nathan requested ASD-STE100 as a writing guide on 2026-10-03. Apply this preference to new notes and subsequent editorial revisions. Use the official [ASD-STE100 overview](https://www.asd-ste100.org/about_STE.html) and [FAQ](https://www.asd-ste100.org/STE_faq.html) as references. STE includes writing rules and a controlled dictionary; short sentences alone do not establish conformance. This atlas uses an STE-informed house style, not a claim of formally checked compliance. A strict compliance pass requires the complete current specification, dictionary and terminology review.

- Use short, complete sentences. Give each sentence one main point. As a house-style target, prefer approximately 20–25 words or fewer where the explanation remains natural; do not present this heuristic as a complete STE rule.
- Prefer active voice and direct verbs. Name the component that performs an operation: the router selects experts; the controller updates biases; a worker sends token vectors.
- Use consistent terms for the same concept. Define technical names and abbreviations at first use. Distinguish logits, affinity scores, selection scores and mixture weights instead of alternating between them as synonyms.
- Use short paragraphs with one main subject. Connect paragraphs explicitly: state the problem, explain the operation, then explain the result and its limits.
- Replace ambiguous pronouns with the relevant component or quantity. Make the referent of "this", "it" and "they" clear.
- Avoid idioms, promotional phrasing and unexplained metaphors. Prefer "introduce numerical errors" to "poison routing", and "keep the same computation" to "make computation free" when those are the intended claims.
- In procedures, state operations in order. Keep conditions, masks, shapes and exceptions explicit. Separate instructions from explanatory observations.
- Preserve standard technical terminology, exact math and source conditions. Do not invent a nonstandard synonym merely to simplify vocabulary. A term's presence in the approved STE dictionary or its eligibility as technical terminology must be checked before claiming strict conformance.
- Keep the note long when its subject requires detail. Simplify sentence structure, not the underlying mechanism. Retain transitions, examples and varied visuals; do not turn a connected explanation into isolated short statements.

Editorial checks: unclear actor; undefined term; inconsistent name; multiple unrelated points in a sentence; ambiguous reference; missing condition; figurative wording; and loss of the causal link after sentence splitting. Current notes are not all STE-reviewed merely because this policy exists.

Dense does not mean compressed into disconnected fact cards. A long topic reader is expected when the subject warrants it. Give it one explanatory spine, explicit transitions, worked examples before implementation caveats, and stable searchable section/subsection anchors for expert lookup. Introduce a method only after its motivating failure is concrete. Explain each comparison's independent axes; do not present sigmoid versus top-k, or fine-grained versus shared experts, as mutually exclusive choices.

Vary the visual language to match the relationship: prose for causal reasoning; original annotated SVG/images for architecture; step-controlled or opt-in animated execution for data flow; tiny numerical examples for equations; aligned tables for variants; bounded interactive experiments for parameters. Small cards are one tool, not the default structure of every section. Preserve caveats, but attach them after the main mechanism has landed. Keep migration/provenance bookkeeping in internal files rather than making public prose sound like an inventory of retained material. The FineEnvs multi-harness RL article is an inspiration for mechanism-led visual explanations, not a template to copy wholesale.

### Prefer explanatory animations when they clarify the mechanism

Nathan explicitly prefers visual animations (2026-10-03). For a process that changes over time, first consider an animated or step-controlled explanation rather than only prose or static cards. Good candidates include token routing, dispatch/combine, iterative load correction, attention access, speculative acceptance, and parallel execution schedules. Use static figures or tables when motion adds no explanatory value.

- Animate meaningful states and transitions. Identify what moves, what changes, and what remains fixed. Synchronize captions with the demonstrated operation; do not add decorative loops.
- Prefer precise code-native SVG, HTML/CSS or canvas for technical explanations. Keep diagrams integrated with the site's palette and typography. A rendered video is optional, not required for every note.
- Give the reader play/pause, replay and manual stepping where useful. Do not force autoplay, audio or motion. Honor reduced-motion preferences and retain a readable static explanation and all numerical evidence.
- Label synthetic demonstrations separately from measured results. Animation must not imply a measured trajectory, speedup or causal result that the source does not establish.
- Keep animations responsive, keyboard-operable and lightweight. Pause or stop playback when the reader leaves the note. Videos, if used, need playback controls, explanatory captions or a transcript, and a static fallback.

Use the approved MoE routing animation as a visual reference, not a template to repeat mechanically. Nathan likes mathematical explanations inspired by 3Blue1Brown: build a scene progressively, connect equations to visible operations, direct attention to one change at a time, and expose the causal mechanism. Use our burgundy/baby-blue palette, with dark-plum canvases where useful. Do not copy another creator's identity, narration or assets. Vary presentation across concepts. Exact code-native animations are preferred over generated footage for mathematical explanations; export to video only when useful or requested.

Every animation needs a testable mathematical/state model. Test endpoint and intermediate values, masks, ties and conservation properties where applicable. Separate playback time from model/training time. Provide enough context to understand the static stopped scene. Avoid caption changes on every frame and do not let animation restart when a section link is clicked.

For parameter experiments, update the interpretation when the parameter changes: a caption valid for a confident error may be false near a correct prediction. Do not shrink a dense desktop diagram until its labels become unreadable on mobile; reorient the layout or provide a local scroll surface. Shared reader tools live in `v2/site/readers/topic-tools.js`, with exact calculations in separate pure model modules. Reuse these behaviors, not an identical scene for every concept.

Organize methods by historical progression when this explains the design: predecessor, bottleneck, proposed improvement, remaining tradeoffs. Verify first-publication dates rather than assuming the newest report invented a technique. Parallel research branches stay parallel; do not imply that linear attention succeeded MLA chronologically or replaces all softmax attention. For example, [MQA (2019)](https://arxiv.org/abs/1911.02150), [early linear-attention work (2020)](https://arxiv.org/abs/2006.16236), [GQA (2023)](https://arxiv.org/abs/2305.13245), and [MLA (2024)](https://arxiv.org/abs/2405.04434) need a chronology that also separates KV-cache compression from alternative attention operators. New findings update the owning topic with dated, source-specific sections.

A re-skinned Markdown page is not a completed conversion. Each retained note must have:

1. A stated reader question and an explanation sufficient without the chat.
2. An appropriate visual teaching treatment: annotated diagram, aligned comparison, worked example, guided figure, execution sequence, or bounded interaction.
3. Exact math and source conditions, with observation distinguished from hypothesis and adaptation.
4. Searchable semantic text and meaningful related links.
5. Keyboard-operable controls, labeled state, visible focus, responsive figures, and reduced-motion support.
6. A static explanation for every key interactive relationship. No interaction is added merely to satisfy a quota.
7. A tracked editorial decision, conversion review, route check, factual check, and visual QA result.

For simple references, a compact annotated example or visual comparison can satisfy the learning goal; a slider is not mandatory. Empirical data must never be replaced by synthetic demonstration data without a clear label.

## Consolidation

Separate subject taxonomy, content type, and optional reading collection. Interview motivation does not define a subject; the NeetCode collection points to canonical pattern sections without duplicating them. Prefer fewer dense topic notes: MoE owns routing/balancing/stability; Speculative Decoding owns drafter families and implementation; Parallelism owns its dimensions/layouts/schedules. Advanced sections are not automatically separate pages. New papers normally update their topic, including motivation, mechanism, visuals, evidence and limitations. Create a separate note only for a genuinely independent subject.

Place connected subjects together: AI-model parallelism belongs to Training; GPU communication/profiling belongs to Execution and connects to models. Use one canonical explanation with section-level links. Individual LeetCode solutions and cybersecurity challenge write-ups are retired from the public atlas; do not recreate an exercise inventory under another label. Recovery uses verified Git history, not visible original-note archives. Before retiring source material, verify that its unique content and old routes have real destinations and its current body is recoverable from Git.

The editorial pass must assign every source an explicit keep/merge/split/expand/move proposal, target subject, reader question, preserved unique material, source provenance, and old-URL destination. Review these as a coherent corpus-wide proposal instead of accumulating unrelated one-off redesigns. Prototype category heuristics must not be presented as that review.

Propose merges based on duplicated explanation and reader needs, not title similarity alone. Record every unique fact, source, example, figure, and inbound link before merging. Preserve original publication history and map old URLs to pages or sections. Nathan approved the coverage-check → transfer/correct → replace links → retire superseded sources process on 2026-10-06. A link to an original is not preservation of its knowledge in v2. Remove original entries from public search/navigation as their reviewed destinations become available; do not claim incomplete reconciliation is complete.

## Corpus proposal and lossless migration

The completed migration's evidence lives in `dense-notes-blueprint.md`, `dense-notes-catalog.md`, `dense-source-map.md`, and `dense-preservation.json`. These record the 54-topic consolidation of 232 baseline entries; they are not the live content registry or a permanent limit on topic count. Read them when changing legacy routes, recovery fixtures or preservation decisions, not for every new paper. The live registry is `v2/site/readers/index.js`.

In `dense-preservation.json`, `primaryDestination` retains the original proposal. Each retained source also has `reviewedPrimaryDestination`, synchronized with `reviewed-route-destinations.json` and the rendered section. Update that reviewed field when a source's actual destination changes; do not erase the historical proposal. Retired sources must not gain a content-preserving reviewed destination. The corpus diagnostic and static regression enforce this distinction. A synchronized destination proves route integrity, not preservation of every substantive detail or production readiness.

Use dense topic readers with searchable internal section navigation, stable anchors and concise prose. Do not enforce short-page word limits or fragment methods into automatic deep-dive pages. Preserve source-specific report details in topic sections and connected recipe profiles; retain the reasoning book's complete pipeline within the reasoning topic. Collections such as NeetCode are separate from subject taxonomy. Consolidation preserves publication lineage instead of publishing every merged topic as artificially new.

Before removing repeated text, record where every substantive unique proof, example, numerical condition, limitation, code variant, figure and citation survives. Inspect JSX components and their assets as well as Markdown images. Uncertain material stays explicitly tracked in the private audit until resolved; do not silently discard it or auto-publish unfinished/local content.

Small snippets should explain one operation, usually in 5–15 lines. Split longer teaching algorithms into steps rather than showing hundred-line walls; preserve useful full source solutions in an expanded walkthrough or referenced asset. Never omit necessary shapes, masks, ordering or correctness conditions merely to shorten a note.

No reader is migrated solely because its Markdown renders inside a new shell. Each retained page must satisfy the existing learning-conversion, source/route, accessibility and visual-QA checks. Planned redirects/anchors in the proposal are not implemented routes.

## Reusable reader tools

Use the implemented helpers in `v2/site/readers/topic-tools.js`, `math.js`, `reader-state.js` and the owning topic's model/scene modules. Read their real APIs before reuse; design-phase component names are not an implementation contract.

### Mathematical rendering

Use `readers/math.js` for new/revised display formulas (`texEq`) and complex inline formulas (`inlineMath`). The locally bundled KaTeX renderer outputs mathematical layout and semantic MathML during reader construction, without a remote CDN or delayed client-only replacement. Invalid or unsupported TeX must fail the test, not ship as red text. Use real fractions, radicals, limits, indexed sums and aligned derivations; do not simulate these with HTML subscripts, Unicode strings or slash-based fractions. Define symbols and conditions beside the formula. Distinguish transpose, pseudoinverse, elementwise powers and matrix norms. Keep long equations in keyboard-scrollable local surfaces, never a page-wide overflow or tiny unreadable font. Structural rendering tests do not prove the equation or its source claim is correct. `audit-math.mjs` tracks remaining legacy display blocks; inline prose and scene formulas require separate inspection.

Use `audit-math.mjs --inline` as a reproducible raw-text review queue in addition to the display audit. Matches need manual context review; units and simple metrics can be intentional. The detector excludes code, SVG and typeset math and cannot certify dynamic states, split-node notation or mathematical correctness. Check captions for literal template interpolation leakage. Keep broad prose comparisons readable in caption-named keyboard-scrollable local tables rather than squeezing words into narrow columns.

Do not insert raw less-than comparisons such as `s<t` into HTML captions or prose. Use `inlineMath` for the relation, or HTML-escape a plain-text comparison. A browser can parse the variable and the remaining explanation as a tag, hiding conditions without a TeX error. Check the parsed caption text as well as the formula. The default static suite includes `test-swallowed-markup.mjs` for closing-tag swallowing across all static readers; quoted attributes and foreign math/SVG trees are excluded. This targeted check is not a complete HTML or dynamic-state validator.

Check the parsed MathML namespace, not only the visual formula and TeX annotation. The current bundled renderer can produce HTML-namespace descendants for some nested annotated operators and `\bmod` forms. Equivalent `\operatorname*{arg\,min}`/`arg\,max`, `\operatorname{mod}` and an explicit parenthesized condition avoid the observed defects. `test-mathml-namespace.mjs` checks all static readers and representative bad structures. This is a targeted structural guard, not full MathML grammar, dynamic-state or screen-reader certification.

For generated interactive HTML, call `assertGeneratedMarkup` from `scripts/check-generated-markup.mjs` in the owning bounded-state test. It returns the same string after checking unresolved templates,swallowed closing markup and MathML namespaces. Use `assertGeneratedMarkupCount` to verify every declared rendered state reached the guard. Keep independent numerical assertions alongside it. These checks do not certify native layout,event scheduling,reduced motion or every continuous parameter value.

For numerical demonstrations, test the computation as well as the identity. Intermediate probability ratios can overflow even with positive support; tiny positive mixtures can round to zero. Use log differences or log-domain mixtures where appropriate, preserve true support failures, and reject missing/nonfinite probability entries. Independent identities need scale-appropriate checks; an absolute tolerance can conceal a lost subnormal result. Do not use epsilon clipping or blanket clamping to hide an incorrect implementation.

## Reader navigation and layout

On 2026-10-06 Nathan replaced the terminal-first preference with a Windows/Linux-style file explorer. The Atlas defaults to folders, category shortcuts, breadcrumbs, back/forward/up navigation, fuzzy atlas-wide search and list/grid views. Folder contents are immediate subfolders and directly assigned notes, not every descendant; search results explicitly span the atlas. Open a note in the adjacent reading pane. This is an atlas browser, not access to the computer's filesystem. The historical terminal prototype is not the default.

The workspace uses the available window, split between file explorer and reader. Keep only the discreet explorer show/hide control outside file-manager navigation; hiding it gives the note full width. Do not reintroduce the rejected landing title, page-wide top band, hide-note or expand buttons. Category navigation must not reset the reader scroll position or remount its interactions. Within notes, retain the discreet searchable “On this page” control, stable section links and state-preserving hash navigation.

Controls must not cover reading text on narrow screens. Use the shared compact utility margin for Home, explorer visibility and section lookup. Keep accessible names and visible keyboard focus when labels are visually compact. Section lookup supports Escape to close and return focus; no note remount is needed for a section jump.

## Content-update workflow

1. Read the requested source, owning topic and relevant components/assets. Check for useful content elsewhere in the corpus. Record what is and is not reviewed; old source fingerprints need attention only when those fixtures change.
2. Map unique mechanisms, proofs, code variants, evidence, conditions, figures and sources to explicit sections. Identify corrections, uncertainty and connected-topic ownership. Do not treat duplicated text as permission to discard unique evidence.
3. Write a coherent explanatory spine: problem, mechanism, worked example, evidence and limitations. Historical progression supports understanding; it is not a mandatory opening timeline. Keep deep details navigable rather than fragmenting them into extra notes.
4. Add purposeful visuals, preferentially explanatory animations where time or state matters. Keep complete static explanations and concise code. Use STE-informed English without claiming certified compliance.
5. Integrate the reader through shared metadata, search, categories and lifecycle code. Add aliases/redirects only for content actually covered. Never hide unmigrated material behind a short new summary.
6. Verify formulas, source-conditioned claims, math rendering, assets, section/internal/legacy links, fuzzy search, dates and visibility. Test animations and other interactions, desktop/narrow layouts, keyboard access and reduced motion. Record unavailable checks accurately.
7. Record substantive changes and verification in the relevant topic audit when useful. Distinguish local, tested, committed, pushed and deployed states. Retire superseded material only with verified recovery and real destination coverage.

Normal content work does not reopen the migration or require reconciling every historical audit. The registry and current source determine what exists; Git and deployment results determine what shipped.

A source map, section outline, animation prototype or new shell is not a finished migration. A good finished note is substantial enough for Nathan's research and implementation, coherent enough to read, and indexed enough to consult without rereading everything.

## Delivery boundaries

The migration shipped in `6bf3368` on 2026-10-25. New research is welcome when requested; the release-only scientific-content freeze has ended. Do not reopen broad paper/code reviews merely because an old audit says “pending.” Resolve identified defects and verify new claims without pretending unreviewed sources were read.

Use the approved Gallery/skywine system. Label synthetic demonstrations and measured data distinctly. Verify content, formulas, links, search, interactions, desktop/narrow layouts, keyboard access and reduced motion. Structural tests do not certify scientific completeness.

Commit, push and deploy only when requested. Inspect the exact diff and preserve unrelated work. Verify the actual Pages run and hosted artifact before claiming deployment; a local build or successful push alone is not that proof.
