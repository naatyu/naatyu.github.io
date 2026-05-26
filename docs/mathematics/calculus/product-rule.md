---
title: "Product Rule"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - math/calculus
  - theory
draft: false
---

## Summary

A fundamental rule in calculus used to find the derivative of a function that is the product of two or more differentiable functions.
## Concepts
- **Derivative:** The rate of change of a function with respect to a variable.
- **Differentiable:** A function that has a derivative at each point in its domain.
- **Leibniz Notation:** A notation for differentiation (e.g., $\frac{d}{dx}$) that emphasizes the operator-like nature of the derivative.

## Content

### The Rule
If we have two differentiable functions $f(x)$ and $g(x)$, the derivative of their product $h(x) = f(x)g(x)$ is given by:

$$(f \cdot g)' = f'g + fg'$$

In Leibniz notation, this is expressed as:
$$\frac{d}{dx}[f(x)g(x)] = \frac{df}{dx}g(x) + f(x)\frac{dg}{dx}$$

### Conceptual Intuition
Imagine a rectangle with sides $f(x)$ and $g(x)$. The area of this rectangle is $A = f(x)g(x)$. If we increase $x$ by a tiny amount $dx$, the change in area ($dA$) comes from:
1. The change in the first side ($df$) multiplied by the second side ($g$).
2. The change in the second side ($dg$) multiplied by the first side ($f$).
3. A tiny corner $(df \cdot dg)$ which becomes negligible as $dx \to 0$.

### Extension to Multiple Functions
The rule scales linearly. For three functions $u, v, w$:
$$(uvw)' = u'vw + uv'w + uvw'$$

### Example
Find the derivative of $h(x) = x^2 \sin(x)$:
- Let $f(x) = x^2 \implies f'(x) = 2x$
- Let $g(x) = \sin(x) \implies g'(x) = \cos(x)$

Applying the rule:
$$h'(x) = (2x)\sin(x) + (x^2)\cos(x)$$

## Related
- Mathematics MOC
- [Chain Rule](/atlas/mathematics/calculus/chain-rule)
- Quotient Rule
