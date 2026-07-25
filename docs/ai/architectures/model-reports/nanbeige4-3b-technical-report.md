---
title: "Nanbeige4-3B Technical Report"
date: 2026-07-25
lastmod: 2026-07-25
tags:
  - ai/llm
  - models
  - small-language-models
  - pretraining
  - reinforcement-learning
draft: false
---

## Summary

Nanbeige4-3B is a family consisting of a `3B` base model and the reasoning-oriented Nanbeige4-3B-Thinking. The report's main contribution is not a new transformer architecture. It is an unusually aggressive training pipeline for extracting capability from a small dense model:

- pretrain on `23T` tokens selected with learned quality labels and similarity retrieval
- coordinate progressively better data mixtures with a Fine-Grained Warmup-Stable-Decay schedule
- scale cold-start reasoning SFT to roughly `30M` examples
- refine generated solutions before reconstructing their chain of thought
- combine sequence-level preferences with token-level teacher supervision
- apply separate RL stages for STEM, coding, and human-preference alignment

The broader lesson is that parameter count alone says little about the capability of a small model. Data quantity, data ordering, distillation, and the construction of learnable RL problems can compensate for a large part of the capacity gap.

This report describes the original Nanbeige4-3B family. It should not be confused with **Nanbeige4.2-3B**, a later model that introduces a Looped Transformer architecture.

## Concepts

- **FG-WSD:** Fine-Grained Warmup-Stable-Decay, which divides the constant-learning-rate portion of WSD into stages with progressively higher-quality data.
- **Dual-Level Preference Distillation (DPD):** a joint objective combining sequence-level preference learning with token-level teacher supervision on positive and negative responses.
- **Solution refinement:** repeatedly generating, evaluating, critiquing, and revising an answer before using it as supervision.
- **CoT reconstruction:** generating a new reasoning trace that is consistent with an already refined final solution.
- **On-policy data filtering:** periodically measuring difficulty using the current model and retaining examples that still produce informative variation.

## 1. Model family

The report introduces two checkpoints:

- **Nanbeige4-3B-Base:** the pretrained base model
- **Nanbeige4-3B-Thinking-2511:** the post-trained reasoning model

The released base checkpoint uses a conventional Llama-style dense transformer. The paper concentrates on how the model is trained rather than proposing a new backbone.

The base model is pretrained on `23T` tokens. Its context length is extended to `64K` during the final pretraining stage, and the post-training pipeline also uses contexts up to `64K`.

The implied training density is:

$$
\mathrm{TPP}
=
\frac{23T}{3B}
\approx
7{,}667
$$

tokens per parameter. This is extremely far beyond the classic compute-optimal regime. It reflects an inference-aware objective: spend much more on one-time training to obtain a small model that is cheaper to deploy repeatedly.

## 2. Pretraining data

The corpus includes:

- web pages
- scholarly articles
- books
- source code
- synthetic question-answer pairs
- synthetic textbooks and lecture notes
- long chain-of-thought examples

Synthetic data accounts for `15%` of the final token mass.

### Multi-dimensional quality tagging

The team initially defines more than `60` data-quality dimensions, then reduces them to `20` after experiments measuring overlap and predictive usefulness. A strong model produces the initial annotations, which are distilled into a smaller model for annotation at scale.

Two findings are particularly useful:

1. Content-related properties are more predictive than formatting properties.
2. A fine-grained `0–9` quality score selects data more accurately than a binary good/bad label.

This matters because quality is not one-dimensional. A document can be cleanly formatted yet contain little knowledge or reasoning, while a visually imperfect document can still be highly valuable.

### Similarity-based retrieval

Quality labels are combined with retrieval against curated high-quality seed data. The retrieval system uses both lexical and vector similarity, while provenance and the learned quality score constrain which retrieved samples are trusted.

The full process:

1. filters tens of trillions of raw tokens
2. retains a `12.5T`-token high-quality pool
3. identifies a `6.5T`-token higher-quality subset
4. repeats that subset for at least two epochs
5. produces the final `23T`-token training stream

The important point is that repetition is deliberate rather than accidental. The scarce high-quality subset receives more training weight, but it remains embedded in a broader corpus that preserves diversity.

## 3. Fine-Grained WSD

Standard [Warmup-Stable-Decay](/atlas/ai/training/optimization/warmup-stable-decay-learning-rate-schedule) has three learning-rate phases:

$$
\text{warmup}
\rightarrow
\text{constant peak learning rate}
\rightarrow
\text{decay}
$$

Nanbeige adds structure inside the stable phase:

$$
\text{diversity-enriched stable}
\rightarrow
\text{high-quality stable}
$$

This produces the full schedule:

| Stage | Tokens | Learning rate | Data objective |
| :--- | ---: | :--- | :--- |
| Warmup | `0.1T` | `0 → 4.5e-4` | stabilize optimization |
| Diversity-enriched stable | `12.4T` | `4.5e-4` | broad coverage and exploration |
| High-quality stable | `6.5T` | `4.5e-4` | increase high-quality data mass |
| Decay | `4T` | `4.5e-4 → 1.5e-6` | consolidate and extend context |

FG-WSD should therefore be understood as both:

- a learning-rate schedule
- a data curriculum aligned with that schedule

The constant learning rate provides room to change the mixture without confounding every data transition with a simultaneous learning-rate transition.

### Controlled ablation

The paper compares ordinary WSD and FG-WSD using a `1B` model trained on `1T` tokens:

| Schedule | GSM8K | CMath | BBH | MMLU | CMMLU | MMLU-Pro |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| Vanilla WSD | 27.1 | 34.5 | 29.3 | 49.2 | 50.3 | 16.87 |
| FG-WSD | **34.3** | **39.5** | **31.6** | **50.6** | **51.9** | **18.64** |

The largest gains appear on math and reasoning benchmarks. The authors attribute this to their high-quality selection policy placing greater weight on reasoning density.

During the decay stage, Adjusting Base Frequency is used to extend context to `64K`. This allows long reasoning traces, books, papers, and code repositories to be consumed without truncation.

## 4. Evaluating the base through controlled SFT

Raw base-model benchmarks can be difficult to interpret because production models are eventually instruction-tuned. Nanbeige therefore compares bases after applying the same SFT treatment.

The experiment uses:

- three independent public SFT datasets
- `500K` examples sampled from each dataset
- two epochs
- identical hyperparameters
- Nanbeige4-3B-Base, Qwen3-4B-Base, and Qwen3-8B-Base

This gives nine training runs rather than one hand-picked comparison. Nanbeige4-3B-Base generally produces the strongest reasoning checkpoint after SFT and frequently exceeds Qwen3-8B-Base.

This is a useful evaluation pattern:

> A strong base model is not only one that answers few-shot questions well; it is one that turns limited downstream supervision into a strong specialized model.

The comparison is still not a full measure of model quality. It focuses heavily on math, science, and code reasoning, where the pretraining mixture was deliberately optimized.

## 5. Scaling reasoning SFT

The cold-start SFT stage uses approximately `30M` cleaned question-answer examples with a `32K` context:

| Domain | Approximate share |
| :--- | ---: |
| Mathematical reasoning | `50%` |
| Scientific reasoning | `30%` |
| Code | `20%` |

The report varies the dataset size from roughly `0.5M` to `35M` examples and observes continued improvements on AIME 2025 and GPQA-Diamond without clear early saturation.

This contradicts the idea that a few hundred thousand exceptionally curated instructions are always sufficient. For a small model, broad exposure to many reasoning trajectories can remain useful well into the tens of millions of examples.

The subsequent overall SFT stage uses a `64K` context and a broader mixture:

| Domain | Approximate share |
| :--- | ---: |
| Math and subject-specific reasoning | `40%` |
| General QA and writing | `30%` |
| Agent scenarios | `20%` |
| Coding | `10%` |

The objective is to preserve reasoning while expanding conversation, writing, tool use, planning, and task execution.

## 6. Refine the solution, then reconstruct the reasoning

Nanbeige separates answer quality from reasoning-trace construction.

### Solution refinement

For each instruction:

1. build a task-specific evaluation checklist
2. generate candidates using teacher models and the current model
3. score candidates for properties such as correctness, completeness, consistency, executability, and safety
4. produce structured critiques
5. revise the answer
6. repeat the evaluation and revision loop

The result is a stronger final solution than simple one-shot teacher generation or rejection sampling.

### CoT reconstruction

Repeated rewriting can improve the answer while disrupting the original chain of thought. Training directly on the refined answer would therefore provide either:

- a good answer with a broken reasoning trace
- or the original coherent trace leading to an inferior answer

Nanbeige solves this by conditioning a chain-completion model on the instruction and the refined final solution. It first creates a short reasoning summary and then reconstructs an explicit chain of thought consistent with that solution.

The final SFT target becomes:

$$
\text{reconstructed reasoning}
+
\text{refined final answer}
$$

This is a powerful synthetic-data principle:

> Optimize the solution first, then construct a learnable trajectory that leads to it.

It should not be confused with a Looped Transformer. The loop here is an offline generate-review-revise process used to create training data.

## 7. Dual-Level Preference Distillation

Standard preference learning provides a sequence-level signal:

$$
y^+ \succ y^-
$$

Standard token-level distillation instead asks the student to match a teacher distribution:

$$
\mathcal{L}_{KD}
=
\sum_t
D_{\mathrm{KL}}
\left(
\pi_T(\cdot \mid x,y_{<t})
\|
\pi_\theta(\cdot \mid x,y_{<t})
\right)
$$

Dual-Level Preference Distillation combines both.

### Data construction

- Positive responses are sampled from Nanbeige3.5-Pro and filtered by automatic scores and rules.
- Negative responses are sampled from the `3B` student.
- A pair is retained only when the negative is clearly worse than the positive.

This makes the negatives relevant to the student's actual failure distribution.

### Joint supervision

The objective contains:

1. a sequence-level DPO-style margin that separates positive and negative responses
2. token-level teacher distillation on positive responses
3. token-level teacher distillation on negative student responses

The third component is the distinctive part. When the student generates an incorrect trajectory, the teacher distribution identifies:

- tokens where the student is confidently wrong
- reasonable alternatives the student underestimates

The sequence loss says which response should win. The token losses provide local information about how the student's distribution should change.

Relative to the SFT checkpoint, the paper reports improvements of roughly:

- `8%` on AIME
- `10%` on GPQA
- `30%` on BFCL V4
- `8%` on Arena-style preference evaluation

It also reports that RL initialized from the distilled checkpoint improves more than RL initialized directly from SFT. However, this section provides less detailed controlled evidence than the FG-WSD ablation, so the precise contribution of each DPD component remains uncertain.

## 8. Multi-stage reinforcement learning

Nanbeige avoids one RL stage over a permanently mixed dataset. It instead runs separate stages for:

1. STEM reasoning
2. practical coding
3. human-preference alignment

The motivation is uneven learning speed. In a mixed math-and-code run, for example, the model may keep improving on math while making little progress on harder coding examples. Separate stages allow each capability to receive concentrated optimization.

Each stage uses on-policy GRPO, removes the KL penalty, and masks the loss on truncated sequences.

### Keep examples near the learning frontier

Before every stage, the latest checkpoint samples `16` responses per question. The question is retained only when its measured pass rate is strictly between `10%` and `90%`:

$$
0.1
<
\operatorname{avg@16}(q)
<
0.9
$$

This excludes:

- trivial prompts where almost every rollout succeeds
- effectively impossible prompts where almost every rollout fails

Because the filter is recomputed after each stage, the curriculum follows the evolving policy. Problems do not have a permanent difficulty: cross-domain transfer can turn an earlier challenge into a later triviality.

### STEM verification

The STEM stage uses an agentic verifier. A Python interpreter checks computations and simplifies symbolic expressions so that mathematically equivalent answers do not fail because of surface-form differences.

### Executable coding data

The coding stage constructs problems together with public and private test functions. One pipeline works backward:

1. create or retrieve a valid solution
2. construct executable tests
3. generate the natural-language problem description

Generating the verifier before the prompt makes the final reward mechanism part of data construction rather than an afterthought.

## 9. Results

The Thinking model is evaluated with temperature `0.6`, top-p `0.95`, and a maximum generation length of `64K`. AIME is averaged over eight runs and most other benchmarks over three.

| Benchmark | Nanbeige4-3B-Thinking | Qwen3-32B | Qwen3-30B-A3B |
| :--- | ---: | ---: | ---: |
| AIME 2024 | **90.4** | 81.4 | 89.2 |
| AIME 2025 | **85.6** | 72.9 | 85.0 |
| GPQA-Diamond | **82.2** | 68.7 | 73.4 |
| SuperGPQA | 53.2 | 54.1 | **56.8** |
| BFCL V4 | **53.8** | 47.9 | 48.6 |
| Fullstack Bench | 48.0 | **58.2** | 54.4 |
| ArenaHard V2 | **60.0** | 48.4 | **60.0** |
| Multi-Challenge | 41.2 | 39.2 | **49.4** |

The profile is impressive but uneven:

- Nanbeige is especially strong in mathematical reasoning, GPQA, function calling, and ArenaHard.
- Larger models remain better on SuperGPQA, full-stack coding, and Multi-Challenge.

The correct conclusion is not that a `3B` model universally beats models ten times larger. It is that a carefully optimized small model can reach or exceed much larger models on the capability dimensions targeted by its training pipeline.

## 10. What is reusable

The report suggests several general lessons:

1. **Model size and training investment must be considered together.**  
   A `3B` model trained on `23T` tokens is economically and behaviorally different from an ordinary `3B` model.

2. **Data quality can be scheduled, not merely filtered.**  
   Broad data supports early exploration; scarce high-quality data can receive more weight later.

3. **Synthetic reasoning data benefits from separating solution search and trajectory construction.**  
   A strong answer can be found first and converted into a coherent supervision trace afterward.

4. **Student failures are valuable distillation states.**  
   Teacher probabilities on student-generated mistakes provide more targeted corrections than teacher demonstrations alone.

5. **RL difficulty must be recomputed on-policy.**  
   A static dataset cannot remain perfectly matched to a policy that is continually improving.

## 11. Limitations

The paper exposes the checkpoints, but not enough of the pipeline to reproduce the result fully:

- the raw and filtered training datasets are unavailable
- the quality-labeling models and retrieval infrastructure are not released
- teacher and evaluator models are partly proprietary
- reward models and synthetic-data systems are incompletely specified
- compute cost and many optimization details are omitted
- most final results cannot be attributed cleanly to one component

FG-WSD receives a useful controlled ablation. Other important techniques, particularly DPD and the full post-training stack, receive fewer component-level comparisons.

The benchmark selection also emphasizes the model's target strengths. Strong math and reasoning results should therefore be read alongside its weaker results in broader knowledge, full-stack coding, and multi-turn instruction following.

## Related

- [Frontier Small Language Models](/atlas/ai/architectures/model-families/frontier-small-language-models)
- [Overtraining and Inference-Aware Scaling](/atlas/ai/training/scaling/overtraining-and-inference-aware-scaling)
- [Data Mixture Optimization](/atlas/ai/training/data/data-mixture-optimization)
- [Warmup-Stable-Decay Learning Rate Schedule](/atlas/ai/training/optimization/warmup-stable-decay-learning-rate-schedule)
- [Progressive Context Extension](/atlas/ai/training/scaling/progressive-context-extension)
- [Knowledge Distillation](/atlas/ai/training/losses/knowledge-distillation)
- [Preference Optimization for LLMs](/atlas/ai/training/optimization/preference-optimization-for-llms)
- [Supervised Fine-Tuning for LLMs](/atlas/ai/training/optimization/supervised-fine-tuning-for-llms)
- [Reinforcement Learning with Verifiable Rewards](/atlas/ai/training/optimization/reinforcement-learning-with-verifiable-rewards)
- [Group Relative Policy Optimization](/atlas/ai/training/optimization/group-relative-policy-optimization)
- [Nanbeige4-3B Technical Report](https://arxiv.org/abs/2512.06266)
- [Nanbeige4-3B checkpoints](https://huggingface.co/Nanbeige)
