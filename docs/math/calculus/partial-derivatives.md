---
title: "Partial Derivatives"
date: 2026-04-10
lastmod: 2026-04-10
tags:
  - math/calculus
  - ai/deep-learning
  - theory
draft: false
---

## Summary

Partial derivatives measure the rate of change of a multivariable function with respect to a single variable while treating all other variables as constant. They are the building blocks of the gradient and backpropagation in machine learning.
## Concepts
- **Multivariable Function:** A function $f(x, y, \dots)$ that depends on more than one input variable.
- **Ceteris Paribus:** A Latin phrase meaning "all other things being equal," which describes the core logic of partial differentiation.
- **Jacobian Matrix:** A matrix of all first-order partial derivatives of a vector-valued function.
- **Clairaut's Theorem:** The principle that the order of differentiation does not matter for mixed partial derivatives, provided the function is sufficiently smooth.

## Content

### Mathematical Definition
For a function $f(x, y)$, the partial derivatives at a point $(x, y)$ are defined by the limits:

$$\frac{\partial f}{\partial x} = \lim_{h \to 0} \frac{f(x+h, y) - f(x, y)}{h}$$
$$\frac{\partial f}{\partial y} = \lim_{h \to 0} \frac{f(x, y+h) - f(x, y)}{h}$$

**Key Rule**: To compute $\frac{\partial f}{\partial x}$, treat $y$ as a constant and differentiate $f$ as if it were a single-variable function of $x$.

### Common Notations
Partial derivatives can be expressed in several ways:
$$\frac{\partial f}{\partial x} = \partial_x f = f_x = D_x f$$

### Computing Partial Derivatives: Example
Given $f(x, y) = x^2y + xy^2$:

1. **With respect to $x$** (treat $y$ as constant):
   $$\frac{\partial f}{\partial x} = 2xy + y^2$$
2. **With respect to $y$** (treat $x$ as constant):
   $$\frac{\partial f}{\partial y} = x^2 + 2xy$$

At the point $(2, 3)$:
- $\frac{\partial f}{\partial x}\big|_{(2,3)} = 2(2)(3) + 3^2 = 12 + 9 = 21$
- $\frac{\partial f}{\partial y}\big|_{(2,3)} = 2^2 + 2(2)(3) = 4 + 12 = 16$
- **Resulting Gradient**: $\nabla f(2, 3) = \begin{bmatrix} 21 \\ 16 \end{bmatrix}$

### Geometric Interpretation
- **$\frac{\partial f}{\partial x}$**: The slope of the curve formed by the intersection of the surface $z = f(x, y)$ and the plane $y = y_0$. It represents the rate of change when moving strictly in the $x$-direction.
- **$\frac{\partial f}{\partial y}$**: The slope of the curve formed by the intersection of the surface and the plane $x = x_0$.

### Application: Gradient Descent
In optimization, we update each parameter independently using its partial derivative:
$$x_{t+1} = x_t - \eta \frac{\partial f}{\partial x}$$
$$y_{t+1} = y_t - \eta \frac{\partial f}{\partial y}$$

### Higher-Order Partial Derivatives
Second-order partials describe the curvature of the surface:
- **Pure Partials**: $\frac{\partial^2 f}{\partial x^2}$, $\frac{\partial^2 f}{\partial y^2}$
- **Mixed Partials**: $\frac{\partial^2 f}{\partial x \partial y}$

By **Clairaut's Theorem**, if the second partials are continuous:
$$\frac{\partial^2 f}{\partial x \partial y} = \frac{\partial^2 f}{\partial y \partial x}$$

### Machine Learning Applications
#### Loss Function Optimization
In a linear regression with $L(w, b) = \frac{1}{n} \sum (y_i - (wx_i + b))^2$:
- $\frac{\partial L}{\partial w}$ tells us how changing the weight $w$ affects the error.
- $\frac{\partial L}{\partial b}$ tells us how changing the bias $b$ affects the error.

#### Backpropagation
Neural networks rely on the **Chain Rule** for partial derivatives to propagate errors from the output layer back to the input weights:
$$\frac{\partial L}{\partial w_i} = \frac{\partial L}{\partial a} \cdot \frac{\partial a}{\partial z} \cdot \frac{\partial z}{\partial w_i}$$

## Related
- Mathematics MOC
- [Gradient Direction and Magnitude](/atlas/math/calculus/gradient-direction-and-magnitude)
- [Product Rule](/atlas/math/calculus/product-rule)
- [Chain Rule](/atlas/math/calculus/chain-rule)
- Optimization with PyTorch
