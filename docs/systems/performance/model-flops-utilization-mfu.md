---
title: "Model FLOPs Utilization (MFU)"
date: 2026-06-08
lastmod: 2026-06-08
tags:
  - systems
  - performance
  - training
draft: false
---

## Summary

Model FLOPs Utilization (MFU) measures how much of a device's theoretical compute throughput is being turned into **useful model FLOPs during training**. It is a training-efficiency metric, not a direct measure of end-to-end productivity.

## Concepts

- **MFU:** ratio of model FLOPs actually executed per second to the hardware's theoretical peak FLOPs/s.
- **Model FLOPs:** the leading-order floating-point work from the training computation, usually dominated by GEMMs and attention.
- **Step time:** end-to-end time for one training step, including forward, backward, communication, optimizer updates, and waiting.
- **Peak throughput:** theoretical hardware FLOPs/s for the relevant precision.
- **Goodput:** wall-clock productivity after including failures, recomputation, and other overheads.

## Content

### Core definition

MFU is usually defined as:

$$
\mathrm{MFU} = \frac{\text{model FLOPs per step}}{\text{step time} \times \text{hardware peak FLOPs/s}}
$$

If the training run uses $N$ identical accelerators, then:

$$
\mathrm{MFU} = \frac{F_{\text{step}}}{t_{\text{step}} \times N \times P_{\text{peak}}}
$$

where:

- $F_{\text{step}}$ is total model FLOPs for one step
- $t_{\text{step}}$ is wall-clock step time
- $N$ is number of devices
- $P_{\text{peak}}$ is peak FLOPs/s per device

Interpretation:

- `MFU = 1.0` would mean perfect use of the device's theoretical peak
- in practice, real runs are much lower

### What MFU is trying to capture

MFU asks:

> given how expensive this model's math is, how efficiently is the system turning hardware time into that math?

So MFU is most useful for:

- comparing training-stack efficiency
- understanding whether kernels/communication are leaving too much compute idle
- tracking regressions in training efficiency

### What counts in the numerator

The numerator is usually **model FLOPs**, not every floating-point instruction the system executes.

Typical inclusions:

- dense GEMMs
- attention matmuls
- MoE expert GEMMs
- other leading-order compute kernels

Typical exclusions or ambiguities:

- memory-bound elementwise ops
- dataloader work
- checkpoint serialization
- CPU-side orchestration
- recomputation overhead, depending on the paper or framework

This means MFU is somewhat convention-dependent. Two teams can report different MFUs if they count FLOPs differently.

### Why MFU is not the same as utilization

MFU is not the same thing as:

- GPU utilization from `nvidia-smi`
- occupancy
- SM busy percentage
- wall-clock productivity

You can have:

- high GPU utilization but mediocre MFU
- good MFU but poor goodput

because waiting, restart overhead, recomputation, and checkpoint stalls are not fully captured by MFU alone.

### Worked example

Suppose you train a model on `8` GPUs.

Assume:

- model FLOPs per step:

$$
F_{\text{step}} = 1.2 \times 10^{16}\ \text{FLOPs}
$$

- step time:

$$
t_{\text{step}} = 0.40\ \text{s}
$$

- hardware peak per GPU:

$$
P_{\text{peak}} = 1.0 \times 10^{15}\ \text{FLOPs/s}
$$

Then total theoretical cluster peak is:

$$
N \times P_{\text{peak}} = 8 \times 10^{15}\ \text{FLOPs/s}
$$

The total theoretical FLOPs available during one step is:

$$
t_{\text{step}} \times N \times P_{\text{peak}}
= 0.40 \times 8 \times 10^{15}
= 3.2 \times 10^{15}\ \text{FLOPs}
$$

Now compute MFU:

$$
\mathrm{MFU}
= \frac{1.2 \times 10^{16}}{3.2 \times 10^{15}}
= 0.375
$$

So:

$$
\mathrm{MFU} = 37.5\%
$$

Meaning:

- the training system is realizing about `37.5%` of the hardware's theoretical peak on model math

### Same example using tokens

Sometimes you estimate model FLOPs per step from batch size and model size.

A rough transformer-training estimate is:

$$
F_{\text{step}} \approx 6ND
$$

where:

- $N$ is model parameter count
- $D$ is number of training tokens in the step

Example:

- parameters:

$$
N = 7 \times 10^9
$$

- tokens per step:

$$
D = 2 \times 10^6
$$

Then:

$$
F_{\text{step}} \approx 6 \times 7 \times 10^9 \times 2 \times 10^6
= 8.4 \times 10^{16}\ \text{FLOPs}
$$

If this runs on `64` GPUs, each with peak:

$$
P_{\text{peak}} = 1.0 \times 10^{15}\ \text{FLOPs/s}
$$

and the step time is:

$$
t_{\text{step}} = 2.8\ \text{s}
$$

then:

$$
\mathrm{MFU}
= \frac{8.4 \times 10^{16}}{2.8 \times 64 \times 10^{15}}
= \frac{8.4}{179.2}
\approx 0.469
$$

So MFU is about:

$$
46.9\%
$$

### Why MFU drops

MFU goes down when the step time grows without a proportional increase in useful model FLOPs.

Common reasons:

- inefficient kernels
- communication overhead
- poor overlap between compute and communication
- activation checkpointing / recomputation
- memory pressure
- small GEMMs
- MoE routing overhead
- load imbalance
- long-context attention costs

### Why MFU can improve with bigger models

Sometimes larger models get **higher** MFU because:

- GEMMs become larger and more hardware-friendly
- arithmetic intensity improves
- fixed overheads are amortized better

This is one reason MFU should be interpreted with context. A smaller run with lower MFU is not automatically “worse engineered.”

### MFU vs goodput

MFU measures:

$$
\text{training-step compute efficiency}
$$

Goodput measures:

$$
\text{end-to-end wall-clock productivity}
$$

So:

- MFU answers “how efficiently are we stepping?”
- goodput answers “how much real progress are we getting?”

A run can have strong MFU but weak goodput if it suffers from:

- crashes
- frequent checkpoint stalls
- recomputation after rollback
- long startup or recovery time

### Practical interpretation

MFU is best used for:

- comparing kernels or parallelism strategies
- tracking regressions in the training stack
- reasoning about scaling efficiency

MFU is less useful as a standalone top-line metric for:

- full production reliability
- wall-clock schedule predictability
- total training productivity

For those, pair it with [Goodput, Determinism, and Fault Tolerance](/atlas/systems/infrastructure/goodput-determinism-and-fault-tolerance).

## Related

- [Goodput, Determinism, and Fault Tolerance](/atlas/systems/infrastructure/goodput-determinism-and-fault-tolerance)
- [Roofline Model](/atlas/systems/performance/roofline-model)
- [Latency vs. Throughput](/atlas/systems/performance/latency-vs-throughput)
- [The Llama 3 Herd of Models](/atlas/ai/architectures/model-reports/the-llama-3-herd-of-models)
- [MAI-Thinking-1: Building a Hill-Climbing Machine](/atlas/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine)
