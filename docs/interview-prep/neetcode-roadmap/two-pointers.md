---
title: "Two Pointers"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 2
tags:
  - algorithms
  - neetcode
  - two-pointers
  - leetcode
draft: false
---

## Summary

The two-pointers pattern replaces repeated searches with two indices that move according to an invariant. It is especially effective when the input is sorted, when the answer concerns pairs, or when elements must be compacted in place.

## Recognition signals

Look for:

- a sorted array or string
- a pair satisfying a relation
- comparison from both ends
- removing or moving elements in place
- merging two ordered sequences
- a quadratic nested loop that repeatedly scans the same region

Two pointers only work when pointer movement can safely eliminate possibilities.

## Core patterns

### 1. Opposite-direction pointers

One pointer starts at each end.

```python
def has_pair_with_sum(nums, target):
    left, right = 0, len(nums) - 1

    while left < right:
        current = nums[left] + nums[right]

        if current == target:
            return True
        if current < target:
            left += 1
        else:
            right -= 1

    return False
```

Why movement is safe:

- if the sum is too small, keeping the smaller value cannot help
- if the sum is too large, keeping the larger value cannot help

This proof depends on sorted order.

### 2. Read and write pointers

The read pointer inspects every value. The write pointer marks where the next accepted value belongs.

```python
def remove_duplicates(nums):
    if not nums:
        return 0

    write = 1

    for read in range(1, len(nums)):
        if nums[read] != nums[write - 1]:
            nums[write] = nums[read]
            write += 1

    return write
```

Invariant: `nums[:write]` is the valid compacted prefix.

### 3. Fast and slow pointers

Both move forward, but at different speeds. This appears in linked-list cycle detection and array problems where one pointer tracks a processed boundary.

### 4. Expanding from a center

For palindromes, place pointers around a center and expand while the characters match.

```python
def expand(s, left, right):
    while left >= 0 and right < len(s) and s[left] == s[right]:
        left -= 1
        right += 1

    return s[left + 1:right]
```

Test both odd centers `(i, i)` and even centers `(i, i + 1)`.

### 5. Three-way reasoning

Problems such as 3Sum usually combine:

1. sorting
2. fixing one value
3. applying opposite-direction pointers to the remaining suffix

Sorting also makes duplicate skipping possible.

## Common invariants

- everything outside `[left, right]` has already been resolved
- the answer, if it exists, is still inside the active interval
- the prefix before `write` contains exactly the accepted values
- each pointer moves monotonically, so total movement is linear

## Complexity

After optional sorting:

- pointer scan: $O(n)$
- sorting plus scan: $O(n \log n)$
- 3Sum: $O(n^2)$ after sorting
- extra space: often $O(1)$, excluding the output

## Common mistakes

- using two pointers on unsorted data without a valid movement rule
- moving both pointers when only one side has been eliminated
- writing `left <= right` when the problem requires two distinct elements
- skipping duplicates before recording a valid result
- losing the original indices after sorting

## Practice progression

1. Valid Palindrome
2. Two Sum II
3. Remove Duplicates from Sorted Array
4. Container With Most Water
5. 3Sum
6. Trapping Rain Water

Before coding, explain why moving a pointer cannot discard a valid answer.
