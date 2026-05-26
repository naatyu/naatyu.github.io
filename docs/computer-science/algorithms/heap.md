---
title: "Heap"
date: 2026-04-25
lastmod: 2026-04-28
tags:
  - algorithms
  - data-structures
  - heap
  - leetcode
draft: false
---

ni

## Summary

A heap is a partially ordered tree structure optimized for repeated access to the smallest or largest element, making it ideal for priority queues and many LeetCode patterns.
## Concepts
- **Min-Heap:** a heap where the smallest element is always at the root.
- **Max-Heap:** a heap where the largest element is always at the root.
- **Heapify:** the $O(n)$ operation that transforms an array into a valid heap.
- **Priority Queue:** an abstract data structure that returns the highest-priority element first, often implemented with a heap.

## Content

### What matters intuitively
A heap is useful when you need the **next smallest** or **next largest** element again and again.

You do **not** use a heap when you need the full sorted order.
You use a heap when:
- you repeatedly extract a best candidate
- new candidates are inserted dynamically
- you only care about the top of the ordering

This is the key difference versus sorting:
- sorting gives a full order
- a heap gives fast access to the best element only

### Heap property
In a min-heap, every parent is smaller than or equal to its children.

That does **not** mean the full array is sorted.
It only guarantees that the root is the minimum.

For an array-based heap:
- left child of index `i`: `2*i + 1`
- right child of index `i`: `2*i + 2`
- parent of index `i`: `(i - 1) // 2`

### Core operations
- Peek min/max: $O(1)$
- Push: $O(\log n)$
- Pop: $O(\log n)$
- Heapify: $O(n)$

### Python basics
Python's `heapq` is a **min-heap**.

```python
import heapq

nums = [5, 1, 8, 3]
heapq.heapify(nums)

smallest = heapq.heappop(nums)
heapq.heappush(nums, 2)
top = nums[0]
```

### Max-heap trick in Python
Because `heapq` is only a min-heap, the common trick is to store negative values.

```python
import heapq

nums = [5, 1, 8, 3]
max_heap = [-x for x in nums]
heapq.heapify(max_heap)

largest = -heapq.heappop(max_heap)
heapq.heappush(max_heap, -7)
top = -max_heap[0]
```

### When a heap is the right instinct
Prompt signals that often mean heap:
- "repeatedly take the smallest/largest"
- "return the k smallest/largest"
- "merge multiple sorted lists/streams"
- "always process the next earliest event"
- "maintain running median"

### Common mistakes
- Sorting everything when only the top element is needed
- Forgetting that `heapq` is a min-heap
- Using repeated `heappush` when `heapify` would be cheaper
- Assuming the heap array is fully sorted

### Mental shortcut
Ask this question:

&gt; Do I need the full order, or do I only need the next best element many times?

If the answer is "next best element many times", think heap first.

## Related
- [Priority Queues](/atlas/computer-science/algorithms/priority-queues)
- [Top K Pattern](/atlas/computer-science/algorithms/top-k-pattern)
- [K-way Merge](/atlas/computer-science/algorithms/k-way-merge)
- [Two Heaps Pattern](/atlas/computer-science/algorithms/two-heaps-pattern)
- [1046 - Last Stone Weight](/atlas/computer-science/algorithms/leetcode-practice/1046-last-stone-weight)
