---
title: "Binary Search"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 4
tags:
  - algorithms
  - neetcode
  - binary-search
  - leetcode
draft: false
---

## Summary

Binary search applies when the search space has a monotonic structure: once a candidate becomes valid, all candidates on one side are also valid. The input does not always need to be a visibly sorted array.

## Recognition signals

- sorted or partially sorted data
- logarithmic-time requirement
- search for a boundary, minimum feasible value, or maximum feasible value
- a yes/no predicate that changes from false to true once
- an answer range much smaller to search than the space of constructions

## Core patterns

### 1. Exact search

```python
def binary_search(nums, target):
    left, right = 0, len(nums) - 1

    while left <= right:
        middle = left + (right - left) // 2

        if nums[middle] == target:
            return middle
        if nums[middle] < target:
            left = middle + 1
        else:
            right = middle - 1

    return -1
```

Invariant: if the target exists, it remains inside the inclusive interval `[left, right]`.

### 2. First valid position

This is the most reusable form.

```python
def first_true(left, right, condition):
    answer = right + 1

    while left <= right:
        middle = left + (right - left) // 2

        if condition(middle):
            answer = middle
            right = middle - 1
        else:
            left = middle + 1

    return answer
```

Use it for:

- lower bound
- first occurrence
- minimum feasible capacity
- earliest valid day

For the last valid value, save the candidate and move right.

### 3. Binary search on the answer

The values being searched may not appear in the input. Define:

1. a candidate answer range
2. a feasibility predicate
3. the monotonic direction

Examples include minimum eating speed and minimum shipping capacity.

The expensive part is usually the predicate, making total time:

$$
O(\text{predicate cost} \times \log(\text{answer range}))
$$

### 4. Transformed sorted spaces

Binary search can work on:

- a matrix treated as one flattened sorted array
- a rotated sorted array after identifying which side is ordered
- timestamps or version numbers

For a matrix with `columns` columns:

```python
row = middle // columns
column = middle % columns
```

## Boundary discipline

Choose one convention and keep it consistent:

- inclusive: `[left, right]` with `left <= right`
- half-open: `[left, right)` with `left < right`

Most binary-search bugs come from mixing conventions, not from the main idea.

## Common mistakes

- applying binary search without proving monotonicity
- using `left = middle` or `right = middle`, causing an infinite loop
- returning immediately when the problem asks for the first or last match
- searching the input values when the true search space is the answer range
- choosing incorrect lower and upper bounds

## Practice progression

1. Binary Search
2. Search a 2D Matrix
3. Koko Eating Bananas
4. Find Minimum in Rotated Sorted Array
5. Search in Rotated Sorted Array
6. Time Based Key-Value Store
7. Median of Two Sorted Arrays

Before coding, write the monotonic predicate in one sentence.
