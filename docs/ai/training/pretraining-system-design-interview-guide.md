---
title: "LLM Pretraining System Design: Interview Guide"
date: 2026-08-05
lastmod: 2026-08-05
tags:
  - ai/training
  - llm
  - pretraining
  - system-design
  - interview-prep
draft: false
---

## Summary

An interview for a pretraining-oriented AI engineer can include ML system design even when the role is not explicitly called "ML infrastructure." The expected depth is usually not distributed-database trivia. It is the ability to turn a model objective and a fixed compute budget into a trainable, measurable, and recoverable system.

A strong answer connects five planes:

1. **Product and capability:** what the model must be good at and how success is measured.
2. **Data:** what it learns from, in which proportions, and with what leakage controls.
3. **Model and optimization:** architecture, token budget, batch size, schedule, precision, and stability.
4. **Distributed execution:** memory, parallelism, topology, communication, throughput, and recovery.
5. **Evaluation and operations:** online diagnostics, downstream evaluations, checkpoints, incident response, and post-training handoff.

The interviewer is usually testing whether the choices form one coherent system. Naming technologies is less important than deriving decisions from requirements, quantifying them, and identifying failure modes.

## 1. Start by reducing ambiguity

Do not immediately choose a model or framework. Clarify the objective and the constraints.

### Capability requirements

- General language model, code model, multilingual model, or domain specialist?
- Base model, instruction model, or both?
- Which languages, repositories, domains, and context lengths matter?
- Is the target benchmark performance, downstream fine-tunability, inference economics, or all three?
- Are tool use and long-context behavior pretraining objectives or post-training objectives?

### Resource requirements

- Accelerator type and count.
- Available wall-clock time.
- Network topology and bandwidth.
- Storage throughput and capacity.
- Maximum acceptable run failure probability.
- Data and software licensing constraints.
- Training budget and reserved ablation budget.

### Operational requirements

- How often are checkpoints and evaluations required?
- Can failed nodes be replaced dynamically?
- Must training be deterministic across restarts?
- What privacy, provenance, and auditability guarantees are required?
- What serving hardware will ultimately host the model?

Conclude the clarification phase by stating a compact objective such as:

> Maximize code-generation and repository-understanding quality under a fixed three-month H100 budget, while preserving general language ability and producing a checkpoint that can be served economically.

## 2. The reusable answer structure

For most pretraining design questions, use this order:

1. Define capabilities, constraints, and evaluation gates.
2. Compute the available training FLOPs.
3. Select a model-size and token-budget region.
4. Define the architecture and tokenizer.
5. Construct and validate the data mixture.
6. Select optimization hyperparameters and a scaling strategy.
7. Fit the model into memory and map parallelism onto the topology.
8. Design the input, checkpoint, evaluation, and observability pipelines.
9. Run progressively larger rehearsals before the main run.
10. Reserve time and compute for recovery, annealing, continued pretraining, and post-training.

This order matters. It prevents choosing a fashionable architecture before knowing whether it fits the budget or target deployment.

## 3. Capacity planning before architecture commitment

For a dense transformer, a useful first-order training estimate is:

$$
F_{train}\approx 6PT,
$$

where $P$ is the number of active non-embedding parameters and $T$ is the number of training tokens. Full activation recomputation can move actual executed work closer to $8PT$. Long-context attention, MoE routing, embeddings, optimizer work, and communication require additional accounting.

If there are $N$ accelerators, each with peak throughput $C$, expected model FLOPs utilization $u$, and available time $t$, the useful compute budget is approximately:

$$
F_{available}=NCut.
$$

The first feasibility condition is:

$$
6PT \le F_{available}.
$$

Do not use peak hardware FLOPs as achieved performance. State an MFU assumption and give a sensitivity range. A design that only works at an optimistic MFU has no operational margin.

### Budget allocation

Do not spend 100% of the nominal budget on the final run. A plausible planning envelope is:

- 5--10% for data, architecture, and systems ablations;
- 5--10% for scale-up rehearsals and integration tests;
- 70--80% for the main pretraining run;
- 5--10% for recovery, annealing, continued pretraining, or a corrected final stage.

The exact split depends on how mature the stack is. A new cluster, data pipeline, or architecture requires more contingency.

See [LLM Training Capacity Planning](/atlas/ai/training/scaling/llm-training-capacity-planning) for worked calculations.

## 4. Choose the model and token budget together

Scaling laws constrain a useful region; they do not make the final decision.

### Dense versus MoE

A dense model is easier to train, debug, checkpoint, and serve. It is a strong default when engineering capacity is limited.

MoE can increase total capacity without proportional active FLOPs, but adds:

- expert parallelism and AllToAll traffic;
- load-balancing and routing stability problems;
- larger checkpoints and more difficult weight synchronization;
- topology sensitivity;
- more complex inference capacity planning.

Choose MoE when the cluster topology, framework, and serving plan are already prepared for it—not merely because the total parameter count looks attractive.

### Overtraining and deployment economics

Compute-optimal training is not always product-optimal. Training a smaller model on more tokens may cost more during training but reduce inference cost for every future request. State whether the objective is minimum pretraining loss per FLOP or minimum lifetime cost at a required quality.

### Architecture decisions

Discuss the choices that materially affect quality or systems behavior:

- width, depth, and head dimension;
- MHA, GQA, or MQA;
- gated MLP ratio;
- normalization and residual formulation;
- positional strategy and target context length;
- vocabulary and embedding tying;
- dense versus sparse layers;
- activation and initialization;
- compatibility with efficient attention kernels.

Prefer a proven baseline unless the interview explicitly asks for architecture research. Every new component creates interaction risk at scale.

## 5. Tokenization is part of the system

Tokenizer design changes sequence length, compute allocation, multilingual balance, and code representation.

For a coding model, evaluate:

- bytes or characters per token by programming language;
- common operators, indentation, whitespace, and identifiers;
- repository metadata and special file separators;
- Unicode and multilingual behavior;
- vocabulary size versus embedding cost;
- compatibility with infilling and long-context formats.

A mixture balanced by documents can become unbalanced after tokenization. Measure the actual token distribution, not only source bytes or document counts.

## 6. Data system design

For many training runs, data quality and mixture design matter more than small architecture changes.

### Data lifecycle

A defensible pipeline is:

1. Acquire and register immutable raw snapshots.
2. Record source, license, timestamp, language, and lineage.
3. Parse and normalize without destroying semantic structure.
4. Apply quality, safety, and domain classifiers.
5. Remove exact, near, and semantic duplicates where appropriate.
6. Detect benchmark and evaluation contamination.
7. Assign mixture domains and sampling weights.
8. Tokenize, shard, and generate deterministic manifests.
9. Run statistical and manual quality audits.
10. Version the complete dataset recipe.

### Quality is multidimensional

Do not describe data as simply high or low quality. Track at least:

- correctness and coherence;
- information density;
- originality and duplication;
- source authority;
- formatting and parse integrity;
- toxicity, PII, secrets, and malware risk;
- licensing and provenance;
- domain, language, and difficulty;
- synthetic-data generator and verifier quality.

For code, additionally track:

- build and parse success;
- repository versus isolated-file context;
- tests and documentation;
- generated or vendored files;
- permissive versus incompatible licenses;
- secrets and credentials;
- duplicated forks;
- temporal leakage from benchmark solutions.

### Deduplication trade-offs

Deduplication reduces memorization and wasted compute, but aggressive removal can erase legitimate repeated conventions or underrepresented domains. Distinguish:

- exact document deduplication;
- near-duplicate document deduplication;
- span-level deduplication;
- repository fork and generated-file handling;
- train-evaluation decontamination.

Always define the unit and threshold. "We deduplicated the dataset" is not a complete design.

### Mixture design

Sampling weights determine where gradient updates are spent. Useful strategies include:

- fixed domain weights;
- temperature sampling to avoid domination by large sources;
- quality-weighted sampling;
- staged mixtures, such as broad early training and code-heavy late training;
- adaptive reweighting based on proxy evaluations.

Watch for regression in general language capability when specializing. A late code-heavy phase can improve target skills while catastrophic forgetting is monitored on held-out general domains.

### Data-plane reliability

The data loader must sustain aggregate consumption without starving accelerators. Design for:

- sequential sharded reads rather than many small random files;
- local or node-level caching;
- asynchronous prefetch and decompression;
- deterministic sample order and resumption;
- corrupted-shard quarantine;
- per-source counters and checksums;
- backpressure and observable queue depth.

A training restart must not silently replay or skip a large part of the data distribution.

## 7. Optimization design

### Baseline recipe

A conventional dense-transformer baseline often uses:

- AdamW or a carefully validated alternative;
- learning-rate warmup followed by decay or warmup-stable-decay;
- mixed precision with selected operations in higher precision;
- gradient clipping;
- activation checkpointing;
- sequence packing;
- decoupled weight decay;
- explicit initialization and residual scaling rules.

The exact hyperparameters should be established through small-scale experiments and scaling rules rather than copied blindly from another architecture.

### Global batch size

Global batch size is:

$$
B_{global}
=
B_{micro}
\times G
\times D,
$$

where $G$ is gradient accumulation and $D$ is the data-parallel degree. In token units:

$$
B_{tokens}=B_{global}S.
$$

Batch size affects gradient noise, optimizer behavior, communication frequency, and the number of optimizer steps. Increasing it to improve hardware utilization can degrade optimization if the learning-rate and token schedule are not adjusted.

### Scaling experiments

Use a ladder of model and run sizes to determine:

- stable peak learning rate;
- batch-size regime;
- initialization and clipping thresholds;
- loss-versus-compute trend;
- data-mixture effects;
- throughput and memory behavior;
- whether improvements transfer with scale.

Prefer ablations that preserve the quantity whose effect is being measured. If comparing architectures, match active parameters, training FLOPs, tokens, and data order as closely as practical.

## 8. Memory accounting

Training memory is not just parameter storage:

$$
M_{total}
=
M_{params}
+M_{grads}
+M_{optimizer}
+M_{activations}
+M_{temporary}
+M_{fragmentation}.
$$

State:

- parameter and gradient precision;
- optimizer-state precision;
- whether master weights exist;
- sharding stage;
- activation checkpointing policy;
- microbatch size and sequence length;
- attention kernel;
- temporary collective and kernel buffers;
- safety margin.

Avoid quoting one universal "bytes per parameter" number without its assumptions. Activations can dominate at long sequence lengths, while optimizer states dominate many shorter-sequence dense runs.

## 9. Map parallelism onto hardware topology

The main parallelism dimensions are:

- **Data parallelism:** replicas process different batches and synchronize gradients.
- **Fully sharded data parallelism:** parameters, gradients, and optimizer states are sharded.
- **Tensor parallelism:** individual matrix operations are split across devices.
- **Pipeline parallelism:** layer groups are placed on different stages.
- **Context or sequence parallelism:** sequence work or activations are distributed.
- **Expert parallelism:** experts are distributed across ranks for MoE.

The key design rule is topology awareness:

- Put high-frequency, latency-sensitive tensor-parallel collectives on the fastest links, usually within a node or tightly connected island.
- Use data parallelism across slower boundaries when possible.
- Size pipeline stages to reduce bubbles and balance per-stage work.
- Use context parallelism when long sequences make activations or attention infeasible on one group.
- Align expert groups with AllToAll-capable topology and monitor imbalance.

### Communication reasoning

For each parallelism dimension, be able to explain:

1. What tensor is communicated?
2. How many bytes are transferred per step?
3. How often does the collective occur?
4. Is the operation latency- or bandwidth-sensitive?
5. Can communication overlap computation?
6. What happens when one rank is slow?

Do not answer topology questions with a generic "use 3D parallelism." Give a tentative mapping and say what profiling result would cause you to change it.

## 10. Throughput, MFU, and goodput

Model FLOPs utilization is useful:

$$
MFU
=
\frac{\text{useful model FLOPs per second}}
{\text{aggregate theoretical peak FLOPs per second}}.
$$

But production planning depends on goodput:

$$
\text{goodput}
=
\frac{\text{useful committed training progress}}
{\text{wall-clock time}}.
$$

High MFU during healthy steps can coexist with poor goodput because of:

- compilation and startup time;
- data stalls;
- checkpoint pauses;
- evaluation pauses;
- node failures and rollback;
- stragglers;
- repeated unstable segments;
- time spent reconfiguring the job.

Report tokens per second, step time distribution, MFU convention, and end-to-end goodput together.

## 11. Checkpointing and fault tolerance

At large scale, failure is part of the expected execution path.

### Checkpoint contents

A resumable checkpoint may need:

- model weights;
- optimizer and scheduler state;
- gradient-scaler state;
- global step and consumed-token count;
- data-loader cursor and shuffle state;
- random-number generator states;
- topology and sharding metadata;
- data and code version identifiers.

### Checkpoint strategy

Balance:

- checkpoint writing time;
- storage bandwidth and retention cost;
- expected failure rate;
- rollback distance;
- asynchronous-write consistency;
- restore time at full cluster scale.

Test restoration before the main run. A checkpoint is not valid merely because files were written.

### Deterministic resumption

Exact bitwise determinism may be expensive or unavailable, but semantic restart correctness is non-negotiable. Verify that restart preserves:

- sample sequence or documented equivalent behavior;
- optimizer-step count;
- learning-rate schedule;
- loss scale;
- parameter and optimizer consistency;
- no shard duplication or omission.

## 12. Observability and stability

### Model and optimizer signals

Monitor:

- total and per-domain loss;
- gradient norm and clipping rate;
- update-to-weight ratios;
- activation and logit statistics;
- learning rate and effective batch size;
- NaN/Inf counters and loss-scale changes;
- attention entropy or routing statistics when relevant;
- validation perplexity and downstream proxies.

### System signals

Monitor:

- step-time percentiles, not only the mean;
- tokens per second and MFU;
- time in compute, collectives, input, checkpointing, and idle states;
- GPU memory and allocator fragmentation;
- network throughput and collective skew;
- dataloader queue depth;
- CPU, storage, and host-to-device utilization;
- hardware errors and rank restarts.

Correlate model and system telemetry by global step. A loss spike without the corresponding data shard, precision state, and hardware events is difficult to diagnose.

### Loss-spike response

A credible incident procedure is:

1. Stop or isolate before corrupting many additional tokens.
2. Preserve the failing checkpoint, batch identity, logs, and environment.
3. Determine whether the issue is data, optimizer, precision, kernel, or hardware related.
4. Reproduce on fewer ranks if possible.
5. Resume from a verified earlier checkpoint with one controlled mitigation.
6. Document any data skips or schedule changes.

Do not automatically skip every batch that causes a spike; that can hide a systematic numerical or optimization problem.

## 13. Evaluation architecture

Training loss is necessary but insufficient.

### Evaluation layers

Use several layers with different cadence:

- frequent validation loss on stable domain slices;
- lightweight capability proxies during training;
- less frequent full downstream suites;
- human or expert review for target domains;
- final contamination-aware and post-training evaluations.

For code models, combine:

- next-token validation by language and source type;
- isolated function-generation tests;
- repository-level completion and editing;
- compilation and execution;
- private tests and contamination-resistant tasks;
- security, license, and memorization probes;
- long-context retrieval and dependency understanding.

### Evaluation integrity

Version prompts, harnesses, dependencies, decoding parameters, and execution environments. A benchmark score without its harness is not reproducible.

Contamination controls should include exact and approximate matching against prompts, solutions, repositories, and known benchmark derivatives. Temporal holdouts help when source timestamps are trustworthy.

### Decision gates

Define in advance what causes the team to:

- continue unchanged;
- adjust the mixture;
- reduce the learning rate;
- roll back;
- stop early;
- select a checkpoint for annealing or post-training.

This reduces decision-making driven by one noisy benchmark after substantial compute has already been spent.

## 14. Progressive scale-up

Never make the largest run the first end-to-end test.

A useful progression is:

1. **Single-device correctness:** loss decreases, masks and packing are correct, checkpoint restores.
2. **Small distributed equivalence:** sharded and unsharded runs agree within expected numerical tolerance.
3. **Topology test:** validate collectives, parallel groups, and memory assumptions on multiple nodes.
4. **Long soak test:** expose memory leaks, dataloader exhaustion, thermal issues, and checkpoint accumulation.
5. **Scale rehearsal:** run the actual topology, sequence length, batch, evaluation, and recovery path.
6. **Main run:** begin only after throughput and restart acceptance criteria pass.

Small runs validate semantics. Full-topology rehearsals validate systems behavior. Neither substitutes for the other.

## 15. Worked interview prompt

> You have 256 H100 GPUs for three months. Design the strongest coding base model you can train.

A structured answer could be:

### 1. Clarify

Ask which H100 variant and interconnect are available, whether three months includes experiments, whether existing weights may be continued, target languages, desired context length, licensing constraints, and the serving envelope.

### 2. Establish compute

Estimate achieved BF16/FP8 throughput per GPU from a comparable model and stack, not the marketing peak. Derive the available FLOPs under low, expected, and high MFU assumptions. Reserve part of the budget for experiments and failures.

### 3. Select a feasible model region

Evaluate several $(P,T)$ pairs satisfying $6PT$ and the deployment target. A smaller, more heavily trained dense model may be preferable to a larger undertrained one if inference cost matters. Use an MoE only if the stack already supports expert routing and the serving plan benefits.

### 4. Define target evaluations before collecting data

Include general language retention, multiple programming languages, code completion, infilling, repository understanding, compilation, tests, security, long context, and contamination-resistant private tasks.

### 5. Construct the mixture

Use licensed repositories with fork-aware deduplication, technical text, documentation, issue/patch histories where permitted, mathematics and reasoning data, and enough general text to preserve language ability. Measure weights after tokenization. Keep evaluation repositories out of training.

### 6. Choose a conservative architecture

Use a proven decoder-only stack with GQA, gated MLPs, efficient attention, stable normalization and initialization, and a tokenizer evaluated on code. Train initially at an efficient context length and extend context in a validated later stage if required.

### 7. Map execution to topology

Place tensor parallelism within high-bandwidth islands, use sharded data parallelism across replicas, and add pipeline or context parallelism only when memory or sequence length requires it. Confirm the plan with a communication and memory model.

### 8. Establish optimization through ladders

Run small models and short proxy runs for learning rate, batch, mixture, initialization, and architecture decisions. Include at least one multi-node soak and restore test.

### 9. Operate the main run

Track domain losses, gradients, throughput, collective time, input stalls, and checkpoint health. Run fixed evaluation slices frequently and full suites at spaced checkpoints. Maintain an incident and rollback procedure.

### 10. Finish deliberately

Reserve compute for learning-rate decay or annealing, a high-quality mixture phase, checkpoint selection, long-context continuation if needed, and the post-training handoff. Do not assume the final chronological checkpoint is the best one.

The answer is strong because every design choice refers back to capability, compute, reliability, or deployment constraints.

## 16. Common follow-up questions

### How do you choose between a larger model and more tokens?

Start with scaling-law estimates, then include data availability, inference cost, target capability, and post-training needs. If serving volume is high, a smaller overtrained model can minimize lifetime cost.

### Why not train at the maximum context length from the beginning?

Long sequences increase activation memory and attention cost, reduce attainable batch size, and may waste compute when most data is short. A staged context-extension phase can be more efficient, but must preserve short-context quality and validate positional behavior.

### How do you know the input pipeline is the bottleneck?

Correlate accelerator idle time with dataloader queue depth, storage throughput, CPU utilization, decompression time, and host-to-device copies. Confirm by replacing real data with synthetic prefetched batches.

### What would cause low MFU?

Small or irregular matrix shapes, excessive activation recomputation, communication exposure, pipeline bubbles, data stalls, imbalance, compiler graph breaks, slow attention kernels, frequent logging, or synchronization in the critical path.

### How do you select parallelism?

First fit memory, then minimize expensive communication on slow links. Estimate collective bytes and frequency, map sensitive groups to high-bandwidth topology, and profile. Parallelism is a hardware-and-model co-design problem.

### How do you change the data mixture during training?

Use versioned manifests and token-based schedules. Validate changes with proxy runs, preserve consumed-token accounting, monitor regression by domain, and record the exact transition in checkpoint metadata.

### How do you prevent benchmark contamination?

Maintain a registry of evaluation prompts, solutions, repositories, and derivatives; perform exact and approximate matching before tokenization; use temporal and private holdouts; and treat suspiciously large benchmark jumps as incidents to investigate.

### What happens when a node repeatedly fails?

Quarantine the node, restore from a verified checkpoint, and measure whether elastic degraded operation or waiting for replacement has higher expected goodput. Verify that topology changes do not alter batch or optimizer semantics unexpectedly.

### When would you stop a run early?

When loss or capability trends fall materially outside validated scaling predictions, instability repeats after controlled mitigation, data corruption is discovered, goodput makes completion infeasible, or a smaller checkpoint already dominates the expected final result after accounting for remaining cost.

### How do you separate a data problem from an optimizer problem?

Replay the failing batch and nearby batches from the same checkpoint, inspect domain and quality metadata, compare gradients and activations, and test a known-good batch. Data-correlated reproducibility suggests the data path; persistence across batches suggests numerical or optimizer state.

### What is training-serving skew for a base model?

Differences in tokenizer, special tokens, precision, positional configuration, attention kernels, context handling, or weight conversion can change behavior. Validate exported checkpoints through the actual serving path before declaring training success.

## 17. What interviewers are evaluating

A strong candidate:

- makes assumptions explicit;
- performs approximate calculations aloud;
- separates peak throughput, MFU, and goodput;
- understands both statistical and systems bottlenecks;
- treats data and evaluation as first-class systems;
- maps parallelism to physical topology;
- designs recovery before failure;
- reserves budget for uncertainty;
- distinguishes a hypothesis from a measured result;
- knows when a simpler architecture is safer.

Weak patterns include:

- choosing a parameter count without a FLOP calculation;
- saying "use Kubernetes" or "use Megatron" in place of a design;
- treating data as one undifferentiated corpus;
- quoting peak hardware throughput as achieved training throughput;
- maximizing MFU while ignoring failed work and checkpoint pauses;
- adding every parallelism dimension without calculating communication;
- monitoring only aggregate training loss;
- assuming the newest checkpoint is automatically the best;
- leaving evaluation and recovery until the end.

## 18. Preparation checklist

Be able to derive or explain without notes:

1. The $6PT$ compute estimate and its limitations.
2. Available compute from device count, achieved throughput, and wall time.
3. Mixed-precision training memory components.
4. Global batch and tokens per optimizer step.
5. Data, tensor, pipeline, context, and expert parallelism.
6. MFU versus hardware FLOPs utilization and goodput.
7. Checkpoint interval trade-offs.
8. Deduplication, decontamination, and mixture design.
9. Scaling ladders and controlled ablations.
10. Loss-spike and node-failure response.
11. Online training metrics versus downstream evaluations.
12. Training-to-serving checkpoint validation.

Practice at least three scenarios:

- fixed accelerator count and deadline;
- fixed monetary budget and target model size;
- an existing run with low throughput or unstable loss.

## Related

- [LLM Training Capacity Planning](/atlas/ai/training/scaling/llm-training-capacity-planning)
- [Transformer Performance Accounting](/atlas/ai/training/scaling/transformer-performance-accounting)
- [Scaling Laws](/atlas/ai/training/scaling/scaling-laws)
- [Data-Constrained Scaling Laws](/atlas/ai/training/scaling/data-constrained-scaling-laws)
- [Overtraining and Inference-Aware Scaling](/atlas/ai/training/scaling/overtraining-and-inference-aware-scaling)
- [Data Mixture Optimization](/atlas/ai/training/data/data-mixture-optimization)
- [Deduplication and Memorization Control](/atlas/ai/training/data/deduplication-and-memorization-control)
- [LLM Training Parallelism Rooflines](/atlas/systems/parallel-computing/llm-training-parallelism-rooflines)
- [Hardware Topology and Parallelism](/atlas/systems/parallel-computing/hardware-topology-and-parallelism)
- [Model FLOPs Utilization](/atlas/systems/performance/model-flops-utilization-mfu)
- [Goodput, Determinism, and Fault Tolerance](/atlas/systems/infrastructure/goodput-determinism-and-fault-tolerance)
- [Choosing an LLM Training Framework](/atlas/systems/infrastructure/choosing-an-llm-training-framework)
- [The Smol Training Playbook](/atlas/ai/training/smol-training-playbook)

## Sources

- [Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556)
- [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)
- [Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism](https://arxiv.org/abs/1909.08053)
- [Efficient Large-Scale Language Model Training on GPU Clusters Using Megatron-LM](https://arxiv.org/abs/2104.04473)
- [ZeRO: Memory Optimizations Toward Training Trillion Parameter Models](https://arxiv.org/abs/1910.02054)
- [Reducing Activation Recomputation in Large Transformer Models](https://arxiv.org/abs/2205.05198)
- [The Pile: An 800GB Dataset of Diverse Text for Language Modeling](https://arxiv.org/abs/2101.00027)
- [Deduplicating Training Data Makes Language Models Better](https://arxiv.org/abs/2107.06499)
- [DataComp-LM](https://arxiv.org/abs/2406.11794)
- [JAX Scaling Book](https://jax-ml.github.io/scaling-book/)
