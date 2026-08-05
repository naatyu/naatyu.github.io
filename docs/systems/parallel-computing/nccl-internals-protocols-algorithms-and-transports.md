---
title: "NCCL Internals: Protocols, Algorithms, and Transports"
date: 2026-08-05
lastmod: 2026-08-05
tags:
  - parallel-computing
  - gpu
  - nccl
  - collective-communication
  - rdma
draft: false
---

## Summary

NCCL does not execute an `AllReduce` as one opaque network operation. It selects an **algorithm-protocol pair**, maps logical communication topologies onto multiple **channels**, splits each channel's region into loop iterations and pipeline slots, and composes the collective from device primitives such as send, receive, reduce, and copy. A separate **transport** determines how each logical edge actually moves bytes through NVLink, PCIe, shared memory, sockets, or RDMA.

The important separation is:

- **algorithm:** which ranks exchange which portions and in what dependency order, such as Ring or Tree;
- **protocol:** synchronization, buffering, and transfer granularity, such as Simple, LL, or LL128;
- **transport:** the physical/software data path for an edge, such as P2P, SHM, Socket, or IB;
- **channels:** parallel instances that partition the collective and exploit several SMs and links.

These choices interact, but they are not synonyms. "NCCL used a ring" does not reveal whether it used LL128 over NVLink or Simple through an RDMA proxy.

> The paper reverse-engineers **NCCL 2.19.1**. Exact buffer sizes, supported combinations, selection rules, QP layouts, and environment-variable behavior are implementation details that can change. Treat them as a strong mental model and verify the deployed NCCL version.

## 1. From API Call to Data Movement

NCCL exposes:

- communicator creation and teardown;
- collectives such as AllReduce, Broadcast, Reduce, AllGather, and ReduceScatter;
- point-to-point `Send` and `Recv`;
- group calls that batch operations between `ncclGroupStart` and `ncclGroupEnd`.

Grouped calls delay submission until the group closes. They reduce launch overhead and let NCCL construct concurrent point-to-point patterns such as send/receive exchanges or an application-level AllToAll.

The runtime path can be read as this hierarchy:

```text
API operation
  -> execution plan and algorithm/protocol selection
    -> communication channels
      -> one CUDA block per active channel
        -> outer loop iterations over the channel region
          -> chunks occupying circular pipeline slots
            -> send/recv/reduce/copy device primitives
              -> P2P, SHM, Socket, or IB transport
```

This hierarchy explains why a high-level alpha-beta model can miss real behavior: it compresses concurrent channels, slot dependencies, GPU copy/reduction work, CPU proxy progress, and transport synchronization into one latency and one bandwidth number.

## 2. Launch and Communicator Structure

Common launch models are:

| Model | Main advantage | Main cost |
| --- | --- | --- |
| one process per GPU | NUMA placement and failure/process isolation | more processes and IPC setup |
| one process, one CPU thread per GPU | shared address space and direct pointers | threading and affinity management |
| one CPU thread controlling several GPUs | simple and low host overhead | sequential launches and less concurrency |

Every participating GPU has a rank-local communicator. During initialization, NCCL discovers topology and builds reusable channel structures. A ring channel stores predecessor and successor ranks; a tree channel stores parent and children.

For AllReduce, NCCL uses a **double binary tree** to use bandwidth in both directions. The construction tries to ensure that a rank is not an internal node in both trees. For even rank counts the second tree mirrors the first; for odd counts it is shifted.

## 3. Channels: Parallelism and Its Trade-off

One communication pipeline on one SM may fail to saturate NVLink, PCIe, or several NICs. NCCL therefore partitions the user buffer across channels:

- each active channel maps to one CUDA block;
- each block normally occupies an SM;
- channels process disjoint contiguous regions;
- different channels can use different logical rings and network paths.

More channels provide more GPU-side parallelism and can stripe traffic across NICs. They are not free:

- they consume more SM and buffer resources;
- the payload per channel becomes smaller;
- network FIFO slots may be only partially filled;
- too many queue pairs and small packets can reduce PCIe/network efficiency.

In the analyzed version, the network FIFO slot is 512 KiB for the Simple protocol. If per-channel chunks fall below that size, proxy threads can issue partially filled buffers. NCCL's tuning heuristics therefore reduce active channel count for smaller messages.

The lesson is not "maximize channels," but:

$$
n_{\mathrm{channels}}^{*}
= f(\mathrm{message}, \mathrm{topology}, \mathrm{algorithm},
\mathrm{protocol}, \mathrm{threads}, \mathrm{NIC\ paths})
$$

## 4. The Three Communication Protocols

### Simple

Simple targets large-message bandwidth. It moves relatively large chunks and uses memory fences to enforce visibility and ordering. Receivers wait for a complete chunk before consuming it.

- near-peak payload efficiency;
- good for bandwidth-dominated transfers;
- synchronization and fence overhead make it poor for small messages;
- coarse chunks limit fine-grained pipeline progress.

### LL: Low Latency

LL sends 4 bytes of payload with a 4-byte readiness flag in one 8-byte atomic unit. The receiver polls the embedded flag instead of depending on a separate memory fence.

- roughly 50% of transmitted bytes are useful payload;
- very fine-grained progress and low synchronization latency;
- commonly only about 25–50% of peak bandwidth in the paper's model;
- network staging is host-resident so the CPU proxy can poll it, which prevents the direct GDRDMA path described for Simple.

LL is intended for small messages where saved latency outweighs its bandwidth loss.

### LL128

LL128 applies the same flag-based idea to 128-byte units: 120 payload bytes plus an 8-byte flag.

- $120/128=93.75\%$ wire payload efficiency, often summarized as about 95%;
- fine-grained intra-node pipelining;
- approaches Simple bandwidth on suitable NVLink paths;
- requires atomic 128-byte visibility: the unit must not be split or reordered.

NCCL disables LL128 on paths that cannot guarantee those semantics. On scale-out paths it still aggregates chunks before notifying the CPU proxy, so its network behavior is not simply "LL but wider."

### Comparison

| Protocol | Synchronization | Transfer unit | Useful payload | Typical regime |
| --- | --- | ---: | ---: | --- |
| Simple | memory fences | large chunks | nearly 100% | large messages |
| LL | embedded flag | 8 B | 4 B / 50% | smallest messages |
| LL128 | embedded flag | 128 B | 120 B / 93.75% | small-to-medium, especially NVLink |

The paper quotes approximate per-hop latencies of 6, 1, and 2 microseconds for Simple, LL, and LL128 respectively. These are explanatory values inherited from a particular platform/source, **not portable constants**. Measure them on the deployed GPU, topology, and NCCL release.

NCCL chooses a protocol together with an algorithm using message size, topology, GPU architecture, supported combinations, resource availability, and its tuning model. `NCCL_PROTO` can force a choice for diagnosis, but a forced winner in one microbenchmark need not be best across a workload.

## 5. Channel Buffers and Slot Pipelining

The analyzed default configuration divides each channel buffer into eight circular slots (`NCCL_STEPS=8`). Version-specific capacities are:

| Protocol | Channel buffer | Capacity per slot | Effective payload per slot |
| --- | ---: | ---: | ---: |
| Simple | 4 MiB | 512 KiB | 512 KiB |
| LL | 256 KiB | 32 KiB | 16 KiB |
| LL128 | about 4.69 MiB | 600 KiB | 562.5 KiB |

For each channel:

1. `workOffset` identifies its contiguous input region;
2. an outer loop processes at most one channel-buffer region at a time;
3. `chunkCount` partitions the loop region into elementary steps;
4. chunks circulate through the eight slots;
5. different slots can simultaneously be produced, queued, in flight, reduced, or consumed.

This is pipeline depth, not eight independent network operations. Head/tail state and per-slot metadata prevent a producer from overwriting data before the consumer advances.

## 6. Mapping onto CUDA

An NCCL kernel uses grid shape `(nChannels, 1, 1)`. A channel mask maps active logical channels to CUDA block IDs.

Within each block:

- the first warps load communicator and channel metadata into shared memory;
- remaining warps perform communication, copies, and reductions;
- point-to-point kernels divide warps between sends and receives;
- threads process protocol-specific vector units with warp-uniform control flow.

NCCL therefore consumes GPU compute resources. A collective may contend with the application for SMs, registers, caches, and memory bandwidth even when network links are the visible bottleneck.

The runtime maintains concurrency at several levels:

- channels across SMs;
- slots within a channel;
- warps with specialized roles;
- thread-level vectorized data movement.

## 7. Primitive Vocabulary

High-level algorithms are composed from operations whose names reveal the fused work:

- `send`, `recv`;
- `copySend`;
- `recvCopySend`;
- `recvReduceSend`;
- `recvReduceCopy`;
- `recvReduceCopySend`;
- direct variants that bypass an intermediate FIFO when permitted.

For example, `recvReduceSend` receives a partial value, combines it with local input, and forwards the new partial value. Fusing these actions avoids separate kernels and intermediate round trips to user buffers.

The primitives are optimized for a small fixed number of peers, as in rings and trees. They are less naturally suited to full AllToAll, where each rank has $N$ sources and destinations; NCCL commonly expresses that pattern through grouped point-to-point operations.

## 8. Intra-Node Transports

NCCL selects a transport for every logical connection.

### P2P over NVLink or PCIe

GPUDirect P2P lets one GPU access another GPU's memory without host staging. NCCL prefers NVLink where available, then may use PCIe P2P.

If ranks share a process, **P2P_DIRECT** can use device pointers in the same address space, avoid IPC-handle machinery, and use direct send/receive primitives to bypass an intermediate FIFO. Atomic head/tail counters still provide ordering and prevent races.

### Shared memory

If P2P is unavailable or performs poorly—especially across some CPU sockets—NCCL can stage through a shared host-memory segment. This adds GPU-to-host and host-to-GPU traffic but can outperform a bad PCIe P2P route through the CPU interconnect.

### Network-assisted intra-node path

On some multi-socket systems, NCCL can route between local GPUs through their nearby NICs: GPU → NIC → NIC → GPU. A physically "intra-node" transfer can therefore use the network transport when that avoids a worse CPU/PCIe path. `NCCL_CROSS_NIC` influences cross-NIC routing, but current behavior must be checked against the installed NCCL documentation.

## 9. Inter-Node Transports

Inter-node progress combines a GPU kernel, a CPU proxy thread, NIC operations, and rendezvous/control state.

### Socket

Without an RDMA transport, NCCL stages through pinned host buffers:

```text
sender GPU -> sender host buffer -> TCP socket
           -> receiver host buffer -> receiver GPU
```

The extra PCIe copies and CPU/network stack work make this the fallback path.

### InfiniBand/RoCE verbs

The IB transport uses RDMA writes. Without GDRDMA, the registered intermediate buffer remains in host memory. With a supported GPU/NIC topology and registration mechanism such as `nvidia-peermem` or DMA-BUF, the NIC directly reads or writes GPU memory.

The paper describes several important details for NCCL 2.19.1:

- two logical channel/connection bundles per remote GPU and NIC by default;
- independent QP sets used round-robin to improve ECMP path diversity;
- a forward reliable-connected QP carrying bulk RDMA writes and completion notification;
- a reverse QP carrying the small clear-to-send message, isolating control traffic from bulk-data head-of-line blocking;
- an RDMA write with immediate data for completion/size signaling;
- a loop-back RDMA read on a dedicated flush QP to ensure preceding PCIe writes are visible to the GPU before its kernel consumes them.

The loop-back read is an ordering mechanism: it need not carry user data or leave the host.

## 10. Ring Algorithms

Let $k$ be the number of ranks. Within one outer loop iteration:

### Ring AllReduce

Ring AllReduce is a ReduceScatter-like phase followed by AllGather:

| Steps | Primitive |
| --- | --- |
| 0 | `send` |
| 1 through $k-2$ | `recvReduceSend` |
| $k-1$ | `recvReduceCopySend` |
| $k$ through $2k-3$ | `recvCopySend` |
| $2k-2$ | `recv` |

This is $2k-1$ primitive steps as indexed by the implementation, including initial/final endpoint actions. The familiar bandwidth model still counts $k-1$ transfer rounds for ReduceScatter and $k-1$ for AllGather; do not mix the two counting conventions.

### Ring AllGather

- initialize with in-place `send` or `copySend`;
- run `recvCopySend` for intermediate ranks/steps;
- finish with `recv`.

It takes $k-1$ communication hops for a block to reach all ranks.

### Ring ReduceScatter

- `send` initially;
- $k-2$ `recvReduceSend` steps;
- `recvReduceCopy` to place the rank's final reduced shard.

These ring collectives are classified as **non-pipelined across outer loop iterations** in the paper: dependencies force a channel to finish all primitive steps for the current loop region before starting the next.

## 11. Tree and Chain-Like Algorithms

### Tree AllReduce

The logical tree branches primarily across nodes; GPUs within a node may be linked as a chain. Reduction moves toward the root and broadcast moves away:

- leaf: `send`, then `recv`;
- middle: `recvReduceSend`, then `recvCopySend`;
- root: `recvReduceCopySend`.

NCCL's implementation can divide SM resources so reduction and broadcast work on different chunks concurrently, with more threads assigned to the more bandwidth-intensive reduction side.

### Ring Broadcast and Reduce

Although named Ring, root selection turns these operations into a directed logical chain.

- Broadcast: root sends, middle ranks receive-copy-send, last rank receives.
- Reduce: initiator sends, middle ranks receive-reduce-send, root receive-reduce-copies.

Tree AllReduce, Ring Broadcast, and Ring Reduce are **pipelined across outer iterations**: downstream stages can operate on one chunk while upstream stages begin a later chunk.

### Specialized algorithms

In the analyzed release:

- CollNet uses SHARP-capable network support for network-assisted collectives;
- NVLS uses NVLink SHARP/NVSwitch reduction;
- NVLS supports AllReduce and some ReduceScatter/AllGather cases with Simple;
- Tree is used for AllReduce, not the other listed collectives;
- PAT was introduced after 2.19 and is outside the paper's detailed analysis.

This support matrix is especially version-sensitive.

## 12. Benchmark Findings

The paper benchmarks GH200 nodes on the Alps system:

- 150 GB/s intra-node interconnect reported by the authors;
- 25 GB/s per-direction Slingshot network link per node;
- up to 16 nodes;
- 20 measured runs after warmup.

Observed regimes:

- below roughly 64 KiB inter-node, LL and LL128 perform best;
- at large inter-node sizes, Simple wins because millions of fine-grained flag checks make LL/LL128 expensive over RoCE/Slingshot paths;
- intra-node LL128 remains strong across a broad size range, approaching Simple at large messages while staying close to LL at small sizes;
- Ring favors large messages; Tree favors smaller messages;
- the crossover depends strongly on whether traffic remains intra-node or crosses the network.

These results explain the tuning logic; they are not universal thresholds. GPU generation, topology, NIC bandwidth, protocol support, and NCCL version move every crossover.

## 13. Performance-Debugging Procedure

When a collective is slow:

1. record the exact NCCL version, GPU/NIC topology, rank placement, and message size;
2. determine the selected algorithm, protocol, transport, and channel count from NCCL debug/tuning logs;
3. confirm that the expected P2P or GDRDMA path is active rather than SHM or Socket fallback;
4. compare intra-node and inter-node cases separately;
5. inspect whether proxy threads are placed on suitable NUMA nodes and making progress;
6. check per-channel chunks, NIC/QP striping, and whether many channels are producing partial FIFOs;
7. profile GPU-side NCCL kernels for SM and HBM contention;
8. force one choice at a time only as a diagnostic experiment;
9. benchmark the actual collective/message distribution, then validate end-to-end step time.

The model also improves simulation. A faithful simulator must represent primitive dependencies, pipelined versus non-pipelined loop behavior, channel concurrency, GPU work, proxy work, and the selected physical paths—not just inject total collective bytes into a network.

## 14. What the Paper Does and Does Not Establish

The paper's main value is a readable execution model grounded in NCCL source code. It enabled the ATLAHS toolchain to translate application traces into fine-grained GOAL schedules and reportedly keep simulation error below 5% in its evaluated cases.

Limitations:

- the implementation analysis targets NCCL 2.19.1, while the paper itself was revised in 2026;
- NVLS and CollNet are listed but not analyzed in depth;
- most algorithm discussion centers on Ring and Tree;
- the benchmark platform is GH200/Alps, not a broad hardware sweep;
- quoted protocol efficiencies and latencies are approximate and path-dependent;
- the paper deliberately avoids a quantitative closed-form model because placement, topology, channels, and transport make a single formula misleading;
- simulation accuracy claims belong to ATLAHS's evaluated workloads and do not guarantee arbitrary models or fabrics.

## Practical Takeaways

- Always name all four dimensions: algorithm, protocol, transport, and channels.
- Small messages need synchronization efficiency; large messages need payload and link efficiency.
- LL128 is especially topology-dependent because it needs atomic 128-byte visibility.
- More channels can either expose bandwidth or fragment network buffers.
- Intra-node traffic can take a host-memory or even NIC path when direct P2P is worse.
- GDRDMA removes host data staging, not necessarily the CPU proxy/control plane.
- Ring and Tree performance cannot be predicted from rank count alone.
- A collective consumes GPU resources as well as network resources.
- Trust autotuning by default, but log its decisions and verify fallbacks when diagnosing regressions.

## Sources

- [Demystifying NCCL: An In-depth Analysis of GPU Communication Protocols and Algorithms](https://arxiv.org/abs/2507.04786)
- [NVIDIA NCCL source code](https://github.com/NVIDIA/nccl)
- [NVIDIA NCCL documentation](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/)
- [ATLAHS network-simulation toolchain](https://github.com/spcl/atlahs)

## Related

- [Low-Latency GPU Collectives](/atlas/systems/parallel-computing/low-latency-gpu-collectives)
- [Sharded Matrix Multiplication and Collectives](/atlas/systems/parallel-computing/sharded-matrix-multiplication-and-collectives)
- [Hardware Topology & Parallelism](/atlas/systems/parallel-computing/hardware-topology-and-parallelism)
- [Tensor Parallelism](/atlas/systems/parallel-computing/tensor-parallelism)
- [Nsight Systems Profiler](/atlas/tooling/profiling/nsys-profiler)
