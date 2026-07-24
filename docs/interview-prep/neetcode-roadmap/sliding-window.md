---
title: "Sliding Window"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 5
tags:
  - algorithms
  - neetcode
  - sliding-window
  - leetcode
draft: false
---

## Summary

Sliding window processes contiguous ranges while reusing work from the previous range. Instead of recomputing every subarray or substring, it updates a compact state when the right boundary expands and the left boundary contracts.

## Recognition signals

- contiguous subarray or substring
- longest, shortest, maximum, or minimum valid range
- a condition based on counts, sum, distinct values, or replacements
- all windows of a fixed size
- an apparent $O(n^2)$ enumeration of start and end positions

Sliding window is not appropriate when removing the leftmost item cannot update the state efficiently or when the valid region is not contiguous.

## Core patterns

### 1. Fixed-size window

```python
def max_sum_of_size_k(nums, k):
    window_sum = 0
    best = float("-inf")

    for right, value in enumerate(nums):
        window_sum += value

        if right >= k:
            window_sum -= nums[right - k]

        if right >= k - 1:
            best = max(best, window_sum)

    return best
```

Invariant: after adjustment, the state describes exactly the last `k` elements.

### 2. Longest valid variable window

Expand right. While the window is invalid, move left until validity is restored.

```python
def longest_unique_substring(s):
    counts = {}
    left = 0
    best = 0

    for right, char in enumerate(s):
        counts[char] = counts.get(char, 0) + 1

        while counts[char] > 1:
            left_char = s[left]
            counts[left_char] -= 1
            left += 1

        best = max(best, right - left + 1)

    return best
```

Invariant: the current window is valid after the shrinking loop.

### 3. Shortest valid variable window

When the current window becomes valid, record the answer and shrink while it remains valid.

This reversal is important:

- longest valid: shrink while invalid
- shortest valid: shrink while valid

### 4. Required-frequency window

For minimum-window substring and anagrams, track:

- required counts
- current window counts
- how many requirements are satisfied

Avoid comparing full dictionaries on every step. Maintain a scalar such as `formed`.

### 5. At most K

Some exact-count problems become easier through:

$$
\text{exactly}(k) = \text{atMost}(k) - \text{atMost}(k - 1)
$$

This is common for subarrays with exactly `k` distinct values.

## Why it is linear

Both pointers move only forward. Each element enters the window once and leaves once. Even with a nested shrinking loop, total pointer movement is $O(n)$.

## Common mistakes

- confusing a subsequence with a contiguous window
- updating the answer before restoring the invariant
- shrinking once with `if` when repeated shrinking requires `while`
- failing to remove zero-count keys when the number of distinct keys matters
- recomputing counts or sums for every window
- assuming the technique works with arbitrary negative numbers in sum-based windows

## Practice progression

1. Best Time to Buy and Sell Stock
2. Longest Substring Without Repeating Characters
3. Longest Repeating Character Replacement
4. Permutation in String
5. Minimum Window Substring
6. Sliding Window Maximum
