# Internal working documents

“Internal” means excluded from the built website and public search, not confidential. Tracked files are still visible in the GitHub repository. Never put credentials or personal secrets here.

## Current guidance

| File | Purpose | When to read/update |
| --- | --- | --- |
| `v2/authoring-contract.md` | Nathan's content, language, visuals, math and navigation preferences | Read for every note; update when preferences change |
| `adding-content.md` | Current code paths, integration steps and verification commands | Read when adding or changing content |
| `../.agents/skills/research-learning-notes/SKILL.md` | Source reading, evidence, figure provenance and factual review | Use for research-note work |

The live implementation is `../v2/site/`; the current topic registry is `../v2/site/readers/index.js`. The only active deployment workflow is `../.github/workflows/deploy.yml`. V2 shipped in commit `6bf3368` on 2026-10-25. There is no ongoing migration freeze.

## Why `v2/` still contains audits and JSON

These files document the completed reorganization of 232 old entries into 54 dense topics. They prevent knowledge and links from silently disappearing during later edits. They are not public notes or a task list for every new agent.

| File family | Contents and goal |
| --- | --- |
| `dense-preservation.json`, `reviewed-route-destinations.json` | Original-source fingerprints and reviewed destination pages/sections. Regression tests check preservation identities and old links. |
| `dense-notes-*`, `dense-source-map.md`, `source-inventory.json` | Corpus decisions: which subjects were combined, why, and where their material went. The live registry supersedes their original proposal as the list of implemented pages. |
| `*-content-audit.md` | Topic-level mapping of unique mechanisms, proofs, examples, citations and corrections. Consult the relevant topic when changing retained knowledge; do not reread every audit for an ordinary addition. |
| `*-closure.json`, verification JSON | Machine-readable reconciliation and numerical/source conditions used by tests. These are evidence fixtures, not instructions to perform the migration again. |
| Math, markup, navigation and layout reviews | Dated findings, known pitfalls and scopes of prior checks. A past pass is not certification of future edits. |
| `recovery/` | A pinned snapshot of the multi-harness source. Tests verify it against committed Git content; it is never exported. |

Some dated design/source reviews retain historical language. Their assertions describe the recorded check, not current deployment status. Prefer source code, tests, Git history and the actual Pages run for present state. Only modify a historical record to correct its evidence, not to rewrite the past as if new checks had happened then.

Superseded 149-page proposals, pre-launch progress/release reports and the inactive workflow copy remain historical records, not current guidance. Their removal was blocked by a safety review because they may support recovery checks; they have not been deleted. Current instructions no longer direct agents to them. Keep future working documents only when they have a concrete ongoing purpose; do not accumulate parallel “current state” reports.
