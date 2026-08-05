---
title: "Hardware Topology & Parallelism"
date: 2026-04-20
lastmod: 2026-08-05
tags:
  - distributed-training
  - hardware
  - nvlink
  - moe
draft: false
---

## Summary

Parallelism must be mapped to the physical network according to its traffic pattern and how often communication blocks compute. "Intra-node" and "inter-node" are useful hints, not performance models. Use achieved collective bandwidth, latency, bisection bandwidth, and topology contention.

## Scale-Up and Scale-Out

**Scale-up** fabrics connect accelerators within a server, tray, or rack-scale domain, commonly through NVLink/NVSwitch or an equivalent accelerator interconnect. They usually provide high bandwidth and low latency for frequent collectives.

**Scale-out** fabrics connect those domains through InfiniBand or Ethernet. Their performance depends on NIC count, rail layout, switch hierarchy, routing, oversubscription, congestion control, and collective offload.

Avoid a universal claim such as "scale-out is 8x slower." At least four numbers are different:

- bandwidth of one accelerator link;
- aggregate scale-up bandwidth per accelerator;
- aggregate NIC bandwidth per node;
- usable application bandwidth for a particular collective.

Compare the number relevant to the actual traffic pattern.

## Network Quantities That Matter

### Latency and bandwidth

For a communication phase:

$$T\approx n_{phases}\alpha+\frac{V_{link}}{W_{achieved}},$$

where $\alpha$ is startup/hop latency, $V_{link}$ is bytes through the limiting link, and $W_{achieved}$ is measured bandwidth. Small messages are latency-bound; large messages are bandwidth-bound.

### Bisection bandwidth

AllToAll and many concurrent flows stress the fabric's middle, so aggregate bisection bandwidth matters more than a single endpoint's advertised rate. This is central for MoE expert routing.

### Per-GPU versus per-node egress

Eight GPUs may share a small number of NICs. Dividing the node's advertised network bandwidth incorrectly—or assuming each GPU receives it independently—can produce an order-of-magnitude planning error.

### Collective versus point-to-point performance

An efficient ring AllReduce, hierarchical AllGather, and irregular AllToAll achieve different fractions of hardware bandwidth. Benchmark the exact message sizes and group shapes used by the model.

## Mapping Parallel Dimensions

| Parallelism | Dominant traffic | Preferred placement |
| --- | --- | --- |
| Tensor / sequence | frequent blocking activation collectives | fastest scale-up links |
| Expert | AllToAll activation routing | high-bisection domain; avoid oversubscribed cuts |
| Data / FSDP | large weight or gradient collectives, often overlappable | scale-out when local batch hides it |
| Pipeline | point-to-point activations at layer boundaries | suitable for slower links if stages are balanced |

This is a starting order, not a law. A model's message size, local work, and overlap can reverse choices.

## MoE Layout

MoE dispatch and combine use AllToAll when tokens and experts are on different devices. Keeping the expert group within a scale-up domain is attractive, but large expert domains may have to cross nodes. Then evaluate:

- expected and worst-case tokens per expert;
- capacity factor or dropless routing behavior;
- achieved cross-node AllToAll bandwidth;
- contention with TP/FSDP traffic;
- whether expert placement matches the physical rail/switch topology.

Network-assisted reductions such as SHARP can improve supported reduction collectives, but do not automatically solve arbitrary AllToAll traffic.

## Topology-Aware Checklist

1. Draw the hardware hierarchy: accelerator, switch domain, node, rack, rail, and cluster.
2. Record per-device HBM bandwidth and achieved compute for the chosen precision.
3. Measure collectives at the real group sizes and payloads.
4. Assign the most latency-sensitive, least-overlappable dimension to the fastest links.
5. Check aggregate node egress and bisection limits, not only endpoint links.
6. Account for simultaneous collectives sharing links.
7. Inspect traces for implicit resharding and lack of communication overlap.

## Pipeline and Inference Caveat

Pipeline parallelism shards weights, but a stage retains KV tensors for the layers it owns. Filling more stages also requires more sequences or microbatches in flight. PP can solve weight placement without improving single-sequence latency or the system-wide KV-cache budget proportionally.

## Sources

- [JAX Scaling Book: GPUs](https://jax-ml.github.io/scaling-book/gpus/)
- [JAX Scaling Book: Training](https://jax-ml.github.io/scaling-book/training/)
- [JAX Scaling Book: Sharding](https://jax-ml.github.io/scaling-book/sharding/)

## Related

- [Low-Latency GPU Collectives](/atlas/systems/parallel-computing/low-latency-gpu-collectives)
- [LLM Training Parallelism Rooflines](/atlas/systems/parallel-computing/llm-training-parallelism-rooflines)
- [Pipeline Parallelism](/atlas/systems/parallel-computing/pipeline-parallelism)
