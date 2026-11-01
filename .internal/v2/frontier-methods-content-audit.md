# Frontier training methods: targeted additions

Date: 2026-11-01. User approved implementation after an assessment of
[Alex Wa's article](https://djdumpling.github.io/2026/01/31/frontier_training.html).
This is not a new public paper-summary page or a reopened migration.

## Ownership

| Material | Canonical destination | Teaching treatment |
|---|---|---|
| Packing changes example and token batch, update count and tuning | `post-training/sft#packing-budget` | Exact assigned 1,024-example budget comparison |
| INTELLECT-3 in-flight versions, inference mismatch and IcePop masking | `post-training/rl#intellect-icepop` | Source equation and inclusive-boundary coefficient table |
| Kimi K2 tool/task/trajectory filtering and simulation limits | `post-training/agents#tool-factory-evidence` | Transition/evidence/failure comparison |
| SmolLM3 storage, loader, shuffle and TP initialization incidents | `training/practice#silent-failures` | Cause versus proposed diagnostic comparison |
| Controlled experiment and promotion contract | `training/practice#experiment-card` | Reusable comparison checklist linked to existing budget/data discussions |

## Evidence and limits

- Read the requested article during assessment. Followed selected primary claims;
  did not exhaustively audit every linked report or every architecture claim.
- Smol Training Playbook: data-mixture/annealing discussion, training-marathon
  incidents and SFT packing/learning-rate discussion. Source is already canonical
  in the Atlas. New incident summary follows its shared-memory wording, not the
  secondary article's GPU page-fault speculation. Do not copy the source's
  apparently swapped short/long-run config comments.
- INTELLECT-3 v1, §§2.1.2–2.1.5, 2.2, 3.1.2, 3.3: policy-version changes,
  group-slot refill, client round robin, sandbox failure masking and masked
  trainer/inference ratios. The equation uses mean-centered rewards; it does
  not normalize by group standard deviation or surviving-token count.
- Kimi K2 v2, §3.1.1: specifications, agents/tasks, rubric-backed trajectory
  generation, stateful simulation, judge filtering and real execution sandboxes.
  The reviewed report revision is later than the article's publication.
- Tables with proposed checks and experiment-card questions are original
  engineering adaptations. They are not reported ablations. The packing numbers
  are assigned arithmetic, not the Smol throughput measurement.
- Avoid duplicate generic material: existing Training Data owns mixture weights,
  novelty/caps and annealing. Existing agent and RL sections own completion bias,
  harness-family weighting and mixed-version trajectory contracts.

## Excluded secondary claims

Do not import: reversed DPO beta interpretation; categorical FlashAttention/
softcap incompatibility; NoPE as bag-of-words under causal masking; router bias
as a mixture weight; normalized gradients before Muon momentum; incorrect
AdamW/linear-attention notation; generic square-root batch LR prescription;
an arbitrary 20B RL threshold; INTELLECT SFT's unsupported 9.9B-token total.
These were reasons to use primary sources, not material for a public error list.

## Verification

Added pure packing-budget and IcePop-coefficient tests, including partial batches,
inclusive endpoints, invalid inputs, rendered destinations, math markup and
internal links. Also tested search discoverability for the four owning readers.

- `npm --prefix v2 test`: pass, all 55 readers. The deliberate additions change
  the total to 562 display equations and 1,474 MathML roots. Five new comparison
  regions bring the scroll-accessibility inventory to 410.
- `npm --prefix v2 run test:publication`: pass. Publication build: 57 indexed
  canonical pages, 267 resources, no private or legacy content dependencies.
- `npm --prefix v2 run test:http`: pass, including canonical/retired routes,
  private-path exclusions, response headers and resources.
- `git diff --check`: pass.
- Native browser: inspected all five section bodies; desktop packing comparison
  and IcePop math; 390px RL/practice/agent pages have no page-wide overflow.
  IcePop table takes focus and moves horizontally with ArrowRight (40px).
  Explorer visibility still gives the reader full space. No warning/error logs
  in the review tab. Temporary viewport override reset.
- No new animation or playback lifecycle was introduced. No OS-level reduced-
  motion setting was changed or separately certified in this pass.

No commit, push or deployment was requested. Local review uses port 4328.

## Publication follow-up

The user subsequently requested a push. Integrated remote commit `b642d55`
(CUDA note) without changing its content. The only overlap was the exact global
equation-count expectation: 566 remote displays plus one IcePop display = 567.
The combined 56-reader full suite and publication-format check pass.
