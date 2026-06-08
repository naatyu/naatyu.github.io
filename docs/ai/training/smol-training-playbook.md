---
title: "The Smol Training Playbook"
date: 2026-06-08
lastmod: 2026-06-08
tags:
  - ai/training
  - llm-training
  - post-training
  - systems
draft: false
---

## Summary

The Smol Training Playbook is valuable because it captures LLM development as an end-to-end program, not just a pretraining recipe. Its durable lessons are about **decision-making under finite compute**: use a training compass, build strong ablation loops, treat data mixture and chat formatting as first-class design variables, prefer operationally extensible schedules, and expect real large-scale runs to fail in ways that small clean experiments do not reveal.

This note extracts the playbook's most reusable ideas across **pretraining, post-training, long-context extension, and infrastructure**. It is intentionally a synthesis note, not a benchmark recap.

## Concepts

- **Training compass:** the `why -> what -> how` framing for deciding whether to train and what to optimize for.
- **Baby baseline:** a deliberately simple first training run whose purpose is to validate formatting, stability, and obvious capability gaps.
- **Annealing ablation:** a short late-stage experiment that injects a candidate dataset into an existing mixture to estimate whether it helps as training matures.
- **Hybrid reasoning model:** a model trained to support both concise and extended-reasoning modes.
- **Execution risk:** the difference between a recipe that looks strong on paper and one that survives a month-long run on a real cluster.

## 1. The playbook's worldview

The playbook is built around one idea:

> training quality comes from the whole process, not from a single clever trick.

That process spans:

- deciding whether training is even justified
- choosing a target capability profile
- building proxy experiments
- selecting mixtures and schedules
- surviving the long run
- turning the base model into an assistant

The strongest high-level lesson is that teams often waste time on the wrong optimization problem. The first question is not:

$$
\text{How do we train the model?}
$$

It is:

$$
\text{Should we train a new model at all?}
$$

That framing is unusually valuable because many bad projects fail before the optimizer matters.

## 2. Pretraining is experimental science, not armchair design

The playbook is explicit that LLM training is empirical. Many ideas that sound obviously good do not survive measurement:

- high-status data like arXiv can hurt smaller models
- promising proxy wins can disappear at scale
- architectural choices that look elegant can lose on systems cost

So the basic method is:

1. define the target capability mix
2. build a fast and reasonably faithful proxy setup
3. run ablations that are cheap enough to repeat
4. trust measured signal over aesthetic preference

This is why the guide emphasizes **speed** and **reliability** in ablations rather than theoretical neatness.

## 3. Architecture is a product decision first

SmolLM3's recipe is not presented as universally optimal. It is tied to the deployment target:

- small enough for edge and on-device scenarios
- multilingual enough to matter outside English
- capable enough in code, math, and long-context usage

That led them to a dense `3B` Llama-style model rather than a larger MoE system.

Several architecture lessons are reusable:

- `GQA` is often the practical middle ground between `MHA` quality and `MQA` inference efficiency
- `NoPE` or hybrid `RoPE/NoPE` layering can make long-context extension easier without obviously hurting short-context quality
- intra-document masking matters more as context length grows, even if it looks neutral on short-context pretraining
- the right architecture is partly determined by the serving and deployment budget, not just by pretraining loss

The deeper lesson is that architecture should be chosen with:

- final deployment constraints
- expected context length
- post-training plans
- and implementation support

all in view at once.

## 4. Hyperparameters should be extrapolated, not guessed

The optimizer section is less about novelty than about discipline.

The playbook's stance is:

- `AdamW` remains the default because it is understood and stable
- new optimizers may win, but fair comparisons are expensive
- schedules that are easy to extend are worth a lot operationally

This is why the guide prefers `WSD`-style schedules over plain cosine when the performance is similar. WSD makes it easier to:

- extend a run
- run scaling-law style comparisons
- decay later without committing to a fixed total horizon too early

The playbook also treats scaling laws correctly: as **priors for search**, not replacements for search. Learning rate and batch size are both treated as functions of total training scale, not as constants copied from another paper.

## 5. Data curation is really mixture design

One of the strongest sections in the playbook is the data chapter.

The important reframing is:

> good data curation is not finding the single best dataset. It is designing a mixture that matches the target capability profile and training horizon.

The SmolLM3 recipe makes several durable points:

- English web data is the foundation, but the exact mix matters
- multilinguality is a budget tradeoff against English and other domains
- code and math help, but too much code early can hurt general benchmarks
- small high-quality datasets should often be staged later instead of overused early

This turns data design into a constrained optimization problem:

$$
\max \text{capability mix under fixed compute and finite unique-token supply}
$$

Two practical lessons stand out.

### Token balance matters more than example balance

In post-training mixtures, long reasoning traces can dominate token volume even if they are a small fraction of examples. So mixture accounting should be done in tokens, not only in examples.

### Staging is often better than one static mixture

SmolLM3 uses a staged curriculum:

- broad base training first
- higher-quality math/code later
- reasoning and Q&A data late

This acknowledges that the best mixture at token `0` is not always the best mixture near the end of training.

## 6. Annealing ablations are a useful late-stage tool

The playbook adds a practical pattern that deserves its own mental slot: **annealing ablations**.

Instead of retraining a full model from scratch for every candidate late-stage dataset, you can:

1. take a late checkpoint
2. keep part of the existing baseline mixture
3. heavily inject a candidate dataset
4. train a short continuation
5. compare the resulting shift

This is useful because the question is no longer:

$$
\text{Is dataset X good in general?}
$$

but:

$$
\text{Does dataset X help at this point in the curriculum?}
$$

That is a much more operationally relevant question.

## 7. The full run exposes new failure modes

The training-marathon chapter is excellent because it shows what ablations miss.

SmolLM3 hit several real-scale issues:

- storage behavior that was invisible in smaller tests
- throughput collapses tied to data placement
- a subtle tensor-parallel seeding bug that forced a restart after roughly `1T` tokens

The lesson is blunt:

> passing ablations does not mean the production run is healthy.

Three operational principles follow.

### Monitor downstream evals early

Loss alone may not reveal that the run is off-distribution or partially broken.

### Throughput is a first-class health metric

If tokens/sec deviates materially, treat it like an incident.

### Fix-on-the-fly vs restart is a capability decision

Some issues are recoverable in place. Others corrupt the training trajectory enough that restarting is rational.

The playbook's restart-after-`1T` example is useful because it shows that sunk compute is not a reason to continue a compromised run.

## 8. Long-context extension should be staged and tested

SmolLM3 reinforces a pattern that also appeared in the MAI report:

- pretrain mostly at short context
- extend later
- adjust positional treatment during the extension

Their concrete lessons are:

- progressive extension (`4k -> 32k -> 64k`) worked better than training very long from the start
- restarting a fresh schedule for the extension stages worked better than simply attaching long-context training to the very end of the original decay
- upsampling dedicated long-document data did **not** outperform the baseline stage-3 mixture in their setup
- a `64k` model extrapolated to `128k` better than a `32k` model did under `YaRN`

This is a useful caution against overfitting your intuition about long-context data. If the base mixture already contains enough long documents, special long-context mixtures may not be the bottleneck.

## 9. Post-training starts with a stable SFT baseline

The post-training half of the playbook is clear on one point:

> most pipelines should start with supervised fine-tuning.

Not because RL is unimportant, but because SFT is:

- cheap
- stable
- good at establishing the basic assistant prior
- and a much better launch point for preference optimization or RL

The playbook's post-training methodology is especially useful on three fronts.

### A. Chat templates are part of the model recipe

Template design controls:

- system-role behavior
- tool-use formatting
- reasoning-mode control
- compatibility with inference engines

A small formatting decision can silently damage behavior. This is why the guide treats chat templates as an engineering artifact worth explicit iteration.

### B. Baby baselines should validate behavior, not just metrics

Their first SFT runs are meant to answer questions like:

- does the template actually induce the intended mode switch?
- are system prompts preserved?
- do multi-turn reasoning traces behave correctly?

This is where **vibe testing** becomes important. It catches problems that metrics often miss.

### C. Preference optimization is often the sweet spot

The playbook presents `DPO` as the default baseline and shows that stronger objectives like `APO` can improve reasoning substantially without jumping straight to RL.

This is a practical sequence:

1. get a solid SFT checkpoint
2. run offline preference optimization
3. only then consider on-policy methods if the task justifies the extra complexity

## 10. Hybrid reasoning models are operationally awkward

SmolLM3's hybrid reasoning setup adds a valuable lesson that does not appear in older assistant recipes:

- `/think` and `/no_think` are not just prompt variants
- they induce very different response-length and optimization regimes

This complicates:

- data design
- chat templating
- SFT formatting
- preference optimization
- RL reward shaping

In particular, RLVR on the concise mode can accidentally teach the model to reason at great length unless the reward explicitly penalizes overlong outputs.

That is an important update to the usual “RL improves reasoning” story:

> RL does not just improve correctness. It also changes the model's length policy.

## 11. Infrastructure lessons are part of the playbook, not a footnote

The infrastructure chapter is consistent with the rest of the guide: practical, not mystical.

Its durable points are:

- stress-test hardware before the main run
- monitor thermal throttling continuously
- automate checkpointing and resume
- benchmark actual distributed layouts instead of trusting generic rules
- estimate GPU count from realistic throughput and expected `MFU`, not peak specs

The most reusable systems lesson is that cluster topology and storage behavior are part of the training recipe. They are not “after the model work.”

## Practical Takeaways

- Use a training compass before committing to pretraining.
- Treat ablations as a filtering system, not as proof of final optimality.
- Design data as a staged weighted mixture, not a static corpus.
- Prefer schedules and architectures that preserve execution flexibility.
- Expect the full run to surface failures that were invisible in proxies.
- Start post-training with SFT, then layer preference optimization, then RL if justified.
- Treat chat templates and vibe testing as first-class parts of the model recipe.
- Separate reasoning quality from response-length policy when training hybrid reasoners.

## Related

- [Smol Training Playbook Foundations](/atlas/ai/training/smol-training-playbook-foundations)
- [LLM Ablation Strategy](/atlas/ai/evaluation-experimentation/llm-ablation-strategy)
- [Data Mixture Optimization](/atlas/ai/training/data/data-mixture-optimization)
- [Progressive Context Extension](/atlas/ai/training/scaling/progressive-context-extension)
- [Supervised Fine-Tuning for LLMs](/atlas/ai/training/optimization/supervised-fine-tuning-for-llms)
- [Preference Optimization for LLMs](/atlas/ai/training/optimization/preference-optimization-for-llms)
- [Chat Templates for LLMs](/atlas/ai/inference-serving/chat-templates-for-llms)
- [Hybrid Reasoning Models](/atlas/ai/architectures/hybrid-reasoning-models)
- [Group Relative Policy Optimization](/atlas/ai/training/optimization/group-relative-policy-optimization)
- [The Smol Training Playbook](https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook)
