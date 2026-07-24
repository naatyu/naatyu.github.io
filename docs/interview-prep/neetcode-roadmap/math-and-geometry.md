---
title: "Math and Geometry"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 18
tags:
  - algorithms
  - neetcode
  - math
  - geometry
  - matrices
  - leetcode
draft: false
---

## Summary

Math and geometry problems usually become simple once the correct representation is chosen. The recurring skills are modular arithmetic, number decomposition, coordinate transforms, matrix boundaries, and careful handling of precision.

## Number techniques

### Greatest common divisor

Euclid's algorithm:

```python
def gcd(a, b):
    while b:
        a, b = b, a % b
    return abs(a)
```

Least common multiple:

```python
lcm = abs(a // gcd(a, b) * b)
```

Divide before multiplying when fixed-width overflow is possible.

### Prime factorization

Trial division only needs to test factors while `factor * factor <= number`. If the remaining number is greater than one afterward, it is a prime factor.

### Modular arithmetic

Useful identities:

$$
(a + b) \bmod m =
((a \bmod m) + (b \bmod m)) \bmod m
$$

$$
(a \times b) \bmod m =
((a \bmod m) \times (b \bmod m)) \bmod m
$$

Use fast exponentiation for large powers:

```python
def power(base, exponent, modulus):
    result = 1
    base %= modulus

    while exponent:
        if exponent & 1:
            result = result * base % modulus
        base = base * base % modulus
        exponent >>= 1

    return result
```

## Digit simulation

Extract decimal digits with:

```python
digit = number % 10
number //= 10
```

Common uses:

- reverse an integer
- detect repeated digit transformations
- construct palindromes
- simulate elementary arithmetic

Watch for negative-number division rules and overflow constraints.

## Matrix patterns

### Boundary traversal

For spiral order, maintain:

- `top`
- `bottom`
- `left`
- `right`

After traversing a boundary, move it inward. Recheck bounds before traversing the bottom row or left column.

### Rotate a square matrix

A 90-degree clockwise rotation can be decomposed into:

1. transpose across the main diagonal
2. reverse every row

This separates a coordinate transform into two simple in-place operations.

### Coordinate encoding

Map `(row, column)` to a single index:

```python
index = row * columns + column
row = index // columns
column = index % columns
```

This is useful for binary search, Union-Find, and compact visited states.

## Geometry patterns

### Slopes without floating point

Avoid computing `dy / dx` as a float. Normalize the pair `(dy, dx)` by their GCD and use a consistent sign.

Special cases:

- vertical lines
- horizontal lines
- duplicate points

### Cross product

For points `A`, `B`, and `C`, the sign of:

$$
(B_x - A_x)(C_y - A_y) -
(B_y - A_y)(C_x - A_x)
$$

indicates whether the turn from `AB` to `AC` is counterclockwise, clockwise, or collinear.

### Distance comparison

Compare squared distances when the exact distance is unnecessary:

```python
distance_squared = x * x + y * y
```

This avoids square roots and floating-point error.

## Cycle detection in numeric processes

Repeated numeric transformations may enter a cycle. Use:

- a visited set
- fast and slow pointers if the state transition is deterministic

Happy Number is a typical example.

## Common mistakes

- using floating-point equality for slopes
- failing to normalize slope signs
- forgetting duplicate points
- traversing a matrix boundary twice after rows or columns cross
- applying modulo only at the end of huge computations
- mishandling negative integer division
- using a square-root distance when squared distance is sufficient

## Practice progression

1. Rotate Image
2. Spiral Matrix
3. Set Matrix Zeroes
4. Happy Number
5. Plus One
6. Pow(x, n)
7. Multiply Strings
8. Detect Squares
