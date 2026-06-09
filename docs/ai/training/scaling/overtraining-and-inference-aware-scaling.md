---
title: "Overtraining and Inference-Aware Scaling"
date: 2026-06-09
lastmod: 2026-06-09
tags:
  - ai/training
  - scaling
  - llm
draft: false
---

## Summary

The current trend in frontier LLM training is to **overtrain** models relative to classic Chinchilla-style compute-optimal scaling. This does **not** mean scaling laws are broken. It means the field is optimizing a different objective: not just lowest pretraining loss for a fixed training compute budget, but better **lifecycle efficiency** across training, inference, and increasingly test-time compute.

The key idea is:

- **compute-optimal scaling** asks how to minimize loss for fixed training FLOPs
- **overtraining** accepts worse training-FLOP efficiency in exchange for a smaller or lower-active-footprint model that is cheaper to deploy and often easier to productize

## Concepts

- **Compute-optimal training:** the parameter/token allocation that minimizes loss under a fixed training compute budget.
- **Overtraining:** training on substantially more tokens than the compute-optimal rule would suggest for the chosen model size or active parameter count.
- **TPP (tokens per parameter):** the ratio of training tokens to model parameters, used as a shorthand for how long a model was trained relative to its size.
- **Inference-aware scaling:** scaling that accounts for the fact that training is a one-time cost but inference is a recurring cost.
- **Lifecycle objective:** an optimization target that includes both training and deployment economics.

## 1. What overtraining means

Start from the usual dense-transformer approximation:

$$
C \approx 6ND
$$

where:

- $C$ is training compute
- $N$ is parameter count
- $D$ is training tokens

Under Chinchilla-like compute-optimal scaling, for a fixed $C$ there is a preferred balance between $N$ and $D$ that minimizes pretraining loss.

Overtraining means:

- you keep $N$ relatively small
- you increase $D$ far beyond that compute-optimal balance

Usually this is summarized with:

$$
\mathrm{TPP} = \frac{D}{N}
$$

where:

- $D$ is the total number of pretraining tokens
- $N$ is the dense-model parameter count

or for MoEs more usefully:

$$
\mathrm{TPP}_{active} = \frac{D}{N_{active}}
$$

where $N_{active}$ is the number of parameters actually used on each forward pass.

For a classic dense Chinchilla reference point, the rule of thumb is:

$$
D \approx 20N
$$

so the reference training density is:

$$
\mathrm{TPP}_{\text{Chinchilla}} \approx 20
$$

That `20 TPP` number is the baseline this note is comparing against when it says modern models are overtrained.

The crucial point is:

> compute-optimal does **not** mean extra tokens stop helping.

It only means that after a certain point, extra tokens are no longer the best way to reduce loss **per unit of training compute**.

So overtraining is:

$$
\text{still improving, but with diminishing returns relative to the compute-optimal allocation}
$$

## 2. Why the field is trending this way

The old objective was roughly:

$$
\min L(N, D) \quad \text{subject to fixed } C_{train}
$$

The newer practical objective is closer to:

$$
\min \big(\text{quality loss} + \text{deployment cost} + \text{latency cost}\big)
$$

or more informally:

$$
\text{maximize quality per lifecycle dollar}
$$

Why this matters:

- training cost is paid once
- inference cost is paid every day

So if a model will serve a huge number of inference tokens, it can be rational to:

- spend more one-time training compute
- to get a smaller model
- that is much cheaper to serve forever

This is the basic economic reason behind the overtraining trend.

## 3. Scaling laws are still correct

Overtraining is not a rejection of scaling laws.

It is a change in objective.

Chinchilla says:

> if the only thing you care about is minimizing loss for a fixed training compute budget, there is a best balance between parameters and tokens.

Modern deployment-aware scaling says:

> if inference cost matters a lot, you may rationally move away from that balance and train a smaller model longer.

That is why it is better to think in terms of:

- **training-compute optimality**
- **deployment optimality**

rather than imagining one universal optimum.

## 4. Strong evidence this is now a real trend

This is no longer just a theoretical idea. Multiple recent model families and analyses point in the same direction.

### Llama 3

Meta explicitly said that:

- the Chinchilla-optimal amount for an `8B` model would be roughly `200B` tokens
- their `8B` and `70B` models continued improving log-linearly up to `15T` tokens

For the `8B` model, that is roughly:

$$
\frac{15T}{8B} \approx 1875 \text{ TPP}
$$

which is an extreme example of overtraining relative to the dense Chinchilla reference of roughly `20 TPP`.

More importantly, Meta also states the reason directly:

- larger models can match the performance with less training compute
- but smaller models are generally preferred because they are much more efficient during inference

That is almost the clearest possible statement of inference-aware overtraining.

### DeepSeek-V3

DeepSeek-V3 reports:

- `14.8T` pretraining tokens
- `37B` active parameters

So the active-parameter training density is roughly:

$$
\frac{14.8T}{37B} \approx 400 \text{ TPP}_{active}
$$

This is far above the classic dense Chinchilla reference of about `20 TPP`, even allowing for the fact that active-parameter accounting in MoEs is only an approximation, and fits the pattern:

- small active footprint
- heavier data training
- cheaper inference than an equivalently capable dense model

### GLM-4.5

GLM-4.5 reports:

- `23T` tokens
- `32B` activated parameters

So:

$$
\frac{23T}{32B} \approx 719 \text{ TPP}_{active}
$$

This is another strong modern example of intentional heavy-data training in an MoE with moderate active size, again far above the old dense `20 TPP` reference.

### MAI-Thinking-1

MAI is especially useful because it separates research and production regimes explicitly:

- many architecture ablations near `100-200 TPP`
- production run around `500-1000 TPP`

Even the lower `100-200 TPP` ablation regime is already above the classic dense Chinchilla reference of about `20 TPP`, and the production regime is far beyond that. So MAI is direct evidence that modern teams may still use relatively lighter regimes for fair research comparison, while intentionally overtraining much harder in production.

### Qwen3

Qwen3 reports:

- `36T` total pretraining tokens
- a three-stage pipeline with a long reasoning stage and long-context stage

Because Qwen3 is a family with multiple sizes, one single TPP number is not the cleanest way to summarize it. The safer takeaway is:

- the token budget is extremely large
- the family is clearly part of the broader move toward heavier data usage

### SmolLM3 and the Smol Training Playbook

The Smol Training Playbook is useful because it treats this trend as normal engineering practice rather than a theoretical novelty.

Its underlying worldview is:

- scaling laws are priors
- smaller strong models are often the real target
- deployment constraints matter as much as pretraining elegance

### Epoch AI trend analysis

Epoch AI’s 2025 analysis provides the broad trend-level confirmation:

- tokens per active parameter in open-weight models have been rising quickly since 2022
- they estimate recent open models have been trained at ratios around `20x` the Chinchilla rule

This is valuable because it shows overtraining is not one lab’s eccentricity. It is an ecosystem-wide direction.

If the Chinchilla-style dense reference is roughly `20 TPP`, then `20x` that rule means a rough order of magnitude of:

$$
20 \times 20 \approx 400 \text{ TPP}
$$

which lines up with several of the modern examples above.

## 5. What overtraining buys you

Overtraining is attractive because it can buy:

- a smaller dense model for similar quality
- a smaller active MoE for similar quality
- lower inference latency
- lower memory use
- lower serving cost
- a more practical model for open-weight release and local deployment

This is especially attractive when:

- the target model is small or medium-sized
- the product will serve many tokens
- inference hardware is the real bottleneck
- on-device or near-device deployment matters

## 6. Why extra tokens still help after the compute-optimal point

This is the most common confusion.

People often hear “compute-optimal” and infer:

> after that point, more training should stop improving the model

That is false.

Usually, after the compute-optimal point:

- loss still decreases
- downstream capabilities can still improve
- robustness can still improve

What changes is the **marginal efficiency** of those gains.

So the tradeoff is:

- before the compute-optimal point, extra tokens help a lot
- near the compute-optimal point, parameter and token scarcity are balanced
- after the compute-optimal point, extra tokens still help, but less efficiently than increasing capacity would have

That is why overtraining is about **diminishing returns**, not **zero returns**.

## 7. Caveats and counterforces

Overtraining is not universally best.

Important caveats:

- **diminishing returns are real**
  - eventually additional tokens buy only small gains
- **data quality still matters**
  - low-quality extra tokens do not rescue a bad recipe
- **MoE accounting matters**
  - total parameters and active parameters tell different stories
- **stage accounting matters**
  - continued pretraining, reasoning stages, and long-context stages complicate one-number TPP summaries
- **adaptation cost may worsen**
  - some recent work suggests heavily overtrained models can become harder to fine-tune

So the trend is not “always train longer.” It is:

> train longer when the deployment objective justifies it.

## 8. Interaction with newer trends

Overtraining fits naturally with several other modern directions:

### MoEs

MoEs make it easier to keep inference-active footprint small while growing total capacity. That makes heavy training on active parameters more attractive.

### Long-context models

Long-context systems are expensive at inference. If a smaller model can be trained longer and still reach the needed quality, the lifecycle economics become favorable.

### Test-time scaling

As reasoning-time compute becomes more important, the objective is no longer just “pretrain the best base model.” It is:

$$
\text{choose the best base model for a whole train + infer + think pipeline}
$$

This is one reason recent papers talk about train-to-test or test-time-aware scaling.

## 9. Practical takeaway

If you care only about:

- lowest loss under fixed training FLOPs

then staying near compute-optimal scaling still makes sense.

If you care about:

- serving cost
- latency
- local deployment
- quality per active parameter
- lifecycle cost

then overtraining may be the better choice.

So the correct workflow is:

1. choose the objective
2. choose the regime
3. use scaling laws inside that objective

not:

1. assume Chinchilla is always the target
2. call everything else a violation

## Related

- [Scaling Laws](/atlas/ai/training/scaling/scaling-laws)
- [Scaling Ladders and Efficiency Gain](/atlas/ai/training/scaling/scaling-ladders-and-efficiency-gain)
- [Hyperparameter Scaling Laws for LLM Training](/atlas/ai/training/scaling/hyperparameter-scaling-laws-for-llm-training)
- [The Smol Training Playbook](/atlas/ai/training/smol-training-playbook)
- [MAI-Thinking-1: Building a Hill-Climbing Machine](/atlas/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine)
- [The Llama 3 Herd of Models](/atlas/ai/architectures/model-reports/the-llama-3-herd-of-models)

## Sources

- Hoffmann et al., *Training Compute-Optimal Large Language Models* (Chinchilla)
- Sardana et al., *Beyond Chinchilla-Optimal: Accounting for Inference in Language Model Scaling Laws*
- Hegde et al., *Language models scale reliably with over-training and on downstream tasks*
- *Test-Time Scaling Makes Overtraining Compute-Optimal*
- Meta, *Introducing Llama 3*
- DeepSeek, *DeepSeek-V3 Technical Report*
- Qwen Team, *Qwen3 Technical Report*
- GLM Team, *GLM-4.5: Agentic, Reasoning, and Coding (ARC) Foundation Models*
- Hugging Face, *The Smol Training Playbook*
- Microsoft, *MAI-Thinking-1: Building a Hill-Climbing Machine*
- Epoch AI, *Training open-weight models is becoming more data intensive*
