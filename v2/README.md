# Atlas — live application

Selected design: Gallery, Burgundy / Baby Blue (`skywine`). The Windows/Linux-style file explorer is the default. Hide it to read a note at full width. The terminal is a historical prototype, not the selected navigation. The homepage carousel shows the three latest original publication dates, not recent edits.

Before writing any note, read `../.internal/v2/authoring-contract.md` completely, then the repository research-learning-notes skill. That guide owns content, STE-informed English, animations, navigation, preservation and verification preferences. Root `AGENTS.md` enforces this entry point. Historical design entries are not live entry points or current guidance.

The v2 migration shipped on 2026-10-25 in commit `6bf3368`. The live registry is `site/readers/index.js`; its 54 topics are the current corpus, not a permanent limit. Source modules and shared UI live in `site/`, exporters and tests in `scripts/`. Internal guides and legacy source Markdown are never published. Historical design-entry HTML is not a production entry point.

From the repository root:

```sh
npm --prefix v2 ci
npm --prefix v2 test
npm --prefix v2 run build:publication
npm --prefix v2 run preview:candidate -- /absolute/output/directory
```

Use the output directory printed by the build. Preview: http://localhost:4323/. Read [the content implementation walkthrough](../.internal/adding-content.md) when adding or updating a topic.

The exported site has no old-note content dependencies or public original-note archive. Production uses this standalone exporter, not Docusaurus. A local build never publishes; commit and push only when requested.

## Static rendering review

`npm --prefix v2 run build:candidate` writes an isolated temporary review site and prints its path plus remaining legacy dependencies. All current readers have complete HTML and MathML before JavaScript; optional interactions hydrate those readers. Review pages remain noindex. Production readers do not carry migration-era draft labels.

`npm --prefix v2 run preview:candidate -- /absolute/path/from/build` serves that artifact on localhost:4323. Candidate pages and responses are noindex. The output contains only canonical reader pages, restricted metadata and referenced runtime/media assets—not the old catalog, source Markdown, internal audits or unpublished notes.

`npm --prefix v2 run test:static` parses the emitted HTML and checks routes, fragments, resources, math structure, search membership and exclusions. It is included in the default test suite. Numerical models and interactions have their own tests; browser layout/accessibility checks remain separate from structural validation.

## Publication preparation

`npm --prefix v2 run build:publication` creates a separate temporary publication-format artifact. It preserves reader content and publication dates, removes review-only labels/noindex from canonical pages, and adds sitemap.xml, robots.txt and .nojekyll. Moved/retired/404 pages remain noindex. This command does not commit, deploy, remove originals or approve content.

`npm --prefix v2 run test:publication` verifies publication packaging independently of the original Markdown and private audit fixtures. The full default suite additionally exercises preservation and numerical models. The candidate preview server intentionally sends noindex headers even when previewing publication-format files; it is not the production host.

The active GitHub Pages workflow is `../.github/workflows/deploy.yml`. Authorized pushes to `main` build and deploy this application. Verify the workflow result and hosted site before claiming deployment. See [the internal index](../.internal/README.md) for retained preservation evidence; old audit timestamps are not current migration blockers.
