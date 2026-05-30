---
title: "Test-Time Compute"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - ai/llm
  - inference
draft: false
---

## Summary

Shifting the performance scaling from pretraining ($N, D$) to inference ($T$). It explores how smaller models can achieve "O1-style" reasoning capabilities by spending more FLOPs during the generation process.
## Concepts
- **Process-Based Reward Model (PRM):** A verifier trained to score every intermediate step of a solution, allowing for **Step-wise Beam Search**.
- **Pass@N:** The probability that at least one of the $N$ samples generated for a prompt is correct.
- **Lookahead Search:** A strategy where the model generates multiple potential "future" paths to decide the next best token.

## Content

### Proposer-Verifier Framework
Test-time compute scaling relies on two components:
1.  **Proposer**: The base LLM generating candidate tokens or full answers.
2.  **Verifier**: An external model (ORM or PRM) that evaluates the candidates.

### Scaling Strategies
The optimal strategy depends on **Prompt Difficulty**:
- **Easy Tasks**: *Best-of-N* (parallel sampling) is compute-optimal.
- **Hard Tasks**: *Beam Search* or *Tree-of-Thought* (sequential search) is more effective.
- **The "Limit"**: If a model has zero probability of generating the correct logic (capability gap), no amount of test-time compute can recover the answer.

### Mathematical Scaling
The study suggests that for difficult reasoning tasks, doubling test-time compute (e.g., more search depth) can sometimes provide performance gains equivalent to a $10 \times$ increase in pretraining compute.

## Related
- AI Papers MOC
- [Scaling Laws](/atlas/ai/training/scaling/scaling-laws)
- [Large Concept Models](/atlas/ai/architectures/model-families/large-concept-models)
