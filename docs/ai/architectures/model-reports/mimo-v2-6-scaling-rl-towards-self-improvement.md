---
title: "MiMo-V2.6: Scaling RL Towards Self-Improvement"
date: 2026-09-22
lastmod: 2026-09-22
tags:
  - ai/llm
  - models
  - mixture-of-experts
  - multimodal
  - reinforcement-learning
  - agents
draft: false
---

## Summary

MiMo-V2.6 is an omni-modal Mixture-of-Experts family built around a simple claim: frontier agent performance can still improve substantially by scaling reinforcement learning, provided that **rollout compute, environment diversity, grader compute, and training infrastructure scale together**.

The family contains:

- **MiMo-V2.6-Pro:** `1.02T` total parameters, `42B` active
- **MiMo-V2.6-Flash:** `310B` total parameters, `15B` active

The report's main contribution is not a new policy-gradient estimator. It is the end-to-end RL system around a GRPO-style objective:

- `1,568` prompts and `16` trajectories per prompt in every step
- roughly `25K` trajectories and `2.7-3.7B` training tokens per step
- contexts up to `1M` tokens
- code, general-computer-use, visual, and cybersecurity environments
- several agent harnesses for the same tasks
- groupwise graders that distinguish strong passing solutions from weak ones
- a multi-layer defense against reward hacking
- asynchronous collection, partial rollouts, and bounded staleness
- exact replay of inference-time MoE routes and sampling candidate sets during training

This is why the report is particularly valuable: it treats agentic RL as a coupled optimization, evaluation, security, and distributed-systems problem rather than as “run GRPO on more prompts.”

## Concepts

- **Groupwise Reward Synthesis (GRS):** builds reusable task-specific solution and behavior rubrics from several offline attempts, then uses them to refine binary test rewards.
- **Groupwise Advantage Redistribution (GAR):** compares passing trajectories online and moves positive advantage mass from lower-quality to higher-quality successes.
- **Multi-harness training:** trains the same task distribution through different agent implementations and interaction protocols to reduce scaffold overfitting.
- **Sample Mixer:** preserves a desired mixed-task training distribution despite large differences in trajectory duration and acceptance rate.
- **Rollout Routing Replay (R3):** records inference-time MoE expert choices and reuses them during training.
- **MOPD2:** combines full-trajectory on-policy distillation with prefix-conditioned, single-turn distillation from several domain teachers.

## 1. Model family

| Property | MiMo-V2.6-Pro | MiMo-V2.6-Flash |
| :--- | ---: | ---: |
| Total parameters | `1.02T` | `310B` |
| Active parameters | `42B` | `15B` |
| Decoder layers | `70` | `48` |
| Sliding-window / global layers | `60 / 10` | `39 / 9` |
| Hidden size | `6,144` | `4,096` |
| Routed experts | `384` | `256` |
| Active experts per token | `8` | `8` |
| Maximum RL context | `1M` | `1M` |

The decoder alternates groups of local Sliding Window Attention layers with Global Attention layers. The first decoder layer is global and uses a dense feed-forward block; later feed-forward blocks are sparse MoEs without shared experts. The local window is only `128` tokens.

This design bounds most attention communication and memory by a small window while retaining periodic exact global retrieval. It is especially useful during context-parallel training at `1M` tokens: local layers exchange at most one window of reachable KV state rather than information proportional to the full sequence.

### Omni-modal components

The language backbone is paired with:

- a `681M`-parameter vision encoder using `24` local and `4` global attention layers
- an audio tokenizer encoder producing residual-vector-quantized codes at `25 Hz`
- a lighter audio patch encoder producing continuous features at `6.25 Hz`

The vision encoder alternates row-major and column-major token serialization. This lets narrow local windows communicate efficiently along both image axes across successive layers.

### Native speculative decoder

MiMo uses **DFlash**, a five-layer dense sliding-window block-diffusion decoder. Given the backbone hidden state at an anchor position, it predicts a block of future tokens in one pass. Draft tokens interact bidirectionally within the block and can attend to up to `1,024` previous backbone positions.

The RL system uses a six-token draft block by default. After adaptation on early RL rollouts, FP8 DFlash gives about `10.3%` higher per-node throughput than the reported baseline on the long-context workload. An important systems lesson is that the best block size is selected by **end-to-end throughput**, not draft acceptance length alone.

## 2. Pretraining creates the exploration substrate

MiMo-V2.6-Flash is pretrained on `48T` tokens (`26T` text and `22T` omni-modal), while Pro is pretrained on `30T` (`27T` text and `3T` omni-modal). Context length grows from `32K` to `256K` during pretraining, then to `1M` in agent-centric mid-training.

The report frames this phase as preparation for RL exploration. A policy can only discover useful agent trajectories if its initial support already includes:

- broad knowledge
- multimodal perception
- long-context operation
- tool-use conventions
- recovery from intermediate failures

The hidden matrices use Muown, a Muon-derived optimizer with row-norm control; embeddings, the language-model head, and the router remain on AdamW. Quantization-aware training prepares the experts for MXFP4 rollout inference.

## 3. Scaling RL along three axes

MiMo scales three coupled resources:

$$
\text{agentic RL scale}
=
\text{rollout/training compute}
+
\text{environment breadth}
+
\text{grader compute}
$$

Scaling only the first term produces more trajectories, but not necessarily more information. If tasks are narrow or rewards treat every passing solution as equivalent, extra samples quickly become redundant.

### Training compute

Each reported training step uses:

- `1,568` prompts
- group size `G=16`
- about `25,088` trajectories
- `2.7-3.7B` training tokens
- roughly `110K-150K` tokens per sequence on average

The reported RL cost is about `$2.6M` for Pro and `$0.9M` for Flash. For Pro, rollout and training consume almost equal shares (`43.8%` and `43.5%`), while grading itself consumes `12.7%`. Grading is therefore a first-class compute workload, not a negligible post-processing step.

### Environment breadth

The task mixture spans:

| Domain | Share |
| :--- | ---: |
| Agentic and competitive coding | `68%` |
| General tool use | `12%` |
| Visual / aesthetic tasks | `13%` |
| Context following | `3%` |
| Cybersecurity | `4%` |

Code tasks are synthesized from real issues and pull requests, everyday workflows, specifications, source code, and long-horizon task expansion. General environments use deterministic local files and mocked software interfaces exposed through APIs, CLIs, GUIs, or MCP. Cyber tasks reproduce OSS-Fuzz vulnerabilities and use sanitizer evidence as a deterministic verifier.

The central rule is that the **task, environment, and verifier are one training object**. A plausible instruction with an unreliable verifier is not useful RL data.

### Harness breadth

The same task can be attempted through several lightweight mini-harnesses. They differ in system prompts, tools, context management, and interaction conventions.

Training on four coding harnesses improved the mean held-out-harness pass rate from approximately `50%` to `66%`. This suggests that scaffold diversity acts like interface augmentation:

$$
\text{task competence}
\neq
\text{competence under one agent scaffold}
$$

## 4. Groupwise grading is the most important RL contribution

Binary tests collapse all successful solutions to the same reward. With a strong policy and `16` rollouts per prompt, many groups may be all-pass, causing normalized group advantages to vanish. Worse, tests may accept brittle workarounds, overbroad patches, or reward hacks.

MiMo adds two complementary mechanisms:

```text
                         binary outcome
                               |
              +----------------+----------------+
              |                                 |
       reusable offline rubrics          online group comparison
              |                                 |
             GRS                               GAR
              |                                 |
    refine each passing reward       redistribute positive advantage
              +----------------+----------------+
                               |
                        policy update
```

### Groupwise Reward Synthesis

For high-pass-rate tasks, several offline attempts are analyzed jointly with the task and repository. A grader constructs:

- **solution rubrics** for correctness, edge cases, and codebase fit
- **behavior rubrics** for evidence gathering and verification discipline

The rubrics are reused online for individual trajectories. The final reward is:

$$
R_i
=
R_i^{\text{test}}
S_i^{\text{sol}}
S_i^{\text{beh}}
$$

A failing solution remains at zero. Passing solutions receive different rewards, so even an all-pass group can generate learning signal.

### Groupwise Advantage Redistribution

For other tasks, an online grader sees the whole rollout group: specifications, patches, repository state, and test outputs. It ranks passing solutions by suitability, precision, minimality, unintended effects, and craftsmanship. Confirmed hacks are reset to zero before group statistics are recomputed.

GAR then redistributes, rather than creates, positive advantage mass. If $\mathcal{P}$ is the passing set, $A_i$ the original group-relative advantage, and $f_i \in (0,1]$ a quality factor:

$$
\lambda
=
\frac{\sum_{j\in\mathcal{P}} A_j}
{\sum_{j\in\mathcal{P}} f_j A_j}
$$

$$
A_i'
=
\begin{cases}
\lambda f_i A_i, & i\in\mathcal{P}\\
A_i, & i\notin\mathcal{P}
\end{cases}
$$

The common factor preserves total positive advantage while moving it toward higher-quality successes. A final mean subtraction restores a zero group mean. In the reported ablation, GAR prevents the uncontrolled growth in turns and tokens seen with binary reward alone while allowing pass rate to continue improving.

See [Groupwise Agentic Grading](/atlas/ai/training/optimization/groupwise-agentic-grading) for the complete mechanism and its failure modes.

## 5. The optimization recipe

The base objective is GRPO-like, with one important aggregation choice:

$$
\mathcal{L}(\theta)
=
-\mathbb{E}
\left[
\frac{1}{G}
\sum_{i=1}^{G}
\frac{1}{|o_i|}
\sum_t
r_{i,t}M_{i,t}A_i
\log \pi_\theta(o_{i,t}\mid q,o_{i,<t})
\right]
$$

The per-sequence token mean is computed before the group mean. This **prompt-mean aggregation** prevents long trajectories from dominating the update merely because they contribute more tokens.

### Four-way adaptive clipping

Instead of one symmetric ratio interval, MiMo decouples lower and upper bounds for positive- and negative-advantage tokens. All four start with a broad `[0.2, 5.0]` configuration and adapt to policy entropy.

- entropy too low: give positive updates more room and constrain negative updates
- entropy too high: constrain positive updates and strengthen negative updates

The conceptual improvement over one adaptive upper bound is that increasing and decreasing token probability are controlled separately. Entropy becomes a feedback signal for the trust region rather than merely another bonus term.

### Local behavioral regularization

Outcome reward is sequence-level, but many agent failures are local. MiMo detects malformed tool calls, unavailable tools, garbled output, repetition, and infrastructure failures at the segment, context, or sequence level.

- On positive trajectories, flagged tokens are masked and their positive mass is moved to clean tokens.
- On negative trajectories, flagged tokens receive stronger negative advantage while clean tokens receive less blame.
- Infrastructure failures can be removed from the learning signal entirely.

This preserves the sign-specific total advantage mass while assigning credit more precisely.

## 6. Reward hacking is treated as security engineering

The defense has several layers:

1. mid-training examples teach correct environment use
2. environment cleanup removes build logs, patches, caches, bytecode, and post-base Git references
3. rollout networks are isolated
4. a dedicated hacking agent probes environments iteratively
5. offline audits inspect suspicious successful trajectories
6. the groupwise grader resets confirmed hacks to zero

The report says confirmed hacking remains below `2%` in the final run. The exact number is less important than the approach: the verifier is part of an adversarial attack surface and must evolve as the policy improves.

## 7. Infrastructure that makes the algorithm real

### Agent-centric trajectory hierarchy

Trajectories are represented as:

$$
\text{Sample}
\rightarrow
\text{Sequence}
\rightarrow
\text{Context}
\rightarrow
\text{Segment}
$$

This supports subagents, concurrent branches, context compaction, selective loss masking, and KV-cache reuse. The inference engine remains token-in/token-out; an external Agent Loop owns environment setup, interaction, reward evaluation, and cleanup.

### Control plane / data plane separation

The driver schedules only lightweight metadata. Tokens, log-probabilities, MoE routes, top-$p$ candidate sets, and images are written once to distributed storage and read only by the consumers that need them.

Without this separation, tens of thousands of long, multimodal trajectories would make driver memory the batch-size ceiling.

### Stable mixed-task collection

Across `25` profiled data sources, mean generated tokens vary by `90x` and active rollout duration by `66x`. A fixed concurrency per source would under-sample slow environments and over-sample fast ones.

The Sample Mixer combines:

- adaptive per-source rollout concurrency
- deficit-aware scheduling toward the desired batch mixture
- predictive dispatch using KV demand and expected inference concurrency
- limited sample replay after startup or recovery

This separates the **target training distribution** from the accidental distribution induced by task latency.

### Training/inference consistency

Small numerical differences can change discrete MoE routes or the candidate set used by top-$p$ sampling. Then a stored rollout probability and the probability recomputed during training no longer describe the same execution path.

MiMo addresses this with:

- MXFP4 quantize-dequantize after each parameter update
- R3 replay of inference-time expert indices
- replay of the exact top-$p$ candidate set before renormalizing training probabilities

This is a stronger notion of consistency than matching weights alone.

## 8. Router freezing and real failure modes

Leaving the MoE router trainable during RL caused severe load collapse in the first `20` steps:

- load coefficient of variation: `0.78 -> 2.0`
- peak expert load: `6x -> 16x` the mean
- cold experts: `0.5% -> 22%`

Restoring only the original router recovered balance without losing benchmark quality, isolating router drift as the cause. Freezing the router kept load statistics stable while task performance improved.

This is evidence for a broader rule: RL updates can destabilize sparse routing much faster than they improve it. Unless routing adaptation is itself a target, freezing the router may be the safer optimization subspace.

The report is also unusually candid about operational failures:

- GPU memory double-bit errors
- Kubernetes failure in the cyber cluster
- an unreachable grader
- stale length estimates after restart exhausting GPU and host KV pools
- one MoE rank receiving more than `30x` the mean micro-batch token load
- host OOM during packing as trajectories grew longer

Thirty Pro steps required `123.1` hours; Flash required `81.8` hours. At this scale, fault recovery and biased post-restart estimates are part of the training algorithm.

## 9. MOPD2 broadens beyond verifiable tasks

After mixed-task RL, specialized teachers are consolidated with Multi-Prefix Multi-Teacher On-Policy Distillation.

For domains with reliable rewards, standard on-policy distillation scores complete student rollouts. For open domains with SFT teachers or expensive verifiers, a source trajectory is split at each assistant decision point. The student generates only the next turn from each prefix, and the selected teacher supplies token-level supervision on that student continuation.

This prefix-conditioned design:

- avoids regenerating the entire preceding interaction
- exposes the teacher to student-generated local mistakes
- uses SFT demonstrations as contexts rather than fixed targets
- extends learning to game development, research, and embodied tasks where terminal reward is difficult to construct

## 10. Open resources and evidence

Xiaomi releases:

- `MiMo-V2.6-Distill-Qwen-9B`
- about `7K` environments across code, cyber, general, and visual tasks
- composable mini-harnesses
- verifiers
- an end-to-end RL framework

The `9B` checkpoint is trained on `77.4B` distilled tokens, of which `27.2B` contribute to the SFT loss. Domain-specific GRPO improves all `11` reported evaluations. For example:

- SWE-bench Verified: `61.1 -> 66.2`
- Terminal-Bench 2.1: `37.1 -> 52.8`
- MiMo Cyber Bench mini: `31.3 -> 47.0`
- MiMo Visual Coding mini: `64.0 -> 72.4`

These smaller open experiments are important because they show that parts of the recipe transfer below trillion-parameter scale. However, they do not isolate every contribution in the frontier runs.

## 11. Critical interpretation

### What the report supports well

- broad, sustained gains during one mixed-domain RL run
- benefits of multi-harness training on held-out harnesses
- router drift as a concrete source of MoE collapse
- GAR improving both pass rate and trajectory efficiency in a controlled ablation
- practical gains from distilled initialization followed by domain RL
- a detailed, reproducible infrastructure design rather than only headline benchmarks

### What remains uncertain

- Most techniques are deployed together, so their individual contribution is not fully isolated.
- Frontier-model comparisons depend on each model's harness and evaluation configuration.
- Groupwise grading adds learned-judge bias even when binary tests remain the anchor.
- The report demonstrates powerful iterative improvement, not autonomous recursive self-improvement in the strong sense.
- The economics of `25K` long trajectories plus grader compute may still be inaccessible outside large labs.

## Main takeaway

MiMo-V2.6's strongest lesson is that scaling agentic RL is not mainly about increasing optimizer steps. Useful scale comes from keeping four quantities in balance:

$$
\boxed{
\text{exploration breadth}
\times
\text{feedback resolution}
\times
\text{systems throughput}
\times
\text{training stability}
}
$$

More rollouts help only when environments remain diverse, graders distinguish meaningful quality, infrastructure preserves the intended sample mixture, and the training path matches the inference path.

## Related

- [Groupwise Agentic Grading](/atlas/ai/training/optimization/groupwise-agentic-grading)
- [Long-Horizon Agentic RL Infrastructure](/atlas/ai/training/optimization/long-horizon-agentic-rl-infrastructure)
- [Agentic Training Data and Environment Synthesis](/atlas/ai/training/data/agentic-training-data-and-environment-synthesis)
- [Group Relative Policy Optimization](/atlas/ai/training/optimization/group-relative-policy-optimization)
- [Adaptive Entropy Control in RL](/atlas/ai/training/optimization/adaptive-entropy-control-in-rl)
- [On-Policy Distillation](/atlas/ai/training/optimization/on-policy-distillation)
- [MoE Routing and Load Balancing](/atlas/ai/training/optimization/moe-routing-and-load-balancing)

## Sources

- LLM-Core Xiaomi, [MiMo-V2.6: Scaling Reinforcement Learning Towards Self-Improvement](https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL/blob/main/MiMo_V2_6_technical_report.pdf)
- XiaomiMiMo, [MiMo-V2.6-Pro-RL model repository](https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL)
