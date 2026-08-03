# Nsight Systems (`nsys`) Profiler

`nsys` is NVIDIA Nsight Systems. It is the profiler to use when the question is:

- Is my GPU actually busy?
- Am I input-bound or compute-bound?
- Is the CPU spending time launching lots of tiny kernels?
- Are there synchronization stalls?
- Are data transfers significant?

It is a **timeline profiler**. It is not the best tool for deep analysis of a single kernel. For that, use `ncu` (`Nsight Compute`).

## What `nsys` records

At a high level, `nsys` records:

- CPU threads
- CUDA API calls
- CUDA kernels
- CUDA memcpys
- OS runtime waits
- NVTX ranges, if the code emits them

This makes it a good tool for reading the end-to-end behavior of a training loop.

## Main artifacts

You will usually see one of these:

- `.nsys-rep`: final report file, open this in `nsys-ui`
- `.qdstrm`: raw capture stream, not the file you usually want to open directly
- `.sqlite`: exported database used by `nsys stats`

### `.qdstrm` vs `.nsys-rep`

If you only got a `.qdstrm`, the run usually did not fully finalize, or you interrupted it too early.

For normal usage, prefer generating a bounded capture that exits cleanly and produces a `.nsys-rep`.

## Basic command

```bash
nsys profile -o profile_report \
  python train.py --arg1 value1 --arg2 value2
```

This writes:

```text
profile_report.nsys-rep
```

Open it with:

```bash
nsys-ui
```

## Recommended options for short training captures

For PyTorch training, this is a good default:

```bash
nsys profile \
  --trace=cuda,osrt,nvtx \
  --sample=none \
  --cpuctxsw=none \
  -o /tmp/train_profile \
  python train.py --arg1 value1 --arg2 value2
```

Why:

- `--trace=cuda,osrt,nvtx`: record CUDA activity, OS runtime, and NVTX ranges
- `--sample=none`: reduce overhead from CPU sampling
- `--cpuctxsw=none`: reduce context switch tracing overhead

## Capturing only a few steps

For training, startup is often noisy and not representative. The cleanest pattern is:

```bash
nsys profile \
  --trace=cuda,osrt,nvtx \
  --sample=none \
  --cpuctxsw=none \
  --delay=10 \
  --duration=0.8 \
  -o /tmp/train_3steps \
  python train.py --arg1 value1 --arg2 value2
```

Interpretation:

- `--delay=10`: skip startup
- `--duration=0.8`: capture a tiny steady-state window

If one step is around `0.2s`, then `0.8s` is roughly `3-4` steps.

## Summary reports in terminal

You do not need the UI for a first pass. These are useful:

```bash
nsys stats profile_report.nsys-rep
```

More targeted:

```bash
nsys stats --report cuda_gpu_kern_sum profile_report.nsys-rep
nsys stats --report cuda_api_sum profile_report.nsys-rep
nsys stats --report osrt_sum profile_report.nsys-rep
```

What they mean:

- `cuda_gpu_kern_sum`: where GPU execution time went
- `cuda_api_sum`: what the CPU spent time asking CUDA to do
- `osrt_sum`: host-side runtime waits like `poll`, `sem_wait`, `pthread_cond_wait`

## How to read `nsys-ui`

The most useful rows to expand first are:

1. the `python` process
2. `Threads`
3. `CUDA API`
4. `CUDA HW`

Everything else is secondary for a first read.

### Mental model

- `Threads`: normal CPU thread activity
- `CUDA API`: CPU asking the GPU to do work
- `CUDA HW`: GPU actually doing work

If you only remember one thing, remember that.

## Where to look for CPU activity

CPU-side activity appears in two places:

### 1. `Threads`

This is general host execution. You will often see a lot of:

- `poll`
- `pthread_cond_wait`
- `sem_wait`

This does **not** automatically mean there is a CPU bottleneck. It often just means threads are blocked waiting for work or synchronization.

### 2. `CUDA API`

This is the most useful CPU lane for GPU training.

Typical calls:

- `cudaLaunchKernel`
- `cudaMemcpyAsync`
- `cudaStreamSynchronize`
- `cudaEventRecord`

Interpretation:

- lots of `cudaLaunchKernel`: many GPU kernels are being launched
- large `cudaMemcpyAsync`: transfers may matter
- large `cudaStreamSynchronize` or `cudaDeviceSynchronize`: synchronization overhead or stalls

## Where to look for GPU activity

Look at:

- `CUDA HW`

This is the real GPU execution timeline.

Typical things you will see:

- GEMMs
- flash attention kernels
- layer norm kernels
- elementwise kernels
- DALI kernels

Questions to ask:

- Is the GPU lane densely packed?
- Are there visible idle gaps?
- Are there many tiny kernels?

Interpretation:

- dense lane: compute-bound or at least well-fed
- large gaps: input starvation, synchronization, or host-side delay
- many tiny kernels: possible kernel fragmentation / fusion opportunity

## Where to look for communication

For multi-GPU training, communication usually shows up as:

- NCCL kernels
- all-reduce / broadcast activity
- NCCL-related NVTX ranges

If you ran with:

```bash
--nproc_per_node=1
```

then there is no meaningful inter-GPU communication to inspect. In that case, ignore comms and focus on `CUDA HW` and `CUDA API`.

## How to visually identify one training step

Without NVTX markers, `nsys` does not know what a "step" is. You infer it by looking for repeated patterns.

A typical step looks like:

1. burst of `cudaLaunchKernel` in `CUDA API`
2. matching burst of kernels in `CUDA HW`
3. repeated again and again

So the workflow is:

1. zoom into the dense steady-state region
2. find one repeated block of GPU kernels
3. treat that repeated block as one step

If you want explicit step boundaries, add NVTX ranges around each step in code.

## Common interpretations

### Compute-bound

Signs:

- `CUDA HW` is densely packed
- GPU kernel summary dominated by GEMMs / attention / backward kernels
- few large idle gaps

This usually means the main wins come from:

- reducing model compute
- using a smaller or more efficient loss
- batch size tuning
- fusion / compilation

### Input-bound

Signs:

- noticeable idle gaps between bursts of GPU kernels
- GPU is not continuously busy
- CPU or reader pipeline is not feeding the GPU fast enough

This usually means looking at:

- data loading
- augmentation placement
- DALI / DataLoader settings
- storage latency

### Too many tiny kernels

Signs:

- `cudaLaunchKernel` is very high in `cuda_api_sum`
- the timeline is full of small short kernels

This usually points to:

- too many unfused elementwise ops
- potential `torch.compile` opportunity
- custom Python-side model code that prevents fusion

## Example reading pattern

A practical first pass is:

1. Open the report in `nsys-ui`
2. Ignore startup
3. Zoom into steady-state
4. Look at `CUDA HW`
   - busy or not?
5. Look at `CUDA API`
   - many launches?
   - many syncs?
6. Ignore `Threads` unless you already suspect a host bottleneck
7. Ignore comms if single-GPU

## Common mistakes

### Reading startup instead of steady-state

Startup includes:

- process creation
- CUDA initialization
- first kernel autotuning
- data pipeline warmup

This is often not representative.

### Over-reading `osrt_sum`

Lots of `poll`, `sem_wait`, or `pthread_cond_wait` does not automatically mean a CPU bottleneck.

### Using only one view

You need both:

- `CUDA HW` to know what the GPU is doing
- `CUDA API` to know what the CPU is asking CUDA to do

## `nsys` vs `ncu`

Use `nsys` first when the question is:

- where does end-to-end time go?

Use `ncu` when the question is:

- why is this specific kernel slow?

Short version:

- `nsys`: whole training loop
- `ncu`: one kernel in depth

## Related

- [PyTorch Profiler and GPU Trace Reading](/atlas/tooling/profiling/pytorch-profiler-and-gpu-trace-reading)
- [Roofline Model](/atlas/systems/performance/roofline-model)
- [Model FLOPs Utilization](/atlas/systems/performance/model-flops-utilization-mfu)
