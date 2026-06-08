---
title: "Goodput, Determinism, and Fault Tolerance"
date: 2026-06-08
lastmod: 2026-06-08
tags:
  - systems
  - infrastructure
  - training
draft: false
---

## Summary

At frontier scale, training efficiency is not just MFU. The more complete metric is goodput: how much useful training progress is actually produced per unit wall-clock time after accounting for failures, recomputation, checkpointing, and silent slowdowns. Determinism and fault tolerance are key levers for protecting that goodput.

## Concepts

- **MFU:** Model FLOPs Utilization, a measure of how efficiently training kernels use theoretical hardware throughput.
- **Goodput:** ideal training duration divided by actual wall-clock duration.
- **Determinism:** fixed training behavior for a fixed configuration, often at bitwise or at least numerically stable fidelity.
- **Recomputation overhead:** repeated work after failure and rollback to a checkpoint.

## 1. Why MFU is not enough

MFU only tells you how efficiently the system steps while it is healthy and running.

It does not include:

- crash loops
- restart delays
- checkpoint stalls
- recomputation after fallback
- unhealthy links
- slow process placement
- silent memory or network degradation

So a job can have decent MFU and still poor real productivity.

## 2. Goodput as the real production KPI

A useful definition is:

$$
\text{Goodput} = \frac{\text{ideal training duration}}{\text{actual wall-clock duration}}
$$

This makes visible the cost of:

- visible failures
- silent slowdowns
- recovery overhead
- restart-induced topology or health changes

That is why goodput is often the better KPI for expensive long-running jobs.

## 3. Determinism is not just for science

Determinism matters for:

- scientific reproducibility
- debugging
- restart correctness
- regression testing of kernels and infra

At large scale, determinism requires coordinated control over:

- data ordering
- random-number state
- kernel reduction order
- MoE routing tie-breaks
- collective communication topology
- checkpoint state completeness

So it is an infrastructure property, not just a modeling property.

## 4. Determinism enables stronger testing

If a fixed run is deterministic, then infrastructure changes can be tested against:

- exact loss traces
- gradient norms
- weight checksums
- checkpoint/restart equivalence

This makes it much easier to distinguish:

- expected numeric drift
- real correctness regressions

## 5. Fault tolerance is about total cost, not just uptime

A failure costs more than the time until restart.

It may also cost:

- recomputation since the last checkpoint
- delayed actor scheduling
- degraded placement
- lower MFU after recovery

So the goal is not only “survive failures.” It is:

- recover quickly
- minimize lost useful work
- keep restart behavior stable

## 6. Useful fault-tolerance patterns

Important patterns include:

- asynchronous checkpointing
- distributed checkpoints
- hot standby or in-job restart
- broadcast of replicated state to avoid storage hotspots
- progress watchdogs
- restart validation against expected metrics

These reduce both visible downtime and hidden throughput loss.

## 7. Treat MFU degradation like an incident

A practical lesson from large runs:

> if MFU drops materially, that is a production issue even if the job has not crashed

Why?

Because thousands of GPUs may still be allocated while producing less useful progress than expected.

That means:

- throughput regressions need owners
- checkpoint stalls need owners
- network degradation needs owners
- memory-path slowdowns need owners

## 8. What the MAI report adds

The MAI report is especially good on this operational framing:

- goodput as the central KPI
- determinism as a system-level discipline
- recovery cost decomposed beyond simple downtime
- MFU drop treated as a real production failure mode

That is a healthier way to think about frontier training than raw utilization alone.

## Related

- [Choosing an LLM Training Framework](/atlas/systems/infrastructure/choosing-an-llm-training-framework)
- [Asynchronous RL Infrastructure](/atlas/systems/infrastructure/asynchronous-rl-infrastructure)
- [MAI-Thinking-1: Building a Hill-Climbing Machine](/atlas/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine)
