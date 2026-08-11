---
title: "Python Bit Tricks: Powers of Two and Alignment"
date: 2026-08-11
lastmod: 2026-08-11
tags:
  - programming/python
  - bit-manipulation
  - alignment
  - systems
draft: false
---

## Summary

Powers of two make rounding and alignment cheap because their binary representation contains exactly one set bit. For an alignment $a=2^k$, the lowest $k$ bits of an integer encode its offset inside an aligned block. Clearing those bits rounds down; adding $a-1$ before clearing them rounds up.

The three useful Python formulas are:

```python
# Next power of two, for x >= 1
1 << (x - 1).bit_length()

# Align down, for power-of-two a
x & ~(a - 1)

# Align up, for power-of-two a
(x + a - 1) & ~(a - 1)
```

## Powers of two in binary

A power of two contains exactly one `1` bit:

```text
1   = 00000001
2   = 00000010
4   = 00000100
8   = 00001000
16  = 00010000
32  = 00100000
```

Left-shifting `1` by $n$ positions computes $2^n$:

```python
1 << 3  # 8
1 << 5  # 32
```

A positive integer is a power of two when removing its only set bit produces zero:

```python
def is_power_of_two(number: int) -> bool:
    return number > 0 and (number & (number - 1)) == 0
```

## Next power of two

For a positive integer, the smallest power of two greater than or equal to it is:

```python
def next_power_of_two(number: int) -> int:
    if number < 1:
        raise ValueError("number must be positive")

    return 1 << (number - 1).bit_length()
```

Examples:

```python
next_power_of_two(13)  # 16
next_power_of_two(16)  # 16
next_power_of_two(17)  # 32
```

For `13`:

```text
13 - 1 = 12 = 1100
bit_length(12) = 4
1 << 4 = 10000 = 16
```

The subtraction handles values that are already powers of two:

```text
16     = 10000
16 - 1 = 01111
bit_length(15) = 4
1 << 4 = 16
```

Without the positive-input check, the expression does not define useful behavior for zero or negative sizes.

## Alignment intuition

If

$$
a=2^k,
$$

every multiple of $a$ has its lowest $k$ bits equal to zero:

```text
multiple of 4   -> xxxx00
multiple of 8   -> xxx000
multiple of 16  -> xx0000
multiple of 32  -> x00000
```

For alignment eight, the lowest three bits encode the offset inside an eight-element block:

```text
32 = 00100 | 000
33 = 00100 | 001
34 = 00100 | 010
35 = 00100 | 011
36 = 00100 | 100
37 = 00100 | 101
38 = 00100 | 110
39 = 00100 | 111
40 = 00101 | 000
```

## Creating the alignment mask

For $a=8$:

```text
a     = 00001000
a - 1 = 00000111
```

The value $a-1$ has exactly the $k$ low bits set. Its bitwise complement clears those bits:

```text
~(a - 1)

...00000111
       NOT
...11111000
```

Python integers are arbitrary precision rather than fixed width. In Python, `~7 == -8`, following

```python
~n == -(n + 1)
```

The leading ones in the mask therefore extend indefinitely. This is exactly the behavior needed for non-negative addresses, sizes, and indices:

```python
~(a - 1) == -a  # True for every integer a
```

## Align down

To round down to a power-of-two boundary, erase the offset bits:

```python
def align_down(number: int, alignment: int) -> int:
    if alignment <= 0 or alignment & (alignment - 1):
        raise ValueError("alignment must be a positive power of two")

    return number & ~(alignment - 1)
```

For 37 aligned to eight:

```text
number = 00100101  # 37
mask   = 11111000
         --------
AND      00100000  # 32
```

Mental model:

```text
00100 | 101
        ↓↓↓ erase the offset
00100 | 000
```

## Align up

To round up, first add $a-1$ so every non-zero offset crosses into the next block, then align down:

```python
def align_up(number: int, alignment: int) -> int:
    if alignment <= 0 or alignment & (alignment - 1):
        raise ValueError("alignment must be a positive power of two")

    return (number + alignment - 1) & ~(alignment - 1)
```

For 37 aligned to eight:

```text
37 + 7 = 44

number = 00101100  # 44
mask   = 11111000
         --------
AND      00101000  # 40
```

An already aligned value remains unchanged:

```python
align_up(40, 8)  # 40
```

The addition works because an aligned value has offset zero. Adding $a-1$ leaves it in the same block, while any positive offset crosses into the following block before the low bits are cleared.

## Useful formulas to memorize

```python
# Next power of two, for x >= 1
1 << (x - 1).bit_length()

# Align down, for power-of-two a
x & ~(a - 1)

# Align up, for power-of-two a
(x + a - 1) & ~(a - 1)
```

Examples:

```python
# Pad a tensor dimension to a multiple of 32
padded_dim = (dim + 31) & ~31

# Round an address or index down to a 256-byte boundary
aligned = address & ~255
```

For $a=2^k$:

```text
a - 1      = k low bits set to 1
~(a - 1)   = k low bits set to 0
AND mask   = erase the offset inside the alignment block
```

## Non-power-of-two alignment

The masking formulas require a power-of-two alignment. For an arbitrary positive alignment, use integer arithmetic:

```python
def align_down_arbitrary(number: int, alignment: int) -> int:
    if alignment <= 0:
        raise ValueError("alignment must be positive")

    return (number // alignment) * alignment


def align_up_arbitrary(number: int, alignment: int) -> int:
    if alignment <= 0:
        raise ValueError("alignment must be positive")

    return ((number + alignment - 1) // alignment) * alignment
```

## Practical caveats

- The optimized masks require `alignment > 0` and exactly one set bit.
- The examples assume non-negative sizes, indices, or addresses. Python also gives mathematically consistent floor/ceiling multiples for negative integers, but that may not match an application's intended domain.
- Python integers do not overflow. In fixed-width languages, `x + a - 1` can overflow near the maximum representable integer.
- Prefer a named helper when the operation is not performance-critical; it makes the power-of-two precondition visible.

## Related

- [Bit Manipulation](/atlas/interview-prep/neetcode-roadmap/bit-manipulation)

## Sources

- Python documentation, [`int.bit_length`](https://docs.python.org/3/library/stdtypes.html#int.bit_length)
- Python documentation, [Expressions: binary bitwise operations](https://docs.python.org/3/reference/expressions.html#binary-bitwise-operations)
