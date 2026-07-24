---
title: "1-D Dynamic Programming"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 12
tags:
  - algorithms
  - neetcode
  - dynamic-programming
  - leetcode
draft: false
---

## Summary

Dynamic programming solves overlapping subproblems by storing their results. In one-dimensional DP, a state is usually identified by one index, one remaining amount, or one position in a sequence.

## Recognition signals

- count the number of ways
- find a minimum or maximum over many choices
- decide whether a target can be formed
- a recursive solution revisits the same state
- the answer for a prefix depends on smaller prefixes
- greedy choices can fail because a local decision changes future options

## The design process

Do not begin with a table. Define:

1. **State:** What does `dp[i]` mean?
2. **Transition:** Which smaller states produce it?
3. **Base cases:** What are the smallest known answers?
4. **Evaluation order:** Are dependencies already computed?
5. **Answer location:** Is the result `dp[n]`, `max(dp)`, or something else?

Write the meaning of `dp[i]` in a complete sentence.

## Top-down template

```python
from functools import cache

@cache
def dp(i):
    if is_base_case(i):
        return base_value(i)

    return combine(dp(previous_state) for previous_state in choices(i))
```

Memoization is often easier to derive because it mirrors the recursive decision tree.

## Bottom-up template

```python
dp = [0] * (n + 1)
dp[0] = base_value

for i in range(1, n + 1):
    dp[i] = transition_from_smaller_states(dp, i)
```

Tabulation avoids recursion overhead and makes space optimization easier.

## Core patterns

### 1. Linear recurrence

Climbing Stairs:

$$
dp[i] = dp[i - 1] + dp[i - 2]
$$

Only the previous two states are needed, so memory can be reduced to $O(1)$.

### 2. Take or skip

House Robber:

$$
dp[i] = \max(dp[i - 1], dp[i - 2] + nums[i])
$$

At each position:

- skip it and keep the previous best
- take it and combine with the best compatible prefix

This pattern appears in weighted independent selections.

### 3. Segmentation

Word Break asks whether a prefix can be split into valid pieces.

```python
def word_break(s, words):
    word_set = set(words)
    dp = [False] * (len(s) + 1)
    dp[0] = True

    for end in range(1, len(s) + 1):
        for start in range(end):
            if dp[start] and s[start:end] in word_set:
                dp[end] = True
                break

    return dp[-1]
```

State: `dp[end]` means `s[:end]` can be segmented.

### 4. Unbounded choices

Coin Change allows using each coin repeatedly. Iteration order and transition direction determine whether reuse is allowed.

### 5. Sequence DP

Longest Increasing Subsequence can use:

$$
dp[i] = 1 + \max(dp[j]) \quad \text{for } j < i \text{ and } nums[j] < nums[i]
$$

This gives $O(n^2)$ time. A separate greedy plus binary-search method reaches $O(n \log n)$.

## Space optimization

Reduce memory only after the recurrence is correct. Ask which previous states are still needed. Updating in the wrong direction can accidentally reuse a state from the current iteration.

## Common mistakes

- defining a state too vaguely
- using an incorrect base case for the empty prefix
- mixing the value at index `i` with the first `i` values
- updating a compressed table in the wrong direction
- using DP when a simpler greedy invariant exists
- reporting only table size while ignoring recursion-stack space

## Practice progression

1. Climbing Stairs
2. Min Cost Climbing Stairs
3. House Robber
4. House Robber II
5. Longest Palindromic Substring
6. Palindromic Substrings
7. Decode Ways
8. Coin Change
9. Word Break
10. Longest Increasing Subsequence
11. Partition Equal Subset Sum
