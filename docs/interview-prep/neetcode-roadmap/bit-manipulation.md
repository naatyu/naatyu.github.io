---
title: "Bit Manipulation"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 17
tags:
  - algorithms
  - neetcode
  - bit-manipulation
  - leetcode
draft: false
---

## Summary

Bit manipulation treats an integer as a compact array of boolean flags. It is especially useful for parity, powers of two, XOR cancellation, subset masks, and operations on fixed-width binary representations.

## Essential operators

| Operation | Meaning |
| --- | --- |
| `a & b` | bits set in both |
| `a \| b` | bits set in either |
| `a ^ b` | bits that differ |
| `~a` | bitwise complement |
| `a << k` | shift left by `k` |
| `a >> k` | shift right by `k` |

## Core techniques

### Test bit `i`

```python
is_set = (number & (1 << i)) != 0
```

### Set bit `i`

```python
number |= 1 << i
```

### Clear bit `i`

```python
number &= ~(1 << i)
```

### Toggle bit `i`

```python
number ^= 1 << i
```

## XOR pattern

XOR has useful cancellation properties:

- `x ^ x = 0`
- `x ^ 0 = x`
- order does not matter

If every value appears twice except one:

```python
def single_number(nums):
    result = 0

    for value in nums:
        result ^= value

    return result
```

The same idea can separate two unique values by partitioning numbers according to a differing bit.

## Lowest set bit

```python
lowest = number & -number
```

This isolates the rightmost set bit in two's-complement arithmetic.

To remove the lowest set bit:

```python
number &= number - 1
```

This gives an efficient population count:

```python
def count_bits(number):
    count = 0

    while number:
        number &= number - 1
        count += 1

    return count
```

## Power of two

A positive power of two has exactly one set bit:

```python
def is_power_of_two(number):
    return number > 0 and (number & (number - 1)) == 0
```

## Bitmask subsets

For `n` elements, integers from `0` to `2^n - 1` encode all subsets.

```python
def subsets(nums):
    result = []

    for mask in range(1 << len(nums)):
        subset = []

        for i, value in enumerate(nums):
            if mask & (1 << i):
                subset.append(value)

        result.append(subset)

    return result
```

Bitmasks also encode visited sets in DP when `n` is small.

## Fixed width and negative numbers

Python integers have arbitrary precision, so `~x` and right shifts of negative numbers do not behave like fixed 32-bit unsigned integers. Apply a mask when a problem specifies fixed width:

```python
MASK = 0xFFFFFFFF
value &= MASK
```

Convert an unsigned 32-bit result back to signed form when necessary.

## Common mistakes

- forgetting parentheses around shifts and masks
- assuming XOR means exponentiation in Python
- applying the power-of-two test to zero
- ignoring fixed-width behavior for negative numbers
- using bit tricks when clearer arithmetic is sufficient
- confusing bit position with bit value

## Practice progression

1. Single Number
2. Number of 1 Bits
3. Counting Bits
4. Reverse Bits
5. Missing Number
6. Sum of Two Integers
7. Reverse Integer
