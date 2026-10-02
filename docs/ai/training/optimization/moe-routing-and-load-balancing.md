---
title: "MoE Routing and Load Balancing"
date: 2026-06-11
lastmod: 2026-09-24
tags:
  - ai/training
  - moe
  - optimization
draft: false
---

## Summary

MoE routing is not just "choose the best expert for each token." In large-scale training, routing is constrained by compute, communication, expert capacity, and stability. A theoretically good router that overloads one expert is operationally bad; a perfectly uniform router that ignores token difficulty can also be suboptimal.

Modern reports combine several controls rather than relying on a single router trick: selected-score gradients train the router, load control prevents expert collapse, numerical controls keep routing stable, and the expert layout determines how much specialization is possible. DeepSeek-V3, Kimi K3, GLM-5, and DeepSeek-V4.1-Flash are useful concrete examples below.

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
- **Loss-free balancing:** balancing batch-level expert usage by adjusting selection scores rather than applying a batch-level balancing loss to the model objective.
- **Shared expert:** an expert computed for every token, outside routed top-$k$ selection.
- **Router z-loss:** a regularizer on the router's log-partition value, used to control numerical scale; it is distinct from load balancing.

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

The exact formula varies by implementation. This particular $f_i$ normalization assumes top-1; for top-$k$, normalize dispatch counts by $kT$ if $f_i$ is meant to sum to one. The intent is consistent:

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

DeepSeek-style loss-free balancing changes the scores used for expert selection directly rather than relying on an auxiliary loss to balance the whole training batch.

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

Then top-$k$ selection uses $s_i'(x)$. The selected experts' mixture weights still come from the *original* affinity scores $s_i(x)$, not the biased scores. This preserves the interpretation of the router's learned preferences after selection. The router continues to learn through gradients from the language-model objective for the selected paths, and the biases are updated separately from measured load.

In DeepSeek-V3, each step's global expert counts drive a fixed-size bias update: raise the bias for underloaded experts, lower it for overloaded ones. Thus "loss-free" describes the **main batch-level balancing controller**, not an absence of every auxiliary term: V3 retains a very small sequence-wise balancing loss to guard against extreme concentration in individual sequences. [DeepSeek-V3, §2.1.2](https://arxiv.org/html/2412.19437)

This is attractive because it largely separates two objectives:

- language modeling loss should train representations
- routing bias should enforce operational balance

The risk is that score correction becomes another control loop. It must be stable, slow enough not to oscillate, and consistent across distributed workers.

## 6. Quantile Balancing

Kimi K3 replaces the fixed-step bias controller with a direct quantile calculation.

For each token, consider expert $i$'s router score relative to the Top-$(k+1)$ selection cutoff. This produces a margin:

$$
m_{ti}
=
s_{ti}
-
\operatorname{Top}_{k+1}(s_t)
$$

Expert $i$ is selected when its bias-adjusted margin is above the cutoff. If the target expert load is:

$$
q=\frac{mk}{E}
$$

for $m$ tokens, K3 chooses the next bias from the margin quantile that makes exactly $q$ margins positive.

Compared with a sign-based controller:

- there is no learning-rate-like bias step to tune
- balance is reached in a few steps rather than through gradual correction
- the update uses router geometry, not only whether load was high or low

The biases affect expert selection but not mixture weights, are mean-centered after the update, and are frozen for inference.

At large scale, communicating every margin is too expensive. K3 builds one histogram per expert, all-reduces the histogram counts, and estimates the desired quantile from `1,000` bins. The quantile error is bounded by the bin width, while communication is reported below `1%` of transmitting raw margins.

This is an example of turning a feedback-control problem into a distributed statistics problem:

$$
\text{load error + tuned step}
\rightarrow
\text{target-load quantile}
$$

## 7. Uniform routing is not always optimal

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

## 8. Sequence-level balancing

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

DeepSeek-V3 tested this distinction. Its small-model ablations found batch-wise auxiliary balancing and loss-free batch balancing reached similar validation losses, while stronger sequence-wise balancing was slightly worse. This means that some apparent "loss-free versus auxiliary" benefit can actually come from **which tokens must balance against each other**, rather than from the absence of an auxiliary gradient alone. Still, batch balance can hide spikes in a particular sequence or under an inference domain shift. [DeepSeek-V3, §4.5.3](https://arxiv.org/html/2412.19437)

## 9. Capacity factor and token dropping

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

## 10. Router learning: softmax, sigmoid, and hard selection

Top-$k$ has two separate roles:

1. **Dispatch:** choose which experts execute. This discrete index selection does not provide an ordinary gradient to every unselected expert.
2. **Combine:** weight the executed experts' outputs. These continuous weights do carry task gradients back to the selected router scores.

The auxiliary load loss provides an additional router training signal based on usage; a loss-free controller changes future dispatch instead. Neither replaces the language-model gradient to the executed expert paths.

Classic Switch uses a softmax across experts and top-1 dispatch. DeepSeek-V3 and GLM-5 use independent sigmoid affinities, top-$k$ selection, and normalization **after** selecting experts. Their correction bias affects dispatch but not output mixture weights. Softmax and sigmoid are therefore different score parameterizations; neither one by itself solves imbalance. [Switch Transformer](https://arxiv.org/html/2101.03961), [DeepSeek-V3](https://arxiv.org/html/2412.19437), [GLM-5 note](/atlas/ai/architectures/model-reports/glm-5-agentic-engineering)

Initialization and precision matter: a large random early advantage can send updates disproportionately to a few experts. Monitor router logit scale, selected score margins, output-weight concentration, and per-expert updates alongside dispatch counts. An evenly distributed dispatch histogram can coexist with a near-zero gate weight for some selected experts.

## 11. Router z-loss and selective precision

ST-MoE introduced the router z-loss for a softmax router with logits $a_{ti}$:

$$
\mathcal{L}_{z}
=
\frac{1}{T}
\sum_{t=1}^{T}
\left[
\log\sum_{i=1}^{E}\exp(a_{ti})
\right]^2.
$$

Compute this with a stable `logsumexp` in FP32, masking out padding. ST-MoE combined it with language-model and balance losses, using coefficient `0.001` in its selected experiment. The paper reports improved run stability without a quality loss in its tested setup. This is an empirical recipe, not a universal coefficient. [ST-MoE, §3.3](https://arxiv.org/html/2202.08906)

The bracketed term is the router's log-partition value. Squaring it discourages its magnitude from drifting. This helps keep numerically sensitive exponentiation in a manageable range. **It does not directly equalize expert loads or maximize entropy.** In fact, adding the same constant to every logit leaves softmax routing unchanged but changes this loss; this is a useful way to see that z-loss controls logit scale/gauge, not just which expert wins.

Switch showed that casting local router operations to FP32 while leaving the rest of the model in BF16 stabilized its tested runs without losing the BF16 speed benefit. ST-MoE found that selective precision alone was insufficient at its largest scale, motivating z-loss. Keep these as separate interventions and verify which one a given model report actually uses. [Switch, selective precision](https://arxiv.org/html/2101.03961), [ST-MoE](https://arxiv.org/html/2202.08906)

Do not automatically transplant the softmax z-loss onto a sigmoid router: the normalization and logit geometry differ. If adapting it, specify which raw logits are regularized, then ablate stability and model quality.

## 12. Why fine-grained experts and shared experts help

DeepSeekMoE begins with $N$ routed FFNs and $K$ activated experts per token. It splits each FFN into $m$ smaller FFNs, each with approximately $1/m$ the intermediate width, then activates $mK$ among $mN$ experts. At comparable expert parameter count and active FFN computation, a token can mix more specialized pieces:

$$
\text{coarse: } K \text{ of } N
\quad\longrightarrow\quad
\text{fine: } mK \text{ of } mN.
$$

For instance, going from 2 of 16 experts to 8 of 64 allows many more distinct combinations. This is **potential capacity**, not proof that every combination is learned or useful. More experts also mean more router scores, dispatch entries, small matrix multiplications, and communication overhead. The best granularity depends on expert batching and hardware efficiency. [DeepSeekMoE, §3.1](https://arxiv.org/html/2401.06066)

DeepSeekMoE then reserves some expert capacity for always-active **shared experts**:

$$
y_t
=
\sum_{j=1}^{N_s}F^{(s)}_j(x_t)
+
\sum_{i\in\operatorname{TopK}(x_t)}w_{ti}F^{(r)}_i(x_t).
$$

The proposed benefit is that common transformations can live in the shared path, reducing duplication in routed experts and letting them specialize more. Since the shared path executes for every token, it also consumes active FLOPs. A fair comparison holds active compute fixed by reducing routed slots or expert widths. The DeepSeekMoE paper's matched comparisons support shared expert isolation and finer segmentation, but its tested shared-to-routed ratios had relatively small differences. Shared experts are a design choice, not a stability guarantee or a necessity for every MoE. [DeepSeekMoE, §§3.2–4.4](https://arxiv.org/html/2401.06066)

Examples in these notes:

| Model | Routed layout | Shared path | Useful detail |
| :--- | :--- | :--- | :--- |
| [DeepSeek-V4.1-Flash](/atlas/ai/architectures/model-reports/deepseek-v4-1-flash) | 384 routed, top 6 | 1 shared | Text/image tokens use separate load-correction biases |
| [GLM-5](/atlas/ai/architectures/model-reports/glm-5-agentic-engineering) | 256 routed, top 8 | 1 shared | Sigmoid affinities and loss-free correction bias |
| [Kimi K3](/atlas/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence) | 896 routed, top 16 | 2 shared | Routed experts compute in a narrower latent space; quantile bias update |

Kimi's latent expert path illustrates another way to afford finer granularity: project to a narrower space for routed FFNs, then project back. Normalization and bounded gated activations help control that path's activation scale. This is a different design axis from load-balancing loss. [Kimi K3 note](/atlas/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence)

## 13. Balance the network and the modality, not just expert IDs

If experts are sharded across devices, a perfectly equal **global** expert count can still produce uneven network traffic or hot nodes. DeepSeekMoE describes both expert-level and device-level balance; DeepSeek-V3 limits each token to a bounded set of nodes. These constrain communication topology as well as mathematical expert selection. [DeepSeekMoE, §3.3](https://arxiv.org/html/2401.06066), [DeepSeek-V3, §2.1.2](https://arxiv.org/html/2412.19437)

For multimodal MoEs, aggregate balance can hide an overloaded expert for image tokens while text tokens compensate. DeepSeek-V4.1-Flash therefore keeps separate correction biases and load measurements for text and image tokens; it uses the original scores for mixing the selected experts. This lets modalities develop distinct preferences while balancing expert utilization within each modality. [DeepSeek-V4.1-Flash report](/atlas/ai/architectures/model-reports/deepseek-v4-1-flash)

Also distinguish training from inference. A domain-specific request burst can overload an expert even if the training mix was balanced. Inference may need expert replication or placement changes; training-time loss coefficients cannot guarantee runtime throughput. DeepSeek-V3 explicitly treats domain-shifted inference load as a deployment concern. [DeepSeek-V3, §4.5.3](https://arxiv.org/html/2412.19437)

## 14. A modern stability checklist

When an MoE run degrades, investigate in this order:

1. **Validity:** remove padding from routing and balance statistics, check capacity overflow and dropped tokens, verify deterministic resume of router biases and expert placement.
2. **Distribution:** inspect per-expert counts, gate mass, dead-expert rate, and per-domain/per-modality/per-sequence loads. A flat average can hide concentrated local loads.
3. **Numerics:** measure raw router logits, `logsumexp`, activation RMS, and gradient spikes. Try FP32 router math; consider z-loss for a softmax router if scale drifts.
4. **Controller:** compare bias-update speed, bias range, and routing churn with loss curves. A balance controller that oscillates can be worse than modest imbalance.
5. **Optimizer and communication:** examine effective update scales for routers versus experts, and precision of sensitive reductions. A delayed collapse can be an optimizer problem rather than a routing formula problem.
6. **Quality and throughput:** compare language-model loss, downstream quality, all-to-all time, and tail step latency at the same active compute. Perfect balance is not the objective by itself.

The [MoE Training Stability](/atlas/ai/training/optimization/moe-training-stability) note documents Laguna's delayed optimizer-induced expert collapse, precision-sensitive reductions, and padding hot spots.

## 15. Practical signals to log

For MoE training, aggregate loss is insufficient.

Track:

- token count per expert
- router probability entropy
- raw logit scale and `logsumexp` for softmax routers
- selected gate weight distribution and top-$k$ score margins
- correction-bias range and update/churn rate when using loss-free balancing
- expert capacity overflow
- token drop rate
- per-expert gradient norm
- per-expert activation RMS
- fraction of padding tokens routed to each expert
- per-domain expert usage
- per-modality and per-sequence expert usage
- routing stability across resume
- all-to-all time and imbalance

Good MoE monitoring should connect optimization and systems telemetry.

## 16. Practical heuristics

- Start with simple auxiliary balancing unless the run is large enough to justify loss-free control loops.
- Do not over-tune the auxiliary coefficient to force perfect uniformity.
- Separate padding tokens from real-token routing statistics.
- Watch both dead experts and overloaded experts.
- For top-$k$, inspect not only chosen experts but also router score margins.
- Treat MoE optimizer changes as routing changes.
- Evaluate per-domain expert usage before claiming specialization.
- Treat z-loss, load-balancing loss, and loss-free bias control as distinct mechanisms with different targets.
- Compare shared and fine-grained expert designs at matched active compute and measured serving efficiency.
- Check inference loads under domain shifts, even if the training batch was balanced.

## Related

- [MoE Training Stability](/atlas/ai/training/optimization/moe-training-stability)
- [Transformer Scaling Rules](/atlas/ai/training/scaling/transformer-scaling-rules)
- [Muon Optimizer](/atlas/ai/training/optimization/muon-optimizer)
- [Kimi K3](/atlas/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence)
- [DeepSeek-V4.1-Flash](/atlas/ai/architectures/model-reports/deepseek-v4-1-flash)
- [GLM-5](/atlas/ai/architectures/model-reports/glm-5-agentic-engineering)
- [Hardware Topology and Parallelism](/atlas/systems/parallel-computing/hardware-topology-and-parallelism)

## Sources

- Su Jianlin, [MoE环游记：1、从几何意义出发](https://kexue.fm/archives/10699)
- Su Jianlin, [MoE环游记：2、不患寡而患不均](https://kexue.fm/archives/10735)
- Su Jianlin, [MoE环游记：3、换个思路来分配](https://kexue.fm/archives/10757)
- Su Jianlin, [MoE环游记：4、难处应当多投入](https://kexue.fm/archives/10815)
- Su Jianlin, [MoE环游记：6、最优分配促均衡](https://kexue.fm/archives/11619)
- Su Jianlin, [MoE环游记：8、强制序列级均衡](https://kexue.fm/archives/11760)
- Kimi Team, [Kimi K3: Open Frontier Intelligence — Technical Report](https://github.com/MoonshotAI/Kimi-K3/blob/main/k3_tech_report.pdf)
- Fedus et al., [Switch Transformers](https://arxiv.org/html/2101.03961).
- Zoph et al., [ST-MoE: Designing Stable and Transferable Sparse Expert Models](https://arxiv.org/html/2202.08906).
- Dai et al., [DeepSeekMoE: Towards Ultimate Expert Specialization](https://arxiv.org/html/2401.06066).
- DeepSeek-AI, [DeepSeek-V3 Technical Report](https://arxiv.org/html/2412.19437).
