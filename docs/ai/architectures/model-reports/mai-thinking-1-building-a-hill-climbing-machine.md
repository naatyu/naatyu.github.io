---
title: "MAI-Thinking-1: Building a Hill-Climbing Machine"
date: 2026-06-08
lastmod: 2026-06-08
tags:
  - ai/llm
  - models
  - pretraining
  - reinforcement-learning
draft: false
---

## Summary

Microsoft's MAI-Thinking-1 report is unusually valuable because it treats frontier model development as a full-stack optimization problem rather than a single-model story. The most reusable parts are not the headline benchmark scores, but the methodology: scaling ladders, efficiency gain, aggressive deduplication, data-mixture search under scale uncertainty, long-context extension, RL stabilization, and goodput-oriented training systems.

This note intentionally extracts the report's **pretraining, RL, long-context, and systems** lessons. It does **not** focus on the evaluation and red-teaming sections.

## Concepts

- **Hill-climbing machine:** a model-development process that continuously improves data, architecture, RL, and infrastructure together.
- **Efficiency gain (EG):** how much more compute a baseline needs to match a candidate model's quality.
- **Scaling ladder:** a family of models trained at matched regimes to test whether a design improvement persists with scale.
- **Goodput:** ideal training time divided by actual wall-clock time, including recovery and slowdown overheads.
- **Entropy-controlled RL:** policy optimization where clipping is adapted to maintain a target entropy.

## 1. Model-development philosophy

The report's strongest idea is not a single architectural trick. It is the claim that progress comes from building a process that can climb reliably.

Their three principles are:

- capabilities should be learned, not inherited through third-party distillation
- simplicity is sustainable
- scientific rigor means ladders, ablations, internal metrics, and repeatable infrastructure

This framing is useful because it shifts attention away from one-off tricks and toward:

- whether improvements persist across scale
- whether the system is stable enough to support long climbs
- whether the data and infra support repeated iteration

## 2. Pretraining architecture

MAI-Base-1 is a decoder-only sparse MoE:

- `35B` active parameters
- about `1T` total parameters
- `78` layers
- `30T` pretraining tokens

The architecture mixes several practical choices:

- periodic local/global attention
- alternating dense FFNs and MoE blocks
- GQA
- tied embeddings
- bias-free transformer blocks

### Attention design

They use a `5:1` cadence:

- 5 local attention layers
- 1 global attention layer

Local layers:

- use sliding-window attention with window size `512`
- use RoPE with base frequency `10,000`

Global layers:

- use no positional encoding
- reportedly perform comparably to RoPE here while being more efficient

Other attention details:

- `8` KV heads
- head dimension `128`
- RMSNorm applied to both queries and keys

This is a practical long-context design point:

- most layers are cheap and KV-efficient
- periodic global layers restore full-context mixing

### Feed-forward and MoE design

They alternate:

- dense FFN
- MoE

instead of using medium-sparsity MoE in every layer.

Their empirical claim is important:

- **high-sparsity MoE + dense interleaving** scales comparably to more uniform MoE allocation
- but is better in wall-clock efficiency on their stack

The MoE specifics:

- `top-8 / 512 experts`
- LatentMoE-style shared down-projection before dispatch
- routing based on original representation
- dropless routing

Two reusable lessons:

- interleaving dense and sparse layers can be a better compute/system tradeoff than “MoE everywhere”
- dropless MoE changes both training stability and what load-balancing conclusions you get

## 3. Scaling methodology

This is one of the best sections in the report.

### Scaling ladder

All important ablations are tested using a **scaling ladder**:

- train multiple model sizes
- keep the tokens-per-parameter regime fixed for the ablation
- compare scaling curves, not just one proxy point

They distinguish between regimes:

- many architecture ablations near Chinchilla-like regions: roughly `100-200` TPP
- main production run much more overtrained: roughly `500-1000` TPP

This matters because a choice that helps at one training density may not be best at another.

### Efficiency gain

They define a baseline scaling law:

$$
L = f(C) = AC^{-\alpha} + E
$$

where:

- $C$ is training cost
- $L$ is loss or an aggregated evaluation loss
- $E$ is irreducible loss

Then for a candidate with cost $C'$ and achieved loss $L'$:

$$
EG = \frac{f^{-1}(L')}{C'}
$$

Interpretation:

- `EG = 1.3` means the baseline would need 30% more compute to match the candidate

The important nuance is that they track two versions:

- `EG_FLOPs`
- `EG_Time`

This cleanly separates:

- theoretical modeling efficiency
- actual wall-clock efficiency on a real stack

That distinction is valuable because new architectures are often initially under-optimized in implementation.

## 4. Internal NLL evaluation methodology

Their pretraining-development loop is driven by internal **held-out NLL suites**, not public benchmark chasing.

They use a weighted objective:

$$
\text{Target} = 0.5 \cdot \text{Coding}
+ 0.175 \cdot \text{STEM}
+ 0.175 \cdot \text{Math}
+ 0.1 \cdot \text{General}
+ 0.05 \cdot \text{Multilingual}
$$

This is important because it makes priorities explicit. The objective is not “generic pretraining quality.” It is a weighted product decision.

Their main argument for NLL-based pretraining evals:

- much cheaper than generative benchmark loops
- less sensitive to formatting accidents
- easier to run exhaustively
- more directly aligned with the pretraining objective

This is useful even if you do care about downstream benchmarks:

- pretraining development needs a cheap, stable signal
- public evals are too noisy and too contaminated for day-to-day steering

## 5. Data pipeline and mixture selection

This is another very strong section.

### In-house data stance

They emphasize:

- publicly available + licensed human-generated data
- no synthetic data in pretraining
- effort to detect and remove AI-generated content
- no use of open-source training datasets as packaged corpora

That policy itself is less reusable than the methods they built around it.

### Data extraction

They do **not** insist on one canonical parser.

Depending on the source, they use:

- structured parsers
- hand-built extractors
- LLM/agent-based filtering or extraction
- training on raw markup when conversion loses too much signal

The useful lesson is:

> extraction quality is source-dependent, and a “universal parser” mindset can quietly destroy the most valuable content.

### Deduplication and memorization control

They apply several distinct dedup stages:

- boilerplate removal
- exact dedup
- fuzzy dedup with MinHash LSH
- template-level dedup
- semantic dedup via embeddings

The report strongly links dedup to scaling behavior:

- large models are more sensitive to redundancy
- duplicate-heavy corpora reduce effective novelty
- scaling degrades once the model saturates repeated content

They also do **cross-dataset dedup with global drop order**:

- if similar content appears in multiple datasets
- keep it only in the highest-priority source

This is operationally important because “dataset A improved” can actually mean “dataset A stole overlap from dataset B.”

### Data-mixture search

Their data-mixture optimization is built around:

- a weighted NLL objective
- many small-scale models
- local and global search over mixture weights
- then scale-up validation

Two especially useful ideas:

1. **epoch caps are part of mixture optimization**
2. **small-scale rankings can invert at larger scale**

They give a concrete failure case where a STEM-heavy mixture won at small scale but lost to a code-heavier mixture at larger scale.

That is a direct warning against naive rank invariance assumptions in datamix optimization.

### Final pretraining mix

The final mix is heavily coding- and reasoning-biased:

- Code: `54.6%`
- STEM: `15.8%`
- Math: `5.4%`
- Web text: `14.9%`
- PDFs: `4.7%`
- Books/journals: `3.1%`
- Multilingual other: `1.6%`

The more interesting point is not the exact percentages, but the repetition structure:

- Math sampled `5.28x`
- Code sampled `2.22x`
- Web/PDF sampled well below `1x`

So the model is not just “trained on 30T tokens.” It is trained on a carefully repeated curriculum over a much smaller novelty base.

## 6. Training recipe

### Training phases

Three-stage process:

- pretraining: `30T` tokens at `16,384` context on `8,192` GB200 GPUs
- mid-training 1: `3.4T` tokens at `65,536` context on `8,192` GPUs
- mid-training 2: `150B` tokens at `262,144` context on `4,096` GPUs

Mid-training is used not only for context extension but also for reweighting toward STEM/math/code.

### Optimizer and regularization

They use AdamW with:

- $\beta_1 = 0.95$
- $\beta_2 = 0.925$
- $\epsilon = 10^{-8}$

Other details:

- global grad norm clip `1.0`
- peak LR `2e-4`
- minimum LR `2e-5`
- warmup about `12B` tokens
- cosine decay
- dropout `0.15`

Two notable points:

- they use unusually high dropout for this regime
- they explicitly say decaying less aggressively improved post-RL results

That is a useful bridge between pretraining recipe and later-stage trainability.

### Attention zero-init for MoE stability

This is a particularly interesting trick.

At initialization, near-uniform attention behaves like causal mean pooling, which reduces token diversity and can produce severe MoE imbalance downstream.

They address this by initializing attention output to zero:

- set the output RMSNorm gains to zero

So the model initially behaves more like stacked feed-forward token processors, and cross-token interactions ramp in over training.

This is a concrete stabilization trick worth remembering for MoE stacks.

### Precision recipe

Their numerics stack is very explicit:

- BF16 default weights and activations
- FP8 E4M3 for forward GEMMs
- FP8 E5M2 for data gradients
- BF16 compute for weight gradients
- FP32 gradient accumulation
- delayed scaling with 1024-step amax history

They keep many sensitive ops in FP32:

- residual stream
- pre-softmax activations
- router weights
- embedding weights
- optimizer state
- data-parallel reductions

This is a practical recipe, not just “we trained in FP8.”

## 7. Long-context extension

This is one of the most reusable parts of the report.

Their core result:

- you do not need to pay long-context cost throughout training
- a short extension phase at the end can do most of the job

They progressively extend context:

- midtrain at shorter lengths
- then extend to the final target length with a much shorter run

Two strong takeaways:

1. **Most long-context adaptation happens quickly**
2. **Long-context extension mostly calibrates existing representations rather than creating new capability from scratch**

They report that most of the long-context NLL improvement happens in the first `1-10%` of the extension phase.

They also find:

- short-context quality does not materially suffer from later long-context training
- repacking the same data mixture at larger sequence lengths minimizes distribution shift

The final recipe they choose is conservative:

- `64K` mid-training
- then `140B` tokens of `256K` extension

## 8. RL climb

Unlike many reports, this RL section is worth extracting for methodology rather than only results.

### Objective

They start from a GRPO-style token-level objective with response-level normalized advantages.

The notable part is not plain GRPO, but the modifications:

- adaptive entropy control
- outer ratio clip
- pass-rate-based problem filtering
- top-p mask replay

### Adaptive entropy control

They dynamically relax the upper clip bound to keep policy entropy near a target.

This is a practical answer to a real RL problem:

- too much freedom -> entropy explosion
- too little -> entropy collapse

The mechanism acts like an automatic entropy regularizer without an explicit entropy bonus term.

### Outer ratio clip

They add a hard outer clip to prevent catastrophic gradient spikes from extreme policy-ratio mismatches.

This is a good example of engineering pragmatism:

- the “clean” PPO/GRPO objective leaves some branches unclipped
- but large async RL systems may need an extra safety boundary

### Problem and rollout filtering

They do pass-rate filtering:

- discard tasks that are too easy
- discard tasks that are too hard

This keeps RL focused on groups with informative relative signal.

They also use top-p mask replay so that training does not backprop through tokens excluded during rollout sampling.

### Self-distillation

Self-distillation is used for:

- moving from prompted behavior to native chat formatting
- recovering from unstable RL runs
- migrating gains to new pretrain/midtrain checkpoints

Important findings:

- about `O(1M)` reasoning traces are enough
- later-climb traces matter more than early ones
- prompt diversity matters more than many traces per prompt
- long-context behavior can be forgotten during self-distillation if you only train on older short-context traces

This makes self-distillation a continuation mechanism, not just a cleanup stage.

## 9. Training systems and cluster lessons

The training stack is an important part of the report's value.

### YOLO

Their in-house training system supports:

- custom kernels
- flexible sharding annotations
- multiple parallelism modes
- dropless MoE
- activation offload/checkpointing

The most reusable design idea is that sharding annotations are **descriptive**, not magical:

- they describe tensor layout
- they do not automatically inject communication into the graph

This helps avoid accidental synchronization points.

### Determinism

They treat determinism as a first-class systems requirement.

That includes:

- fixed batch order
- deterministic kernel reductions
- stable MoE top-k tie-breaking
- stable collective topology
- full checkpoint state including FP8 scaling history and RNG state

The point is broader than reproducibility:

- determinism improves debugging
- determinism improves confidence in infra changes
- determinism turns training correctness into something testable

### Fault tolerance and checkpointing

They emphasize:

- asynchronous checkpointing
- distributed checkpointing
- hot-standby style fast recovery
- restart validation via deterministic comparisons

This is a good reminder that failure cost is not only downtime:

- it is also recomputation
- plus restart latency
- plus altered placement and degraded MFU after recovery

### Goodput over raw MFU

Their production KPI is **goodput**, not just MFU.

Goodput captures:

- crash overhead
- recomputation
- checkpoint pauses
- startup delays
- silent slowdowns

This is a better systems metric for frontier training because it prices both visible failures and invisible inefficiency.

## 10. Reusable takeaways

- Treat architecture, data, RL, and systems as one optimization loop.
- Use scaling ladders, not single-scale proxy wins, to make pretraining decisions.
- Measure both `EG_FLOPs` and `EG_Time`.
- Deduplication is a scaling intervention, not just a cleanliness step.
- Do not trust small-scale datamix rankings without scale-up validation.
- Long-context extension should usually be staged and late.
- RL stability often comes from extra control mechanisms, not pure textbook objectives.
- Goodput is a better production metric than MFU alone.

## Related

- [Scaling Ladders and Efficiency Gain](/atlas/ai/training/scaling/scaling-ladders-and-efficiency-gain)
- [Overtraining and Inference-Aware Scaling](/atlas/ai/training/scaling/overtraining-and-inference-aware-scaling)
- [Data Mixture Optimization](/atlas/ai/training/data/data-mixture-optimization)
- [Deduplication and Memorization Control](/atlas/ai/training/data/deduplication-and-memorization-control)
- [Progressive Context Extension](/atlas/ai/training/scaling/progressive-context-extension)
- [Reinforcement Learning for LLMs](/atlas/ai/training/optimization/reinforcement-learning-for-llms)
- [Asynchronous RL Infrastructure](/atlas/systems/infrastructure/asynchronous-rl-infrastructure)
- [Goodput, Determinism, and Fault Tolerance](/atlas/systems/infrastructure/goodput-determinism-and-fault-tolerance)
- [No Positional Embeddings (NoPE)](/atlas/ai/architectures/transformers/no-positional-embeddings-nope)

## Sources

- Microsoft AI, *MAI-Thinking-1: Building a Hill-Climbing Machine*: https://microsoft.ai/wp-content/uploads/2026/06/main_20260602_2.pdf
