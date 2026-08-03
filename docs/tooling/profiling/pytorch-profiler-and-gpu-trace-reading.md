---
title: "PyTorch Profiler and GPU Trace Reading"
date: 2026-08-03
lastmod: 2026-08-03
tags:
  - tooling
  - profiling
  - pytorch
  - cuda
  - performance
draft: false
---

## Summary

`torch.profiler` connects framework-level operations to the CPU dispatch and accelerator kernels they trigger. It is the right first tool when the question is:

> Which PyTorch operation caused this kernel, allocation, copy, synchronization, or idle gap?

The profiler table answers **what consumed time or memory**. The timeline answers **when it happened, what launched it, and what failed to overlap**. A productive profiling session starts by predicting the expected operators and kernels, then treating every mismatch between that prediction and the trace as evidence.

Important boundaries:

- CPU and accelerator work are asynchronous, so their totals are not generally additive.
- A PyTorch operation is not necessarily a GPU kernel; it may be a view, wrapper, allocation, or dispatcher call.
- Fewer operator names do not prove that less work happened.
- Graph fusion, dispatcher fusion, GEMM epilogues, and true kernel fusion are different.
- High occupancy is not the objective; useful work completed per unit time is.
- Results depend on hardware, shapes, dtype, masks, dropout, software versions, and training versus inference.

## 1. Choose the profiler by the question

| Tool | Best question | Typical scope |
| --- | --- | --- |
| `torch.profiler` | Which PyTorch operation caused this device work? | Operators, autograd, allocations, CPU-to-kernel attribution |
| `nsys` | Where does end-to-end execution time go? | Processes, threads, CUDA APIs, kernels, streams, copies, NCCL |
| `ncu` | Why is this particular kernel slow? | Instructions, memory traffic, occupancy, stalls, roofline metrics |
| Roofline analysis | Is the fundamental limit compute or data movement? | Arithmetic intensity versus hardware roofs |

A practical escalation path is:

1. use `torch.profiler` to find expensive operations and unexpected dispatch
2. use `nsys` when the problem involves input starvation, synchronization, streams, communication, or system-wide overlap
3. use `ncu` only after identifying the kernel that deserves detailed analysis

Profiling every layer with every tool at once produces large traces, high overhead, and little clarity.

## 2. A bounded profiling template

Profile a small steady-state window rather than an entire job:

```python
import torch
from torch.profiler import ProfilerActivity, profile, record_function


def train_step(batch):
    with record_function("forward"):
        loss = model(batch)

    with record_function("backward"):
        loss.backward()

    with record_function("optimizer"):
        optimizer.step()
        optimizer.zero_grad(set_to_none=True)

    return loss


# Warm CUDA, libraries, allocator, data path, and compiled graphs.
for _ in range(10):
    train_step(next(loader))

schedule = torch.profiler.schedule(
    wait=1,
    warmup=2,
    active=3,
    repeat=1,
)

with profile(
    activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA],
    schedule=schedule,
    on_trace_ready=torch.profiler.tensorboard_trace_handler("/tmp/torch-traces"),
    record_shapes=False,
    profile_memory=False,
    with_stack=False,
) as prof:
    for _ in range(6):
        train_step(next(loader))
        prof.step()
```

The schedule phases mean:

- `wait`: execute without profiling
- `warmup`: enable profiling machinery without retaining the trace
- `active`: record events for export
- `repeat`: repeat the cycle for separated samples

External warmup moves the application toward steady state. Scheduled warmup prepares the profiler itself. Call `prof.step()` exactly once at the intended iteration boundary.

Enable expensive options only when needed:

| Option | Provides | Cost/caveat |
| --- | --- | --- |
| `record_shapes=True` | input shapes and shape-grouped aggregation | extra metadata and references; can perturb behavior |
| `profile_memory=True` | allocations/releases attributed to operators | higher overhead; not allocator-reserved memory |
| `with_stack=True` | Python/TorchScript source stacks | large and expensive traces |
| `with_flops=True` | estimated FLOPs for supported operators | incomplete model of device work |
| `record_function(...)` | user-defined semantic ranges | small cost; invaluable for navigation |

## 3. Table versus timeline

The aggregated table and timeline answer different questions.

```python
print(
    prof.key_averages().table(
        sort_by="cuda_time_total",
        row_limit=30,
    )
)
```

Use the table to find:

- dominant CUDA or CPU operations
- unexpectedly high call counts
- allocations attributed to an operator
- the difference between time in a parent and its children

The columns mean:

- **self time:** time attributed directly to the event, excluding children
- **total time:** event time including nested children
- **average time:** aggregate divided by call count
- **number of calls:** frequency, which can reveal fragmentation

A wrapper such as `aten::linear` can have low self CUDA time but high total CUDA time because the actual work belongs to a child GEMM.

Export a trace when temporal order matters:

```python
prof.export_chrome_trace("trace.json")
```

Open it in Perfetto or another compatible viewer. Inspect:

- CPU launch order
- CUDA runtime calls
- GPU kernel execution
- copies and allocations
- idle gaps and stream overlap
- which CPU operator launched a GPU event

The table finds a hotspot. The timeline tests the causal explanation for it.

## 4. The dispatch chain

A common hierarchy is:

```text
ProfilerStep
└── record_function("forward")
    └── Python / nn.Module call
        └── aten::linear
            ├── aten::t
            └── aten::addmm or aten::mm
                ├── CUDA runtime launch
                └── GPU GEMM kernel
```

These levels should not be credited interchangeably:

- Python describes the user program.
- ATen selects and composes tensor operations.
- the CUDA runtime launches asynchronous work.
- cuBLAS, cuDNN, Triton, or generated code provides kernels.
- the GPU timeline contains what executed on the device.

An ATen operation may launch no kernel. Many uses of `view`, `reshape`, `transpose`, `as_strided`, and `aten::t` only modify shape and stride metadata. They become expensive when a consumer requires materialization, a copy, or an unsupported layout.

## 5. Classify the bottleneck

### Launch- or overhead-bound

Signs:

- many very short kernels
- gaps between kernels
- CPU dispatch comparable to device execution
- high call counts for small elementwise operations
- the GPU repeatedly waits for the host

Possible actions include batching work, fusing operations, reducing hot-path Python control flow, compiling a sufficiently large graph, or using CUDA Graphs for stable repeated workloads.

### Compute-bound

Signs:

- dense GPU lane
- large GEMMs or convolutions dominate
- little idle time
- compute approaches the relevant hardware roof

Possible actions include lower precision, Tensor Core-friendly shapes, fewer FLOPs, better kernels, or better batching.

### Memory-bound

Signs:

- elementwise/reduction kernels dominate
- large intermediates are written and immediately reread
- fusion removes runtime despite similar FLOPs
- measured bandwidth approaches the relevant roof

Possible actions include eliminating intermediates, fusing producers and consumers, improving layout/locality, or using IO-aware algorithms such as FlashAttention.

### Input-, synchronization-, or communication-bound

Signs include GPU gaps between steps, blocking copies or synchronizations, dominant NCCL activity, or input preparation that does not overlap device work. `nsys` is usually the better tool once the question involves processes, streams, pipelines, or collectives.

## 6. Warmup and profiler artifacts

Startup can include CUDA initialization, lazy library loading, allocator growth, cuBLAS/cuDNN heuristics, JIT compilation, autotuning, `torch.compile` code generation, data-pipeline initialization, and profiler-buffer allocation.

Common artifacts include:

- a first recorded step much wider than later steps
- activity-buffer requests
- a final `cudaDeviceSynchronize` used to flush events
- variable kernel times from clocks, thermals, power management, or driver housekeeping
- trace options perturbing the execution being measured

The final profiler synchronization is not automatically an application bottleneck. CUDA is asynchronous; it may simply wait for already-issued work so the profiler can emit complete timings.

Measure performance outside the profiler too. Synchronize at measurement boundaries, not after every operation:

```python
torch.cuda.synchronize()
start = time.perf_counter()

for _ in range(iterations):
    step()

torch.cuda.synchronize()
elapsed = time.perf_counter() - start
```

## 7. Predict the kernel inventory

For a gated MLP:

```python
g = gate_proj(x)
u = up_proj(x)
h = torch.nn.functional.gelu(g, approximate="tanh")
m = h * u
y = down_proj(m)
```

an eager forward roughly suggests:

1. gate-projection GEMM
2. up-projection GEMM
3. GeLU kernel
4. multiplication kernel
5. down-projection GEMM

Ask:

- Did a view unexpectedly materialize?
- Did an allocation or copy appear?
- Were GeLU and multiplication fused?
- Did the GEMM change when the shape changed?
- Did compilation reduce kernels, only CPU wrappers, or neither?

Equal-FLOP GEMMs can run at different speeds because matrix shapes select different tiles and pipelines. Kernel count alone is not the objective either: one poorly shaped fused kernel can lose to several good kernels.

## 8. Fusion has several meanings

### Dispatcher or graph fusion

PyTorch may rewrite `torch.add(torch.matmul(x, w), bias)` as `addmm`. This simplifies dispatch but does not prove all memory traffic disappeared.

### GEMM epilogue fusion

A GEMM can apply bias, scaling, or activation while writing its output. This avoids a pointwise launch, although destination preparation or a copy can remain.

### True kernel fusion

A compiler or hand-written kernel may keep an intermediate in registers or shared memory:

```text
eager:
    write GeLU output to HBM
    read it for multiplication

fused:
    compute GeLU and multiply on chip
    write the final output once
```

### Algorithmic/IO fusion

FlashAttention reorganizes the algorithm so the quadratic attention score and probability matrices are never materialized in HBM.

For a claimed fusion, ask:

1. Did ATen operator count decrease?
2. Did launch count decrease?
3. Did kernel identity change?
4. Did allocations or device copies disappear?
5. Did bytes moved decrease?
6. Did steady-state latency improve?

## 9. Reading `torch.compile` traces

The compiled path commonly includes:

```text
TorchDynamo cache/guard lookup
→ AOTAutograd runtime wrapper
→ TorchInductor generated/external calls
→ cuBLAS, cuDNN, Triton, or generated kernels
```

Compilation can remove Python/dispatcher overhead, fold metadata operations into generated calls, fuse pointwise work, specialize for shapes, or choose external library kernels. It cannot improve an already optimal single operation merely by wrapping it. A lone `nn.Linear` may already map to one tuned GEMM while compilation adds guards and wrapper overhead.

Compare eager and compiled runs with identical inputs, steady-state cache hits, the same synchronization boundaries, kernel names rather than only ATen rows, recompile counts for dynamic shapes, and the real production shape distribution.

A shape-specialized compiled kernel and a hand-tuned generic kernel solve different deployment problems.

## 10. Profiling scaled dot-product attention

`torch.nn.functional.scaled_dot_product_attention` dispatches among implementations such as math/reference, memory-efficient, FlashAttention, and cuDNN attention.

Selection depends on:

- device and architecture
- PyTorch/CUDA/cuDNN versions
- dtype and Q/K/V layout
- head dimension and sequence lengths
- causal or explicit masks
- dropout and backward requirements
- GQA and other feature support

Force a backend for diagnosis:

```python
from torch.nn import functional as F
from torch.nn.attention import SDPBackend, sdpa_kernel

with sdpa_kernel(SDPBackend.FLASH_ATTENTION):
    output = F.scaled_dot_product_attention(
        query,
        key,
        value,
        is_causal=True,
    )
```

For production, automatic selection is normally preferable unless measurements on real shapes justify pinning.

Naive attention may launch separate kernels for $QK^\top$, scale, mask/copy, softmax, and $PV$. An out-of-place mask may introduce a hidden copy. That does not mean an in-place replacement is safe during training: autograd may need the overwritten forward value.

Flash-style kernels deliberately use registers and shared memory to keep tiles on chip. This can reduce occupancy while reducing far more expensive HBM traffic:

> Low occupancy is a clue about resource use, not proof of poor performance.

A reported `0%` can also be an attribution limitation for a launch path. Cross-check resource footprint and duration. The Hugging Face series' exact A100 backend timings are worked examples, not a permanent ranking.

## 11. Training is not inference

Forward-only profiling can mislead training optimization because backward can select different kernels, recompute intermediates, require values an in-place forward would overwrite, allocate more memory, and interact differently with compilation or checkpointing.

Profile these phases separately:

```text
data transfer
forward
loss
backward
gradient synchronization
optimizer
checkpoint/logging
```

Also distinguish prefill from decode, batch-1 latency from throughput batches, static shapes from production distributions, and one rank from distributed critical-path ranks. Use `nsys` when NCCL overlap, stragglers, or stream dependencies determine performance.

## 12. Memory interpretation

With `profile_memory=True`, tables attribute tensor allocations and releases. Distinguish:

- self versus child allocations
- live tensor memory
- caching-allocator reserved memory
- temporary library workspaces
- peak memory across the step

An allocation-heavy operator is not necessarily the owner of long-lived memory. Freed tensor memory may remain reserved. Use allocator statistics or memory snapshots for fragmentation and persistent-reservation questions.

## 13. Investigation checklist

1. Reproduce the issue without the profiler.
2. Define the metric: latency, throughput, memory, MFU, or goodput.
3. Warm the model, shapes, libraries, compiler, and input path.
4. Capture only a few steady-state steps.
5. Annotate semantic phases with `record_function`.
6. Write the expected operator and kernel inventory.
7. Inspect the table for dominant time, memory, and call count.
8. Inspect the GPU lane for gaps, copies, and fragmentation.
9. Trace surprising GPU events to their CPU/ATen launchers.
10. Distinguish views from materializations and allocations.
11. Compare kernel names, shapes, layouts, and dtypes.
12. Check for synchronization and profiler artifacts.
13. Change one variable at a time.
14. Re-measure outside the profiler.
15. Validate numerics and training after optimization.

The durable habit is:

> Predict first, inspect second, explain every mismatch, and verify the hypothesis with a controlled change.

## Related

- [Nsight Systems (`nsys`) Profiler](/atlas/tooling/profiling/nsys-profiler)
- [Roofline Model](/atlas/systems/performance/roofline-model)
- [Model FLOPs Utilization](/atlas/systems/performance/model-flops-utilization-mfu)
- [FlashAttention](/atlas/ai/architectures/transformers/flashattention)
- [Attention Softmax and Scaling](/atlas/ai/architectures/transformers/attention-softmax-and-scaling)
- [FP8 Training](/atlas/ai/training/precision/fp8-training)

## Sources

- Hugging Face, [Profiling in PyTorch, Part 1: A Beginner's Guide to `torch.profiler`](https://huggingface.co/blog/torch-profiler)
- Hugging Face, [Profiling in PyTorch, Part 2: From `nn.Linear` to a Fused MLP](https://huggingface.co/blog/torch-mlp-fusion)
- Hugging Face, [Profiling in PyTorch, Part 3: Attention Is All You Profile](https://huggingface.co/blog/torch-attention-profile)
- PyTorch, [`torch.profiler` API documentation](https://docs.pytorch.org/docs/stable/profiler.html)
- PyTorch, [Profiler recipe](https://docs.pytorch.org/tutorials/recipes/recipes/profiler_recipe.html)
- PyTorch, [Scaled dot-product attention tutorial](https://docs.pytorch.org/tutorials/intermediate/scaled_dot_product_attention_tutorial.html)
