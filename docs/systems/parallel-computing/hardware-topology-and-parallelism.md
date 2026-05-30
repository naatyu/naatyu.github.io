---
title: "Hardware Topology & Parallelism"
date: 2026-04-20
lastmod: 2026-05-04
tags:
  - distributed-training
  - hardware
  - nvlink
  - moe
draft: false
---

## 1. Scale-Up (Intra-Rack) vs. Scale-Out (Inter-Rack)
- **Scale-Up (NVLink)**: Full all-to-all connectivity via physical switches in the rack. Essential for **Expert Parallelism (MoE)**.
- **Scale-Out (InfiniBand/Ethernet)**: Typically **8x slower** than scale-up.
- **Physical Constraint**: The size of a single "Scale-Up Domain" (e.g., 72 GPUs in Blackwell) is limited by cable density, power delivery, and cooling.

## 2. Mixture of Experts (MoE) Layout
MoE layers follow an **All-to-All** traffic pattern. If experts are split across two racks, the 8x bandwidth bottleneck in scale-out networks stalls the model.
- **Deployment Rule**: Keep the MoE expert domain within a single rack (scale-up domain) whenever possible.

## 3. Pipeline Parallelism ($P$)
Pipelining is a "hassle" that doesn't improve latency but solves **Memory Capacity** issues.
- **The KV Cache Problem**: While pipelining shards weights, it **does not** save KV cache memory per GPU. To keep all racks busy, the number of sequences in flight must increase proportionally to the number of pipeline stages, canceling out the memory savings for activations.
