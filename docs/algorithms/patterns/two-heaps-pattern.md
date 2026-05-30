---
title: "Two Heaps Pattern"
date: 2026-04-25
lastmod: 2026-04-25
tags:
  - algorithms
  - leetcode
  - heap
  - pattern
  - median
draft: false
---

## Summary

The Two Heaps pattern splits values into a lower half and an upper half so you can query medians or balanced partitions efficiently as data changes.
## Concepts
- **Lower Half:** the smaller half of the values, usually stored in a max-heap.
- **Upper Half:** the larger half of the values, usually stored in a min-heap.
- **Rebalancing:** moving an element from one heap to the other so their sizes stay valid.
- **Median Maintenance:** updating the median efficiently as new values arrive.

## Content

### Recognition signals
Think two heaps when the prompt says:
- "running median"
- "median in a data stream"
- "continuously add numbers and query middle value"
- "partition values into two balanced halves"

### Intuition
To know the median, you want quick access to:
- the largest value in the lower half
- the smallest value in the upper half

One heap alone cannot give both efficiently.
Two heaps can:
- max-heap for lower half
- min-heap for upper half

### Invariant
The usual invariant is:
- all elements in lower half `&lt;=` all elements in upper half
- heap sizes differ by at most 1

If that invariant holds, the median is easy to read from the heap tops.

### Python implementation trick
Because Python has only min-heap support, the lower half is stored with negative values.

```python
import heapq

class MedianFinder:
    def __init__(self):
        self.small = []  # max-heap via negatives
        self.large = []  # min-heap

    def addNum(self, num: int) -> None:
        heapq.heappush(self.small, -num)

        if self.large and -self.small[0] > self.large[0]:
            value = -heapq.heappop(self.small)
            heapq.heappush(self.large, value)

        if len(self.small) > len(self.large) + 1:
            value = -heapq.heappop(self.small)
            heapq.heappush(self.large, value)
        elif len(self.large) > len(self.small):
            value = heapq.heappop(self.large)
            heapq.heappush(self.small, -value)

    def findMedian(self) -> float:
        if len(self.small) > len(self.large):
            return -self.small[0]
        return (-self.small[0] + self.large[0]) / 2
```

### Why it works
The lower half heap exposes the maximum of the lower side.
The upper half heap exposes the minimum of the upper side.

Those are exactly the boundary values needed for the median.

### Complexity
- insertion: $O(\log n)$
- median query: $O(1)$

### Common mistakes
- Forgetting to rebalance after insertion
- Forgetting the negative-value trick for the max-heap
- Violating ordering between the two heaps

### Mental shortcut
If the problem is about a **dynamic median** or a **balanced split around the center**, think two heaps.

## Related
- [Heap](/atlas/algorithms/data-structures/heap)
- [Priority Queues](/atlas/algorithms/data-structures/priority-queues)
- [Top K Pattern](/atlas/algorithms/patterns/top-k-pattern)
- [K-way Merge](/atlas/algorithms/patterns/k-way-merge)
