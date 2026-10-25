# V2 production switch and source retirement

> Historical plan. The live switch shipped in `6bf3368` on 2026-10-25; `.github/workflows/deploy.yml` now builds v2. Legacy sources still serve recovery/tests. This document does not direct a new switch or deletion. See `../README.md`.

Prepared 2026-10-14. This is a private, unexecuted plan. It does not authorize publication, deletion, or promotion of drafts. The existing Docusaurus workflow remains unchanged.

## Exact removal scope and recovery

Run `node scripts/retirement-preflight.mjs --full` from `v2/` to obtain the exact current source-body list. The command is read-only and does not save or delete files. Each row includes the original path, baseline/current SHA-256, a pinned Git commit, recovered SHA-256, byte equality, actual route treatment and blockers. Recovery commands are argument arrays for `git show`, not shell strings or removal commands. No broad directory or wildcard removal is proposed.

The current checkpoint resolves commit `83b894857e3e622a62ccbec8b5b5d219c0f2e8a0`. At that commit, 231 of the 232 current original Markdown/MDX bodies are byte-equal recoveries. There are 206 content-preserving reviewed primary destinations, 25 intentional notices and one navigation replacement. No unexpected Markdown/MDX source appears under `docs/`.

`docs/ai/training/optimization/multi-harness-agentic-rl.md` is not in that commit. It must not be removed, silently staged or silently committed. Before retirement, establish an explicitly authorized durable recovery for its exact current bytes and rerun the preflight. A temporary candidate directory is not a recovery copy. The current preflight deliberately exits 1 and reports this exception; a test passes only because it verifies the exception is detected, not because recovery is complete.

The pinned commit exists locally. This check does not establish remote reachability or protection from repository loss. At publication time, verify that the recovery revision is included in the authorized pushed history and record its full ID. Read a recovered object with `git show <full-commit>:<exact-path>` and verify its hash before restoring it. Do not reset or overwrite unrelated working-tree changes.

The preflight covers source bodies only. It is not an approval to delete original assets, components, root build files, dependency manifests or tooling. Those require an exact dependency/recovery list of their own. Source-body hash equality and route existence also do not prove semantic preservation; the topic audits and content reviews remain required.

## Required release sequence

1. Finish the substantive per-topic content, math, figure, editorial and proportional native review gates in `finish-line.md`. Keep valuable report details and the reasoning-book pipeline. Resolve uncertainties rather than replacing them with stronger unsupported claims. Do not promote all 54 drafts merely to make the release index nonempty.
2. Inspect the final isolated artifact: no original bodies or private guide/audit content, no old-content dependencies, valid exact legacy fragments, complete canonical search/metadata/date lineage, packaged assets, static reading content and usable narrow-screen layouts. Run the full suite and separate HTTP tests on the same final code state. Local HTTP evidence is not proof of actual hosting behavior.
3. Re-run pinned recovery and destination preflight after every source or ledger change. Resolve the untracked harness exception through authorized recovery. Freeze the exact source-body retirement list and the independently verified asset/component cleanup list. Do not use directory-wide deletion.
4. Prepare the production exporter/workflow only after the content gates pass. Current `.github/workflows/deploy.yml` installs root dependencies, runs root Docusaurus and uploads `./build`; uploading the temporary review export is not an integrated release. Use the isolated `v2` lockfile/install and explicit output directory in a reviewed production build. Keep the live root workflow intact until the authorized switch.
5. Choose release metadata deliberately. The review export is `noindex,nofollow`, and all current readers remain locally marked drafts/prototypes. Promote only validated readers with preserved publication dates; enable indexing for intended public pages, while moved/retired notices and 404 responses keep the appropriate non-article treatment. Do not globally remove every `noindex` or synthesize new publication dates. Recheck homepage last-three ordering after promotion.
6. Validate the root-host constraint against the actual Pages configuration. The present canonical/runtime asset paths assume `https://naatyu.github.io` at `/`; do not treat them as arbitrary project-subpath support. Keep generated `404.html`, verify packaged module/font MIME loading, and define a cache policy compatible with changed reader revisions and unversioned runtime paths. The local preview's `no-store` is a review policy, not an adopted production cache setting.
7. Obtain authorization to commit/push/deploy the exact release changes. Review the exact staged diff, pending local files and remote changes. Do not force-push or include unrelated untracked work. Retire the exact verified originals as part of the validated switch so the current Docusaurus site is not broken in an intermediate state.
8. After the authorized deployment succeeds, inspect the real homepage, explorer/search, representative canonical notes, old deep links, intentionally retired pages, unknown URL/404 status, assets and metadata. Static moved pages are HTTP 200 landings with client replacement, not server-side 301s. Unknown fragments must not be guessed. Record host/cache behavior as observed, not inferred from the local preview.
9. If the hosted release fails, use a reviewed rollback change to the known recovery revision/workflow without discarding unrelated user changes. Do not run a broad hard reset. Keep the recovery revision accessible and record the rollback/deployment state honestly.

## Current evidence versus remaining authority

`retirement-preflight.mjs` has no deletion, staging, commit, network, deployment or write operations. Its `readyForRemoval` and `removalAuthorized` fields always remain false. The executable guards can establish exact local recovery and route integrity; they cannot grant the human publication authority or close content/readability gates. The dry-run is useful even while release remains gated. It must never be interpreted as an automatic cleanup script.
