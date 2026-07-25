---
title: "Controlling Reasoning Effort in LLMs"
date: 2026-07-20
lastmod: 2026-07-25
tags:
  - ai/llm
  - reasoning
  - inference
  - optimization
draft: false
---

## Summary

Reasoning effort is a control over how much inference work a reasoning model performs for a request. Increasing it usually produces longer reasoning traces and can improve answer quality, but it also increases latency and cost, with diminishing and task-dependent returns.

The important point is that an effort label is not ordinary prompt engineering. A system message such as `Reasoning effort: high` only works reliably when post-training has taught the model what that label means. This behavior can be learned through supervised examples, effort-conditioned reinforcement learning, or a combination of both.

## Concepts

- **Reasoning effort:** a requested operating point that trades token use, latency, and cost for potential answer quality.
- **Effort conditioning:** including the desired effort level in the model input during training and inference.
- **Learned effort mode:** a behavior the model has been trained to select, such as concise, medium-effort, or extended reasoning.
- **Hard reasoning budget:** an external limit on how many tokens the reasoning trace may consume.
- **Length penalty:** a reward term that makes unnecessary generated tokens costly during post-training.
- **RLVR:** reinforcement learning with rewards that can be checked automatically, commonly using math answers, tests, or code execution.

## 1. Two independent scaling knobs

There are two distinct ways to spend more compute on a response:

1. Select a larger or more capable model.
2. Keep the model fixed and increase its reasoning effort.

The first changes the model weights being served. The second changes how much inference-time compute the same model is encouraged or allowed to use.

This creates a family of cost-quality curves rather than one universal ranking. A smaller model at high effort may sometimes reach the quality of a larger model at low effort. Which operating point is preferable depends on:

- task difficulty
- latency requirements
- token price
- reliability requirements
- the model's ability to benefit from additional reasoning

Reasoning effort is therefore a practical form of [test-time compute](/atlas/ai/inference-serving/performance/test-time-compute), but it is only one form. Other methods include parallel sampling, self-consistency, search, and external verification.

## 2. What an effort setting does at inference

An effort setting is usually delivered through one of three interfaces:

- an ordinal system instruction such as `low`, `medium`, or `high`
- a continuous value between a minimum and maximum effort
- a chat-template switch that opens, closes, or pre-fills a reasoning block

For example, a hybrid model may use:

```text
/think     -> <think>{reasoning}</think>{answer}
/no_think  -> <think></think>{answer}
```

The literal `<think>` tags do not create reasoning ability. They mark the reasoning span so that the training pipeline, inference server, or user interface can distinguish it from the final answer.

The control itself can be **soft** or **hard**:

- A soft instruction asks the model to adopt a learned mode.
- A hard control modifies the chat template or stops the reasoning span at a token limit.

This distinction matters because a model may ignore a soft instruction, while a hard cutoff is guaranteed to stop generation but may interrupt useful reasoning.

## 3. How models learn effort levels

### Effort-conditioned supervised fine-tuning

In supervised fine-tuning, each effort label is paired with a target response that demonstrates the desired behavior:

- low effort receives concise examples
- medium effort receives moderately detailed traces
- high effort receives longer traces with more checking and correction

The model learns an association between the control token or system instruction and the target response distribution.

The dataset must be balanced by tokens as well as examples. A small number of long traces can dominate the training volume and pull nominally concise modes toward verbose behavior.

### Effort-conditioned reinforcement learning

Reinforcement learning can make the cost of generation depend on the requested effort. A useful abstraction is:

$$
R(e) = R_{\text{task}} - \lambda(e)N_{\text{tokens}}
$$

where:

- $e$ is the requested effort
- $R_{\text{task}}$ rewards correctness or task completion
- $N_{\text{tokens}}$ is the number of generated tokens
- $\lambda(e)$ is the effort-dependent token cost

Low effort uses a larger $\lambda(e)$, pushing the policy toward short solutions. High effort uses a smaller token cost, allowing the model to spend more tokens when they improve the answer.

This equation is a conceptual pattern, not a universal disclosed objective. Real training recipes can use different reward shaping, context limits, format rewards, and task-specific constraints.

### Combining SFT and RL

The two approaches are complementary:

1. SFT teaches the format and establishes recognizable modes.
2. RL improves correctness and calibrates the cost-quality trade-off inside each mode.

Without mode-specific training, adding an effort label to an arbitrary model is unlikely to produce a stable or well-calibrated control.

## 4. Learned effort versus hard token budgets

A learned effort mode and a hard budget solve different problems.

| Control | What it changes | Main advantage | Main risk |
| --- | --- | --- | --- |
| Learned effort | How the model chooses to use tokens | Can adapt the reasoning style to the task | May not respect an exact cost ceiling |
| Hard budget | How long the reasoning span may continue | Enforces a predictable upper bound | Can cut off reasoning before completion |

Simply truncating a reasoning trace is brittle. The model may be in the middle of a derivation, verification step, or tool plan when the budget expires.

Budget-aware training improves this behavior. One method exposes the model to reasoning traces stopped at different points while retaining the original final answer. Another alternates between constrained and unconstrained RL phases. The goal is to teach the model both concision and the ability to benefit from additional compute when it is available.

The distinction can be summarized as:

$$
\text{learned effort} = \text{how to spend the budget}
$$

$$
\text{hard limit} = \text{how much budget is available}
$$

### Difficulty-aware length control

[Nanbeige4.2-3B](/atlas/ai/architectures/model-reports/nanbeige4-2-3b-unlocking-agentic-capabilities) provides a concrete alternative to applying one global token penalty.

For every problem $q$, collect correct responses from earlier checkpoints and set a fixed historical budget:

$$
b_q
=
\operatorname{median}
\left\{
\text{length of correct rollouts for }q
\right\}
$$

For a new response of length $L_i$, the constrained RL phase uses:

$$
r_i
=
r_i^{base}
-
\alpha p_q
\left[
\frac{L_i-b_q}
{L_{max}-b_q}
\right]_0^1
$$

where $p_q$ is the fraction of correct responses in the current rollout group.

This makes the pressure to be concise depend on two quantities:

1. how far the response exceeds the historical correct budget
2. how reliably the current policy solves the problem

Easy problems with high pass rates receive stronger length pressure. Hard problems retain more room for exploration. Responses within budget are never penalized.

Nanbeige alternates these constrained phases with free-expansion phases where the length penalty is disabled. This avoids teaching the model that shorter is universally better and preserves its ability to exploit additional test-time compute.

## 5. Representative implementation patterns

Different model families expose similar user-facing controls while using different post-training recipes.

| Model | Disclosed mechanism | General lesson |
| --- | --- | --- |
| **Qwen3** | Thinking and non-thinking examples are fused with SFT and a chat template; an inference-time thinking budget can stop the reasoning span. | Mixed-mode SFT can place concise and reasoning behavior in one checkpoint. |
| **Inkling** | A continuous effort value is included in the system message, while per-token cost changes with effort during large-scale RL. | Effort can be a continuous conditioning variable rather than a few named modes. |
| **DeepSeek V4** | Non-think, Think High, and Think Max use mode-specific post-training settings; the resulting specialists are distilled into one checkpoint. | A unified model can inherit modes first developed as separate specialists. |
| **Nemotron 3 Ultra** | Medium effort is introduced in SFT and reinforced on a subset of RLVR prompts with length-aware rewards; learned modes can be combined with hard budgets. | A learned policy and an external budget can coexist. |
| **Kimi K2.5** | Toggle alternates budgeted and unconstrained RL phases rather than permanently optimizing against one short budget. | Alternating constraints can improve token efficiency without destroying test-time scalability. |
| **Nanbeige4.2** | Each problem receives a budget from historical correct rollouts; excess-length penalties scale with current pass rate, and constrained phases alternate with free expansion. | Length pressure can increase automatically as a problem becomes easier for the policy. |

These approaches share three recurring ingredients:

1. A control signal in the prompt or chat template.
2. Training data or rewards that give the signal a consistent meaning.
3. Evaluation across multiple cost-quality operating points.

## 6. Why higher effort eventually stops paying

More reasoning tokens can provide room for decomposition, backtracking, verification, and tool use. But response length is only a proxy for useful computation.

Additional effort can fail when:

- the model does not know the required fact or operation
- the reasoning repeatedly explores the same path
- the task is already solved at low effort
- a longer trace introduces new mistakes
- the reward has taught verbosity rather than productive reasoning

As a result, the quality curve usually saturates and may be uneven. The optimal effort is task-specific, and the labels exposed by different providers are not directly comparable.

## 7. Effort selection as a serving policy

For production systems, effort should be treated as a routing decision rather than a stylistic preference.

A simple policy might use:

- low effort for classification, extraction, rewriting, and routine tool calls
- medium effort for multi-step questions with cheap verification
- high effort for ambiguous planning, difficult coding, math, or high-cost mistakes

An agent can also change effort during a trajectory. It may begin cheaply, increase effort after a failed test or low-confidence result, and reserve its largest budget for verification.

Automatic selection is attractive but difficult. A router must estimate task difficulty before seeing the answer, account for remaining time and token budgets, and avoid spending high effort on requests that cannot benefit from it. A user override remains useful for choosing between speed, cost, and maximum performance.

## Practical Heuristics

- Benchmark effort levels on the actual task distribution, not only aggregate leaderboards.
- Track quality, output tokens, end-to-end latency, and monetary cost together.
- Do not assume that equal effort labels mean equal compute across models.
- Separate learned-effort evaluation from hard-budget evaluation.
- Train on interrupted or constrained traces if the serving system can stop reasoning early.
- Route easy requests to low effort and escalate only when there is evidence that more compute may help.
- Keep an explicit override for latency-sensitive and high-stakes requests.

## Related

- [Test-Time Compute](/atlas/ai/inference-serving/performance/test-time-compute)
- [Hybrid Reasoning Models](/atlas/ai/architectures/hybrid-reasoning-models)
- [Chat Templates for LLMs](/atlas/ai/inference-serving/chat-templates-for-llms)
- [Reinforcement Learning for LLMs](/atlas/ai/training/optimization/reinforcement-learning-for-llms)
- [Reinforcement Learning with Verifiable Rewards](/atlas/ai/training/optimization/reinforcement-learning-with-verifiable-rewards)
- [LLM Inference Economics](/atlas/ai/inference-serving/performance/llm-inference-economics)
- [Group Relative Policy Optimization](/atlas/ai/training/optimization/group-relative-policy-optimization)
- [Nanbeige4.2-3B](/atlas/ai/architectures/model-reports/nanbeige4-2-3b-unlocking-agentic-capabilities)

## Sources

- [Sebastian Raschka - Controlling Reasoning Effort in LLMs](https://magazine.sebastianraschka.com/p/controlling-reasoning-effort-in-llms)
- [Qwen3 Technical Report](https://arxiv.org/abs/2505.09388)
- [Thinking Machines Lab - Inkling: Our Open-Weights Model](https://thinkingmachines.ai/news/introducing-inkling/)
- [DeepSeek V4 Technical Report](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/DeepSeek_V4.pdf)
- [NVIDIA Nemotron 3 Ultra Technical Report](https://research.nvidia.com/labs/nemotron/files/NVIDIA-Nemotron-3-Ultra-Technical-Report.pdf)
- [Kimi K2.5 Technical Report](https://arxiv.org/abs/2602.02276)
- [Nanbeige4.2-3B Technical Report](https://huggingface.co/Nanbeige/Nanbeige4.2-3B/blob/main/Nanbeige42_report.pdf)
