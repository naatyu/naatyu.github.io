# Atlas authoring instructions

Before creating or revising notes, read `.internal/v2/authoring-contract.md` completely, then `.agents/skills/research-learning-notes/SKILL.md` for research and figure verification. Follow `.internal/adding-content.md` for the current implementation steps.

The live site is the standalone static exporter in `v2/`. Current readers and shared UI live in `v2/site/`. Use `v2/package.json`, not the legacy root package, for builds and tests. `.github/workflows/deploy.yml` is the only active deployment workflow. Legacy Docusaurus sources are recovery/test fixtures, not authoring targets.

The v2 migration shipped in commit `6bf3368` on 2026-10-25. Normal note work does not reopen that migration or require reading the whole corpus history. The live reader registry is `v2/site/readers/index.js`. New research normally extends its owning topic; create a new page only for an independent subject. `.internal/README.md` distinguishes maintained guidance from historical evidence.

Keep `.internal/`, this file, and `.agents/` out of public content and search. Internal means non-published, not confidential. Preserve unrelated work, useful knowledge, stable links and publication dates. Read preservation ledgers only when changing legacy sources/routes or reconciling old material. Commit, push and deploy only when requested.
