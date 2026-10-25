# Linked Lists and Pointer Ownership — draft audit

## Fresh source closure — 2026-10-07

The complete165-line original was freshly reread and verified byte-equal committed HEAD with the SHA below. Its node structure,dummy scaffold,complete reversal/cycle/merge functions,reachability invariant,structural phases,pointer checklist,costs and mistakes have explicit homes. Practice labels are not republished as exercise pages. There are no source figures,JSX/assets or external citations.

The three body-only algorithms are now complete callable functions using the v2 ListNode.value definition consistently. Reversal requires finite acyclic input; cycle detection compares object identity; destructive sorted merging requires disjoint acyclic inputs and selects the first input on equal values. Node mutation/allocation/output-space conditions remain adjacent to the code. New learning goals state those contracts rather than only listing methods.

Removed the public original-reference block and duplicate local identity. Related mechanisms now link to Ordering#streams and Trees#orders. All13 actual original headings map to covered v2 sections:reachability,dummy,reverse,fast-slow,merge,phases,cost and practice. This is local navigation,not deployed HTTP redirects; physical original remains intact.

`test-linked-lists-preservation.mjs` extracts the real node class and3 rendered functions and executes them. It checks41 reversal lengths with duplicate values and exact identity coverage,double reversal,192 cycle-prefix/period configurations with no link mutation,and1225 independently ordered merges with identity coverage and stable input-side tie order. Empty lists are included; resulting cycles are rejected by the independent collector. Test is imported by the default search-links suite. Existing graph-state conservation/step tests remain.

Native desktop reversal code visually inspected and saved as linked-lists-preserved.png. Actual390px explorer-hidden pre region is258px wide with286px content; ArrowRight advances local scrollLeft22.5 without page overflow. No warning/error logs. Focusable code regions have accessible names;viewport reset. Final dedicated search-links/static export passes after punctuation correction;full-suite result recorded separately in migration-progress.md.

Remaining:corpus actual reduced-motion/keyboard/mobile review and final canonical shell/search/HTTP-route/production integration. No new full external textbook audit claimed. No source physically removed,production switch,commit,push or deployment. The historical audit below predates this source closure and no longer defines visible original retention.

Updated 2026-10-04. `algorithms/linked-lists`, publication2026-07-24. Complete165-line body read; no original assets. Original route retained, no alias/retirement.

## Coverage and corrections

Node structure/reachability → `#reachability`; dummy/tail scaffold → `#dummy`; complete iterative reversal body and prefix/suffix invariant → `#reverse`, `#reverse-lab`; middle, cycle, entrance and splitting → `#fast-slow`; node identity/intersection → `#identity`; moving-tail merge body → `#merge`; middle/reverse/weave and palindrome phases → `#phases`; O(n) time/auxiliary versus recursion/output allocations → `#cost`; pointer checklist, guards, cycles, tails and head result → `#practice`. Original exercise progression is represented by mechanisms, including removal gap, random-reference copying, carry arithmetic and k-way merge. Complete original remains linked.

Ownership is explicitly an algorithmic responsibility, not enforced exclusivity. Reversal assumes finite acyclic input. Merge assumes sorted disjoint structures; shared suffixes require different treatment. Middle choice on even length, identity versus equal values, cycle-entry proof and restoration of a nonmutating palindrome check are explicit. Constant auxiliary reference space excludes output and nodes; search for a predecessor is not free. Python fragments are function bodies/scaffolds, not standalone scripts.

## Evidence and QA

Mechanisms are derived from the user-owned source and exact graph model; no new full primary textbook review is claimed. For every length0..40, the final links reverse identities and return the proper new head. Every save/rewire/advance frame preserves union reachability from previous/current/saved and introduces no cycle. Duplicate values deliberately do not merge node identities. Invalid nonfinite input rejected. Registry, originals, related links, search and anchors pass.

Browser step2 shows current0.next=null with saved-next1 still reaching suffix; final returns head3 with links0→null,1→0,2→1,3→2. SVG index labels, arrow directions and HTML reference/link text provide redundant explanations. Mobile390×844 document no overflow, scene304; desktop figure checked. Screenshot `linked-list-v2.png` in task directory. No console warnings/errors; viewport reset. Shared opt-in animation lifecycle/reduced-motion harness reused, actual OS preference pending. Final primary/preservation/production gates remain pending; no source retirement or deployment.

SHA-256: `4cd65175059e9073711e76549a2601555606c487683d131554f0286bbfae4053`.
