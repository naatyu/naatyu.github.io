# Add or update Atlas content

This is the implementation walkthrough, not another writing-style guide. Read `AGENTS.md`, `v2/authoring-contract.md` and the research skill first.

```text
Read the source and existing topic
                ↓
Choose the owning topic ── independent subject? → register a new topic
                ↓                                      ↓
Write a connected explanation ←────────────────────────┘
                ↓
Add static visuals + useful optional interactions
                ↓
Check metadata, dates, sections and related links
                ↓
Test calculations, markup, search and browser behavior
                ↓
Review locally → publish only when requested
```

## 1. Find the owner

Search `v2/site/readers/index.js` and the topic bodies. A new MoE balancing paper normally enhances `moe.js`/`moe-content.js`; it does not become another standalone paper note. A source can contribute to several topics, each owning its own explanation with section links between them.

Ignore legacy `docs/`, `src/` and root Docusaurus configuration as authoring targets. They remain recovery/test fixtures. Do not regenerate `site/catalog.json` to add public content; that is a historical fixture.

## 2. Change a reader

Most topics export four pieces:

- `<topic>Meta`: slug, title, description, original `date`, substantive `updated`, tags, `topicPath`, `kind: 'dense-topic'`, `visibility: 'public'`, learning goals and related slugs.
- `<topic>Aliases`: supported old identities, if any. Ordinary additions need no new alias.
- `<topic>Reader(link)`: a pure function returning complete semantic HTML. Use its `link` callback for canonical topic/section links.
- `mount<Topic>(scope)`: optional browser interactions. It must be safe when no matching article exists and must not double-mount.

Read a nearby implementation instead of blindly copying one. `readers/topic-tools.js` provides `topic`, `section`, `cite`, `table`, `mountTopic` and `rangePlayback`. `readers/math.js` provides `texEq` and `inlineMath`. Keep detailed source calculations in pure `*-model.js` modules and visual logic in topic-specific scene modules when useful. Images belong under `static/img/<topic>/` and use `/img/...` URLs.

Preserve the explanatory spine and all still-useful evidence. Add stable section IDs to the section list as well as the body. Preserve the original publication date; reference-only changes must not move the topic to the top of the homepage. New content should not use `prototype: true`.

Interactions need full static explanations, keyboard controls and visible focus. Reuse reader-state helpers for meaningful saved state; stop playback on `atlas-reader-suspend`, and release observers/listeners on `atlas-reader-dispose`. Do not access browser globals during static rendering or reset note state on a section jump.

## 3. Only for a genuinely new topic

Create a reader module and register its `{meta, aliases, render, mount}` entry in `v2/site/readers/index.js`. Slugs currently follow `subject/topic`. Choose `topicPath` from the real subject taxonomy in `site/navigation.js`; do not add another top-level category just because the source is a new paper.

The exporter derives the page, search entry and homepage eligibility from this registry. Do not add a second search inventory or hand-edit generated output. Add meaningful related slugs and source links. If replacing an old URL, update the reviewed navigation mapping only after its destination actually covers the material.

The test suite has baseline totals for reader count, equations and related corpus fixtures. A new topic or formula can legitimately change them. Review each failed expectation, update it deliberately and retain the underlying route/content checks. Do not globally replace numbers or invent a legacy source ledger entry for a new topic.

## 4. Verify and hand off

From the repository root:

```sh
git diff --check
npm --prefix v2 test
npm --prefix v2 run test:publication
npm --prefix v2 run build:publication
npm --prefix v2 run preview:candidate -- /absolute/output/directory
```

Use the directory printed by the build. Run affected numerical/state tests directly while iterating. `npm --prefix v2 run test:http` tests local serving separately. Preview desktop and narrow layouts; exercise controls, section links, search, keyboard focus and reduced motion. Check math, images, console errors and horizontal overflow. State any checks you could not perform.

No `.internal` or legacy Markdown content may appear in the export. Historical migration audits are consulted only for affected preservation/route questions. Record substantive corrections in the relevant audit when useful, not in a new global migration-progress report.

Summarize the changed topics and actual verification. Do not commit or push without the user's request. An authorized push to `main` deploys through `.github/workflows/deploy.yml`; verify both the run and hosted artifact before calling it live.
