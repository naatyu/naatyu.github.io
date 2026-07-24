---
title: "Backtracking"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 10
tags:
  - algorithms
  - neetcode
  - backtracking
  - recursion
  - leetcode
draft: false
---

## Summary

Backtracking explores a decision tree and abandons a branch as soon as it cannot lead to a valid answer. Its characteristic operation is: choose, explore, then undo the choice.

## Recognition signals

- generate all combinations, subsets, or permutations
- find every valid arrangement
- constraints must remain valid while constructing an answer
- choices can be modeled as a search tree
- input sizes are deliberately small

Backtracking is often exponential. Its purpose is not to remove the exponential search space, but to explore it correctly and prune it early.

## Universal template

```python
def backtrack(state, choices):
    if goal_reached(state):
        result.append(state.copy())
        return

    for choice in choices:
        if not valid(choice, state):
            continue

        apply(choice, state)
        backtrack(state, next_choices(choice))
        undo(choice, state)
```

At every recursive call, define:

- what the current state represents
- which choices remain
- when a complete answer has been reached
- which conditions make a branch impossible

## Core patterns

### 1. Subsets: include or skip

```python
def subsets(nums):
    result = []
    current = []

    def dfs(index):
        if index == len(nums):
            result.append(current.copy())
            return

        current.append(nums[index])
        dfs(index + 1)
        current.pop()

        dfs(index + 1)

    dfs(0)
    return result
```

Each element creates a binary decision, producing $2^n$ subsets.

### 2. Combinations: choose a next index

Use a `start` index so selections remain ordered and the same combination is not generated in different orders.

```python
def combinations(nums, k):
    result = []
    current = []

    def dfs(start):
        if len(current) == k:
            result.append(current.copy())
            return

        for i in range(start, len(nums)):
            current.append(nums[i])
            dfs(i + 1)
            current.pop()

    dfs(0)
    return result
```

### 3. Permutations: track used choices

Order matters, so every unused element may be chosen next. Use a boolean array or swap elements in place.

### 4. Constraint search

For N-Queens, Sudoku, or graph coloring, maintain fast constraint sets rather than rechecking the full board.

For N-Queens, track:

- used columns
- used positive diagonals `row + column`
- used negative diagonals `row - column`

### 5. Grid backtracking

Mark a cell as visited before exploring neighbors and restore it afterward. Check cheap failure conditions before deeper recursion.

## Pruning strategies

- stop when a partial sum exceeds the target
- sort candidates to break once all later choices are too large
- skip duplicate choices at the same decision depth
- reject violated constraints immediately
- use remaining capacity bounds to detect impossible branches

For duplicate skipping after sorting:

```python
if i > start and nums[i] == nums[i - 1]:
    continue
```

This skips duplicates among sibling choices, not across different recursion levels.

## Common mistakes

- appending `current` instead of `current.copy()`
- forgetting to undo a choice
- using a global duplicate set instead of depth-local skipping
- confusing combinations with permutations
- performing expensive validity checks from scratch
- claiming polynomial complexity for an output containing exponentially many answers

## Practice progression

1. Subsets
2. Combination Sum
3. Permutations
4. Subsets II
5. Combination Sum II
6. Word Search
7. Palindrome Partitioning
8. N-Queens
