# Release handoff — 2026-10-25

## Local deliverables

- `v2/`:54 dense readers,selected Gallery/skywine homepage,file explorer,shared math/navigation/interaction runtime,review and publication exporters,and tests.
- `static/img/scaling/`:referenced scaling figure assets. Exporter packages referenced media only,not the whole original image tree.
- `.internal/v2/deploy-v2.yml`:prepared replacement for `.github/workflows/deploy.yml`. **Not applied.** Node24,isolated v2 lockfile/install,publication verification,root-host guard,dynamic artifact path,existing Pages deployment action pattern.
- `.internal/` and `AGENTS.md`:authoring/preservation/recovery records,not public site content. Do not put them in the deployment artifact. Full preservation tests need their fixtures in the working checkout; publication packaging does not.

## Verification this pass

- Clean isolated copy at `/private/tmp/atlas-v2-release-clean-5KHznv`:v2 scripts/prototypes/packages and source image tree only. Offline `npm ci --ignore-scripts` installs four locked dependencies. Publication regression passes all54 unchanged reader texts/date lineages,56 canonical pages,sitemap/robots/.nojekyll and232 noindex compatibility/retirement/404 pages. This does not depend on root Docusaurus dependencies,Markdown originals,private audit fixtures or Nathan's absolute paths.
- Prepared workflow parses as YAML with Ruby's installed parser; build/deploy dependency and v2 working directory checked. Node YAML package was unavailable; no new parser dependency installed. Hosted Actions execution is not claimed.
- Focused28404 reached terminal0 for Reasoning core closure,Frontier,Compact andAgents. All report/recipe row/hash/heading/citation tests pass. No source-note or scientific-content changes in this pass.
- Freshly reread the complete original reasoning-book note and the corresponding pipeline/evaluation/sampling/refinement/RL/stability/distillation/compute/checklist explanations. All its substantive original mechanisms,ranges,result observations and limitations have explicit destinations; no new omission found. Existing wider topic/source closures are reused,not mislabeled as a new complete external-book/paper review.
- Checked remaining SFT/Tokenization/Preferences/Decoding/Speculation/Distillation historical flags against actual later source reconciliations. K3's unverified top-k-negative claim is explicitly tracked privately and already not asserted publicly; it is not silently promoted to fact or a reason for another unlimited review.

## Release blockers

Multi-harness decision2026-10-25: Nathan delegated the choice. Resolved approach:canonical content stays in v2 Agents;byte-equal recovery snapshot `.internal/v2/recovery/multi-harness-agentic-rl.md` goes in the eventual migration commit,not the public export. No separate legacy-note publication/commit is required. Include the snapshot in the exact release commit set and verify its Git object before retiring the docs original at the coordinated switch. It is currently a local snapshot,not yet Git recovery. No further choice is needed from Nathan on this point;the remaining commit/push/deploy still requires the release authorization.

Update2026-10-25:the visual/navigation blocker below is superseded by release-navigation-check.md. Access recovered,a real native Back/Forward mismatch was fixed,and the recorded representative desktop/narrow/keyboard/finder/history checks pass. Full80955 and HTTP70568 terminal0. No broader OS-preference/BFCache/screen-reader certification is implied. Publication and recovery approval remain outstanding.

1. **Final visual/shared-navigation pass:**Mac is still locked on the latest availability check. User has been asked to unlock. Finish the interrupted Shortcut desktop/narrow check and representative finder/search/hide/show/section/Back/keyboard/motion checks. Existing topic visual evidence remains valid to its recorded scope. No new screenshot pass claimed.
2. **Approval for production switch and exact commit set:**not requested or granted in this pass. Prepared workflow remains private/inactive. Live deployment is still Docusaurus.
3. **Original removal recovery exception:**the local untracked multi-harness original remains intact.231other originals have verified Git recovery. Do not delete this source or auto-stage it. Choose the recovery step explicitly before its eventual retirement; keeping it temporarily on disk does not expose it in the v2 artifact.

## Safe publication sequence once approved

1. Finish final visual gate,then inspect the exact intended staged change set;do not include unrelated local work or generated temporary artifacts.
2. Establish approved Git recovery for the local harness before removing its original. Keep all originals until the coordinated switch.
3. Apply the prepared workflow after approval. Run final tests/build and inspect artifact privacy/assets/routes. Commit/push only on request.
4. Verify actual hosted home,canonical notes,old fragment landings,retirement notices and404 behavior. GitHub Pages compatibility landings are not server-side301redirects. Restore the prior workflow through Git if rollback is needed;do not force-reset user work.

Local preparation is not deployment. No source removed,commit,push or live configuration change.
