---
title: "Stack"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 3
tags:
  - algorithms
  - neetcode
  - stack
  - monotonic-stack
  - leetcode
draft: false
---

## Summary

A stack stores unresolved work in last-in, first-out order. It is the right structure when the most recently opened, added, or deferred item must be resolved first.

## Recognition signals

Think stack when the problem contains:

- nested delimiters or scopes
- undoing or backtracking through recent operations
- expression evaluation
- path simplification
- a need for the nearest previous or next greater/smaller value
- recursive structure that should be processed iteratively

## Core patterns

### 1. Matching open and close tokens

```python
def is_valid_parentheses(s):
    matching = {")": "(", "]": "[", "}": "{"}
    stack = []

    for char in s:
        if char in matching:
            if not stack or stack.pop() != matching[char]:
                return False
        else:
            stack.append(char)

    return not stack
```

Invariant: the stack contains unmatched opening tokens in their nesting order.

### 2. Simulation stack

Use the stack as the state of a process:

- file-system path components
- collisions
- removing adjacent pairs
- decoding nested strings

The stack should store the minimum information required to resume an unfinished operation.

### 3. Expression evaluation

Postfix expressions are naturally evaluated with an operand stack.

```python
def eval_rpn(tokens):
    stack = []

    for token in tokens:
        if token not in {"+", "-", "*", "/"}:
            stack.append(int(token))
            continue

        right = stack.pop()
        left = stack.pop()

        if token == "+":
            stack.append(left + right)
        elif token == "-":
            stack.append(left - right)
        elif token == "*":
            stack.append(left * right)
        else:
            stack.append(int(left / right))

    return stack[-1]
```

Operand order matters for subtraction and division.

### 4. Monotonic stack

A monotonic stack keeps values or indices in increasing or decreasing order. When a new value violates the order, popped elements have found their answer.

```python
def next_greater_values(nums):
    answer = [-1] * len(nums)
    stack = []  # indices with decreasing values

    for i, value in enumerate(nums):
        while stack and nums[stack[-1]] < value:
            previous = stack.pop()
            answer[previous] = value
        stack.append(i)

    return answer
```

Use indices when the answer depends on distance or position.

Typical problems:

- daily temperatures
- largest rectangle in a histogram
- next greater element
- stock span

Each index is pushed and popped at most once, so the nested `while` loop is still $O(n)$.

## Choosing the stack contents

Store:

- values when only values matter
- indices when distance or boundaries matter
- tuples when a deferred computation needs extra state

Be able to finish this sentence:

> Every element in the stack is still waiting for ...

## Common mistakes

- reading `stack[-1]` without checking that the stack is non-empty
- reversing left and right operands
- storing values when duplicate values require distinct indices
- assuming a nested `while` loop makes a monotonic-stack solution quadratic
- using recursion when input depth can overflow the call stack

## Practice progression

1. Valid Parentheses
2. Min Stack
3. Evaluate Reverse Polish Notation
4. Generate Parentheses
5. Daily Temperatures
6. Car Fleet
7. Largest Rectangle in Histogram
