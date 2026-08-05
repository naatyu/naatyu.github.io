---
title: "Low-Latency GPU Collectives"
date: 2026-07-21
lastmod: 2026-08-05
tags:
  - parallel-computing
  - gpu
  - collective-communication
  - nccl
  - inference
draft: false
---

## Summary

GPU collective communication is often optimized for bandwidth, but small collectives are dominated by fixed latency and synchronization. This matters in tensor-parallel LLM decoding because each transformer layer places several small AllReduce operations directly on the token-generation critical path.

Low-latency collective designs reduce the number and cost of synchronization phases. Within a scale-up domain, techniques such as one-shot communication, symmetric memory, sentinel or low-latency synchronization, double buffering, and hardware multicast can bring small-message AllReduce latency close to the hardware lower bound.

## Concepts

- **Collective:** a communication operation involving a group of ranks, such as AllReduce, AllGather, ReduceScatter, or AllToAll.
- **AllReduce:** reduces values across all ranks and returns the result to every rank.
- **Rank:** one participant in a distributed operation, typically one GPU.
- **Scale-up domain:** GPUs connected through a high-bandwidth, low-latency fabric such as NVLink and NVSwitch.
- **Symmetric memory:** remotely accessible buffers with matching layouts across participating GPUs.
- **Speed-of-Light (SoL) bound:** the minimum latency implied by the hardware's required data movement, ignoring software and execution overhead.
- **Synchronization phase:** a point where ranks must make communication progress or wait for data from peers.

## 1. Why decode becomes collective-latency bound

[Tensor parallelism](/atlas/systems/parallel-computing/tensor-parallelism) shards individual transformer layers across GPUs. Each GPU computes a partial result, after which a collective combines the shards before the next dependent operation can continue.

During autoregressive decoding, only a small number of tokens are processed in each step. An approximate activation message size is:

$$
M \propto B \times d_{\text{model}} \times \text{bytes per element}
$$

where $B$ is the active decode batch size. Long contexts increase KV-cache memory pressure, which can force the server to reduce $B$. The resulting AllReduce messages become relatively small even though the model itself is large.

For large messages, transfer time dominates:

$$
T_{\text{collective}} \approx \alpha + \frac{M}{\beta}
$$

where:

- $\alpha$ is fixed startup and synchronization latency
- $M$ is message size
- $\beta$ is effective communication bandwidth

For small messages, $M/\beta$ shrinks and $\alpha$ dominates. Improving peak bandwidth alone does little if ranks still spend microseconds entering barriers, polling flags, or moving through unnecessary communication phases.

The cost also repeats. If a transformer has $L$ layers and each layer invokes $C$ critical-path collectives, the communication contribution to one token is approximately:

$$
T_{\text{comm per token}}
\approx
L \times C \times T_{\text{collective}}
$$

This is why saving a few microseconds from one collective can materially improve inter-token latency.

## 2. The collective Speed-of-Light bound

The collective Speed-of-Light bound is not the propagation time of light through a cable. It is a hardware lower bound defined by the minimum data movements required to complete the operation.

For a push-based one-shot AllReduce, the critical path includes:

1. Loading input from the local cache into GPU registers.
2. Storing data into peer scratch buffers.
3. Loading peer contributions and reducing them.
4. Writing the final result.

The bound assumes favorable conditions such as cache residency, simultaneous peer stores, and no instruction-scheduling or computation overhead. A real kernel must therefore be slower.

The useful metric is:

$$
\text{SoL overhead}
=
\frac{T_{\text{measured}} - T_{\text{SoL}}}{T_{\text{SoL}}}
$$

This separates unavoidable hardware movement from removable software overhead.

## 3. AllReduce algorithm regimes

There is no single best AllReduce algorithm for every message size and rank count.

| Algorithm | Communication phases | Strength | Weakness |
| --- | ---: | --- | --- |
| **Ring** | $O(N)$ | Good bandwidth utilization for large messages | Too many phases for small messages |
| **Tree / recursive doubling** | $O(\log N)$ | Lower small-message latency than a ring | Still requires multiple synchronization rounds |
| **One-shot** | $O(1)$ | Lowest startup latency | High peer traffic and scratch-memory use |
| **Two-shot** | $O(1)$ | Lower communication volume than one-shot | Adds a second synchronization phase |

### One-shot AllReduce

In a one-shot design, every GPU sends its contribution to its peers and performs the complete reduction locally in one communication phase.

Push-based communication is attractive for latency because a remote store can reach a peer in roughly half the round-trip time needed by a remote load. The trade-off is additional scratch space for incoming values and communication volume that grows with the number of ranks.

One-shot algorithms are therefore strongest for small messages where avoiding another synchronization phase matters more than traffic volume.

### Two-shot AllReduce

A two-shot algorithm performs:

1. ReduceScatter: each rank obtains one reduced partition.
2. AllGather: the reduced partitions are distributed to all ranks.

The extra phase increases fixed latency, but total communication volume is much smaller. Two-shot designs become preferable as messages grow and the bandwidth cost begins to dominate.

The runtime should select the kernel using at least:

- message size
- number of ranks
- available scratch space
- multicast support
- whether buffers are registered as symmetric memory

## 4. Why global barriers are expensive

Traditional low-latency collectives often use explicit barrier flags:

1. Write data to a peer buffer.
2. Enforce memory ordering.
3. Publish a readiness flag.
4. Wait until flags from all peers are visible.

The evaluated GB200 system in the paper spends more than $1\ \mu s$ in one such barrier. A small-message AllReduce taking about $5\ \mu s$ can require two barriers, placing roughly 40% of its latency in synchronization alone.

Barrier-free protocols do not eliminate synchronization semantics. Instead, they encode data readiness directly into the communication protocol so that receivers can make progress without a separate global barrier.

## 5. Barrier-free synchronization techniques

### Low-Latency (LL) protocol

The LL protocol packages a data fragment and its readiness flag into one atomic store. The receiver polls the embedded flag and consumes the data once the expected epoch appears.

This removes the separate signaling step, but only part of each transmitted unit carries useful payload. It therefore reduces effective bandwidth and increases scratch-space requirements. LL is most effective for very small messages where fixed latency dominates.

### Sentinel synchronization

Sentinel synchronization initializes the receive buffer with a special value, such as a negative NaN. The sender writes data directly into the buffer, and the receiver polls until the sentinel changes.

Unlike LL, sentinel synchronization preserves the full payload bandwidth and uses less scratch space. It becomes attractive for moderately larger messages. Its constraints include:

- the sentinel must not be confused with valid data
- buffers must be reinitialized before reuse
- memory visibility and ordering must remain correct

### Double buffering

Double buffering alternates between two scratch regions across communication epochs. A sender writes the next chunk into one buffer while the receiver consumes the previous chunk from the other.

This prevents a faster rank from overwriting data that a slower rank has not yet consumed. It also allows scratch-buffer initialization or reuse to overlap with useful work.

### LL128 atomic reduction

The paper also introduces a two-shot LL128 atomic algorithm. Groups of threads operate on one 128-byte cache line, use atomic additions to accumulate contributions, and encode completion in the cache line itself.

This reduces scratch-space requirements and scales well for some medium-message regimes. However, the order of floating-point atomic additions is not deterministic. It should be treated as a performance-oriented option for workloads that tolerate the numerical behavior of the chosen accumulation precision.

## 6. The hardware substrate

These designs depend on more than nominal link bandwidth.

### Device-initiated communication

Device-side communication APIs let a GPU kernel directly initiate remote loads, stores, atomics, and synchronization. Avoiding host intervention removes launch and coordination latency from the critical path.

### Symmetric memory

Symmetric buffers have corresponding layouts across ranks and can be addressed using a common logical offset plus a rank identifier. This simplifies direct peer access and enables reusable low-latency communication primitives.

On NVIDIA systems, CUDA virtual memory management can make symmetric regions load/store accessible across GPUs in an NVLink domain.

### Multicast and in-network reduction

NVLink SHARP and NVSwitch multicast operations can distribute or reduce values inside the fabric. Hardware multicast may add overhead at very small rank counts, but its advantage grows with scale because it reduces explicit peer operations and software-managed reduction.

This explains why [hardware topology](/atlas/systems/parallel-computing/hardware-topology-and-parallelism) affects more than available bandwidth. The fabric determines which communication semantics and offloads are possible.

## 7. Evaluation results

The paper evaluates experimental NCCL kernels on GB200 systems across 2 to 64 GPUs. Its main findings are:

- The one-shot LLBuffer kernel is fastest for very small messages across the tested GPU counts.
- At 2 GPUs, its best result is approximately 7% above the estimated SoL bound.
- LL is strongest at the smallest sizes, while sentinel synchronization becomes preferable as message size or rank count grows.
- Two-shot and LL128 atomic variants cover parts of the medium-message regime.
- Hardware multicast becomes increasingly important as the number of GPUs grows.
- The new kernels complement rather than replace bandwidth-oriented collectives for large messages.

### LLM inference

The vLLM experiments use:

- one NVL72 GB200 scale-up system
- TP configurations of 4 and 8 GPUs
- input contexts of 100K to 200K tokens
- 16K generated tokens
- batch size 8
- dense, mixture-of-experts, and hybrid-attention models

Under these conditions, the best configurations reduce inter-token latency by approximately:

- **7% to 13% on 4 GPUs**
- **9% to 11% on 8 GPUs**

Output throughput improves by similar amounts. The paper's simplified conversion from throughput to hourly GPU cost estimates savings above $11 per million output tokens for a large model such as DeepSeek-V3 in the 8-GPU configuration.

The paper also reports improvements in cuSOLVERMp, showing that latency-sensitive collectives matter outside LLM inference when scientific workloads perform frequent small reductions.

## 8. Limitations

- The implementation and most measurements target NVIDIA GB200 and NCCL inside an NVLink scale-up domain.
- The best-case 7% SoL overhead is a two-GPU result, not a universal property across all rank counts.
- The LLM evaluation targets long-context, decode-heavy workloads and should not be generalized to every serving distribution.
- The cost calculation isolates the benefit of faster collectives; it is not a complete model of disaggregated production serving.
- LL sacrifices payload efficiency, sentinel synchronization imposes data constraints, and LL128 atomic reduction may be nondeterministic.
- Empirical kernel selection is hardware- and workload-specific. A different GPU generation or message distribution can move the crossover points.
- The work optimizes collectives within a scale-up domain; it does not solve scale-out network latency.

## Practical Heuristics

- Profile collective message sizes and latency distributions instead of relying only on aggregate NCCL bandwidth.
- Optimize startup and synchronization when decode produces many small messages.
- Use one-shot kernels for small messages and switch toward lower-volume algorithms as messages grow.
- Keep tensor-parallel groups inside the fastest scale-up domain available.
- Register buffers as symmetric memory when the framework and communication library support it.
- Include scratch-memory capacity in kernel-selection decisions.
- Treat hardware multicast as a scalability feature, not automatically the lowest-latency choice at small scale.
- Validate numerical reproducibility before adopting atomic-reduction variants.
- Measure inter-token latency and output throughput at the application level after microbenchmarking collectives.

## Related

- [NCCL Internals: Protocols, Algorithms, and Transports](/atlas/systems/parallel-computing/nccl-internals-protocols-algorithms-and-transports)
- [Tensor Parallelism](/atlas/systems/parallel-computing/tensor-parallelism)
- [Hardware Topology & Parallelism](/atlas/systems/parallel-computing/hardware-topology-and-parallelism)
- [Sequence Parallelism](/atlas/systems/parallel-computing/sequence-parallelism)
- [Data Parallelism](/atlas/systems/parallel-computing/data-parallelism)
- [Latency vs. Throughput](/atlas/systems/performance/latency-vs-throughput)
- [LLM Inference Economics](/atlas/ai/inference-serving/performance/llm-inference-economics)
- [Nsight Systems Profiler](/atlas/tooling/profiling/nsys-profiler)

## Sources

- [Every Microsecond Matters: Achieving Near Speed-of-Light Latency in GPU Collectives](https://arxiv.org/abs/2607.16100)
- [Low-Latency NCCL Reference Implementation](https://github.com/ss16118/low-latency-nccl)
