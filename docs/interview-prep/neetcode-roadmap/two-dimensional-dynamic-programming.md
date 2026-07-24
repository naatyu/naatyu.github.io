---
title: "2-D Dynamic Programming"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 16
tags:
  - algorithms
  - neetcode
  - dynamic-programming
  - leetcode
draft: false
---

## Summary

Two-dimensional dynamic programming uses states described by two changing variables, commonly two indices, a grid position, or an index plus a remaining capacity.

## Recognition signals

- compare or align two strings
- move through a grid
- choose items under a capacity
- two independent positions change during recursion
- the same pair of parameters is revisited
- the answer depends on both a prefix and a second dimension

## Design process

Define the state before the recurrence:

> `dp[i][j]` represents ...

Common meanings:

- best answer using prefixes `a[:i]` and `b[:j]`
- number of paths reaching cell `(i, j)`
- best result using the first `i` items with capacity `j`
- result for substring `s[i:j+1]`

Then identify exactly which smaller states are dependencies.

## Core patterns

### 1. Grid paths

```python
def unique_paths(rows, columns):
    dp = [[1] * columns for _ in range(rows)]

    for row in range(1, rows):
        for column in range(1, columns):
            dp[row][column] = (
                dp[row - 1][column]
                + dp[row][column - 1]
            )

    return dp[-1][-1]
```

Each state receives contributions from the valid predecessor cells.

### 2. Longest common subsequence

For suffix-based state `dp[i][j]`:

- if characters match, use `1 + dp[i + 1][j + 1]`
- otherwise skip one character from either string

```python
def longest_common_subsequence(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]

    for i in range(len(a) - 1, -1, -1):
        for j in range(len(b) - 1, -1, -1):
            if a[i] == b[j]:
                dp[i][j] = 1 + dp[i + 1][j + 1]
            else:
                dp[i][j] = max(dp[i + 1][j], dp[i][j + 1])

    return dp[0][0]
```

Loop order follows dependency direction.

### 3. Edit distance

State compares two prefixes or suffixes. If characters differ, consider:

- insert
- delete
- replace

Each operation must map to the correct neighboring state.

### 4. 0/1 knapsack

Each item may be used at most once:

$$
dp[i][capacity] =
\max(
dp[i - 1][capacity],
value_i + dp[i - 1][capacity - weight_i]
)
$$

When compressing to one dimension, iterate capacities backward so the current item is not reused.

### 5. Interval DP

The state is a subarray or substring boundary `(left, right)`. Compute shorter intervals before longer intervals.

Examples include palindrome DP and Burst Balloons.

## Space compression

If row `i` depends only on row `i - 1`, keep two rows or one carefully ordered row.

Do not compress until these are clear:

- which old states are required
- whether current-row updates may be reused
- required iteration direction

## Complexity

Typical table:

- time: number of states times transitions per state
- space: number of memoized states

A table of `m * n` states with constant transitions costs $O(mn)`.

## Common mistakes

- never defining what each cell means
- using dimensions without an extra empty-prefix row or column
- filling the table in an order that reads uncomputed values
- compressing memory with the wrong iteration direction
- confusing subsequence with substring
- missing a third transition such as replace in edit distance

## Practice progression

1. Unique Paths
2. Longest Common Subsequence
3. Best Time to Buy and Sell Stock with Cooldown
4. Coin Change II
5. Target Sum
6. Interleaving String
7. Longest Increasing Path in a Matrix
8. Distinct Subsequences
9. Edit Distance
10. Burst Balloons
11. Regular Expression Matching
