---
title: "K-way Merge"
date: 2026-04-25
lastmod: 2026-04-25
tags:
  - algorithms
  - leetcode
  - heap
  - pattern
  - merge
draft: false
---

## Summary

K-way merge is the pattern for merging multiple sorted lists or streams by using a heap to always pull the next smallest available element.
## Concepts
- **Sorted Stream:** a source that yields elements in sorted order.
- **Merge Frontier:** the set of current candidate elements, one from each list or stream.
- **Tuple Heap:** a heap storing both the value and the metadata needed to fetch the next value.
- **Incremental Merge:** building the result one element at a time instead of concatenating and sorting everything.

## Content

### Recognition signals
Look for this pattern when the prompt says:
- "merge k sorted lists"
- "smallest range from k lists"
- "find kth smallest across multiple sorted arrays"
- "multiple sorted streams"

### Intuition
Each list is already sorted.
So the only candidates for the next output are the current heads of those lists.

That means you never need to compare all remaining elements.
You only need a structure that tells you which current head is smallest.

That structure is a min-heap.

### Standard strategy
1. Put the first element of each list into a min-heap
2. Pop the smallest element
3. Add it to the result
4. Push the next element from the same list
5. Repeat until the heap is empty

### Example: merge k sorted arrays
```python
import heapq

def merge_k_sorted_lists(lists):
    heap = []
    result = []

    for list_idx, arr in enumerate(lists):
        if arr:
            heapq.heappush(heap, (arr[0], list_idx, 0))

    while heap:
        value, list_idx, elem_idx = heapq.heappop(heap)
        result.append(value)

        next_idx = elem_idx + 1
        if next_idx < len(lists[list_idx]):
            next_value = lists[list_idx][next_idx]
            heapq.heappush(heap, (next_value, list_idx, next_idx))

    return result
```

### Why this works
At any moment, each list contributes at most one candidate to the heap: its current head.

So the heap contains exactly the frontier of the merge.
The next output element must be one of those frontier values.

### Complexity
If the total number of elements is `n` and there are `k` lists:
- time: $O(n \log k)$
- space: $O(k)$

This is much better than concatenating and sorting again at $O(n \log n)$.

### Common tuple shape
The heap often stores:

```python
(value, list_index, element_index)
```

This is enough to recover where the next candidate should come from.

### Common mistakes
- Concatenating all lists and sorting from scratch
- Forgetting to store enough metadata in the heap
- Using `k` as if it were total element count instead of number of lists

## Related
- [Heap](/atlas/algorithms/data-structures/heap)
- [Priority Queues](/atlas/algorithms/data-structures/priority-queues)
- [Top K Pattern](/atlas/algorithms/patterns/top-k-pattern)
- [Two Heaps Pattern](/atlas/algorithms/patterns/two-heaps-pattern)
