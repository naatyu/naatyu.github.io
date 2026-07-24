---
title: "Linked List"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 6
tags:
  - algorithms
  - neetcode
  - linked-list
  - leetcode
draft: false
---

## Summary

Linked-list problems test pointer ownership rather than indexed access. The main skill is changing links without losing access to the remainder of the list.

## Basic node

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
```

## Recognition signals

- nodes must be rearranged in place
- insertions or deletions occur near known nodes
- constant extra space is requested
- the middle, cycle, or intersection must be found
- two sorted linked structures must be merged

## Core patterns

### 1. Dummy node

A dummy node removes special cases at the head.

```python
dummy = ListNode(0)
tail = dummy

# Build the answer through tail.next

return dummy.next
```

Use it for merging, partitioning, deleting, or constructing a result list.

### 2. Iterative reversal

```python
def reverse_list(head):
    previous = None
    current = head

    while current:
        next_node = current.next
        current.next = previous
        previous = current
        current = next_node

    return previous
```

Invariant:

- `previous` is the fully reversed prefix
- `current` is the first unprocessed node
- `next_node` preserves access to the remaining suffix

### 3. Fast and slow pointers

Move `slow` by one and `fast` by two.

Uses:

- finding the middle
- detecting a cycle
- locating the cycle entrance
- splitting a list before reordering

```python
def has_cycle(head):
    slow = fast = head

    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next

        if slow is fast:
            return True

    return False
```

### 4. Merge with a moving tail

```python
def merge_two_lists(a, b):
    dummy = ListNode()
    tail = dummy

    while a and b:
        if a.val <= b.val:
            tail.next = a
            a = a.next
        else:
            tail.next = b
            b = b.next
        tail = tail.next

    tail.next = a or b
    return dummy.next
```

### 5. Multiple passes with structural phases

Complex problems often decompose cleanly:

1. find the middle
2. reverse one half
3. merge or compare the two halves

Reorder List and Palindrome Linked List follow this pattern.

## Pointer checklist

Before changing `node.next`, ask:

1. Do I still have a reference to the old next node?
2. Which part of the list owns this node now?
3. What are the head and tail of every partial list?
4. Can the input be empty or contain one node?

## Complexity

Most linked-list patterns are:

- time: $O(n)$
- extra space: $O(1)$

Recursive reversal uses $O(n)$ call-stack space.

## Common mistakes

- losing the suffix before rewiring `next`
- forgetting to advance a tail pointer
- comparing node values when identity is required
- dereferencing `fast.next` without first checking `fast`
- creating an accidental cycle
- returning the dummy node instead of `dummy.next`

## Practice progression

1. Reverse Linked List
2. Merge Two Sorted Lists
3. Linked List Cycle
4. Reorder List
5. Remove Nth Node From End of List
6. Copy List With Random Pointer
7. Add Two Numbers
8. Merge K Sorted Lists
