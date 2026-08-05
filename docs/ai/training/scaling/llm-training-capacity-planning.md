---
title: "LLM Training Capacity Planning"
date: 2026-08-05
lastmod: 2026-08-05
tags:
  - ai/training
  - llm
  - scaling
  - performance
  - system-design
draft: false
---

## Summary

Pretraining system-design interviews frequently require order-of-magnitude calculations. The objective is not false precision. It is to expose assumptions, reject impossible designs quickly, and connect model scale to time, memory, topology, reliability, and cost.

The core worksheet is:

1. Compute available FLOPs from devices, achieved utilization, and time.
2. Allocate only part of that budget to the main run.
3. Find feasible parameter-token pairs using $6PT$.
4. verify memory for parameters, optimizer state, gradients, activations, and buffers.
5. Convert the plan into tokens per second, step time, and optimizer steps.
6. Estimate communication, checkpoint, failure, storage, and evaluation overhead.
7. Give a sensitivity range instead of one optimistic number.

## 1. Units worth memorizing

Use scientific notation consistently:

- thousand: $10^3$;
- million: $10^6$;
- billion: $10^9$;
- trillion: $10^{12}$;
- TFLOP/s: $10^{12}$ FLOPs per second;
- PFLOP/s: $10^{15}$ FLOPs per second;
- EFLOP/s: $10^{18}$ FLOPs per second;
- one day: $86{,}400$ seconds;
- 30 days: $2.592\times10^6$ seconds;
- 90 days: $7.776\times10^6$ seconds.

A useful habit is to keep all intermediate values in scientific notation and round only the final planning result.

## 2. Available training compute

Let:

- $N$: accelerator count;
- $C$: relevant dense peak FLOP/s per accelerator;
- $u$: expected model FLOPs utilization;
- $t$: wall-clock seconds.

Then:

$$
F_{available}=NCut.
$$

The precision matters. Do not use an FP8 or sparse peak when the proposed training path uses dense BF16 operations unless the FLOP convention explicitly reconciles them.

### Sensitivity table

Always compute at least three cases:

| Case | MFU | Downtime | Interpretation |
|---|---:|---:|---|
| Conservative | 30% | 15% | New or unstable stack |
| Expected | 40% | 8% | Mature but realistic stack |
| Optimistic | 50% | 3% | Well-tuned, stable workload |

MFU normally describes healthy-step compute efficiency. Downtime accounts for startup, failures, checkpoints, evaluations, and other intervals without committed progress. Avoid silently folding both into one favorable utilization number.

Useful committed compute is therefore:

$$
F_{committed}=NCut(1-d),
$$

where $d$ is the downtime fraction.

## 3. Convert FLOPs into parameter-token choices

For a conventional dense transformer:

$$
F_{train}\approx 6PT.
$$

Therefore:

$$
T\approx\frac{F_{train}}{6P},
\qquad
P\approx\frac{F_{train}}{6T}.
$$

This estimate counts useful forward and backward matmul FLOPs. It undercounts some long-context attention work and does not represent wall-clock overhead. Full-block activation recomputation may make executed work closer to $8PT$ even when reported MFU uses the $6PT$ convention.

### MoE adjustment

For MoE, use active parameters to estimate most token-level matmul FLOPs, while using total parameters for checkpoint and much of the memory/storage analysis. Add routing, imbalance, padding, and AllToAll costs separately.

Never describe an MoE plan with only one parameter count.

## 4. Worked compute example: 256 H100s for 90 days

Assume, solely for interview arithmetic:

- 256 H100 SXM accelerators;
- a dense BF16 peak $C=989$ TFLOP/s per accelerator;
- expected MFU $u=40\%$;
- 90 days of allocation.

The nominal useful-compute estimate is:

$$
F_{available}
=256
\times989\times10^{12}
\times0.40
\times7.776\times10^6
\approx7.88\times10^{23}\text{ FLOPs}.
$$

Suppose 25% of the allocation is reserved for experiments, integration, evaluation, failures, and finishing stages. The main run receives:

$$
F_{main}\approx5.91\times10^{23}\text{ FLOPs}.
$$

Several first-order dense-model choices fit the same compute envelope:

| Parameters | Tokens | Approximate $6PT$ |
|---:|---:|---:|
| 7B | 14.1T | $5.92\times10^{23}$ |
| 13B | 7.6T | $5.93\times10^{23}$ |
| 30B | 3.28T | $5.90\times10^{23}$ |
| 70B | 1.41T | $5.92\times10^{23}$ |

These are feasibility points, not equivalent-quality choices. The decision also depends on:

- available unique high-quality tokens;
- inference cost and serving memory;
- desired model capacity;
- scaling-law prediction;
- optimization risk;
- post-training budget;
- whether attention FLOPs are significant at the target context length.

The appropriate interview statement is:

> The compute budget defines a curve of feasible parameter-token pairs. I would compare points on that curve using scaling experiments, data availability, and lifetime inference economics.

## 5. Tokens per second and step time

Aggregate achieved useful throughput is:

$$
C_{achieved}=NCu.
$$

For the previous example:

$$
C_{achieved}
=256\times989\times10^{12}\times0.40
\approx1.013\times10^{17}\text{ FLOP/s}.
$$

For a $30$B model, useful FLOPs per token are approximately:

$$
6P=1.8\times10^{11}\text{ FLOPs/token}.
$$

Thus expected aggregate throughput is:

$$
\text{tokens/s}
\approx
\frac{1.013\times10^{17}}{1.8\times10^{11}}
\approx563{,}000.
$$

If the global batch contains four million tokens:

$$
t_{step}
\approx
\frac{4\times10^6}{563{,}000}
\approx7.1\text{ seconds}.
$$

Training on $3.28$T tokens requires:

$$
\text{steps}
=
\frac{3.28\times10^{12}}{4\times10^6}
=820{,}000.
$$

At 7.1 seconds per healthy step, this is about 67 days, consistent with assigning roughly 75% of a 90-day allocation to the main run.

This consistency check is valuable: compute-based and step-based estimates should agree.

## 6. Batch arithmetic

Let:

- $B_{micro}$: sequences per device per microbatch;
- $S$: tokens per sequence;
- $G$: gradient-accumulation steps;
- $D$: data-parallel replicas.

Then:

$$
B_{tokens}
=B_{micro}SGD.
$$

Do not multiply by tensor- or pipeline-parallel degree. Those ranks cooperate on the same model replica rather than consuming independent data-parallel batches.

### Example

If:

- $B_{micro}=1$;
- $S=8192$;
- $G=16$;
- $D=32$;

then:

$$
B_{tokens}=1\times8192\times16\times32
=4{,}194{,}304.
$$

At 563,000 tokens/s, this predicts a step time near 7.45 seconds.

State whether padding tokens count as trained tokens. Sequence packing can greatly reduce the gap between processed and useful tokens.

## 7. Parameter-state memory

Build memory from components instead of memorizing one number.

An illustrative mixed-precision Adam configuration might use:

- BF16 parameters: 2 bytes/parameter;
- BF16 gradients: 2 bytes/parameter;
- FP32 master parameters: 4 bytes/parameter;
- FP32 first moment: 4 bytes/parameter;
- FP32 second moment: 4 bytes/parameter.

Total:

$$
M_{state}=16P\text{ bytes}.
$$

Some implementations omit FP32 master weights, use different gradient precision, quantize optimizer states, or maintain additional buffers. State the actual layout.

### Examples

| Parameters | BF16 weights only | Illustrative Adam training state at 16 B/P |
|---:|---:|---:|
| 7B | 14 GB | 112 GB |
| 13B | 26 GB | 208 GB |
| 30B | 60 GB | 480 GB |
| 70B | 140 GB | 1.12 TB |

These decimal GB values exclude activations, temporary buffers, fragmentation, and framework metadata.

### Sharding

If all 16 bytes per parameter are perfectly sharded over $D$ ranks:

$$
M_{state/rank}\approx\frac{16P}{D}.
$$

Real peak memory can be higher because parameter gathers and collectives temporarily materialize larger tensors. Sharding solves persistent storage pressure at the cost of communication and temporary memory.

## 8. Activation memory

Activation memory depends on:

- layers;
- microbatch size;
- sequence length;
- hidden width;
- attention implementation;
- tensors retained for backward;
- tensor/sequence/context parallelism;
- checkpointing granularity.

A coarse linear term scales like:

$$
M_{act}\propto B_{micro}SLD,
$$

but naive attention can add $S^2$ intermediates. FlashAttention-style kernels avoid materializing the full attention matrix, changing the memory regime.

Because constant factors depend strongly on the implementation, use an analytical estimate to choose a candidate configuration and then measure peak allocated and reserved memory in a representative full block.

Keep an explicit margin for temporary collective buffers and allocator fragmentation. A configuration that fits with less than a few percent headroom is fragile.

## 9. Communication estimates

For a ring AllReduce over $D$ ranks and a payload of $M$ bytes per rank, a common bandwidth-volume approximation per rank is:

$$
V_{ring}\approx2\frac{D-1}{D}M.
$$

The ideal bandwidth time is:

$$
t_{comm}\gtrsim\frac{V}{BW_{effective}},
$$

plus collective latency and synchronization effects.

This is only a lower bound. Effective bandwidth depends on topology, contention, message sizes, collective algorithm, rank placement, and overlap.

### Communication-compute ratio

Estimate whether an approach can hide communication:

$$
\rho
=
\frac{t_{communication,exposed}}
{t_{step}}.
$$

If $ho$ is high, consider:

- changing parallelism degrees;
- placing the group on faster links;
- increasing compute per communication event;
- overlapping collectives with backward computation;
- reducing pipeline bubbles;
- using sequence parallelism to reduce replicated activations;
- improving expert balance for MoE.

## 10. Checkpoint capacity planning

For $P$ parameters:

- BF16 model weights alone require roughly $2P$ bytes;
- a full training checkpoint may approach the complete parameter-state footprint;
- temporary and metadata overhead must also be included.

For a 30B model:

- BF16 weights: approximately 60 GB;
- illustrative full Adam state: approximately 480 GB.

At an effective aggregate checkpoint bandwidth of 20 GB/s, 480 GB takes at least:

$$
\frac{480}{20}=24\text{ seconds}
$$

before filesystem, metadata, synchronization, and consistency overhead.

If the observed pause is 60 seconds and checkpointing occurs every 30 minutes, synchronous checkpoint overhead is:

$$
\frac{60}{1800}\approx3.3\%.
$$

### Checkpoint interval

A classic first-order approximation for an efficient interval is:

$$
I^*\approx\sqrt{2CM},
$$

where $C$ is checkpoint duration and $M$ is mean time between failures, using consistent time units.

If $C=1$ minute and job-level $M=360$ minutes:

$$
I^*\approx\sqrt{720}\approx27\text{ minutes}.
$$

This approximation ignores restart cost, asynchronous checkpointing, correlated failures, and storage contention, but gives a useful starting point.

## 11. Reliability and expected lost work

With periodic checkpoints every $I$ time units and failures uniformly distributed between them, average rollback is approximately:

$$
E[L_{rollback}]\approx\frac{I}{2}.
$$

Expected reliability overhead includes:

$$
T_{overhead}
=T_{checkpoint}
+T_{rollback}
+T_{restart}
+T_{reconfiguration}.
$$

At large device counts, reason about job-level failure rate rather than only per-device reliability. More ranks create more opportunities for a run-stopping event.

The optimization target is total goodput, not the longest interval between checkpoint pauses.

## 12. Storage and data throughput

Packed token storage is often smaller than people first assume. At four bytes per token, $3.28$T token IDs occupy about:

$$
3.28\times10^{12}\times4
\approx13.1\text{ TB}.
$$

Read once over 67 days, the average aggregate payload bandwidth is only a few MB/s. Yet real input systems can still stall because of:

- millions of small objects;
- decompression and parsing;
- remote metadata calls;
- unbalanced shards;
- repeated shuffling;
- shared-storage contention;
- insufficient prefetch;
- dynamic sequence construction.

Distinguish payload bandwidth from request rate, latency, CPU work, and tail behavior.

Storage planning must also include:

- immutable raw and normalized datasets;
- tokenized versions and manifests;
- repeated checkpoints and optimizer states;
- evaluation artifacts;
- logs and profiles;
- temporary checkpoint duplication;
- retention and disaster recovery.

## 13. Cost estimates

If the effective accelerator price is $r$ currency units per accelerator-hour:

$$
Cost_{accelerator}=N\times24\times days\times r.
$$

For 256 accelerators over 90 days:

$$
\text{accelerator-hours}=256\times24\times90=552{,}960.
$$

Illustrative compute-only costs are:

| Effective price | Compute-only cost |
|---:|---:|
| 3 per GPU-hour | 1.66 million |
| 6 per GPU-hour | 3.32 million |
| 10 per GPU-hour | 5.53 million |

Do not present these example rates as current market quotes. Real cost includes networking, storage, CPU hosts, support, reserved-capacity terms, idle allocation, engineering labor, failed runs, and inference/evaluation workloads.

For owned infrastructure, distinguish purchase cost from amortized cost and include power, cooling, utilization, networking, facilities, and operations.

## 14. Inference-aware model choice

Pretraining capacity planning should include expected deployment volume.

Let:

- $C_{train}$: one-time training cost;
- $c_{inf}(P)$: inference cost per token for a model size $P$;
- $V$: lifetime served tokens.

Then a simple lifetime objective is:

$$
C_{lifetime}=C_{train}+V c_{inf}(P).
$$

At large $V$, spending more training compute on a smaller model can be economically preferable if it reaches the quality target. At small $V$, minimizing training cost may dominate.

Also check whether the resulting model fits the intended serving tensor-parallel group, latency target, and memory budget. A model that trains efficiently but requires uneconomical serving is not an optimal system design.

## 15. Long-context corrections

The $6PT$ shortcut mainly represents parameterized linear layers. Attention-score and value aggregation work scales approximately as:

$$
F_{attention,fwd}\approx4BS^2D
$$

per layer under a dense full-matrix convention.

As sequence length $S$ grows, the quadratic term becomes material. Long context also increases activation memory and can reduce microbatch size, changing utilization.

When comparing a short-context main phase with long-context continuation:

1. compute exact architecture FLOPs for both;
2. estimate achievable batch and MFU separately;
3. account for the long-document data supply;
4. budget evaluations for retrieval, extrapolation, and short-context regression.

## 16. Questions to answer aloud

### How long will this run take?

State model parameters, tokens, FLOP convention, accelerator count, relevant peak, expected MFU, and downtime. Compute both $6PT/(NCu)$ and steps times observed step duration.

### Will it fit in memory?

Enumerate weights, gradients, optimizer, master weights, activations, temporary buffers, fragmentation, and sharding. Give both steady-state and peak estimates.

### What is the global batch?

Multiply microbatch sequences by sequence length, gradient accumulation, and data-parallel replicas. Do not multiply by model-parallel ranks.

### Is communication the bottleneck?

Estimate bytes and collective frequency for each parallelism dimension, map them to effective link bandwidth, and compare exposed communication time with compute time.

### How frequently should we checkpoint?

Use checkpoint duration, job-level failure rate, rollback cost, restore time, and storage contention. Validate the decision with an injected-failure test.

### How much will it cost?

Compute accelerator-hours, then separate compute-only cost from storage, networking, evaluation, failures, engineering, and inference. Give a range.

### Which estimate is least trustworthy?

Usually achieved MFU, unique usable data volume, full-scale stability, or communication overlap. Identify it explicitly and propose a rehearsal that reduces the uncertainty.

## 17. Common arithmetic mistakes

- Using sparse or FP8 peak for dense BF16 training.
- Applying MFU twice when using an already-achieved throughput number.
- Confusing total MoE parameters with active parameters.
- Multiplying global batch by tensor-parallel ranks.
- Ignoring gradient accumulation when counting optimizer steps.
- Treating $6PT$ as exact for very long context.
- Omitting activation recomputation from executed-work estimates.
- Dividing all memory perfectly by the sharding degree.
- Ignoring temporary parameter gathers and collective buffers.
- Reporting GB while calculating GiB without saying so.
- Assuming healthy-step MFU equals end-to-end goodput.
- Spending the entire allocation on the nominal main run.
- Quoting a cloud price without a date, contract, or utilization assumption.

## 18. Compact interview worksheet

Fill this before proposing the final design:

| Quantity | Assumption or result |
|---|---|
| Target capability and metrics | |
| Device type and count | |
| Relevant peak FLOP/s | |
| Expected MFU range | |
| Downtime/goodput assumption | |
| Available wall time | |
| Main-run compute allocation | |
| Active and total parameters | |
| Training tokens | |
| Context length | |
| Global tokens per step | |
| Expected tokens/s | |
| Expected step time | |
| Optimizer-step count | |
| Persistent bytes per parameter | |
| Activation-memory estimate | |
| Parallelism mapping | |
| Largest collective and link | |
| Checkpoint size and interval | |
| Storage footprint | |
| Evaluation and contingency budget | |
| Training and lifetime cost range | |
| Largest uncertainty | |

If these fields are internally consistent, the rest of the design discussion becomes much easier.

## Related

- [LLM Pretraining System Design: Interview Guide](/atlas/ai/training/pretraining-system-design-interview-guide)
- [Transformer Performance Accounting](/atlas/ai/training/scaling/transformer-performance-accounting)
- [Transformer Scaling Rules](/atlas/ai/training/scaling/transformer-scaling-rules)
- [Scaling Laws](/atlas/ai/training/scaling/scaling-laws)
- [Overtraining and Inference-Aware Scaling](/atlas/ai/training/scaling/overtraining-and-inference-aware-scaling)
- [Model FLOPs Utilization](/atlas/systems/performance/model-flops-utilization-mfu)
- [Roofline Model](/atlas/systems/performance/roofline-model)
- [LLM Training Parallelism Rooflines](/atlas/systems/parallel-computing/llm-training-parallelism-rooflines)
- [Goodput, Determinism, and Fault Tolerance](/atlas/systems/infrastructure/goodput-determinism-and-fault-tolerance)

## Sources

- [JAX Scaling Book: Training](https://jax-ml.github.io/scaling-book/training/)
- [JAX Scaling Book: Transformers](https://jax-ml.github.io/scaling-book/transformers/)
- [Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556)
- [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)
- [Megatron-LM](https://arxiv.org/abs/1909.08053)
- [Efficient Large-Scale Language Model Training on GPU Clusters Using Megatron-LM](https://arxiv.org/abs/2104.04473)
- [ZeRO](https://arxiv.org/abs/1910.02054)
- [The Optimum Checkpoint Interval for Restart Dumps](https://doi.org/10.1145/1460833.1460837)
