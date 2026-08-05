---
title: "Shieldstral: Policy-Adaptive Multimodal Safety Classification"
date: 2026-08-05
lastmod: 2026-08-05
tags:
  - ai/llm
  - models
  - safety
  - multimodal
  - data-curation
  - guardrails
draft: false
---

## Summary

Shieldstral is a `3B`-parameter multimodal guard model built on Ministral-3B. Its important contribution is not a new backbone. It is a data and task formulation that makes one small classifier respond to natural-language safety policies supplied at inference time.

Instead of predicting one fixed taxonomy, the model receives:

```text
Instruction: deployment context and desired strictness
Query:       a yes/no policy question
Document:    text, an image, or both
Output:      yes or no
```

The same content can therefore be evaluated against different policies without retraining the classifier. The central training trick is to pair one document with both applicable and inapplicable policy queries. These iso-content contrasts force the model to interpret the query rather than merely detect that the document looks generally harmful.

The paper reports training from approximately `54.1M` constructed samples and strong text, multilingual, refusal-detection, and multimodal results. The sample count should not be confused with unique source documents: template variation, positive duplication, hierarchical labels, and multiple queries expand the training set substantially.

The reusable lesson is:

> Policy adaptability comes from conditioning the classifier on the policy and constructing hard negatives that hold the content constant while changing the policy question.

## 1. Why fixed-taxonomy guard models are limiting

A conventional guard model predicts labels from a fixed safety taxonomy:

```text
violence
hate
self-harm
sexual content
illegal activity
safe
```

This creates two problems.

First, public safety datasets use incompatible definitions, labels, and levels of granularity. One dataset may distinguish hate, harassment, and insults, while another merges them into toxicity.

Second, deployment policy is contextual. Cybersecurity instructions may be appropriate in a defensive research product and unacceptable in a child-facing assistant. A classifier whose policy is embedded only in its weights cannot adapt without retraining, additional rules, or a separate model.

Shieldstral instead represents the policy as part of the input. Classification becomes conditional:

$$
P(\text{violation}\mid\text{policy},\text{content},\text{context}).
$$

This does not eliminate the need for policy engineering. It moves policy expression from a fixed output taxonomy into a natural-language query that can be changed at deployment time.

## 2. Binary question-answering formulation

Every example is transformed into three input fields and a single-token target.

### Instruction

The instruction describes:

- the moderation task;
- deployment context;
- strict, moderate, or lenient enforcement;
- multilingual or adversarial framing when relevant.

It is expected to remain relatively stable for a deployment or dataset.

### Query

The query asks one specific yes/no question, such as:

```text
Does this response promote physical violence?
```

Queries can represent:

- an overall safe/unsafe decision;
- one detailed harm category;
- a target demographic;
- refusal detection;
- response quality;
- an operator-defined policy not expressed as a training label.

### Document

The document contains the content being classified:

- a user prompt;
- an assistant response;
- a prompt-response pair;
- an image;
- an image with accompanying text.

Prompt-response documents are rendered using varied formats, including role labels, brackets, XML-like tags, Markdown, conversational phrases, and minimal delimiters. This reduces dependence on one chat serialization.

### Output score

Training uses ordinary vocabulary cross-entropy at one output position, with `yes` or `no` as the target token.

At inference, only the two corresponding logits are used. If they are $z_{yes}$ and $z_{no}$, the reported violation score is:

$$
s
=
\frac{\exp(z_{yes})}
{\exp(z_{yes})+\exp(z_{no})}.
$$

The paper uses a threshold of `0.5`:

$$
\hat{y}=\mathbb{1}[s\ge0.5].
$$

This is computationally cheap: one model forward pass and one generated decision token, rather than a long reasoning trace.

The score is not automatically a calibrated real-world probability. Threshold selection and calibration must be validated for each policy, prevalence, and cost asymmetry.

## 3. Training-data composition

The reported training set contains approximately `54.1M` constructed samples:

| Component | Samples | Approximate share |
| :--- | ---: | ---: |
| Transformed open-source text | `45.2M` | `83.5%` |
| Synthetic contrastive text | `4.4M` | `8.1%` |
| Multimodal | `4.5M` | `8.3%` |
| **Total** | **`54.1M`** | **`100%`** |

The sources cover safety, toxicity, hate speech, jailbreak detection, moderation, refusal detection, and response quality. The paper's main data problem is not collecting one homogeneous corpus; it is reconciling heterogeneous supervision without erasing each dataset's intended boundary.

The construction pipeline has four main stages:

1. template-based task unification;
2. contrastive sample curation from existing annotations;
3. LLM-generated contrastive samples for fine-grained policies;
4. a separate multimodal data pipeline.

## 4. Template-based unification

Each source dataset receives a manually designed processor that maps its native schema into:

```text
instruction + query + document -> yes/no
```

The processor defines:

- native-label interpretation;
- category mapping;
- positive and negative conditions;
- task-specific instructions;
- query pools;
- document formatting.

An LLM generates paraphrases of the manually defined templates. Each training example randomly samples among those phrasings.

### Strictness as input

Instruction templates encode different operating points:

| Strictness | Example setting | Intended behavior |
| :--- | :--- | :--- |
| Strict | jailbreaks, adversarial inputs, visual safety | flag borderline risks |
| Moderate | general safety, toxicity, hate | balance false positives and false negatives |
| Lenient | response quality, dialogue moderation | flag only clear violations |

This is an appealing interface, but words such as `strict` do not guarantee a known or stable false-positive rate. Operational strictness should still be measured on deployment-specific calibration data.

### Query types

The transformed public data includes:

- category-specific questions;
- overall safety questions;
- refusal-detection questions;
- paraphrases of each question type.

### Multimodal versions

For image-text examples, separate samples can ask whether:

- the image is unsafe;
- the text is unsafe;
- the combination is unsafe.

This helps distinguish which modality carries the violation rather than always learning one fused label.

## 5. Iso-content contrastive curation

The key insight is to generate multiple policy decisions for the same content.

Suppose a document contains instructions for physical violence. Training examples may include:

```text
Query: Does this content promote physical violence?
Label: yes
```

and, using the identical document:

```text
Query: Does this content contain racial hate speech?
Label: no
```

The second example is not a generally safe document. It is a hard negative for the particular query.

This prevents the shortcut:

```text
content looks harmful -> always answer yes
```

and encourages the desired decision:

```text
content satisfies the supplied policy criterion -> answer yes
```

### Positive construction

For annotated harmful content, positive queries can cover:

- generic unsafety;
- the annotated category;
- a target group when present;
- ancestors of a fine-grained category.

### Negative construction

Negatives come from:

- unrelated harm categories;
- unrelated target demographics;
- genuinely safe content;
- sibling categories that are semantically close to the positive category.

### Balancing

One positive category can produce many negative pairings. To counter this imbalance, the pipeline duplicates positive examples and independently samples new instruction and query paraphrases for each copy.

This increases the reported sample count without increasing unique content by the same amount. The duplication is a deliberate sampling-weight choice, not new information in every example.

### Label cross-validation

An open-source LLM checks source annotations at both overall and per-category levels. Samples are removed when the classifier disagrees with the source label.

This can improve consistency, but it also distills the verifier model's biases into the dataset. A disagreement filter favors examples that fit both the original taxonomy and the verifier's interpretation; difficult or culturally ambiguous examples may be removed disproportionately.

## 6. Synthetic fine-grained contrastive data

Public datasets provide broad coverage but limited fine-grained policy contrasts. The synthetic pipeline adds approximately `4.4M` samples based on a training taxonomy with:

- `11` superclasses;
- `73` leaf categories;
- a hierarchy derived from `11` source taxonomies.

### Generation procedure

For a safe source text, the generator receives:

- one target harm category;
- one sibling category that must be avoided.

It produces:

1. an unsafe rewrite containing the target harm;
2. a positive query about the target;
3. a negative query about the sibling.

This yields an iso-content pair:

```text
same rewritten document + target query  -> yes
same rewritten document + sibling query -> no
```

The paper instructs the generator to preserve the source language while producing queries in English. Generation temperature is reported as `0.7`.

### Hierarchical positives

If a rewrite violates a leaf category, it also receives positive examples for its ancestors. One generation can therefore supervise several levels of abstraction:

```text
specific leaf -> subcategory -> superclass -> general unsafety
```

This is data-efficient, but these samples are highly correlated and again make raw sample count a poor proxy for semantic diversity.

### Why sibling negatives are useful

Random negative categories are often too easy. A violent document paired with a privacy question can be distinguished using coarse concepts. A physical-assault document paired with a kidnapping question forces attention to the actual policy boundary.

This technique transfers beyond safety classification. It can be used whenever a model must apply natural-language criteria:

- legal and compliance review;
- medical triage policies;
- document routing;
- quality assurance;
- rubric-conditioned evaluation;
- data filtering and labeling.

## 7. Multimodal data construction

The multimodal portion contains approximately `4.5M` samples. Because unsafe image datasets are scarce, the pipeline combines:

- visual moderation datasets containing violations;
- clean image datasets as safe negatives;
- general image classification and object-detection data;
- LLM-generated query variations;
- sibling-category hard negatives.

### Query mutation

An LLM generates roughly `2,000` query phrasings from a fixed visual taxonomy of `14` subcategories covering NSFW material, violence, hate, and illegal content.

Approximately `30%` of queries use inverse wording such as:

```text
Is this image free from violent content?
```

Inverse formulations help prevent a simple association between harmful words in the query and the `yes` label.

### Reranker filtering

A vision-language reranker scores each image-query pair. It filters:

- incorrect source labels;
- query mutations that do not match the image;
- hallucinated category assignments;
- generated hard negatives that are not genuinely negative.

Thresholds are asymmetric: filtering is more permissive for scarce violation examples and stricter for abundant negatives.

This preserves recall in rare categories, but can also preserve more label noise among the positive samples. The correct threshold depends on the cost of missing rare violations versus introducing noisy supervision.

## 8. Adaptability evaluation

Evaluating ordinary benchmark performance does not show whether the model can follow a new policy. The authors therefore construct a separate fine-grained taxonomy benchmark.

The evaluation taxonomy contains:

- `12` superclasses;
- `26` subcategories;
- `52` leaf categories;
- `90` fixed, manually written queries.

It differs from the training taxonomy in names, grouping, and granularity. No leaf maps one-to-one, although `10` of the `12` evaluation superclasses have a loose training counterpart.

### Contrastive evaluation pairs

For each target and sibling category, an LLM creates:

- a positive document satisfying the target query;
- a negative document satisfying the sibling but not the target;
- one fixed query shared by both documents.

A separate LLM verifies the samples. The test generator, verifier, and source seeds differ from those used for the training set. A separate validation set uses the training-generation models and supports ablations.

This is more convincing than evaluating on renamed training labels, but it is not proof of arbitrary policy generalization. The harm domains still overlap conceptually, and both training and evaluation rely heavily on synthetic LLM-generated text.

## 9. Training recipe

Shieldstral starts from `Ministral-3B-Base-2512`, which includes a Pixtral vision encoder.

The language model is fine-tuned using LoRA and ordinary cross-entropy on the single output token. The authors report that full SFT does not provide a significant overall advantage on the two validation sets considered:

| Method | Aegis v2 F1 | Fine-grained taxonomy F1 |
| :--- | ---: | ---: |
| LoRA | `87.1` | `84.4` |
| Full SFT | `87.8` | `83.9` |

This supports LoRA as an efficient choice for this specific classifier, not the universal conclusion that LoRA always matches full fine-tuning.

Important reproduction details are absent from the report, including:

- LoRA rank, alpha, dropout, and target modules;
- optimizer and learning rate;
- batch size and sequence-length distribution;
- epochs or consumed-token count;
- source-dataset sampling weights;
- training compute and hardware;
- whether and how vision components are updated;
- calibration-set construction.

The paper explains the data transformations much more completely than the optimization recipe.

## 10. Checkpoint specialization and SLERP merging

The authors train two specialized checkpoints:

- **P:** public safety data only;
- **PG:** public data plus generated taxonomy data.

They observe a trade-off:

- `P` is better calibrated to established safety benchmarks;
- `PG` is much better at fine-grained policy discrimination but drifts from the public benchmark distribution.

The final model is a pairwise SLERP merge:

```text
0.6 * PG
+ 0.3 * P
+ 0.1 * Ministral-3B-Instruct
```

The instruct checkpoint is intended to restore general instruction-following behavior.

On the reported validation sets:

| Checkpoint or merge | Aegis v2 F1 | Fine-grained taxonomy F1 |
| :--- | ---: | ---: |
| P | `88.5` | `61.1` |
| PG | `87.1` | `84.4` |
| `0.9 PG + 0.1 I` | `87.4` | `84.6` |
| `0.6 PG + 0.3 P + 0.1 I` | `88.0` | `88.7` |

The result suggests complementary solutions in weight space. It does not explain why these particular coefficients should transfer to other models or data mixtures; they remain validation-tuned hyperparameters.

## 11. Reported results

Shieldstral is compared with ten guard-model baselines across text, multilingual, refusal-detection, adaptability, and multimodal evaluations.

The headline results are:

| Evaluation family | Reported result |
| :--- | ---: |
| Aggregate text F1 | `84.9%` |
| Fine-grained adaptability F1 | `91.3%` |
| Aggregate multimodal F1 | `83.8%` |

The paper reports that:

- its aggregate text F1 matches GPT-OSS-Safeguard-20B;
- GPT-OSS-Safeguard-20B remains higher on policy adaptability at `94.1%`;
- Shieldstral leads the reported multimodal average;
- the `3B` base is smaller than all compared text guard models;
- reasoning guard models produce longer outputs, while Shieldstral makes a single-token decision.

These are paper-reported comparisons, not independent evaluation. The baselines do not all use the same output style or reasoning configuration, and aggregate F1 across heterogeneous benchmarks can hide different operating characteristics.

### Data ablation

On the fine-grained taxonomy validation set:

| Training stage | Precision | Recall | F1 | Incremental F1 |
| :--- | ---: | ---: | ---: | ---: |
| Base Ministral-3B | `0.0` | `0.0` | `0.0` | — |
| + transformed public data | `90.8` | `46.0` | `61.1` | `+61.1` |
| + generated taxonomy data | `75.9` | `95.0` | `84.4` | `+23.3` |

The base model defaults to predicting safe. Public data creates a conservative, high-precision classifier. Synthetic contrastive data sharply increases recall and fine-grained discrimination, at some cost to precision.

This precision-recall movement is as important as the F1 gain. In deployment, the preferred point depends on whether false negatives or false positives are more costly.

## 12. What is genuinely transferable

### Turn incompatible labels into conditional questions

When datasets use different schemas, do not always force them into one global label space. Encode the original decision criterion in the input and reduce the output to a common primitive.

### Hold content constant when generating negatives

Changing only the query prevents the model from using generic properties of the document as a shortcut. This is stronger than pairing harmful and benign documents.

### Use sibling categories as hard negatives

Taxonomic proximity controls difficulty. Siblings teach fine boundaries; random categories teach only coarse discrimination.

### Separate training and evaluation ontologies

Policy generalization cannot be measured by evaluating on the same label names used during training. Change category names, granularity, grouping, prompts, generators, and seeds.

### Preserve several specialized solutions

Public-data calibration and synthetic-policy adaptability pull training in different directions. Separate checkpoints followed by merging can preserve both better than one compromise mixture, although joint multi-objective training should also be tested.

### Keep the classifier output cheap

For high-volume moderation, a one-token score can be more useful than a long explanation. Reasoning can be reserved for ambiguous cases in a cascade.

## 13. Important limitations

### The training recipe is not reproducible

The paper discloses the conceptual data recipe but omits enough optimization and mixture detail that reproducing the checkpoint from the paper alone is not possible.

### Sample count overstates independent information

The `54.1M` total includes:

- multiple policy questions per document;
- positive duplication for balance;
- template paraphrases;
- ancestor-category positives;
- multimodal query mutations.

These are useful training views, but not `54.1M` independent semantic examples.

### Adaptability remains in-domain

The evaluation taxonomy is structurally different, but most superclasses have training analogues. The experiment shows transfer across policy wording and boundaries within safety, not unrestricted interpretation of arbitrary novel policies.

### Synthetic evaluation can share generator biases

Different generation and verification models reduce direct leakage, but LLM-generated training and test examples may still share recognizable style, simplicity, and taxonomy assumptions.

### The score may be miscalibrated

Normalizing only the `yes` and `no` logits gives a convenient bounded score. It does not establish calibration across languages, policy prompts, modalities, or changes in prevalence.

### F1 hides deployment costs

Moderation is often asymmetric. Missing severe harm and blocking benign content do not have equal cost. Per-category precision-recall curves, calibration error, worst-group behavior, and cost-weighted metrics would be more operationally informative.

### Efficiency is asserted more than measured

The one-token design is logically cheaper than long safeguard reasoning, but the paper does not report production latency, throughput, memory, batching, or cost comparisons.

### Visual policy adaptability is narrower

The multimodal pipeline uses a fixed `14`-subcategory taxonomy and far fewer samples than text. The broader claim of free-form policy adaptability is better established for text than for images.

### Safety policy itself remains underspecified

Natural-language policies can be contradictory, ambiguous, adversarial, or incomplete. The model still needs policy validation, threshold calibration, audit logs, escalation, and defense against prompt injection.

## 14. Production design implications

A practical moderation service could use Shieldstral-like classifiers in a cascade:

```text
request or response
        |
        v
policy selection and validation
        |
        v
fast adaptive guard classifier
        |
        +-- high-confidence safe ------> continue
        |
        +-- high-confidence unsafe ----> block or transform
        |
        +-- uncertain -----------------> larger reasoning guard or human review
```

Production requirements extend beyond the model:

- version each policy prompt;
- prevent untrusted users from replacing the system policy;
- calibrate thresholds per domain and severity;
- measure false positives and false negatives separately;
- monitor score and content drift;
- preserve decisions for audit and appeal;
- evaluate interactions between input and output guards;
- support fail-open or fail-closed behavior by risk class;
- maintain deterministic fallbacks when the guard is unavailable;
- red-team policy injection and obfuscated multimodal attacks.

The classifier should be one component of a safety system, not the complete policy enforcement mechanism.

## Practical Takeaways

- The novel part is the task and data construction, not the `3B` architecture.
- Represent the deployment policy in the classifier input instead of fixing it entirely in the weights.
- Train the same document against positive and negative policy questions.
- Prefer sibling-category hard negatives to easy random negatives.
- Treat instruction strictness as a feature that still requires empirical calibration.
- Track unique content, constructed views, and sampling weight separately.
- Evaluate using a separately designed taxonomy and different generation pipeline.
- Interpret the reported adaptability as in-domain policy transfer, not arbitrary policy understanding.
- LoRA matching full SFT is a task-specific result based on limited ablations.
- A one-token guard can be the fast first stage in a moderation cascade.
- F1 alone is inadequate for production safety decisions.

## Source

- [Shieldstral](https://arxiv.org/abs/2607.25857)

## Related

- [Large Language Model Serving](/atlas/ai/inference-serving/serving-architectures/large-language-model-serving)
- [Agentic Training Data and Environment Synthesis](/atlas/ai/training/data/agentic-training-data-and-environment-synthesis)
- [Data Mixture Optimization](/atlas/ai/training/data/data-mixture-optimization)
- [LoRA vs. Full Fine-Tuning](/atlas/ai/training/optimization/lora-vs-full-finetuning)
- [Cross-Entropy Loss](/atlas/ai/training/losses/cross-entropy-loss)
- [A/B Testing](/atlas/ai/evaluation-experimentation/a-b-testing)
