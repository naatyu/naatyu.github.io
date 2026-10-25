---
title: "Multi-Harness Agentic RL"
date: 2026-10-01
lastmod: 2026-10-01
tags:
  - ai/training
  - reinforcement-learning
  - agents
  - infrastructure
draft: false
---

## Summary

A harness controls how a model interacts with a task: prompts, available tools, execution, context management, and stopping. Multi-harness RL trains one policy through several such interfaces. FineEnvs demonstrates this with OpenEnv, Harbor, and TRL, leaving the agent programs unmodified. [Source: FineEnvs guide](https://huggingface.co/spaces/FineEnvs/multi-harness-rl).

The useful question is whether the model learns behavior that survives a change of interface. This connects to the harness diversity already discussed in the [MiMo-V2.6 note](/atlas/ai/architectures/model-reports/mimo-v2-6-scaling-rl-towards-self-improvement).

## 1. What changes when the harness changes?

Consider a hypothetical task: repair a CSV-processing script and verify its output.

| Component | Example |
| :--- | :--- |
| Policy | The model predicting the next response |
| Harness | The program offering file-editing tools and deciding when to request another response |
| Task | Repair the script while preserving the required output format |
| Sandbox | The isolated machine containing the script and data |
| Verifier | Tests checking the resulting behavior |

One harness might expose `edit_file(path, content)`, while another expects a patch passed to a shell command. Solving the programming problem requires knowing what to change; completing the interaction also requires expressing that change through the available interface.

This gives two separate failure questions:

1. Was the intended action wrong?
2. Was the intended action appropriate but expressed through an unsupported tool or format?

Evaluation should distinguish them. Improving tool-format validity alone can raise success rates without improving the underlying programming reasoning by the same amount.

## 2. A mathematical view of harness diversity

The following is a conceptual model, not the article's exact implementation objective. Let $q$ denote a task, $h$ a harness, and $\tau$ a trajectory:

$$
J(\theta)=
\mathbb{E}_{q\sim D,\ h\sim H}
\mathbb{E}_{\tau\sim P(\tau\mid q,h,\pi_\theta)}
[R(q,\tau)]
$$

The harness influences the trajectory distribution even when model weights and task are fixed. It changes the observations the policy receives and the actions it can express.

Training with one harness concentrates $H$ on a single interface. Training with several broadens that distribution. However, optimizing its average does not guarantee good performance on every harness, especially one absent from training.

A useful evaluation therefore has two axes:

| | Training harnesses | Held-out harnesses |
| :--- | :--- | :--- |
| Familiar tasks | Fit to the training setup | Interface transfer on familiar work |
| Held-out tasks | Task generalization | Joint task and interface generalization |

These cells answer different questions. Testing unseen tasks under familiar harnesses does not establish transfer to an unseen harness.

## 3. Training through a model-call proxy

OpenEnv's Harbor integration intercepts model requests, translates API dialects, and records the inference engine's prompt IDs, generated IDs, and behavior log-probabilities. Harbor supplies tasks, execution backends, and verifiers. Endpoints without the required token evidence can still support evaluation, but their traces are not accepted as trainable captures. [Source: OpenEnv documentation](https://huggingface.co/docs/openenv/environments/harbor).

```text
Task + selected harness + sandbox
              |
              v
      Harness interaction loop
          |              ^
     model request       | response
          v              |
       Capture proxy <----+----> Inference engine
          |
          +----> Token trace ----> RL trainer
                                    ^
Sandbox outcome ----> Verifier ------+
```

The integration boundary matters: the trainer can observe the model calls without reimplementing every harness's interaction loop.

## 4. Why text logs are insufficient

Decoding generated tokens and subsequently re-encoding the text need not recover the original token sequence. Reformatting tool calls can also turn logged text into something the model never sampled. Token-in/token-out training preserves sampled IDs and excludes prompt and tool-result tokens from the policy loss. [Source: Hugging Face's token-in/token-out explanation](https://huggingface.co/blog/huggingface/tito).

For asynchronous training, distinguish the current policy from the behavior policy that generated the action:

$$
r_t=
\exp\left(
\log\pi_\theta(a_t\mid s_t)
-\log\mu_{\mathrm{behavior}}(a_t\mid s_t)
\right)
$$

Recomputing both terms with today's weights removes the intended correction. TRL's asynchronous GRPO separates generation and optimization, so policy version and rollout staleness become part of the training data contract. [Source: TRL documentation](https://huggingface.co/docs/trl/async_grpo_trainer).

Sampling settings matter too. OpenEnv checks whether returned log-probabilities describe the processed sampling distribution, including temperature, rather than raw logits. Its capture graph links calls through token-prefix matches; context rewrites can create separate branches. [Source: OpenEnv documentation](https://huggingface.co/docs/openenv/environments/harbor).

## 5. What the FineEnvs experiment establishes

The guide reports LFM2.5-2.6B trained with asynchronous GRPO across OpenCode, Claude Code, Codex, and Mini-SWE-Agent. Each eight-rollout group uses one harness. At step 1,000, average pass@1 rises from 42.2% to 54.2%; OpenCode-only training reaches 52.3%. The authors consider the 1.9-point difference within noise.

Multi-harness training reduces tool calls by about 31% on tasks both it and the base model solve. Correct answers can earn a small efficiency bonus; incorrect answers cannot. There is no LFM ablation isolating that bonus. Runs use one seed, unequal data exposure, and different compute. All four evaluation harnesses are included in multi-harness training. These results support improvement over the base, not a universal ranking of training mixtures. [Source: FineEnvs experiment](https://fineenvs-multi-harness-rl.hf.space/#training-small-models-across-harnesses).

## 6. Design implications

The following are practical deductions for designing a follow-up experiment.

### Match comparison conditions within a group

If rollout A receives powerful tools and rollout B receives restricted tools, their reward difference mixes action quality with interface difficulty. Comparing attempts under the same task and harness makes a group-relative advantage easier to interpret. Diversity can then occur between groups.

### Track the effective mixture

Equal numbers of episodes do not imply equal contributions to the gradient. A harness that produces longer histories or more trainable branches may contribute more tokens. Track mixture weights in episodes, generated tokens, training rows, and actual loss weighting.

### Separate efficiency from failure

An illustrative reward is:

$$
R(\tau)=C(\tau)\left[1+\beta e(\tau)\right],
\qquad 0\leq e(\tau)\leq1
$$

Here $C$ indicates correctness, and $e$ scores efficiency. This is a generic construction, not the guide's precise bonus formula. Multiplication prevents a fast failure from earning the efficiency bonus. If every rollout succeeds, differing efficiencies can still provide group-relative signal, connecting to [Groupwise Agentic Grading](/atlas/ai/training/optimization/groupwise-agentic-grading).

### Measure robustness explicitly

Compare the mean, each harness separately, and the weakest harness. Add genuinely held-out harnesses, match generation budgets, and repeat seeds. For tool-use savings, state whether the comparison includes all tasks or only common successes: fewer calls caused by early failure would otherwise look like progress.

## Related

- [Agentic Training Data and Environment Synthesis](/atlas/ai/training/data/agentic-training-data-and-environment-synthesis)
- [Long-Horizon Agentic RL Infrastructure](/atlas/ai/training/optimization/long-horizon-agentic-rl-infrastructure)
- [Group Relative Policy Optimization](/atlas/ai/training/optimization/group-relative-policy-optimization)
- [MiMo-V2.6](/atlas/ai/architectures/model-reports/mimo-v2-6-scaling-rl-towards-self-improvement)

## Sources

- FineEnvs, [The ultimate guide to multi-harness RL](https://huggingface.co/spaces/FineEnvs/multi-harness-rl), published October 1, 2026.
- Hugging Face, [Harbor Environment documentation](https://huggingface.co/docs/openenv/environments/harbor).
- Hugging Face, [Agentic RL: Token-In, Token-Out Done Right](https://huggingface.co/blog/huggingface/tito).
- Hugging Face TRL, [Asynchronous GRPO](https://huggingface.co/docs/trl/async_grpo_trainer).
