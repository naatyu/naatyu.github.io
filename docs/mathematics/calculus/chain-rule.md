---
title: "Chain Rule"
date: 2026-04-10
lastmod: 2026-04-10
tags:
  - math/calculus
  - ai/deep-learning
  - theory
draft: false
---

## Summary

The chain rule is a formula for computing the derivative of the composition of two or more functions. It is the fundamental principle behind backpropagation in neural networks, allowing gradients to be calculated across multiple layers.
## Concepts
- **Composition:** A function $h(x) = f(g(x))$ where the output of one function becomes the input of another.
- **Inner vs. Outer Function:** In $f(g(x))$, $g(x)$ is the "inner" function and $f(u)$ is the "outer" function.
- **Rate of Change Propagation:** The concept that a change in the input $x$ propagates through intermediate layers to affect the final output.
- **Automatic Differentiation:** A set of techniques to numerically evaluate the derivative of a function specified by a computer program, heavily reliant on the chain rule.

## Content

### Basic Definition
For a composite function $h(x) = f(g(x))$, the derivative is the product of the derivative of the outer function (evaluated at the inner function) and the derivative of the inner function:

$$h'(x) = f'(g(x)) \cdot g'(x)$$

### Intuition: The Thermostat Example
Imagine the following rates of change:
1. The temperature changes at **2°C per hour**.
2. A thermostat reading changes by **0.5 units per °C**.
3. **Result**: The reading changes by $2 \times 0.5 = 1$ unit per hour.

Mathematically, if $u = g(x)$ and $y = f(u)$, the rate of change of $y$ with respect to $x$ is the product of their intermediate rates.

### Leibniz Notation
The chain rule is often easier to visualize in Leibniz notation, where it appears as if the intermediate terms "cancel out":

$$\frac{dy}{dx} = \frac{dy}{du} \cdot \frac{du}{dx}$$

For three variables $y = f(v), v = g(u), u = h(x)$:
$$\frac{dy}{dx} = \frac{dy}{dv} \cdot \frac{dv}{du} \cdot \frac{du}{dx}$$

### Algorithmic View: Forward and Backward Pass
In computational contexts (like training neural networks), the chain rule is implemented as a two-step process.

**Function**: $h(x) = e^{\sin(x^2)}$ at $x=0.5$

#### 1. Forward Pass (Compute values)
- $u_1 = x^2 = 0.25$
- $u_2 = \sin(u_1) \approx 0.2474$
- $h = e^{u_2} \approx 1.2807$

#### 2. Backward Pass (Compute derivatives)
- $\frac{dh}{du_2} = e^{u_2} \approx 1.2807$
- $\frac{du_2}{du_1} = \cos(u_1) \approx 0.9689$
- $\frac{du_1}{dx} = 2x = 1.0$
- **Total Derivative**: $\frac{dh}{dx} = 1.2807 \times 0.9689 \times 1.0 \approx 1.2409$

### Connection to Backpropagation
A deep neural network is essentially a massive composition of functions:
$$L = \text{Loss}(f_n(\dots f_2(f_1(x))))$$

Backpropagation applies the chain rule starting from the loss $L$ and working backwards to find the gradient with respect to each weight $w$:
$$\frac{\partial L}{\partial w_i} = \frac{\partial L}{\partial \text{output}} \cdot \frac{\partial \text{output}}{\partial \text{layer}_i} \cdot \frac{\partial \text{layer}_i}{\partial w_i}$$

### Key Properties
1. **Associativity**: You can group the multiplications in any order ($a(bc)$ or $(ab)c$).
2. **Local Computation**: Each "layer" or function only needs to know its local derivative to contribute to the global gradient.
3. **Efficiency**: Allows computing all gradients in a single backward pass after one forward pass.

## Related
- Mathematics MOC
- [Product Rule](/atlas/mathematics/calculus/product-rule)
- [Partial Derivatives](/atlas/mathematics/calculus/partial-derivatives)
- [Gradient Direction and Magnitude](/atlas/mathematics/calculus/gradient-direction-and-magnitude)
- Optimization with PyTorch
