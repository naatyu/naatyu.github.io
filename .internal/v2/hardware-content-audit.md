# GPU Infrastructure — preservation and exact foundations

## Current reconciliation — 2026-10-08

Final verification: all47 default suites passed38632exit0 after the last table change; dedicated Hardware and whitespace checks pass. Native disaggregation link additionally verified at Serving `deployment`. All broader open gates below remain open.

Previous status-only turn was no progress; revalidated the guide, source plan, complete original and current reader before edits. Original SHA remains `6aca26bfd118e25f24af1fc4dcb2fdab97e0a0062c5f2f07ffc3addcd6d69647`, byte-equal committed HEAD. Complete ten-section body, definitions, seven math blocks and four references reconciled against the integrated destinations below. Original has no embedded assets. Numeric density ranges stay contextual; the invalid whole-site minimum and dimensional mnemonic are corrected rather than copied.

All thirteen actual source headings now have exact local fragment mappings and a canonical landing. Source identity is excluded from duplicate local navigation; physical original remains intact until the production switch. Economics and disaggregation links target inspected Serving `economics`/`deployment` sections; Roofline targets Performance `roofline`. Hardware has no remaining old-content dependencies. This does not close the whole Serving source audit.

The complete501-line auto-generated English transcript of the Jane Street tour was newly read in two spans. Caption recognition errors mean model names, voltages, chemical mixtures and filtration details are not independently verified specifications. No chemical recipe, protection setpoint or deployment prescription was added. Video pixels remain unreviewed. At12:19–12:44, cooling buffers bridge a chiller restart and damp workload temperature changes; the reader explains finite stored capacity and required circulation without inventing a ride-through time. At11:14–12:03, topology-aware breaker monitoring can stop workloads. Both remain attributed site observations. Full cited NVIDIA HTML texts were reread; figures/OCP guidance still need their separate review.

Reader retains16sections/three scenes/three MathML displays. New preservation test extracts all13 actual headings with GithubSlugger, checks canonical targets, zero old-reader links, linked Serving anchors, transcript conditions and four focusable640px tables. Existing2,624 independent model cases and10,349 rendered states pass. Native browser: old cooling-failure fragment resolves to `execution/hardware#failure-domains`; Serving economics link resolves to its exact canonical section. Desktop new prose inspected;390px tables scroll locally by keyboard (258px surface/640px content), zero page overflow/KaTeX errors and warning/error logs. Narrow tables initially broke words awkwardly; corrected with local scroll rather than shrinking text. Viewport reset. Proof `hardware-preserved.png` in Codex workspace.

Structural93 reviewed source candidates/1351 exact heading destinations, zero source changes/invalid reviewed targets/broken canonical links/duplicate IDs. Static54 readers/96 old landings/452 displays/14images/375files/18 old-dependent readers. All47 default suites passed69974 after main content/routes; final table adjustment passes dedicated Hardware and will receive a final full run. Initial deep-link scrolling, complete source figures, actual OS reduced-motion/offscreen behavior and final production accessibility/routes/privacy/retirement remain open. No production-ready claim, physical deletion, commit, push or deployment.

The dated record below is historical; its inaccessible-video/empty-alias/49-reader statements are superseded above.

2026-10-06. **Integrated local draft; not production-ready.** Canonical owner `execution/hardware`; original publication2026-05-30. Corpus contains49 local readers:one pilot,48 drafts. Five readers not started. Zero production-ready/deployed. No alias, retirement, commit, push or deployment.

## Original evidence

Complete body of `docs/systems/infrastructure/high-density-gpu-infrastructure.md` read, including all ten sections and seven math blocks. SHA-256: `6aca26bfd118e25f24af1fc4dcb2fdab97e0a0062c5f2f07ffc3addcd6d69647`. No figures, imported components or code assets. Original remains untouched.

Original source link is the Jane Street data-center-tour video `https://youtu.be/8J-GUnfSqeE?si=kQdFZs3qOumjG2Fh`. Direct web access failed; transcript/video not newly reviewed. Preserve that provenance, but do not attribute new verified specifications or universal numeric limits to an unseen video. Adjacent capacity-planning note mentions owned-infrastructure power, cooling, networking, operations and amortization; its whole-body ownership stays Performance.

## Integrated section map

Reader question: why can an installed GPU cluster fail to deliver usable compute even when it has enough servers and apparent site-level capacity?

| Original unique material | Integrated destination / treatment |
| --- | --- |
| Power density and coupled placement/heat/isolation problem | `high-density-gpu-infrastructure`, `density`; retain original rough10–40kW air and100–150+kW liquid discussion as contextual ranges, not certified limits; prefer a clearly scoped documented rack example |
| CDU, cold plates and technical-loop terminology | `heat-path`; annotated heat path separating fluid circulation from heat crossing an exchanger; distinguish direct-to-chip from immersion and liquid-to-air alternatives |
| Five-stage heat removal | `heat-path`; code-native step-controlled explanation; GPU→cold plate→technical loop→CDU→facility loop→heat rejection; retain air-cooled remainder |
| Retrofitting, raised-floor/overhead options and headroom | `retrofit`; table of physical constraints, optionality and maintenance access; no assertion that every retrofit should overbuild |
| Leaks, fittings, flow imbalance, contamination, biology, maintenance | `failure-domains`; distinguish detection, isolation and recovery; no guessed protection setpoints or chemical-treatment instructions |
| Q=ṁcₚΔT, symbols, insufficient/excess flow and clogging | `flow`; exact declared-units illustration of bulk coolant temperature rise; not a junction-temperature or cold-plate-resistance model. Branch flow competition conditional on network/pump/valve design |
| Power buses, rows, breakers, redundancy and spare-site/local limits | `power-placement`; replace invalid whole-site minimum with simultaneous path-load constraints; visual fixed placement versus reassignment |
| Monitoring, shedding, correlation and operational view | `control`; telemetry→decision→action→physical response; monitoring cannot substitute for protection or create electrical capacity. Preserve original informal safe-utilization mnemonic as qualitative, not additive dimensioned law |
| Opportunity cost, idle capacity/downtime/slow expansion | `useful-capacity`, `cost`; GPU-hour partition and separately named accounting/opportunity terms; counterfactual value and double-counting caveat |
| Smaller compute footprint, larger facility support | `facility-footprint`; heat rejection/pumping/electrical/access/service infrastructure remains necessary; compact server area does not establish lower total cost |
| Durable lessons and related links | `checklist`, `sources`; Parallelism canonical; Performance/Serving links retain complete original destinations until those readers exist |

## Corrections required

1. `Pusable ≤ min_i Pbus_i` is not a correct total-site bound for parallel distribution branches. Two independent4kW branches can carry6kW in total. Correct fixed placement constraints are `Σr p_r ≤ Psite` and `Σr using path i p_r ≤ C_i` for every path. The minimum applies to serial constraints on the same demanded path, not to an arbitrary site total. A full network allocation needs the topology and shared ancestors.
2. Power density is configuration-specific; neither original range is an industry maximum. NVIDIA's current DGX GB rack guide reports approximately120kW for its scoped rack, while the8-rack SuperPOD scalable-unit reference reports1.2MW. Do not equate rack sum and whole reference-unit design load without ancillary equipment/accounting.
3. Liquid cooling can leave an air-cooled fraction. The documented DGX trays use cold plates for CPUs/GPUs and air for remaining networking/storage components. No universal “liquid removes all rack heat” statement.
4. A CDU in the common liquid-to-liquid design separates technical and facility fluids while transferring heat. “Coolant leaves the server” does not mean its fluid enters the building loop. Other architectures exist; do not define all CDUs exclusively by one installation.
5. `Q=ṁcₚΔT` is steady bulk energy accounting, not a safety certification or a component temperature prediction. Higher flow in one branch need not starve every other branch; hydraulic coupling matters.
6. Software can improve observability and orchestrate responses, but physical protection, engineered margins, vendor requirements and fail-safe behavior remain independent. Delete any implication that better software permits ignoring design ratings.
7. Opportunity cost depends on the best displaced feasible workload. Avoid adding the same unrealized revenue twice to a total-cost figure. Useful GPU-hours are an illustrative accounting partition, not MFU or measured business value.

## Fresh primary-source scope

- `https://docs.nvidia.com/dgx/dgxgb200-user-guide/hardware.html`: complete HTML text read (last update2026-09-17). Rack components,72-GPU domain, compute/management/cluster network distinctions, hybrid cooling, power shelves/bus bar and approximately120kW checked. Page images not visually reviewed. Use only a short scoped example, not a complete vendor hardware/spec table.
- `https://docs.nvidia.com/dgx-superpod/reference-architecture-scalable-infrastructure-gb200/latest/dgx-superpod-architecture.html`: complete short page read.8-rack scalable-unit1.2MW thermal-design value and hybrid cooling verified. Figure1 pixels not reviewed. No claim that cited facility standards were separately read or certified.
- OCP liquid-cooling integration/logistics white paper: search extraction confirms isolated technical/facility loops and CDU heat exchange, but PDF not fully read/rendered. This is discovery evidence only; not full primary coverage.
- NVIDIA DSX reference-design page: search extraction only; full open failed due to size. Do not base a new45°C or outage-operating prescription on that extraction. Cooling/airflow guessed URL inaccessible; no claim reviewed.
- Jane Street video: inaccessible in this pass. Retain original link and scope uncertainty.

## Exact foundations

`hardware-model.js` contains pure models, not an operating procedure:

- Declared kW, L/min, kg/L and kJ/(kg·K) bulk heat transport. Separates liquid and air power, converts mass flow to kg/s, and computes bulk ΔT. Positive flow/capacity and finite-result guards. No claim of measured coolant properties; scene inputs must be declared illustrative.
- Fixed rack-to-branch power placement with all branch and site inequalities. Includes a counterexample where sufficient total power cannot repair an overloaded branch without reassignment. Does not solve full electrical routing or failover.
- Installed GPU-hours split into useful hours, downtime and available-but-unused hours. Uptime and productive fraction are distinct multipliers. No invented uptime measurements or monetary opportunity values.

`test-hardware-model.mjs` passes2,624 independently checked combinations:320 heat settings,2,048 rack placement settings and256 useful-capacity settings. Separate invalid-domain and counterexample assertions; original fingerprint unchanged. It is imported by the new default Hardware test.

## Reader and browser verification

`hardware.js` integrates16 sections and approximately3,074 words. Three code-native scenes explain isolated-loop heat transport, constrained rack placement and installed/available/useful GPU-hours. Registry, original publication date, related destinations, stable anchors, source visibility and semantic search pass. Unimplemented Performance and Serving preserve their original complete destinations; aliases remain empty.

All10,349 bounded rendered combinations pass:110 heat states,38 placement states and10,201 capacity states, with finite values and capacity-bar conservation. Numerical foundations separately pass2,624 combinations. Native browser verification covers349 unique combinations:all110 heat and38 placement states;201 capacity states cover every individual uptime/productivity value but not the whole Cartesian grid. Displayed heat balance, branch/site margins, feasibility and GPU-hour partition match independent references.

Native Play/Pause/Replay checked; actual stage value resets to0. Section search reaches power-placement while retaining the chosen assignment. Desktop full-width and narrow390×844 layouts inspected. Narrow document width remains390; diagrams scroll locally and respond to keyboard input. Fixed missing shared scene styling during QA. Terminal toggle inspected; no current browser errors observed. Final screenshot in Codex workspace: `hardware-v2-check.png`. Final numerical/reader test passes after prose/style refinements; full-suite result recorded in migration-progress.md.

## Next and open gates

2026-10-07 math-rendering pass: three displays use explicit TeX/MathML. Heat balance declares steady constant properties,positive flow/density/heat capacity and the minute-to-second conversion; path constraints define dependent-rack sets and a common operating state; GPU-hour fractions are conditional accounting, not MFU. Feedback loop becomes a semantic flow and cost accounting qualified prose. Dedicated2,624 model cases/10,349 rendered bodies plus reader/math checks pass. Native1280/390px:3 MathML displays,zero errors/page overflow; heat equation visually inspected. Proof:hardware-typeset.png in Codex workspace. No fresh video/primary/source closure or operating safety claim; original intact.

Review the original video/transcript if accessible, authoritative figures and OCP full primary guidance before closing source gates. The section map is preservation evidence, not an exhaustive completed losslessness audit. Initial deep-link scroll, full keyboard/accessibility coverage, actual OS reduced-motion and offscreen/disposal checks remain pending; shared lifecycle tests do not certify them. Mobile floating-navigation overlap is a corpus-level polish item. Complete old routes, privacy and production gates before source retirement. Reader integration increments local implementation to49, not completed migration.
