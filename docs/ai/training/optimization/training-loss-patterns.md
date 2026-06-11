---
title: "Training Loss Patterns"
date: 2026-06-11
lastmod: 2026-06-11
tags:
  - ai/training
  - optimization
  - diagnostics
draft: false
---

## Summary

Training loss curves are operational telemetry. A spike, plateau, or divergence is not just a visual artifact; it is a signal about data quality, optimizer stability, resume correctness, or distributed training state. The useful skill is not memorizing one perfect curve, but recognizing patterns and choosing the right response.

## Concepts

- **Fast recovering spike:** a sharp loss increase that quickly returns to the previous trajectory.
- **Slow recovering spike:** a loss spike that eventually recovers, but costs many steps of degraded training.
- **Non-recovering spike:** a spike after which loss plateaus higher or diverges.
- **Non-spike divergence:** gradual instability without one obvious isolated bad step.
- **Resume-related spike:** a loss artifact caused by imperfect restoration of data, RNG, optimizer, or loader state.
- **False low loss:** an artificially good loss caused by repeated data or evaluation leakage.

## 1. Why loss patterns matter

For small experiments, a loss curve is often just a progress plot.

For large training runs, it becomes a control signal:

- should the run continue?
- should we rollback?
- did resume work correctly?
- did the data mixture shift?
- is one source distribution causing the issue?
- are we silently repeating data?

The hard part is that similar-looking curves can have different causes. A single loss spike may be harmless, while a subtle plateau shift may indicate a serious issue.

## 2. Healthy loss curves

A healthy pretraining curve usually has:

- smooth downward trend on a log-like scale
- small batch-to-batch noise
- occasional recoverable bumps
- no sustained upward drift
- stable validation loss trends

The absolute loss value is less important than the trajectory and whether it matches expectations from previous runs or scaling forecasts.

Useful comparisons:

- same recipe, smaller scale
- previous checkpoint family
- held-out validation
- per-domain validation losses
- gradient norm and clipping frequency

![Healthy BLOOM training loss curve](/img/training-loss-patterns/bloom-176B-success.png)

_A healthy large-scale run is not perfectly smooth, but the global trend keeps improving and transient irregularities do not change the trajectory._

## 3. Fast recovering spikes

A **fast recovering spike** is a sharp loss increase that quickly returns to the previous curve.

Typical causes:

- unusual batch
- temporary data pocket
- transient numerical event
- occasional high-loss distribution sample

Usually this is acceptable if:

- recovery is quick
- gradient norms return to normal
- validation loss is unaffected
- downstream evals do not degrade

Action:

- keep training
- mark the step
- inspect related telemetry if the spike is unusually large

Do not overreact to one fully recovered spike in an otherwise healthy run.

![Fast recovering loss spikes](/img/training-loss-patterns/pre-bloom-tr1-13B-glitch-1-2.png)

_Fast recovering spikes are useful to recognize because stopping every run on this pattern would waste compute. The important signal is the quick return to the previous loss trend._

## 4. Slow recovering spikes

A **slow recovering spike** eventually returns to the old trajectory, but only after many steps.

This is more concerning because it wastes useful training compute and may indicate a deeper interaction.

Possible causes:

- bad data region
- temporary distribution shift
- optimizer state disturbance
- precision issue
- resume artifact

Action:

- compare validation loss before and after recovery
- check gradient norms and clipping rate
- inspect data-source mix around the spike
- consider rollback if recovery takes too long

The key question is:

$$
\text{did the model recover to the same trajectory, or only to a worse one?}
$$

![Slow recovering loss spike](/img/training-loss-patterns/idefics-80b-tr-190-01-spike-recover-2023-05-30.png)

_A slow recovery can still be acceptable, but it has an opportunity cost: many steps are spent repairing the disturbed optimizer/model state instead of making normal progress._

## 5. Non-recovering spikes

A **non-recovering spike** is serious.

Patterns:

- spike then plateau at worse loss
- spike then gradual divergence
- spike then downstream eval collapse

Likely causes:

- learning rate too high
- numerical instability
- optimizer state corruption
- repeated bad data interaction
- precision overflow
- architecture instability

Action:

- stop and diagnose
- rollback to a checkpoint before the event
- try skipping suspicious batches
- reduce learning rate or tighten clipping if instability repeats
- check whether the issue reproduces from the same checkpoint

A non-recovering spike should not be treated as “just noise.”

![Non-recovering loss spike](/img/training-loss-patterns/pre-bloom-tr8-104B-glitch-1.png)

_The dangerous case is not the spike itself, but the new post-spike regime. If the curve resumes from a worse plateau, the run may have taken irreversible damage without rollback._

## 6. Non-spike divergence

Not every failed run has a dramatic spike.

Sometimes loss:

- flattens too early
- drifts upward slowly
- oscillates with increasing amplitude
- diverges after repeated restarts

This can be harder to catch because there is no obvious single event.

Likely causes:

- unstable optimizer settings
- poor precision regime
- dirty data
- bad initialization
- missing normalization
- broken parallelism or sharding behavior

Action:

- compare against a smaller known-good run
- inspect gradient norms over time
- check loss by data source
- validate resume and dataloader determinism
- run a short reproduction from the same checkpoint

## 7. Resume-related spikes

Resume correctness is a major source of confusing loss patterns.

A good resume should restore:

- model weights
- optimizer state
- scheduler state
- random-number generator state
- dataloader position
- sampler state
- mixture counters or ratios

If any of these are wrong, the model may see a sudden distribution shift after resume.

Common symptoms:

- small spike after every resume
- data mixture ratio changes
- loss appears too good after rollback
- repeated data after restart

Action:

- test resume early before the full run
- compare pre-resume and post-resume batch statistics
- log data-source mix around resume boundaries
- verify sampler state restoration explicitly

Resume correctness is not just a convenience feature. It protects the validity of the run.

![Resume-related data-source loss artifact](/img/training-loss-patterns/idefics-80b-tr-190-01-image2text.png)

_Resume bugs often show up as localized artifacts around the restart boundary. This is why checkpoint validation should include dataloader and sampler state, not only model weights._

## 8. Repeated data can create false low loss

One dangerous pattern is not a loss spike but an artificially low loss.

If a resume restarts the dataloader from the beginning, the model may see data it already memorized.

The loss may look unusually good because:

$$
\text{loss on repeated data} < \text{loss on fresh data}
$$

Then, when fresh data resumes, the curve may appear to “jump” to a higher level. The apparent spike is actually the end of a false low-loss region.

Action:

- verify dataloader resume position
- track document or shard IDs
- monitor repeated-token or repeated-document rates
- avoid evaluating run quality on repeated data segments

This failure can invalidate ablations because the comparison no longer assumes the same data exposure.

![Repeated data creates a false low-loss region](/img/training-loss-patterns/ptl-repeat-data-p3.png)

_Repeated data can make a run look better than it is. When fresh data resumes, the apparent loss jump is the removal of the artificial advantage, not necessarily a new instability._

## 9. Track losses per data distribution

When training on multiple data sources, aggregate loss can hide the source of a problem.

Track separate losses for:

- web
- code
- math
- multilingual
- image-text
- synthetic data
- instruction data

This helps distinguish:

- global model instability
- one bad source distribution
- mixture-ratio shifts
- a source-specific preprocessing bug

If only one source spikes, the likely cause is different from a simultaneous spike across every source.

![Per-source loss curves reveal localized instability](/img/training-loss-patterns/idefics-80b-tr-190-01-losses-2023-06-04.png)

_Aggregate loss can hide the real failure mode. Per-source curves make it easier to separate global optimizer instability from source-specific data or preprocessing problems._

## 10. Diagnostic checklist

When a suspicious loss pattern appears, ask:

- Did training resume recently?
- Did the dataloader restore exactly?
- Did the data mixture change?
- Did the spike recover fully?
- Did validation loss move too?
- Did gradient norm or clipping frequency spike?
- Did throughput or hardware telemetry change?
- Is the pattern source-specific?
- Does it reproduce from the same checkpoint?

The answer determines whether to continue, rollback, skip batches, or change the recipe.

## 11. Practical response table

| Pattern | Severity | Likely action |
| --- | --- | --- |
| Fast recovering spike | Low | Continue and monitor |
| Slow recovering spike | Medium | Inspect data, gradients, validation, resume state |
| Non-recovering spike | High | Rollback and diagnose |
| Gradual divergence | High | Check optimizer, LR, precision, data, architecture |
| Spike after every resume | Medium | Fix checkpoint and dataloader restore |
| False low loss after rollback | High | Check repeated data and sampler state |
| Source-specific spike | Medium | Inspect that data source or preprocessing path |

## Practical Heuristics

- Do not judge a spike only by its height; judge whether it returns to the old trajectory.
- Test resume behavior before a long run.
- Log data-source mix and shard IDs, not only scalar loss.
- Treat repeated data as a correctness bug, not just an efficiency bug.
- Pair loss curves with gradient norms, validation loss, and throughput telemetry.

## Related

- [Gradient Norm and Training Dynamics](/atlas/ai/training/optimization/gradient-norm-and-training-dynamics)
- [Gradient Clipping](/atlas/ai/training/optimization/gradient-clipping)
- [Goodput, Determinism, and Fault Tolerance](/atlas/systems/infrastructure/goodput-determinism-and-fault-tolerance)
- [Choosing an LLM Training Framework](/atlas/systems/infrastructure/choosing-an-llm-training-framework)
- [The Smol Training Playbook](/atlas/ai/training/smol-training-playbook)

## Sources

- Stas Bekman, [Understanding Training Loss Patterns](https://github.com/stas00/ml-engineering/blob/master/training/instabilities/training-loss-patterns.md)
