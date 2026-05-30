---
title: "Reversible Networks (RevNets)"
date: 2026-04-20
lastmod: 2026-05-04
tags:
  - ai/deep-learning
  - architectures
  - memory-optimization
draft: false
---

## Summary

RevNets utilize the **Feistel Cipher** construction from cryptography to make neural network layers invertible. This allows the backward pass to "rematerialize" activations by running the network in reverse, saving memory at the cost of compute.
## 1. The Feistel Construction
In a standard residual network: $y = x + f(x)$. You cannot easily recover $x$ from $y$.
In a **Reversible Network**, the state is split into two halves $(x_1, x_2)$:
1. $y_1 = x_1 + f(x_2)$
2. $y_2 = x_2 + g(y_1)$

To invert:
1. $x_2 = y_2 - g(y_1)$
2. $x_1 = y_1 - f(x_2)$

## 2. Why use it?
- **Standard Training**: Requires storing all activations from the forward pass in memory ($O(L)$ space for $L$ layers).
- **RevNet Training**: You only store the final layer's activations. You recompute (reverse) each preceding layer's activation on-the-fly during the backward pass.
- **Trade-off**: You trade roughly **33% more compute** to potentially reduce activation memory footprint to near zero.
