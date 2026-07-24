---
title: "Arrays and Hashing"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 1
tags:
  - algorithms
  - neetcode
  - arrays
  - hashing
  - leetcode
draft: false
---

## Summary

Arrays give constant-time indexed access, while hash maps and sets give average constant-time lookup by key. Together they solve problems where the main difficulty is remembering what has already been seen, counting occurrences, or retrieving a value without repeatedly scanning the input.

## Recognition signals

Think about arrays and hashing when the problem asks for:

- duplicates, frequencies, or membership
- pairs or groups determined by a key
- the first occurrence or last occurrence of a value
- a fast lookup of information computed earlier
- a result for every index based on values to its left or right

The central question is:

> What information would make the current decision easy if I could retrieve it in constant time?

## Core patterns

### 1. Membership with a set

Use a set when only presence matters.

```python
def contains_duplicate(nums):
    seen = set()

    for value in nums:
        if value in seen:
            return True
        seen.add(value)

    return False
```

Invariant: before processing `nums[i]`, `seen` contains exactly the values in `nums[:i]`.

### 2. Frequency map

Use a dictionary when the number of occurrences matters.

```python
from collections import Counter

counts = Counter(nums)
```

Typical uses:

- comparing two multisets
- finding the most frequent values
- checking whether a window satisfies required counts
- grouping values by frequency

### 3. Complement lookup

Instead of searching for a partner, compute the partner you need.

```python
def two_sum(nums, target):
    index_by_value = {}

    for index, value in enumerate(nums):
        complement = target - value
        if complement in index_by_value:
            return [index_by_value[complement], index]
        index_by_value[value] = index
```

The lookup must happen before insertion when the same element cannot be used twice.

### 4. Canonical keys for grouping

Convert values that belong together into the same immutable key.

For anagrams, common keys are:

- sorted characters: `tuple(sorted(word))`
- a 26-element frequency tuple

```python
from collections import defaultdict

def group_anagrams(words):
    groups = defaultdict(list)

    for word in words:
        counts = [0] * 26
        for char in word:
            counts[ord(char) - ord("a")] += 1
        groups[tuple(counts)].append(word)

    return list(groups.values())
```

### 5. Prefix and suffix accumulation

Precompute information from both directions when the answer at index `i` depends on everything except `i`.

```python
def product_except_self(nums):
    result = [1] * len(nums)

    prefix = 1
    for i in range(len(nums)):
        result[i] = prefix
        prefix *= nums[i]

    suffix = 1
    for i in range(len(nums) - 1, -1, -1):
        result[i] *= suffix
        suffix *= nums[i]

    return result
```

## Complexity instincts

- array access by index: $O(1)$
- set or dictionary lookup: average $O(1)$
- sorting before scanning: usually $O(n \log n)$
- frequency array over a fixed alphabet: $O(n)$ time and $O(1)$ extra space

Hashing often exchanges $O(n)$ extra space for an improvement from quadratic to linear time.

## Common mistakes

- using a list for repeated membership checks, causing $O(n^2)$ time
- forgetting that dictionary keys must be hashable
- confusing a set with a frequency map
- inserting a value before checking its complement
- ignoring collisions between poorly designed grouping keys
- modifying a dictionary while iterating over it

## Practice progression

1. Contains Duplicate
2. Valid Anagram
3. Two Sum
4. Group Anagrams
5. Top K Frequent Elements
6. Product of Array Except Self
7. Longest Consecutive Sequence

For each problem, be able to name the exact information stored in the hash table and state the invariant before writing code.
