---
title: "Preference Optimization for LLMs"
date: 2026-06-08
lastmod: 2026-06-08
tags:
  - ai/training
  - llm
  - post-training
draft: false
---

## Summary

Preference optimization is the post-training stage where a model learns that one response is better than another without requiring a full reinforcement-learning loop. In practice it is often the best middle ground between simple SFT and expensive RL: more behavior-shaping power than supervised imitation, but much easier to stabilize and scale than on-policy RL.

## Concepts

- **Preference pair:** a prompt with a chosen and rejected response.
- **Reference model:** a frozen baseline that anchors the optimization.
- **$\beta$:** the parameter controlling how strongly the model is allowed to move away from the reference.
- **Offline preference optimization:** training on a fixed dataset of preference pairs.
- **On-policy preference optimization:** refreshing preference data as the model evolves.

## 1. Why preference optimization exists

SFT teaches the model to imitate demonstrations.

Preference optimization instead teaches:

$$
\text{response A} \succ \text{response B}
$$

for the same prompt.

This is useful when:

- demonstrations are noisy or diverse
- you care more about relative quality than exact imitation
- you want to improve style, alignment, or reasoning quality beyond the initial SFT baseline

## 2. Why it is often the sweet spot

Compared with RL, preference optimization is:

- cheaper
- easier to debug
- more stable
- easier to run on modest compute

Compared with plain SFT, it gives more direct control over:

- helpfulness
- style
- policy refinement
- reasoning behavior

So a common practical sequence is:

1. train a strong SFT checkpoint
2. run preference optimization
3. only then consider RL if static preference data is no longer enough

## 3. DPO is the default baseline

`DPO` is often the first algorithm to try because it is simple and usually strong enough to establish whether preference learning helps on your setup.

The high-level idea is:

- increase the likelihood of chosen responses
- decrease the likelihood of rejected responses
- keep the result anchored to a reference model

The exact formula matters less than the workflow lesson:

> start with DPO, then only add algorithmic complexity if the data justifies it.

## 4. Better-than-DPO variants are often worth trying

The Smol Training Playbook highlights a good pragmatic point: once DPO is working, alternatives can be cheap to test and sometimes materially better.

Useful families include:

- `APO`
- `ORPO`
- `KTO`

The deeper lesson is not that one acronym always wins. It is that preference objectives are easy enough to swap that you should treat them like ablation candidates, not ideological commitments.

## 5. Learning rate usually needs to drop sharply from SFT

A practical rule from the playbook is:

- preference-optimization learning rates often work best at roughly `5x` to `20x` lower than the SFT learning rate

This makes sense because the model is no longer learning from broad supervised signal. It is being nudged relative to a good existing checkpoint, so over-aggressive updates can erase useful behavior quickly.

## 6. Tune $\beta$, but do not worship one value

The parameter $\beta$ controls how tightly the policy stays near the reference model.

At a high level:

- lower $\beta$ means stronger anchoring
- higher $\beta$ means more willingness to fit the preference data

The useful practical rule is to treat values like:

$$
\beta \in [0.01, 0.5]
$$

as a search region rather than assuming a universal default.

## 7. Small datasets can already work

One of the more useful operational observations is that preference optimization can improve models with surprisingly modest dataset sizes.

That matters because it makes iteration cheaper:

- you can test ideas with smaller preference sets
- you do not need to wait for a huge labeling pipeline before learning something useful

## 8. Watch for fast overfitting

Preference objectives often overfit quickly, sometimes after roughly one epoch.

So the goal is not:

$$
\text{keep training until the loss looks impressive}
$$

It is:

$$
\text{stop while downstream behavior is still improving}
$$

This is why iterative partitioning or short runs over shuffled slices can be better than repeatedly hammering the whole preference set.

## 9. Preference optimization can improve reasoning too

The playbook makes an important point: preference optimization is not only for “alignment” in the narrow assistant-style sense.

If the preference pairs reflect stronger reasoning behavior, then offline preference optimization can improve reasoning quality substantially, sometimes enough that jumping immediately to RL is unnecessary.

## 10. Offline vs on-policy

Offline preference optimization uses a fixed dataset.

On-policy variants refresh the preference data as the model changes. This reduces distribution drift and can move some of the benefits of RL into a lighter-weight training loop.

A useful mental model is:

- offline PO is simpler and cheaper
- on-policy PO is more adaptive
- RL is more flexible, but harder to stabilize

## Practical Heuristics

- Start with DPO on top of a good SFT checkpoint.
- Use a learning rate much smaller than the SFT learning rate.
- Tune $\beta$ over a range, not a single sacred value.
- Expect fast overfitting and monitor behavior early.
- Escalate to RL only when fixed preference data is no longer enough.

## Related

- [Supervised Fine-Tuning for LLMs](/atlas/ai/training/optimization/supervised-fine-tuning-for-llms)
- [Group Relative Policy Optimization](/atlas/ai/training/optimization/group-relative-policy-optimization)
- [Hybrid Reasoning Models](/atlas/ai/architectures/hybrid-reasoning-models)
- [The Smol Training Playbook](/atlas/ai/training/smol-training-playbook)
- [The Smol Training Playbook](https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook)
