---
title: "Choosing Algorithms from Problem Constraints"
date: 2026-09-26
lastmod: 2026-09-26
sidebar_position: 0
tags:
  - algorithms
  - neetcode
  - complexity
  - leetcode
draft: false
---

## Summary

The constraints at the end of a coding problem are clues about which solutions can be practical. The maximum array length, number of queries, value range, or target sum can eliminate entire classes of algorithms before you write code.

The reasoning has three steps:

$$
\text{constraints}
\rightarrow \text{plausible complexity}
\rightarrow \text{candidate algorithms}
$$

Constraints narrow the search, but the problem's structure determines which algorithm is correct. An input of length `100,000` suggests avoiding quadratic work; it does not tell you whether to use hashing, sorting, a heap, or a sliding window.

This note is a companion to the NeetCode roadmap, useful before choosing a section or pattern.

## 1. Estimate the work of brute force

First describe a correct, straightforward solution. Then substitute the maximum input size into its complexity.

For $n=100{,}000$:

| Growth function | Approximate count |
| :--- | ---: |
| $n$ | `100,000` |
| $n\log_2 n$ | `1.66 million` |
| $n^2$ | `10 billion` |
| $n^3$ | `1 quadrillion` |

These are growth estimates, not CPU instruction counts. They still make the gap clear: replacing a quadratic scan with sorting or a linear pass can reduce work by several orders of magnitude.

Avoid treating a fixed number such as “100 million operations per second” as a universal budget. A Python dictionary lookup, a C++ integer addition, and a string comparison have different costs. The judge's time limit and hardware also matter.

## 2. A rough constraint-to-complexity guide

Use this table to generate hypotheses, then estimate the actual work and memory.

| Maximum problem size | Candidate complexity | Patterns to consider |
| :--- | :--- | :--- |
| Around `8-10` elements | $O(n!)$ | Permutations, exhaustive backtracking |
| Around `20` elements | $O(2^n)$, sometimes $O(n2^n)$ | Subsets, bitmask DP |
| Around `40` elements | $O(2^{n/2})$ with possible sorting factors | Meet-in-the-middle |
| Around `100-300` elements | $O(n^3)$ may fit | Interval DP, all-pairs shortest paths |
| Around `1,000-3,000` elements | $O(n^2)$ may fit | Pair enumeration, quadratic DP |
| Around `100,000` elements | Usually $O(n\log n)$ or $O(n)$ | Sorting, heaps, hashing, two pointers |
| Around `1,000,000` elements | Prefer near-linear work | Scans, counting, prefix sums; sorting can still be viable |

These are neither hard limits nor a guarantee that the listed complexity passes. For example, $20\cdot2^{20}$ is about `21 million` state-transition-scale operations; storing a Python object for every DP state can be more problematic than the arithmetic.

Small constraints permit brute force but do not require it. If a simple linear solution exists, it remains a good choice for a ten-element input.

## 3. Worked example: finding a pair with a target sum

Suppose an array can contain `100,000` numbers, and you must return two distinct indices whose values sum to a target.

Brute force checks every pair:

$$
\frac{n(n-1)}{2}\approx5\times10^9
$$

That is too much work for a typical coding challenge. The next question is: what repeated work can be removed?

For a current value $x$, the required partner is exactly $\text{target}-x$. Store previously seen values in a hash map and perform one expected constant-time lookup per element.

```python
def two_sum(nums, target):
    seen = {}
    for i, value in enumerate(nums):
        complement = target - value
        if complement in seen:
            return [seen[complement], i]
        seen[value] = i
    return None
```

The lookup happens before insertion, so the same element cannot be used twice. Expected time is $O(n)$ and auxiliary space is $O(n)$.

Sorting plus two pointers is another candidate with $O(n\log n)$ time. If original indices are required, preserve them during sorting. If the input is already sorted, two pointers can work directly in $O(n)$ time with constant auxiliary space.

The size constraint rejects the pairwise scan; complement lookup and sorted order supply the actual algorithms.

## 4. Worked example: subset sum at different scales

Suppose the task asks whether some subset adds to a target $S$.

For about `20` elements, enumerating $2^{20}\approx1$ million subsets may be practical. Carrying a running sum through recursion avoids recomputing each subset's sum from scratch.

For about `40` elements, $2^{40}$ is about one trillion subsets. Split the input into two halves, enumerate their subset sums, and look for complementary sums across the halves. Each half has about $2^{20}$ possibilities. This is meet-in-the-middle; sorting and binary search give a typical $O(n2^{n/2})$ time bound and $O(2^{n/2})$ space.

For many elements with nonnegative integer values and a small target, an $O(nS)$ dynamic program can be more suitable. Its feasibility depends on the product $nS$, not just the array length.

This is why you should read every bound: a small target can matter more than a large $n$. The $O(nS)$ algorithm is called pseudo-polynomial because its cost depends on the numeric value of $S$, whose binary representation needs only $O(\log S)$ bits.

## 5. Structural constraints suggest patterns

| Constraint or property | Useful implication |
| :--- | :--- |
| Input is sorted | Binary search, two pointers, or merging may exploit order |
| Predicate changes once from false to true | Binary search on the answer may apply |
| Only 26 lowercase letters | Frequency arrays can replace general-purpose maps |
| Nonnegative values | Window sums are monotone under expansion and contraction |
| Unweighted graph | BFS finds shortest paths measured in number of edges |
| Nonnegative edge weights | Dijkstra becomes a candidate |
| Small integer value range | Counting or value-indexed DP may be practical |
| Many queries on unchanged data | Preprocessing may reduce repeated query work |
| Every subset or permutation must be returned | Output size already imposes exponential or factorial work |

## 6. Quick reference: which technique should I investigate?

Combine the size bound with what the problem asks. The same input length can lead to very different techniques.

| Clue in the statement or constraints | Techniques to consider | Typical cost and condition |
| :--- | :--- | :--- |
| Large array; duplicates, frequencies, or a complementary value | Hash map, hash set, counting array | Expected $O(n)$ with hashing; counting arrays require a manageable value range |
| Sorted array; pair or triplet satisfying a condition | Two pointers; fix one element for triplets | $O(n)$ for a pair scan, often $O(n^2)$ for triplets; sorting may be needed first |
| Contiguous segment; validity can be maintained as boundaries move | Sliding window | Often $O(n)$ if each boundary moves only forward and updates are cheap |
| Exact subarray sum with signed values | Prefix sums plus hash map | Expected $O(n)$; avoids relying on monotone window sums |
| Many range-sum queries; no updates | Prefix sums | $O(n)$ preprocessing, $O(1)$ per query |
| Many range queries with point updates | Fenwick tree, segment tree | Usually $O(\log n)$ per update/query; choose a structure supporting the required aggregate |
| Sorted search or a monotone feasibility condition | Binary search; binary search on the answer | $O(\log n)$ search, or $O(C\log U)$ for check cost $C$ and answer range size $U$ |
| Need only the largest or smallest $k$ elements | Size-$k$ heap, quickselect | Heap: $O(n\log k)$ for $k\geq2$; quickselect: expected $O(n)$ partitioning, with extra sorting if ordered output is required |
| Next greater/smaller element or nearest boundary blocking progress | Monotonic stack | Often $O(n)$ because each element is pushed and popped at most once |
| Maximum/minimum for every fixed-size window | Monotonic deque | $O(n)$ overall, with each index entering and leaving at most once |
| Overlapping intervals or events on a timeline | Sort and scan, sweep line, sometimes a heap | Commonly $O(n\log n)$; active-event maintenance depends on the query |
| Small set of selectable elements; choices depend on what is already selected | Backtracking, subset enumeration, bitmask DP | Exponential in the small set size; count transitions and stored states |
| Around 40 independent include/exclude choices | Meet-in-the-middle | Enumerate two halves; combination cost depends on the task |
| Repeated subproblems with a small index, capacity, or target range | Memoization, tabulation | Number of reachable states multiplied by transitions per state |
| Connectivity, components, or reachability in a sparse graph | DFS, BFS, union-find | Traversal: $O(V+E)$; union-find is useful for incremental connectivity |
| Shortest path with equal edge costs | BFS | $O(V+E)$ |
| Shortest path with edge weights only 0 or 1 | 0-1 BFS with a deque | $O(V+E)$ |
| Shortest path with arbitrary nonnegative weights | Dijkstra with a priority queue | Commonly $O((V+E)\log V)$ |
| All-pairs shortest paths and only a few hundred vertices | Floyd–Warshall | $O(V^3)$ time, $O(V^2)$ space; account for negative cycles if present |
| Prerequisites or dependencies forming a directed acyclic graph | Topological sort, DP on a DAG | Topological order costs $O(V+E)$; DP cost depends on transitions |
| Many prefix searches across words | Trie | Operations scale with word or prefix length; node memory can be significant |
| Only one answer needed from an enormous numeric range | Binary search, arithmetic, number theory | Requires exploitable mathematical structure; avoid allocating by numeric magnitude |

Each implication has a correctness condition. Nonnegative values support some sliding-window arguments, but do not make every subarray problem a sliding-window problem. Sorted input enables binary search only when you can discard a half of the search space correctly.

### Why negative values matter for sliding windows

For nonnegative values, extending a window cannot decrease its sum, and removing its leftmost element cannot increase it. This supports the usual shrink-while-too-large rule for some sum constraints.

With negative values, that reasoning breaks. For a target sum of `3`, the subarray `[5, -2]` is valid, even though its first prefix has sum `5`. Discarding `5` immediately because the sum is too large loses the solution. Prefix sums and hashing may be more appropriate for exact-sum problems with signed values.

## 7. Count all dimensions and all queries

An algorithm called “linear” might be linear in the wrong quantity.

- A grid traversal is $O(RC)$, where $R$ and $C$ are the dimensions.
- Graph traversal is $O(V+E)$, not simply $O(V)$.
- Comparing two strings can require time proportional to their length.
- A DP with $n$ states and $k$ transitions per state costs $O(nk)$.
- Running an $O(n)$ operation for $q$ queries costs $O(nq)$.

For example, `100,000` elements and `100,000` range-sum queries make a scan per query infeasible. On an unchanged array, prefix sums reduce the total time to $O(n+q)$ with $O(n)$ extra space. If updates are allowed, static prefix sums may no longer be sufficient; a Fenwick tree or segment tree can become relevant.

Also check bounds across test cases. If the statement limits the sum of all input lengths, use that total when estimating runtime instead of assuming every case reaches the maximum independently.

## 8. Memory can eliminate a solution too

Time complexity is only half the feasibility check. A table with $n^2$ cells at $n=100{,}000$ contains ten billion cells. Even at one byte per cell, that is about `10 GB`; ordinary Python containers can require substantially more.

For dynamic programming, ask whether every previous state must remain available. If each row depends only on the previous row, rolling arrays can reduce $O(nm)$ space to $O(m)$ without changing the time complexity. Reconstructing the chosen solution may require additional information.

A huge numeric bound is different from a huge explicit input. A scalar target as large as $10^{18}$ may suggest binary search, number theory, or a formula. An explicit array still costs $\Omega(n)$ to read when every element matters; its large size alone cannot justify an $O(\log n)$ algorithm.

## 9. Constraints do not prove correctness or optimality

An $O(n\log n)$ greedy algorithm may fit the time limit and still return the wrong answer. You need an invariant, exchange argument, recurrence, or another explanation of why the choices are valid.

Similarly, a quadratic solution can pass small tests while an interview expects a more efficient approach. Explain both the simplest valid solution and the improvement, including its memory trade-off.

For enumeration problems, include the cost of writing results. Materializing all subsets requires $\Theta(n2^n)$ element output in total, even if the recursion tree itself has only $O(2^n)$ nodes. A tiny input bound may be necessary because the answer is inherently enormous.

## Interview workflow

1. Identify the actual size variables: length, vertices, edges, target, queries, and value range.
2. Describe a correct brute-force solution and estimate its worst-case work.
3. Use the constraints to rule out impractical time and memory costs.
4. Find the repeated work or structural property that suggests a roadmap pattern.
5. State the invariant or recurrence that makes the candidate correct.
6. Check total cost across all dimensions and test cases.
7. Implement, then test edge cases that challenge the invariant.

A useful explanation during an interview is: “At this input size, checking every pair is too expensive. For each value, I only need to know whether its complement has appeared, so I can replace the inner scan with a hash-map lookup.”

## Related

- [Arrays and Hashing](/atlas/interview-prep/neetcode-roadmap/arrays-and-hashing)
- [Two Pointers](/atlas/interview-prep/neetcode-roadmap/two-pointers)
- [Binary Search](/atlas/interview-prep/neetcode-roadmap/binary-search)
- [Sliding Window](/atlas/interview-prep/neetcode-roadmap/sliding-window)
- [Backtracking](/atlas/interview-prep/neetcode-roadmap/backtracking)
- [One-Dimensional Dynamic Programming](/atlas/interview-prep/neetcode-roadmap/one-dimensional-dynamic-programming)
- [Two-Dimensional Dynamic Programming](/atlas/interview-prep/neetcode-roadmap/two-dimensional-dynamic-programming)

## Sources

- [USACO Guide: Time Complexity](https://usaco.guide/bronze/time-comp) — complexity estimation and common input-size ranges. The thresholds above are approximate study heuristics, not judge-specific guarantees.
- [NeetCode Roadmap](https://neetcode.io/roadmap) — the pattern organization used by the companion notes.
