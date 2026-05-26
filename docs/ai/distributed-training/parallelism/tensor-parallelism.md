---
title: "Tensor Parallelism (TP)"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - ai/distributed-training
  - parallelism
draft: false
---

## Summary

An intra-node parallelism strategy that shards the weight matrices of individual layers (MLP and Attention) across GPUs. It is essential for fitting models that exceed a single GPU's memory.
## Concepts
- **Column-Parallel Linear:** Splitting $W$ by columns. Output is $Y = [XW_1, XW_2]$. Requires an **All-Gather** to reconstruct $Y$.
- **Row-Parallel Linear:** Splitting $W$ by rows. Output is $Y = X_1W_1 + X_2W_2$. Requires an **All-Reduce** to sum the partial results.
- **NVLink:** High-speed interconnect (900GB/s+) required for TP because it synchronizes multiple times within a single transformer block.

## Content

### Transformer Block Sharding
To minimize communication, TP groups operations:
1.  **MLP**: `ColumnParallel` (FC1) $\to$ `RowParallel` (FC2). 
    - The activation $X$ is identical on all GPUs.
    - $W_{FC1}$ is sharded by column.
    - $W_{FC2}$ is sharded by row.
    - **Result**: Only *one* All-Reduce is needed after FC2 to sync the result before the residual addition.
2.  **Attention**: Q, K, V projections are sharded by columns (heads). The output projection is sharded by rows.
    - This allows each GPU to compute a subset of attention heads independently.

### The "TP Barrier"
TP is almost exclusively restricted to **8 GPUs (one node)**. Scaling TP across nodes via standard Ethernet/InfiniBand is too slow because the All-Reduce operation is blocking and happens multiple times per layer. 

### Sequence Parallelism (SP) Integration
Standard TP gathers full activations for LayerNorm and Dropout, which wastes memory. **Sequence Parallelism** extends TP by sharding these specific operations along the sequence dimension, further reducing the activation memory footprint.

## Related
- [Distributed Training MOC](/atlas/ai/distributed-training/distributed-training-moc)
- [Sequence Parallelism](/atlas/ai/distributed-training/parallelism/sequence-parallelism)
- [Pipeline Parallelism](/atlas/ai/distributed-training/parallelism/pipeline-parallelism)
