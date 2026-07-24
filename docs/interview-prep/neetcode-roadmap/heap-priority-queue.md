---
title: "Heap and Priority Queue"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 9
tags:
  - algorithms
  - neetcode
  - heap
  - priority-queue
  - leetcode
draft: false
---

## Summary

A heap is useful when the algorithm repeatedly needs the current smallest or largest candidate while candidates are dynamically added. It maintains only enough order to expose the best element, unlike sorting, which computes a complete order.

## Recognition signals

- repeatedly select the smallest, largest, earliest, or highest-priority item
- maintain the top `k` elements
- merge sorted streams
- process events by time
- keep track of a median
- find a shortest path with non-negative weights

## Python essentials

Python's `heapq` is a min-heap.

```python
import heapq

heap = []
heapq.heappush(heap, 4)
heapq.heappush(heap, 1)
smallest = heapq.heappop(heap)
```

For a max-heap, negate numeric priorities.

```python
heapq.heappush(heap, -value)
largest = -heapq.heappop(heap)
```

Tuples are compared lexicographically:

```python
heapq.heappush(heap, (priority, tie_breaker, item))
```

Use a numeric tie-breaker when `item` objects are not comparable.

## Core patterns

### 1. Top K with a bounded heap

To retain the `k` largest elements, use a min-heap of size `k`.

```python
def kth_largest(nums, k):
    heap = []

    for value in nums:
        heapq.heappush(heap, value)
        if len(heap) > k:
            heapq.heappop(heap)

    return heap[0]
```

Invariant: the heap contains the `k` largest values seen so far.

### 2. K-way merge

Store one frontier element from each sorted source:

```python
(value, source_index, element_index)
```

After popping from one source, push its next element. If there are `n` total values across `k` sources, time is $O(n \log k)$.

### 3. Scheduling and event simulation

The heap contains available work ordered by its next relevant event:

- earliest finishing meeting
- soonest available machine
- task with highest frequency
- next arrival or expiration

Be precise about whether the heap stores active items or available items.

### 4. Two heaps

Maintain:

- a max-heap for the lower half
- a min-heap for the upper half

Keep sizes within one and ensure every lower value is at most every upper value. Median queries then take $O(1)$.

### 5. Lazy deletion

When arbitrary removal from a heap is expensive, mark entries invalid in a separate set or counter. Discard stale entries only when they reach the top.

## Complexity

- peek: $O(1)$
- push: $O(\log n)$
- pop: $O(\log n)$
- heapify existing list: $O(n)$
- bounded heap of size `k`: operations cost $O(\log k)$

## Common mistakes

- using a heap when a one-time sort is simpler
- choosing the wrong heap direction for Top K
- forgetting that the heap array is not fully sorted
- omitting a tie-breaker for tuple entries
- removing arbitrary elements directly from the heap
- allowing stale lazy-deletion entries to affect the answer

## Practice progression

1. Kth Largest Element in a Stream
2. Last Stone Weight
3. K Closest Points to Origin
4. Kth Largest Element in an Array
5. Task Scheduler
6. Design Twitter
7. Find Median from Data Stream

## Related

- [Heap](/atlas/algorithms/data-structures/heap)
- [Priority Queues](/atlas/algorithms/data-structures/priority-queues)
- [Top K Pattern](/atlas/algorithms/patterns/top-k-pattern)
- [K-way Merge](/atlas/algorithms/patterns/k-way-merge)
- [Two Heaps Pattern](/atlas/algorithms/patterns/two-heaps-pattern)
