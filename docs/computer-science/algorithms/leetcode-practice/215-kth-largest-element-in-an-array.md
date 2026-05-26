---
title: "215 - Kth Largest Element in an Array"
date: 2026-04-25
lastmod: 2026-04-25
tags:
  - leetcode
  - algorithms
  - heap
  - top-k
draft: false
---

## Summary

The problem asks for the kth largest value, which makes it a classic **Top K** problem best solved with a **min-heap of size k**.
## Concepts
- **Min-Heap:** a heap where the smallest element is always at the root.
- **Top K Pattern:** an algorithmic pattern where only the best `k` candidates are maintained instead of fully sorting everything.
- **Bounded Heap:** a heap intentionally restricted to a fixed size, here `k`.

## Description
Given an integer array `nums` and an integer `k`, return the `k`th largest element in the array.

Note that it is the `k`th largest element in sorted order, not the `k`th distinct element.

**Example 1:**

**Input:** `nums = [3,2,1,5,6,4], k = 2`
**Output:** `5`

**Example 2:**

**Input:** `nums = [3,2,3,1,2,4,5,5,6], k = 4`
**Output:** `4`

## Solution

The right idea is to maintain the **k largest elements seen so far**.

We use a **min-heap of size `k`**:
- every new number is pushed into the heap
- if the heap becomes larger than `k`, we remove the smallest
- at the end, the heap contains exactly the `k` largest elements
- the smallest among them is the `k`th largest overall

```python
import heapq

class Solution:
    def findKthLargest(self, nums: List[int], k: int) -> int:
        min_heap = []

        for n in nums:
            heapq.heappush(min_heap, n)

            if len(min_heap) > k:
                heapq.heappop(min_heap)
        
        return min_heap[0]
```

### Analyse de Complexité
- **Time Complexity**: $O(n \log k)$
- **Space Complexity**: $O(k)$

We only keep `k` elements in the heap, which is why the logarithmic factor is `\log k` instead of `\log n`.

## Pattern Recognition
This problem is a direct **Top K** pattern.

Signal principal: the prompt asks for the **kth largest**, not for the full sorted array.

That means:
- we do not need a complete ordering of all elements
- we only need to preserve the current `k` largest candidates

Why use a **min-heap** and not a max-heap?
Because among the current top `k`, the element most likely to be discarded is the **smallest** one. A min-heap gives direct access to that element.

Mental shortcut:

&gt; If the problem says "kth largest" or "top k", ask whether a heap of size `k` is enough.

## Why not sort?
Sorting the whole array would cost $O(n \log n)$.

That works, but it computes more order than the problem actually needs.
The heap solution is better when the goal is only to track the top `k` elements.

## Related
- [Heap](/atlas/computer-science/algorithms/heap)
- [Priority Queues](/atlas/computer-science/algorithms/priority-queues)
- [Top K Pattern](/atlas/computer-science/algorithms/top-k-pattern)
- [1046 - Last Stone Weight](/atlas/computer-science/algorithms/leetcode-practice/1046-last-stone-weight)
