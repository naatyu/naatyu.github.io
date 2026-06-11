---
title: "MoE Routing and Load Balancing"
date: 2026-06-11
lastmod: 2026-06-11
tags:
  - ai/training
  - moe
  - optimization
draft: false
---

## Summary

MoE routing is not just "choose the best expert for each token." In large-scale training, routing is constrained by compute, communication, expert capacity, and stability. A theoretically good router that overloads one expert is operationally bad; a perfectly uniform router that ignores token difficulty can also be suboptimal.

The core MoE tension is:

$$
\text{specialization} \quad \text{vs.} \quad \text{balanced utilization}
$$

## Concepts

- **Router:** network that scores experts for each token.
- **Top-$k$ routing:** each token is sent to its top $k$ experts.
- **Expert capacity:** maximum number of tokens an expert can process in a batch.
- **Dead expert:** expert that receives almost no useful tokens.
- **Token drop:** tokens skipped or routed suboptimally because selected experts are full.
- **Auxiliary load-balancing loss:** extra loss term encouraging uniform expert usage.
- **Loss-free balancing:** balancing by modifying routing scores rather than adding an auxiliary LM-loss tradeoff.

## 1. The geometric view of MoE

A dense FFN computes:

$$
y = f(x)
$$

An MoE FFN computes a weighted combination of experts:

$$
y
=
\sum_{i=1}^{E}
\rho_i(x) f_i(x)
$$

where:

- $E$ is the number of experts
- $f_i$ is expert $i$
- $\rho_i(x)$ is the router score or routing weight

With top-$k$ routing:

$$
\rho_i(x) = 0
\quad
\text{for most experts}
$$

Only a sparse subset of experts is active per token.

The useful geometric intuition from kexue.fm is that the router partitions representation space into expert regions. Tokens near similar regions are routed to similar experts. Expert specialization emerges from this partitioning.

## 2. Training runs expert-first, not token-first

The intuitive story is:

> each token chooses experts.

The implementation reality is closer to:

> each expert receives a bucket of tokens and processes them in parallel.

This difference matters. If many tokens choose the same expert, that expert becomes overloaded while others sit idle.

So even if routing scores look semantically reasonable, the system can fail because:

- some experts receive too many tokens
- some experts receive too few tokens
- all-to-all communication becomes imbalanced
- capacity limits force token dropping

Load balance is therefore both a quality issue and a systems issue.

## 3. Why dead experts are expensive

If an MoE has $E$ experts but only $E_{\text{active}}$ are used meaningfully, the model is paying memory and communication cost for capacity it does not use.

Roughly:

$$
\text{effective capacity}
\ll
\text{stored capacity}
$$

Dead experts cause:

- wasted parameters
- lower effective model capacity
- worse specialization
- imbalance in communication
- possible collapse loops where active experts get even more updates

The kexue.fm framing is blunt: dead experts mean you paid for a large model but trained a smaller one.

## 4. Classical auxiliary load-balancing loss

A common solution is to add an auxiliary loss that encourages uniform expert usage.

Let:

$$
f_i
=
\frac{\text{tokens routed to expert }i}{\text{total routed tokens}}
$$

and:

$$
p_i
=
\frac{1}{T}
\sum_{t=1}^{T}
\rho_i(x_t)
$$

A Switch-style balancing loss has the form:

$$
\mathcal{L}_{\text{aux}}
=
\alpha E
\sum_{i=1}^{E}
f_i p_i
$$

The exact formula varies by implementation, but the intent is consistent:

$$
f_i \approx \frac{1}{E}
$$

for all experts.

Benefits:

- simple
- differentiable enough to train routers
- widely used
- reduces dead experts and token dropping

Problems:

- $\alpha$ is hard to tune
- too small does not balance
- too large hurts LM loss
- uniform load is not always semantically optimal

This is why load balancing should not be treated as a solved detail.

## 5. Loss-free load balancing

DeepSeek-style loss-free balancing changes the router scores directly rather than adding an auxiliary loss to the language-model objective.

The generic idea is:

$$
s_i'(x) = s_i(x) + b_i
$$

where:

- $s_i(x)$ is the original router score for expert $i$
- $b_i$ is a bias adjusted from recent load statistics

If expert $i$ is underused:

$$
b_i \uparrow
$$

If expert $i$ is overused:

$$
b_i \downarrow
$$

Then routing uses $s_i'(x)$, while the model does not need a separate auxiliary loss term fighting the LM objective.

This is attractive because it separates two objectives:

- language modeling loss should train representations
- routing bias should enforce operational balance

The risk is that score correction becomes another control loop. It must be stable, slow enough not to oscillate, and consistent across distributed workers.

## 6. Uniform routing is not always optimal

The phrase "load balancing" can be misleading. Equal expert load is useful, but not always the true objective.

Some tokens are harder:

- code tokens may need more specialized computation
- math reasoning tokens may need more capacity
- rare-language tokens may benefit from specialized experts
- noisy or duplicated tokens may not deserve extra compute

A stronger objective is closer to:

$$
\text{allocate compute where marginal loss reduction is highest}
$$

Uniform load is a practical proxy for avoiding collapse, not a proof of optimal compute allocation.

This matters for interpreting expert histograms. A perfectly flat histogram is not automatically a better model. It may indicate that the router is being over-regularized.

## 7. Sequence-level balancing

Batch-level balancing can still allow bad local patterns. For example, one sequence might route almost entirely to one expert while another sequence compensates globally.

Sequence-level balancing asks for stronger constraints:

$$
\text{balance within each sequence}
$$

or at least:

$$
\text{avoid pathological per-sequence expert concentration}
$$

This can matter for long-context or reasoning-heavy workloads, where a single sequence is itself a meaningful training unit. If the router collapses within a sequence, the model may lose diversity of computation across that example.

The tradeoff:

- stronger balancing gives more predictable utilization
- but it can interfere more with natural specialization

## 8. Capacity factor and token dropping

Let each expert receive capacity:

$$
C_e
=
\left\lceil
\frac{kT}{E}\cdot \gamma
\right\rceil
$$

where:

- $T$ is number of tokens
- $k$ is top-$k$ routing
- $E$ is number of experts
- $\gamma$ is the capacity factor

If $\gamma$ is too small, overload causes token drops.

If $\gamma$ is too large, experts get enough slack but memory and communication waste increase.

Dropless MoE avoids token dropping, but then the system must handle variable expert loads efficiently. This is often harder at scale.

## 9. Practical signals to log

For MoE training, aggregate loss is insufficient.

Track:

- token count per expert
- router probability entropy
- expert capacity overflow
- token drop rate
- per-expert gradient norm
- per-expert activation RMS
- fraction of padding tokens routed to each expert
- per-domain expert usage
- routing stability across resume
- all-to-all time and imbalance

Good MoE monitoring should connect optimization and systems telemetry.

## 10. Practical heuristics

- Start with simple auxiliary balancing unless the run is large enough to justify loss-free control loops.
- Do not over-tune the auxiliary coefficient to force perfect uniformity.
- Separate padding tokens from real-token routing statistics.
- Watch both dead experts and overloaded experts.
- For top-$k$, inspect not only chosen experts but also router score margins.
- Treat MoE optimizer changes as routing changes.
- Evaluate per-domain expert usage before claiming specialization.

## Related

- [MoE Training Stability](/atlas/ai/training/optimization/moe-training-stability)
- [Transformer Scaling Rules](/atlas/ai/training/scaling/transformer-scaling-rules)
- [Muon Optimizer](/atlas/ai/training/optimization/muon-optimizer)
- [Hardware Topology and Parallelism](/atlas/systems/parallel-computing/hardware-topology-and-parallelism)

## Sources

- Su Jianlin, [MoE环游记：1、从几何意义出发](https://kexue.fm/archives/10699)
- Su Jianlin, [MoE环游记：2、不患寡而患不均](https://kexue.fm/archives/10735)
- Su Jianlin, [MoE环游记：3、换个思路来分配](https://kexue.fm/archives/10757)
- Su Jianlin, [MoE环游记：4、难处应当多投入](https://kexue.fm/archives/10815)
- Su Jianlin, [MoE环游记：6、最优分配促均衡](https://kexue.fm/archives/11619)
- Su Jianlin, [MoE环游记：8、强制序列级均衡](https://kexue.fm/archives/11760)
