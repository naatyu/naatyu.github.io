---
title: "Advanced Graphs"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 15
tags:
  - algorithms
  - neetcode
  - graphs
  - shortest-path
  - minimum-spanning-tree
  - leetcode
draft: false
---

## Summary

Advanced graph problems add weights or require a globally structured route. The main task is to classify the graph correctly: shortest path, minimum spanning tree, all-pairs reachability, or use-every-edge traversal.

## Algorithm selection

| Problem structure | Algorithm |
| --- | --- |
| Unweighted shortest path | BFS |
| Non-negative edge weights | Dijkstra |
| Negative edges | Bellman-Ford |
| All-pairs shortest paths, small graph | Floyd-Warshall |
| Connect all vertices with minimum total cost | Prim or Kruskal |
| Use every edge exactly once | Hierholzer |

## Dijkstra's algorithm

Dijkstra expands the not-yet-finalized node with the smallest known distance.

```python
import heapq

def dijkstra(graph, source):
    distances = {source: 0}
    heap = [(0, source)]

    while heap:
        distance, node = heapq.heappop(heap)

        if distance != distances.get(node):
            continue

        for neighbor, weight in graph[node]:
            candidate = distance + weight

            if candidate < distances.get(neighbor, float("inf")):
                distances[neighbor] = candidate
                heapq.heappush(heap, (candidate, neighbor))

    return distances
```

Invariant: when a node is popped with its current best distance, that distance is final.

Why non-negative weights matter: a future path cannot return and make a finalized distance smaller.

The heap may contain stale entries. Ignore them instead of trying to update an entry in place.

## Bellman-Ford

Relax every edge up to `V - 1` times. A further successful relaxation indicates a reachable negative cycle.

It is slower, $O(VE)$, but handles negative weights and also inspires bounded-edge DP solutions such as Cheapest Flights Within K Stops.

## Minimum spanning tree

An MST connects every vertex with minimum total edge cost and no cycles.

### Kruskal

1. sort edges by weight
2. add an edge if its endpoints are in different components
3. merge components with Union-Find

### Prim

1. start from one vertex
2. push outgoing edges into a min-heap
3. repeatedly add the cheapest edge reaching a new vertex

Difference from shortest-path trees:

- MST minimizes total tree weight
- shortest paths minimize distance from a source

## Eulerian path with Hierholzer

Use every edge exactly once:

1. follow unused edges until stuck
2. add the stuck vertex to the route
3. backtrack and continue
4. reverse the postorder route

Reconstruct Itinerary adds lexical ordering, usually handled by sorting adjacency lists in reverse and popping from the end or by using heaps.

## Floyd-Warshall

For every intermediate vertex `k`:

$$
dist[i][j] = \min(dist[i][j], dist[i][k] + dist[k][j])
$$

Time is $O(V^3)$, making it appropriate only for relatively small graphs.

## Common mistakes

- using Dijkstra with negative weights
- treating a minimum spanning tree as a shortest-path tree
- marking Dijkstra nodes visited when pushing instead of when finalizing
- failing to ignore stale heap entries
- counting vertices instead of edges in a bounded-stop problem
- constructing an Eulerian path in forward preorder instead of reverse postorder
- forgetting disconnected-graph cases

## Practice progression

1. Network Delay Time
2. Swim in Rising Water
3. Min Cost to Connect All Points
4. Cheapest Flights Within K Stops
5. Reconstruct Itinerary
6. Alien Dictionary

## Related

- [Heap](/atlas/algorithms/data-structures/heap)
- [Priority Queues](/atlas/algorithms/data-structures/priority-queues)
