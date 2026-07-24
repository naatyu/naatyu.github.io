---
title: "Graphs"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 11
tags:
  - algorithms
  - neetcode
  - graphs
  - dfs
  - bfs
  - leetcode
draft: false
---

## Summary

Graphs model entities connected by arbitrary relationships. Most graph problems reduce to choosing a representation, traversing without revisiting, and recognizing whether the task concerns reachability, shortest unweighted distance, dependencies, or connectivity.

## Representations

### Adjacency list

```python
from collections import defaultdict

graph = defaultdict(list)

for source, destination in edges:
    graph[source].append(destination)
```

Space is $O(V + E)$ and neighbor iteration is efficient.

### Grid as an implicit graph

Each cell is a vertex. Valid neighboring cells are edges. There is no need to build an explicit adjacency list.

```python
directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]
```

## Core patterns

### 1. DFS for reachability and components

```python
def dfs(node):
    if node in visited:
        return

    visited.add(node)

    for neighbor in graph[node]:
        dfs(neighbor)
```

Mark a node visited when entering it, not after processing all neighbors.

### 2. BFS for unweighted shortest distance

```python
from collections import deque

def shortest_distance(start):
    queue = deque([(start, 0)])
    visited = {start}

    while queue:
        node, distance = queue.popleft()

        if is_target(node):
            return distance

        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, distance + 1))

    return -1
```

Mark nodes visited when enqueuing them to prevent duplicate queue entries.

### 3. Multi-source BFS

Put every source in the initial queue with distance zero. The BFS wave then finds the distance to the nearest source.

Examples:

- Rotting Oranges
- Walls and Gates
- distance to nearest zero

### 4. Cycle detection

For an undirected graph, a visited neighbor is a cycle only if it is not the current node's parent.

For a directed graph, use three states:

- unvisited
- visiting: currently in recursion stack
- visited: fully processed

An edge to a `visiting` node is a directed cycle.

### 5. Topological sort

A topological order exists only for a directed acyclic graph.

Kahn's algorithm:

1. compute indegrees
2. enqueue every zero-indegree node
3. remove a node and decrement its neighbors
4. if fewer than `V` nodes are processed, a cycle exists

### 6. Union-Find

Disjoint Set Union maintains connected components under edge additions.

```python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, node):
        while node != self.parent[node]:
            self.parent[node] = self.parent[self.parent[node]]
            node = self.parent[node]
        return node

    def union(self, a, b):
        root_a = self.find(a)
        root_b = self.find(b)

        if root_a == root_b:
            return False

        if self.rank[root_a] < self.rank[root_b]:
            root_a, root_b = root_b, root_a

        self.parent[root_b] = root_a

        if self.rank[root_a] == self.rank[root_b]:
            self.rank[root_a] += 1

        return True
```

With path compression and union by rank, operations are nearly constant time.

## Choosing the traversal

- DFS: reachability, components, recursive structure
- BFS: shortest path in an unweighted graph, levels
- multi-source BFS: nearest source
- topological sort: prerequisites and dependencies
- Union-Find: dynamic connectivity and redundant edges

## Complexity

DFS and BFS:

- time: $O(V + E)$
- space: $O(V)$

For a grid, this becomes $O(rows \times columns)$.

## Common mistakes

- forgetting that edges may be directed
- not including vertices with no outgoing edges
- marking visited too late
- using BFS for weighted shortest paths
- modifying a shared grid without restoring it when restoration is required
- treating every visited neighbor as a cycle in an undirected graph

## Practice progression

1. Number of Islands
2. Clone Graph
3. Max Area of Island
4. Pacific Atlantic Water Flow
5. Rotting Oranges
6. Course Schedule
7. Course Schedule II
8. Graph Valid Tree
9. Number of Connected Components
