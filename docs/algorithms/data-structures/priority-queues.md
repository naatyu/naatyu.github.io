---
title: "Priority Queues"
date: 2026-04-25
lastmod: 2026-04-25
tags:
  - algorithms
  - data-structures
  - priority-queue
  - heap
  - leetcode
draft: false
---

## Summary

A priority queue is an abstract structure where elements are removed by priority rather than insertion order, and heaps are the most common way to implement it efficiently.
## Concepts
- **Priority:** the value used to decide which element should be returned first.
- **Heap-backed Priority Queue:** a priority queue implemented with a heap, giving efficient insertion and extraction.
- **Tuple Ordering:** in Python, tuples are compared lexicographically, which is useful for custom priorities.
- **Stable Tie-Breaker:** an extra field added to avoid ambiguous comparisons when priorities are equal.

## Content

### Intuition
A queue says "first in, first out".
A priority queue says "most important first".

This is the right model when the problem is about:
- best candidate first
- earliest event first
- smallest cost first
- highest frequency first

The structure is about **selection order**, not storage order.

### Heap vs Priority Queue
- **Priority queue** is the abstract behavior
- **Heap** is the usual implementation

In LeetCode, when someone says "use a priority queue", they usually mean "use a heap".

### Python patterns
Smallest value first:

```python
import heapq

pq = []
heapq.heappush(pq, 5)
heapq.heappush(pq, 2)
heapq.heappush(pq, 8)

while pq:
    print(heapq.heappop(pq))
```

Custom priority with tuples:

```python
import heapq

pq = []
heapq.heappush(pq, (2, "task-b"))
heapq.heappush(pq, (1, "task-a"))
heapq.heappush(pq, (3, "task-c"))

priority, task = heapq.heappop(pq)
```

Max-priority queue with negatives:

```python
import heapq

pq = []
heapq.heappush(pq, (-10, "urgent"))
heapq.heappush(pq, (-3, "normal"))

priority, task = heapq.heappop(pq)
real_priority = -priority
```

### Very common LeetCode trick
Store tuples like:

```python
(-frequency, value)
```

This lets you:
- pop highest frequency first
- keep the corresponding value attached

### Tie-breaker trick
Sometimes Python cannot compare two payload objects directly.
Then add a numeric tie-breaker:

```python
import heapq

pq = []
counter = 0

heapq.heappush(pq, (5, counter, {"job": "a"}))
counter += 1
heapq.heappush(pq, (5, counter, {"job": "b"}))
```

This avoids comparison errors when priorities are equal.

### Recognition signals
Think priority queue when the prompt says:
- "always pick the smallest/largest next"
- "process jobs by priority"
- "return top k frequent"
- "find next available/earliest event"
- "merge sorted streams efficiently"

### Common mistakes
- Using a normal queue when ordering matters by value
- Forgetting tuple comparison rules in Python
- Pushing objects that are not comparable without a tie-breaker
- Re-sorting after every insertion

## Related
- [Heap](/atlas/algorithms/data-structures/heap)
- [Top K Pattern](/atlas/algorithms/patterns/top-k-pattern)
- [K-way Merge](/atlas/algorithms/patterns/k-way-merge)
- [Two Heaps Pattern](/atlas/algorithms/patterns/two-heaps-pattern)
- [1046 - Last Stone Weight](/atlas/interview-prep/leetcode/1046-last-stone-weight)
