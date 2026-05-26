---
title: "Cross Product"
date: 2026-04-10
lastmod: 2026-04-15
tags:
  - math/linear-algebra
  - theory
draft: false
---

## Summary

The cross product is a binary operation on two vectors in 3D space, resulting in a vector that is perpendicular to both inputs. Its magnitude represents the area of the parallelogram formed by the two vectors.
## Concepts
- **Orthogonal:** Two vectors that are perpendicular (at a 90° angle) to each other.
- **Right-Hand Rule:** A mnemonic for determining the direction of the cross product vector ($x$ axis index, $y$ axis middle, $z$ axis result/thumb).
- **Determinant Form:** A symbolic way to compute the cross product using a $3 \times 3$ matrix with unit vectors $\mathbf{i}, \mathbf{j}, \mathbf{k}$ in the first row.
- **Anti-Commutative:** A property where swapping the order of operands changes the sign of the result: $\mathbf{a} \times \mathbf{b} = -(\mathbf{b} \times \mathbf{a})$.

## Content

### Mathematical Definition
For two vectors $\mathbf{a} = [a_1, a_2, a_3]^T$ and $\mathbf{b} = [b_1, b_2, b_3]^T$, the cross product $\mathbf{c} = \mathbf{a} \times \mathbf{b}$ is defined as:

$$\mathbf{a} \times \mathbf{b} = \begin{vmatrix} \mathbf{i} & \mathbf{j} & \mathbf{k} \\ a_1 & a_2 & a_3 \\ b_1 & b_2 & b_3 \end{vmatrix}$$

Expanding the determinant:
$$\mathbf{a} \times \mathbf{b} = \left[ a_2b_3 - a_3b_2, \ a_3b_1 - a_1b_3, \ a_1b_2 - a_2b_1 \right]$$

### Geometric Interpretation
The result $\mathbf{c}$ is perpendicular to the plane containing $\mathbf{a}$ and $\mathbf{b}$.

#### Magnitude
The magnitude $\|\mathbf{a} \times \mathbf{b}\|$ is equal to the **area of the parallelogram** spanned by $\mathbf{a}$ and $\mathbf{b}$:
$$\|\mathbf{a} \times \mathbf{b}\| = \|\mathbf{a}\| \|\mathbf{b}\| \sin(\theta)$$
where $\theta$ is the angle between the vectors ($0 \le \theta \le \pi$).

- If $\mathbf{a} \times \mathbf{b} = \mathbf{0}$, the vectors are **parallel** (or one is the zero vector).

### Key Properties
1. **Anti-commutative**: $\mathbf{a} \times \mathbf{b} = -(\mathbf{b} \times \mathbf{a})$
2. **Distributive**: $\mathbf{a} \times (\mathbf{b} + \mathbf{c}) = (\mathbf{a} \times \mathbf{b}) + (\mathbf{a} \times \mathbf{c})$
3. **Scalar Multiplication**: $k(\mathbf{a} \times \mathbf{b}) = (k\mathbf{a}) \times \mathbf{b} = \mathbf{a} \times (k\mathbf{b})$
4. **Self-product**: $\mathbf{a} \times \mathbf{a} = \mathbf{0}$

### Example Calculation
For $\mathbf{a} = [1, 0, 0]$ (unit $x$-axis) and $\mathbf{b} = [0, 1, 0]$ (unit $y$-axis):
$$\mathbf{a} \times \mathbf{b} = [ (0\cdot 0 - 0\cdot 1), \ (0\cdot 0 - 1\cdot 0), \ (1\cdot 1 - 0\cdot 0) ] = [0, 0, 1]$$
The result is the unit $z$-axis, which is perpendicular to both $x$ and $y$.

### Use Cases
- **3D Graphics**: Calculating surface normals to determine how light reflects off a triangle.
- **Physics**: Computing torque ($\mathbf{\tau} = \mathbf{r} \times \mathbf{F}$) and angular momentum.
- **Machine Learning**: Verifying orthogonality in low-dimensional geometric projections or embeddings.

## Related
- Mathematics MOC
- [Gradient Direction and Magnitude](/atlas/mathematics/calculus/gradient-direction-and-magnitude)
- [Partial Derivatives](/atlas/mathematics/calculus/partial-derivatives)
- Isotropic vs Anisotropic Embeddings
