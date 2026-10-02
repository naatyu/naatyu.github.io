---
title: "Jev and Tev: Typed Decision Models, Training, and New Workflows"
date: 2026-09-24
lastmod: 2026-09-24
tags:
  - ai/llm
  - classification
  - fine-tuning
  - calibration
  - agents
draft: false
---

## Summary

Jev is TypeSafe AI's decision model: applications supply state and bounded questions, and receive typed answers and probabilities rather than generated prose. Together's **Tev1-4B-experimental** is a separate, Jev-inspired classifier built by LoRA fine-tuning Qwen3.5-4B. It is not an open reproduction of Jev's undisclosed internals.

The interesting idea is to use pretrained semantic knowledge as a cheap, inspectable component inside ordinary software. Keep arithmetic, permissions, and workflow logic in code; use the model for judgments that are difficult to express as exact rules.

This note separates three things:

1. **Disclosed behavior:** what TypeSafe documents about Jev.
2. **Reproducible baseline:** what Together's repository actually implements.
3. **Design hypotheses:** architectures and training objectives one could use to build such a system, not claims about Jev's private implementation.

Sources checked September 24, 2026: [TypeSafe introduction](https://docs.typesafe.ai/introduction), [Together tutorial](https://www.together.ai/blog/how-to-train-your-own-jev), and [Tev repository](https://github.com/togethercomputer/tev1).

## 1. What is Jev?

TypeSafe calls its category **System One**, emphasizing quick, bounded judgments rather than extended generation. Jev is the product/model name, not an acronym for a published architecture.

The API separates shared input state from questions. A question specifies its own answer space; application code consumes the result. Questions in one request are documented as independently evaluated against the same state, in parallel. This is more specific than “ask a chatbot to return JSON.” [Introduction](https://docs.typesafe.ai/introduction)

| Primitive | Meaning | Returned information |
| :--- | :--- | :--- |
| Noul | Evaluate a yes/no proposition | Probability of yes, between 0 and 1 |
| Choice | Select among supplied alternatives | Selected option, distribution, confidence |
| Score | Evaluate against ordered descriptive levels | Numeric score, level distribution, confidence |

The options can change between requests: this is **question-conditioned classification**, not a classifier whose permanent classes are only “positive” and “negative.” Question IDs are application bookkeeping, not instructions the model sees. [Primitives](https://docs.typesafe.ai/primitives)

For Score, the output is the probability-weighted mean of level indices. For example, levels 0/1/2 with probabilities 0.1/0.6/0.3 give `0×0.1 + 1×0.6 + 2×0.3 = 1.2`. This is a rubric position, not a measured physical quantity. Different distributions can have the same mean. [Score documentation](https://docs.typesafe.ai/primitives/score)

### What this does not imply

A constrained answer can still be wrong. Returning an existing product ID instead of inventing one eliminates one failure mode, but the selected product may be irrelevant. Likewise, a valid enum is not authorization to execute its corresponding action.

Distinguish:

- **Type validity:** the output belongs to the allowed schema.
- **Semantic accuracy:** it is the right answer.
- **Calibration:** probabilities match observed outcome frequencies.
- **Operational safety:** code allows only appropriate actions.

These require different tests. A guarantee of the first is not a guarantee of the other three.

## 2. What is actually disclosed about Jev's internals?

TypeSafe's launch describes a new architecture, a parallel sampler, and **RLCD: Reinforcement Learning for Calibrated Decisions**. It says outputs are produced in parallel rather than through sequential text generation. The public material reviewed does not provide a layer diagram, parameter count, checkpoint lineage, training-data volume, or implementable RLCD loss and optimizer recipe. [Launch post](https://typesafe.ai/blog/introducing-system-one-models-and-jev)

Its training primer frames RLCD as adapting pretrained models toward decision distributions rather than preferred prose. It explains the calibration target but not the algorithm. Thus, pretrained language representations are a reasonable starting point to discuss; naming a particular backbone, attention mask, or RL method for Jev would be speculation. [AI primer](https://docs.typesafe.ai/introduction/machine-learning-primer)

### Plausible design A: a language model with restricted answer tokens

This is the simplest baseline and the family to which Tev belongs:

```text
state + question + descriptions of options
                  ↓
          pretrained language backbone
                  ↓
         logits for answer-token positions
                  ↓
       allowed answer / option probabilities
```

With one single-token label per option, a custom implementation can use:

```text
p(option_i) = exp(logit_i / T) / sum_j exp(logit_j / T)
```

The denominator ranges over valid labels. This yields a distribution conditional on the supplied answer set; it does not establish that the answer set contains a correct option. Verify tokenizer behavior: letters with different whitespace or prefixes may not have the assumed tokenization.

A one-token decision already avoids long decoding. Therefore, a fair performance comparison should include this baseline—not only a large reasoning model generating a paragraph and a JSON distribution.

### Plausible design B: a shared backbone with explicit decision heads

One could replace vocabulary generation with a small head:

```text
h = backbone(state, question, option_descriptions)
logits = decision_head(h)
probabilities = softmax(mask_invalid_slots(logits))
```

A fixed maximum number of output slots can support variable option counts by masking unused slots. Slot meanings come from the prompt, not fixed class names. A binary head can implement Noul; a level head can implement Score.

Another design scores each option with the same function `score(state, question, option_i)`, then normalizes across candidates. This accommodates dynamic descriptions and encourages permutation-equivariance, but can repeat expensive computation unless state representations are shared.

Removing the vocabulary head may reduce output projection cost. It does not remove the backbone's input processing, and it does not automatically yield calibrated probabilities.

### Plausible design C: shared state computation with isolated question branches

To answer many questions efficiently, one could encode state once, then process multiple query branches against it:

```text
                         ┌→ question A → distribution A
state → shared features ─┼→ question B → distribution B
                         └→ question C → distribution C
```

Possible mechanisms include cross-attention over shared state features or a causal shared prefix with isolated branches and shared prefix KV. The branches must not read each other's answers if independence is part of the interface.

These designs differ: a bidirectional state encoder and a cached causal prefix are not interchangeable. Both are plausible implementations, not reverse-engineered Jev facts.

Approximate compute accounting is:

```text
Independent calls:       Q × (state_cost + question_cost)
Shared-state execution:  state_cost + Q × question_cost + scheduling_overhead
```

The opportunity grows when state is expensive and each question is small. More questions still consume resources. Parallel latency, aggregate compute, and billed tokens are different quantities. Parallel evaluation also does not make the real-world events being judged statistically independent.

## 3. What Together actually trains

The tutorial reports approximately **$17 of fine-tuning cost and 25 minutes**. Treat these as one reported training run, not the cost of developing Jev, pretraining Qwen, or operating a production endpoint. Dedicated hosting and inference are extra. The blog's example provisions one H100 80GB endpoint; that is a serving example, not evidence of the training hardware used. [Together tutorial](https://www.together.ai/blog/how-to-train-your-own-jev)

The repository explicitly identifies Tev as ordinary **LoRA SFT using Qwen's existing language-model head**. It does not train on Jev-generated answers. Its supported decision format has 2–24 options. [Repository README](https://github.com/togethercomputer/tev1)

### Data quantity and mixture

The repository's final dataset contains **37,840 training examples**, **4,568 development examples**, and **16,929,529 training tokens**. The longest exported sequence is 1,526 tokens.

| Source | Training examples |
| :--- | ---: |
| MultiNLI | 5,000 |
| BoolQ | 3,000 |
| Banking77 | 3,000 |
| AG News | 1,500 |
| SST-5 | 2,000 |
| Synthetic policies, original + additional | 13,500 |
| Priority routing | 6,000 |
| Synthetic research classification | 3,840 |
| Total | 37,840 |

The final merge removes 6,000 exact replay duplicates and checks split overlap, conflicting duplicates, chat-template alignment, and answer/EOS formatting. Synthetic research examples are templated exercises, not thousands of independent real papers. [Dataset guide](https://github.com/togethercomputer/tev1/blob/main/docs/DATASET.md)

The blog inconsistently mentions 38,000 and 38,340; use the repository's precise final count above. [Together tutorial](https://www.together.ai/blog/how-to-train-your-own-jev)

### Starting training recipe

These are the published script defaults, **not a verified export of the historical job's configuration**:

| Parameter | Value |
| :--- | :--- |
| Base checkpoint | `Qwen/Qwen3.5-4B` |
| Method | SFT, LoRA on all linear modules |
| LoRA rank / alpha / dropout | 8 / 16 / 0 |
| Epochs | 1 |
| Batch size / accumulation | 8 / 1 |
| Learning rate | `5e-5` |
| Schedule | Cosine, 3% warmup |
| Maximum sequence length | 2,048 |
| Packing | Enabled |
| Loss | Completion-only; input tokens masked |
| Weight decay / gradient clipping | 0 / 1 |

Sources: [training guide](https://github.com/togethercomputer/tev1/blob/main/docs/TRAINING.md), [training script](https://github.com/togethercomputer/tev1/blob/main/examples/train_together.py).

### What one example looks like

Illustrative training record, not copied from the dataset:

```json
{
  "state": "The user asks where to download last month's invoice.",
  "question": "Which team should handle this request?",
  "options": [
    {"label": "A", "key": "billing", "description": "Invoices and payments"},
    {"label": "B", "key": "technical", "description": "Product failures"},
    {"label": "C", "key": "unknown", "description": "Insufficient information"}
  ]
}
```

The supervised completion is the answer letter followed by EOS. The client maps that letter back to the semantic key; the model is **not trained to produce the final JSON object**. Training and inference must use consistent templates and non-thinking mode. [Training guide](https://github.com/togethercomputer/tev1/blob/main/docs/TRAINING.md)

The inference script sets temperature 0, disables thinking, permits up to 8 generated tokens, and constrains output with a regex over allowed letters. It requests logprobs but only five top alternatives; with more choices, that is not necessarily a complete distribution. Token preferences are not calibrated correctness probabilities. [Inference implementation](https://github.com/togethercomputer/tev1/blob/main/examples/decide.py)

The saved results are 880/1,000 main decisions and 300/300 policy-transfer decisions. The repository labels these reused development benchmarks, not untouched final tests. They do not establish equivalence to Jev. [Run record](https://github.com/togethercomputer/tev1/blob/main/runs/new-v1/README.md)

## 4. How could one train a genuinely calibrated decision model?

The following is a **proposed engineering recipe**, not TypeSafe's disclosed RLCD implementation.

### First train semantic discrimination

Start from a capable pretrained backbone. Train on `(state, question, answer_space, target)` tuples from varied domains. Use cross-entropy for hard labels or distribution matching when reliable soft targets exist:

```text
Hard-label loss:  -log p(correct_option | input)
Soft-label loss:  -sum_i target_probability_i × log p(option_i | input)
```

Soft targets may represent human disagreement or a teacher distribution, but these are not interchangeable with objective event frequencies. A consensus of teachers can confidently share the same error.

Important augmentations and controls:

- Shuffle option order and remap targets to avoid learning letter/position shortcuts.
- Vary question phrasing and option descriptions while preserving meaning.
- Include realistic ambiguity, missing evidence, hard negatives, and an explicit abstention option where appropriate.
- Split by source document, customer, repository, or template family—not just random rows.
- Separate trusted instructions from untrusted state and include adversarial state examples.
- Preserve objective arithmetic in code rather than rewarding approximate guesses.

### Why accuracy reward alone is insufficient

Consider binary labels where the true conditional probability of yes is `q = 0.7`. A policy samples yes with probability `p` and earns 1 for a correct answer. Its expected reward is:

```text
E[reward] = q*p + (1-q)*(1-p)
          = 0.3 + 0.4*p
```

The maximum occurs at `p = 1`, not `p = 0.7`. Thus, optimizing sampled decision accuracy can reward certainty without recovering the actual uncertainty.

For this toy problem, expected log loss instead is:

```text
L(p) = -q*log(p) - (1-q)*log(1-p)
```

Its derivative vanishes at `p = q`. This is why **proper probability objectives** matter when the output is a distribution rather than only a chosen action. It does not prove that Jev uses this objective or that ordinary cross-entropy guarantees practical calibration.

### Calibration and operational evaluation

Reserve a calibration split and a final untouched test. Evaluate log loss, Brier score, reliability diagrams, and selective accuracy: how much traffic can be automated at a specified error rate?

Temperature scaling fits a scalar `T` on held-out logits, using `softmax(logits/T)`. It can correct a confidence tendency while leaving the argmax unchanged, but it cannot fix wrong features, missing classes, or arbitrary distribution shift. See [Guo et al., On Calibration of Modern Neural Networks](https://arxiv.org/abs/1706.04599).

If later adding RL, specify its actual purpose: downstream action utility, abstention cost, information acquisition, or sequential control. A static classification dataset does not automatically require rollout environments or GRPO. Any proposed probability-based reward needs an honest outcome target and protection against gaming the evaluator.

## 5. Probability is not the same thing as the confidence field

TypeSafe documents Choice/Score `confidence` as a statistic derived from the returned distribution, not an independent estimate from a second verifier. Noul has no separate confidence field. The exact confidence formula is not specified on the reviewed confidence page. [Confidence documentation](https://docs.typesafe.ai/confidence)

Consequently, do not interpret `confidence = 0.9` as “90% of these answers are correct” without validation. A sharp but wrong distribution can have high confidence. Nor is a distribution over choices a complete decomposition of epistemic uncertainty versus inherent ambiguity.

For automation, choose thresholds using measured costs and coverage on representative data. A threshold is part of the application policy, not a universal property of the model.

## 6. What becomes practical when decisions are cheap?

These are workflow opportunities, not claims that classification or routing was invented with Jev.

### Many small judgments instead of one opaque answer

For a support ticket, ask separately whether evidence is sufficient, whether the user requests a refund, and which issue category applies. Code computes deadlines, checks account permissions, and chooses the next step.

Independent questions can be sent together, including speculative questions whose answers only some branches will use. This trades extra work for fewer sequential network round trips. Questions requiring newly obtained evidence still need another stage. [Speculative fan-out](https://docs.typesafe.ai/patterns/fan-out)

### Concrete use cases and their boundaries

| Workflow | Decision-model role | Keep outside the model |
| :--- | :--- | :--- |
| Model/tool routing | Select a suitable specialist or tool from descriptions | Access control, budget limits, valid argument checks |
| RAG | Judge relevance or claim support for retrieved passages | Retrieval provenance and deterministic citation IDs |
| Data curation | Score relevance, style, educational value, or duplication candidates | Dataset lineage, sampling controls, human audits |
| Agent monitoring | Detect likely failure, missing evidence, or completion | Final executable tests and real task outcomes |
| Semantic feature extraction | Turn text into reusable rubric-based numeric features | Leakage-safe train/test splits for downstream models |
| Interactive products/games | Pick a bounded response or action from current state | State transitions, physical constraints, safety checks |
| Entity resolution | Judge whether candidate records refer to the same entity | Candidate retrieval and uniqueness constraints |

Cheap decisions make it more feasible to judge every retrieved item or agent step rather than a small sample. But evaluation volume can amplify systematic errors as readily as useful signal. Measure the resulting system, not only each classifier call.

### Extraction without free-form invention

A particularly useful pattern is **candidate extraction → semantic selection → deterministic normalization**. A parser or regex extracts possible values; the model chooses the relevant candidate; code copies the original value. This preserves provenance and prevents inventing a value outside the candidate set. It can still select the wrong candidate or miss an answer omitted by the parser. [Pre-parsed extraction cookbook](https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook)

### A fast/slow cascade

Use a cheap decision model for well-covered cases, escalate uncertain or unfamiliar inputs to a stronger reasoner, and send consequential unresolved cases to people. On a distribution where the gate works, this can lower average cost without forcing every input through the most expensive model.

An illustrative accounting—not a measured Jev result—is:

```text
average_cost = gate_cost + escalation_rate × expensive_model_cost
```

The hard part is measuring **confident errors that are never escalated**. Evaluate these separately; they are invisible if tests inspect only the escalation queue.

## 7. Limits, performance claims, and fair comparisons

TypeSafe reports roughly 70–500 ms responses and much larger speed/cost advantages on selected workflows. Its launch explicitly notes favorable short inputs and comparison settings. These are vendor measurements, not universal speedups over all classifier baselines. [Launch post](https://typesafe.ai/blog/introducing-system-one-models-and-jev)

The workflow evaluation uses a fixed code graph and reference answers derived from strong external models. Agreement with that reference is not independently verified real-world correctness, especially for ambiguous judgments. [Evaluation methodology](https://evals.typesafe.ai/)

The Jev 1.13 limitation page is unusually important: it reports weaknesses in counting, numerical precision, dates, multi-hop indirection, irrelevant context, and adversarial state. Separately asked propositions need not obey logical complement identities. Type validity therefore does not eliminate prompt injection or contradictory judgments. Keep arithmetic and invariants in code. [Documented limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13)

A fair local benchmark should compare:

1. Exact code/rules where applicable.
2. A conventional encoder classifier or reranker.
3. A prompted small LLM with constrained one-token output.
4. A Tev-style fine-tune.
5. Jev and a stronger reasoning model.

Use the same inputs, decision schema, batching opportunities, and quality target. Report p50/p95 latency, input size, number of questions/options, throughput under load, calibration, abstention coverage, and total serving cost. Disable unnecessary reasoning when evaluating a non-reasoning baseline.

## Takeaway

**Jev's useful idea is a machine-facing decision interface with distributions and parallel questions. Tev shows that a cheap SFT baseline can cover part of that workload. Neither proves that $17 reproduces Jev's architecture, calibration, or performance.**

For a first implementation, start with the simplest constrained classifier, a rigorous holdout, and explicit escalation. Add shared-state computation, specialized heads, distillation, or RL only when measurements show what they need to improve.

## Related

- [Supervised Fine-Tuning for LLMs](/atlas/ai/training/optimization/supervised-fine-tuning-for-llms)
- [LoRA vs Full Fine-Tuning](/atlas/ai/training/optimization/lora-vs-full-finetuning)
- [Knowledge Distillation](/atlas/ai/training/losses/knowledge-distillation)
- [Agentic Training Data and Environment Synthesis](/atlas/ai/training/data/agentic-training-data-and-environment-synthesis)

## Main sources

- Together AI, [How to train your own Jev for $17](https://www.together.ai/blog/how-to-train-your-own-jev), September 23, 2026.
- Together AI, [Tev1 repository](https://github.com/togethercomputer/tev1), particularly its dataset/training guides, inference example, and run record.
- TypeSafe AI, [Introducing System One Models & Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev), September 15, 2026.
- TypeSafe AI, [documentation](https://docs.typesafe.ai/introduction), [confidence semantics](https://docs.typesafe.ai/confidence), and [Jev 1.13 limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13).
