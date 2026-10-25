# Nathan's Atlas

Personal notes and projects at [naatyu.github.io](https://naatyu.github.io).

Production is the standalone static Atlas in `v2/`: 54 consolidated readers, interactive explanations, local math rendering, a file explorer and fuzzy search. GitHub Pages builds it through `.github/workflows/deploy.yml`.

## Work locally

Use Node.js 24 or newer:

```sh
npm --prefix v2 ci
npm --prefix v2 test
npm --prefix v2 run build:publication
```

The build prints an isolated output directory. Preview it:

```sh
npm --prefix v2 run preview:candidate -- /absolute/output/directory
```

Open `http://localhost:4323/`. The preview server sends noindex headers; the publication artifact has normal indexing for canonical pages.

## Authoring

Read `AGENTS.md` and `.internal/v2/authoring-contract.md` before changing notes. Readers live in `v2/site/readers/`. New research normally updates its owning topic. Preserve original publication dates. Follow [the implementation walkthrough](.internal/adding-content.md); see [the internal index](.internal/README.md) for editorial guides and historical evidence.

## Publication and recovery

A push to `main` builds and deploys v2. The exporter includes only required runtime files, canonical pages, compatibility landings and referenced media. Internal guides, source Markdown and recovery snapshots are never copied into the website.

Legacy Docusaurus files remain as preservation/rollback inputs, not the live build. Do not use the old Docusaurus deployment command. Old URLs resolve to reviewed topic sections or explicit retirement notices.
