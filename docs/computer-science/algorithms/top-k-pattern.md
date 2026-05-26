---
title: "Top K Pattern"
date: 2026-04-25
lastmod: 2026-04-25
tags:
  - algorithms
  - leetcode
  - heap
  - pattern
  - top-k
draft: false
---

## Summary

The Top K pattern appears when a problem asks for the k largest, k smallest, or k most frequent elements, and the efficient solution is usually a heap of size $k$.
## Concepts
- **Bounded Heap:** a heap intentionally kept at size $k$.
- **Top K:** the best $k$ elements according to some ordering.
- **Streaming Variant:** a version where values arrive over time and the top $k$ must be maintained dynamically.
- **Frequency Heap:** a heap built from `(frequency, value)` pairs.

## Content

### Recognition signals
Prompt phrases that should trigger this pattern:
- "k largest"
- "k smallest"
- "top k frequent"
- "find the kth largest"
- "keep only the best k candidates"

### Intuition
If you sort everything, you compute much more order than the problem asks for.

For Top K problems, you usually do not need all elements sorted.
You only need to keep track of the current best $k$ elements.

That is why a heap of size $k$ is often the right fit.

### Standard strategy
For the **k largest** elements:
- maintain a **min-heap** of size `k`
- if the heap grows above `k`, pop the smallest
- after processing all elements, the heap contains the k largest

Why min-heap?
Because the smallest among the current top `k` is the one most likely to be removed.

### Example: k largest elements
```python
import heapq

def k_largest(nums, k):
    heap = []

    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)

    return heap
```

### Example: kth largest element
```python
import heapq

def kth_largest(nums, k):
    heap = []

    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)

    return heap[0]
```

### Example: top k frequent
```python
import heapq
from collections import Counter

def top_k_frequent(nums, k):
    counts = Counter(nums)
    heap = []

    for value, freq in counts.items():
        heapq.heappush(heap, (freq, value))
        if len(heap) > k:
            heapq.heappop(heap)

    return [value for freq, value in heap]
```

### Complexity
If there are `n` elements:
- time: $O(n \log k)$
- space: $O(k)$

This is usually better than full sorting at $O(n \log n)$ when `k &lt;&lt; n`.

### Variations
- `k` largest: min-heap of size `k`
- `k` smallest: max-heap of size `k` using negatives
- kth largest: min-heap of size `k`
- top k frequent: min-heap on frequencies

### Common mistakes
- Using a heap of size `n` when a bounded heap of size `k` is enough
- Forgetting that the returned heap is not fully sorted
- Using a max-heap when a min-heap of size `k` is the better fit

### Mental shortcut
If the problem says "top k", think:

&gt; Can I keep only `k` candidates and discard the rest as I go?

If yes, think bounded heap.

## Related
- [Heap](/atlas/computer-science/algorithms/heap)
- [Priority Queues](/atlas/computer-science/algorithms/priority-queues)
- [K-way Merge](/atlas/computer-science/algorithms/k-way-merge)
- [Two Heaps Pattern](/atlas/computer-science/algorithms/two-heaps-pattern)
- [1046 - Last Stone Weight](/atlas/computer-science/algorithms/leetcode-practice/1046-last-stone-weight)
