---
title: "Greedy"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 14
tags:
  - algorithms
  - neetcode
  - greedy
  - leetcode
draft: false
---

## Summary

A greedy algorithm makes the best local choice and never revisits it. The code is often simple; the difficult part is proving that the local decision cannot make the global optimum worse.

## Recognition signals

- only feasibility or an optimum value is needed, not every solution
- a decision can be summarized by the best frontier seen so far
- sorting reveals a natural earliest, smallest, or largest choice
- replacing an earlier choice with a better one never hurts future options
- dynamic programming seems possible, but most state can be discarded

## How to justify a greedy choice

### Exchange argument

Show that an optimal solution using a different first choice can exchange it for the greedy choice without becoming worse.

Example: in interval scheduling, replace the first selected interval with the compatible interval that ends earliest.

### Dominance

Show that one partial state is at least as good as another in every future continuation. Keep only the dominant state.

### Stay-ahead argument

Show that after every step, the greedy solution's frontier is never behind that of any alternative.

## Core patterns

### 1. Reachable frontier

Jump Game tracks the farthest reachable index.

```python
def can_jump(nums):
    farthest = 0

    for index, jump in enumerate(nums):
        if index > farthest:
            return False
        farthest = max(farthest, index + jump)

    return True
```

Invariant: every position up to `farthest` is reachable from the processed prefix.

### 2. Reset a harmful prefix

Kadane's algorithm discards a negative prefix because it can only reduce every future subarray sum.

```python
def max_subarray(nums):
    current = best = nums[0]

    for value in nums[1:]:
        current = max(value, current + value)
        best = max(best, current)

    return best
```

This can also be viewed as compressed DP.

### 3. Sort by the greedy criterion

Common criteria:

- earliest finishing interval
- smallest cost or largest gain
- highest frequency first
- closest available resource

Sorting by an intuitive key is not enough; the key needs a proof.

### 4. Bidirectional feasibility

Gas Station uses total feasibility plus a reset rule. If starting at `start` cannot reach index `i + 1`, no index between `start` and `i` can do better, so the next candidate starts at `i + 1`.

### 5. Greedy construction with counts

Problems such as Hand of Straights or partitioning labels use frequency maps and ordered choices. Always consume the most constrained item first, such as the smallest remaining value.

## Greedy versus DP

Use DP when two locally inferior states can lead to different future outcomes. Use greedy when one state provably dominates the other and all discarded detail is irrelevant.

Ask:

> If I discard this alternative now, can any future suffix make it better?

If the answer is unclear, the greedy rule is not yet justified.

## Common mistakes

- assuming the locally largest value is always best
- writing a greedy algorithm without a correctness argument
- using the wrong sort key
- confusing a heuristic that often works with a guaranteed algorithm
- missing an impossibility check before construction
- keeping more state than the proof requires

## Practice progression

1. Maximum Subarray
2. Jump Game
3. Jump Game II
4. Gas Station
5. Hand of Straights
6. Merge Triplets to Form Target Triplet
7. Partition Labels
8. Valid Parenthesis String
