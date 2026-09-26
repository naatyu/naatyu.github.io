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

## Start here: algorithm decision tree

The NeetCode roadmap tells you what to study and in what order. Choosing an approach for an unfamiliar problem requires a different map: start with the requested output and the operations you need.

Use these trees to produce one or two candidates. A leaf is a hypothesis to verify with an invariant and a complexity estimate. Several branches can apply: Word Search II combines a grid traversal, backtracking, and a trie; Dijkstra combines graph search with a heap.

```text
What must the solution do?
|
+-- Follow connections between nodes, cells, or states?
|   `-- Tree / graph / grid decisions -> A
|
+-- Search or summarize an array or string?
|   `-- Sequence decisions -> B
|
+-- Choose among many possible arrangements or action sequences?
|   `-- Backtracking / DP / greedy decisions -> C
|
+-- Maintain priorities, events, prefixes, or linked nodes?
|   `-- Data-structure decisions -> D
|
`-- Exploit arithmetic, binary representation, or coordinates?
    `-- Math / bit manipulation decisions -> E

For every candidate:
Can I explain why it is correct AND fit the worst-case time/memory?
    Yes -> implement and test the invariant.
    No  -> revisit the state, repeated work, or structural property.
```

- [A. Trees, graphs, and grids](#a-trees-graphs-and-grids)
- [B. Arrays and strings](#b-arrays-and-strings)
- [C. Choices, counting, and optimization](#c-choices-counting-and-optimization)
- [D. Choosing a data structure](#d-choosing-a-data-structure)
- [E. Numbers, bits, and geometry](#e-numbers-bits-and-geometry)

### A. Trees, graphs, and grids

Think of a graph whenever the problem contains states and legal transitions, even if it never uses the word “graph.” A grid cell can be a state, and a valid move can be an edge.

```text
What do the connections represent?
|
+-- A tree?
|   +-- Need information from children? -> Postorder DFS
|   +-- Carry information from ancestors? -> Top-down DFS
|   +-- Need levels / nearest depth? -> BFS
|   `-- BST lookup / range with ordering? -> Prune using BST order
|
+-- Reachability, islands, connected components?
|   +-- Static graph / grid -> DFS or BFS + visited tracking
|   `-- Undirected connectivity as edges are added -> Union-find
|
+-- Shortest path / minimum number of transitions?
|   +-- Equal edge costs -> BFS
|   +-- Weights only 0 and 1 -> 0-1 BFS
|   +-- General nonnegative weights -> Dijkstra
|   `-- Negative weights -> DAG relaxation if acyclic;
|                          otherwise consider Bellman-Ford
|
+-- Prerequisites / ordering constraints?
|   `-- Topological sort; failure to order all nodes detects a cycle
|
+-- Connect all vertices at minimum total edge cost?
|   `-- Minimum spanning tree: Kruskal or Prim
|
`-- Use every edge exactly once?
    `-- Eulerian traversal: check existence, then Hierholzer
```

**Distinguish the objective:** a shortest-path tree minimizes distances from a source; a minimum spanning tree minimizes the total selected edge weight. One does not generally solve the other objective. Negative cycles can make shortest-path values unbounded for affected destinations.

For grids, ask whether movement creates cycles. Counting right/down paths can use DP because dependencies are acyclic. Finding the shortest route with obstacles and equal-cost moves suggests BFS. Finding a word without reusing a cell requires backtracking with a path-specific visited set.

Read: [Trees](/atlas/interview-prep/neetcode-roadmap/trees), [Graphs](/atlas/interview-prep/neetcode-roadmap/graphs), [Advanced Graphs](/atlas/interview-prep/neetcode-roadmap/advanced-graphs).

### B. Arrays and strings

First distinguish a **subarray/substring** (contiguous) from a **subsequence** (may skip elements). Sliding windows describe contiguous regions and generally do not solve subsequence problems.

```text
What relationship between elements matters?
|
+-- Membership, duplicates, counts, or a complement?
|   `-- Hash set / hash map; frequency array for a small alphabet
|
+-- A contiguous region?
|   +-- Fixed length k?
|   |   +-- Sum / counts -> Rolling window
|   |   `-- Maximum / minimum -> Monotonic deque
|   +-- Variable length with a valid forward-only boundary rule?
|   |   `-- Sliding window
|   +-- Exact sum, possibly with negative values?
|   |   `-- Prefix sums + hash map
|   +-- Maximum subarray sum?
|   |   `-- Kadane: best sum ending at each position
|   `-- Palindrome? -> Expand around centers or DP
|
+-- A sorted order you can exploit?
|   +-- Locate a value / boundary -> Binary search
|   +-- Find a pair / compare opposite ends -> Two pointers
|   `-- Merge ordered sequences -> Merge pointers
|
+-- Next greater/smaller element?
|   `-- Monotonic stack
|
+-- Rearrange / compact in place?
|   `-- Read/write pointers, swapping, or partitioning
|
`-- A subsequence or alignment between sequences?
    `-- Define a DP state; check for specialized optimizations
        such as O(n log n) longest increasing subsequence
```

**The sliding-window test:** explain exactly why moving a boundary cannot skip an answer that will become valid later. “Longest substring” alone is not enough. For no-repeat substrings, shrinking until counts are valid works; for exact sums with signed values, a sum that is currently too large can later decrease.

**The binary-search test:** identify a sorted search space or prove that a feasibility predicate changes truth value at most once. For “minimum speed to finish within a deadline,” increasing speed only makes completion easier. That enables binary search on speed even when the input array is unsorted.

Read: [Arrays and Hashing](/atlas/interview-prep/neetcode-roadmap/arrays-and-hashing), [Two Pointers](/atlas/interview-prep/neetcode-roadmap/two-pointers), [Sliding Window](/atlas/interview-prep/neetcode-roadmap/sliding-window), [Binary Search](/atlas/interview-prep/neetcode-roadmap/binary-search), [Stack](/atlas/interview-prep/neetcode-roadmap/stack).

### C. Choices, counting, and optimization

“Minimum,” “maximum,” and “number of ways” describe the output. They are not enough to identify DP: minimum hops may be BFS, and the maximum number of compatible intervals may be greedy.

```text
Do I need to explicitly produce all valid solutions?
|
+-- Yes -> Backtracking / enumeration + pruning
|          Check the number and size of outputs.
|
`-- No: need existence, a count, or an optimum
    |
    +-- A proven safe local choice or dominant frontier?
    |   `-- Greedy; state the exchange or dominance argument
    |
    +-- Repeated subproblems with the same future possibilities?
    |   `-- DP / memoization
    |       +-- One index or remaining amount -> Often 1-D DP
    |       +-- Two indices / index + capacity -> Often 2-D DP
    |       `-- Chosen subset matters -> Bitmask state if small
    |
    +-- Can test feasibility monotonically at a candidate answer?
    |   `-- Binary search on the answer + a feasibility algorithm
    |
    `-- No useful compression found?
        `-- Backtracking if small; consider meet-in-the-middle
            for splittable choices, or rethink the state if too large
```

These checks are not exclusive. A binary search can use a greedy feasibility test, and DP can run over a tree or graph. “1-D” and “2-D” refer to the state, not the shape of the original input or the final compressed storage.

**The DP test:** can two different histories reach the same state and have identical future options and costs? If so, cache the answer for that state. If visited cells affect which moves remain possible, `(row, column)` alone is not a sufficient state for a no-revisit path search.

**The greedy test:** can a locally preferred choice replace the corresponding choice in an optimal solution without making it worse? Try to break the proposed rule on small inputs. With coin values `[1, 4, 5]` and target `8`, taking the largest coin first yields `5 + 1 + 1 + 1`, but `4 + 4` uses fewer coins. Minimum coin count needs a stronger argument or a different method, commonly DP over the amount. See [USACO's greedy discussion](https://usaco.guide/silver/greedy-sorting) for proofs and counterexamples.

Read: [Backtracking](/atlas/interview-prep/neetcode-roadmap/backtracking), [Greedy](/atlas/interview-prep/neetcode-roadmap/greedy), [1-D DP](/atlas/interview-prep/neetcode-roadmap/one-dimensional-dynamic-programming), [2-D DP](/atlas/interview-prep/neetcode-roadmap/two-dimensional-dynamic-programming).

### D. Choosing a data structure

Ask which operation you repeatedly perform. The data structure should make that operation cheap.

```text
Which repeated operation is expensive?
|
+-- Find the next smallest/largest available item?
|   +-- Repeated arrivals / removals -> Heap / priority queue
|   +-- Static kth element only -> Quickselect or heap
|   `-- Running median -> Two heaps
|
+-- Resolve the most recently opened item first?
|   `-- Stack: brackets, nested expressions, undo, deferred work
|
+-- Process overlapping intervals?
|   +-- Merge coverage -> Sort by start, scan
|   +-- Maximize count of compatible intervals -> Greedy by end
|   `-- Count simultaneous resources -> Sweep line or end-time heap
|
+-- Search a dictionary repeatedly?
|   +-- Exact whole-word membership -> Hash set is often enough
|   `-- Prefixes / shared character branching -> Trie
|
`-- Manipulate linked nodes?
    +-- Middle / cycle -> Slow and fast pointers
    +-- kth from end -> Pointers separated by k nodes
    +-- Reverse -> Maintain previous, current, and next pointers
    `-- Merge / delete -> Dummy head and careful link ownership
```

For weighted interval rewards, choosing the earliest end no longer solves the general optimization problem; weighted interval scheduling typically uses DP. For a static top-$k$ task, sorting can be the simplest acceptable solution if the constraints allow it. A heap is especially useful when priorities must remain available as the data changes.

Read: [Heap / Priority Queue](/atlas/interview-prep/neetcode-roadmap/heap-priority-queue), [Intervals](/atlas/interview-prep/neetcode-roadmap/intervals), [Tries](/atlas/interview-prep/neetcode-roadmap/tries), [Linked List](/atlas/interview-prep/neetcode-roadmap/linked-list).

### E. Numbers, bits, and geometry

```text
What mathematical structure is available?
|
+-- Pair cancellation with exactly one unpaired integer? -> XOR
+-- Subsets / boolean flags in a small universe? -> Bitmasks
+-- Powers of two / set bits? -> Bit operations
+-- Divisibility / repeating cycles? -> GCD, remainders, modular arithmetic
+-- Coordinates / rotations / matrix traversal? -> Geometry or simulation
`-- Huge number of repeated steps? -> Look for a formula, cycle,
                                     or faster composition of operations
```

State the assumptions before using a shortcut. XOR cancellation solves the “every value appears twice except one” pattern, but is not a universal method for finding a unique element under arbitrary multiplicities.

Read: [Bit Manipulation](/atlas/interview-prep/neetcode-roadmap/bit-manipulation), [Math and Geometry](/atlas/interview-prep/neetcode-roadmap/math-and-geometry).

### Walk through the decisions before coding

| Problem | Route through the tree | Decisive reason |
| :--- | :--- | :--- |
| Longest substring without repeated characters | B: contiguous region -> sliding window + counts | Removing from the left restores validity; earlier invalid starts remain invalid when extending |
| Count subarrays summing to k, including negative values | B: exact sum -> prefix sums + frequency map | Earlier prefix sum must equal current prefix sum minus k |
| Daily Temperatures | B: next greater element -> monotonic stack | A warmer day resolves pending colder days |
| Koko Eating Bananas | B/C: smallest feasible speed -> binary search | If a speed works, every higher speed also works |
| Number of Islands | A: components in a grid -> DFS/BFS | Each traversal marks one connected land component |
| Course Schedule | A: dependencies -> topological sort or directed-cycle DFS | A cycle makes the prerequisite order impossible |
| Coin Change | C: repeated remaining amounts -> 1-D DP | Different choices reach the same remaining amount; largest-first can fail |
| Word Search II | A + C + D: grid paths + backtracking + trie | Track used cells per path and prune prefixes absent from the dictionary |

After solving a problem, record the clue, the invariant, and why a tempting alternative fails. This builds recognition you can transfer to unfamiliar wording.

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
- [AlgoMonster: Algorithm Selection Flowchart](https://algo.monster/flowchart) — an external interactive selection aid. The trees in this note are an original synthesis of the local roadmap notes, not a reproduction of its chart.
- [USACO Guide: Greedy Algorithms with Sorting](https://usaco.guide/silver/greedy-sorting) — justification of greedy choices and examples where local choices fail.
