---
title: "MoE Training Stability"
date: 2026-06-08
lastmod: 2026-06-08
tags:
  - ai/training
  - moe
  - optimization
draft: false
---

## Summary

Mixture-of-Experts models introduce stability failures that do not usually appear in dense transformers: expert collapse, routing saturation, load-balancing pathologies, and greater sensitivity to numerical details in communication. In practice, MoE stability depends as much on optimizer conventions, routing treatment, and collective precision as on the nominal architecture.

## Concepts

- **Expert collapse:** a failure mode where a subset of experts dominates or other experts become effectively dead.
- **Routing saturation:** too many tokens being sent to one expert at the same time.
- **Load-balancing loss:** an auxiliary objective that discourages pathological expert usage imbalance.
- **Padding tokens:** non-semantic tokens inserted for batching or packing convenience that can still disturb routing if left untreated.

## 1. Why MoE is more fragile than dense training

MoE models add a routing system on top of normal transformer optimization.

That means the training dynamics are now shaped by:

- parameter updates
- router-score updates
- token-to-expert assignment
- communication and dispatch behavior

So a run can remain numerically “alive” while its expert allocation is already degrading.

## 2. Expert collapse can be an optimizer mismatch problem

One important lesson from the Laguna report is that expert collapse may come from optimizer scaling conventions, not just bad routing design.

In their case, Muon without the right learning-rate / effective-weight-decay rescaling caused collapse after a long delay, roughly hundreds of billions of tokens into training.

The reusable point is:

> if different parameter classes experience mismatched effective update scales, MoE instability can first appear as a routing or expert-utilization failure.

So optimizer migration in MoE runs should be treated as a stability experiment, not only a convergence experiment.

## 3. Communication precision can destabilize the whole model

Another high-signal lesson is that the precision of seemingly local collectives can matter a lot.

Laguna reports that the **LM-head input-gradient all-reduce** in `BF16` under tensor parallelism became a dominant numerical error source once logits drifted upward. Moving that all-reduce to `FP32` stabilized training.

The practical takeaway is broader:

- reductions around large activations or sensitive heads should not automatically inherit low-precision defaults
- some collectives are worth forcing to `FP32` even if the rest of the model trains in `BF16`

## 4. Padding tokens can poison routing

Padding looks harmless, but in MoE it can create a systematic routing artifact.

If padding tokens:

- share the same embedding
- do not mix meaningfully with surrounding tokens
- and still participate in routing and load-balancing

then they may all be sent to the same expert:

$$
\text{many identical router inputs}
\Rightarrow
\text{one expert hot spot}
$$

So a robust default is:

- exclude padding from routing if possible
- exclude padding from the load-balancing loss

This is a simple but high-value stability fix.

## 5. Dense early layers can be a useful stabilizer

Another practical pattern in large MoEs is to keep the first one or few transformer layers dense.

This can help because the earliest layers process the rawest and noisiest activations. Delaying routing slightly reduces the burden on the first router and often makes optimization easier.

## 6. What to watch during a run

Useful stability signals include:

- per-expert token counts
- share of padding tokens
- auxiliary load-balancing loss behavior
- dead-expert rates
- logit drift
- gradient spikes near the LM head

Loss alone is often too late or too coarse.

## Practical Heuristics

- Treat optimizer changes in MoEs as routing-stability changes too.
- Audit low-precision collectives around the LM head and other sensitive reductions.
- Exclude padding from routing and load-balancing when possible.
- Monitor expert-usage histograms early and continuously.
- Consider dense early layers if the first routers are unstable.

## Related

- [Model FLOPs Utilization (MFU)](/atlas/systems/performance/model-flops-utilization-mfu)
- [Rules of Engagement for LLM Training](/atlas/ai/training/optimization/rules-of-engagement-for-llm-training)
- [Laguna M.1 / XS.2 Technical Report](https://poolside.ai/assets/laguna/laguna-m1-xs2-technical-report.pdf)
