---
title: "45 - Jump Game II"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **BFS (Breadth-First Search):** an algorithm for traversing or searching tree or graph data structures, layer by layer.
- **Greedy Algorithm:** choosing the best immediate option at each step to minimize the total number of jumps.

You are given a **0-indexed** array of integers `nums` of length `n`. You are initially positioned at `nums[0]`.

Each element `nums[i]` represents the maximum length of a forward jump from index `i`. In other words, if you are at `nums[i]`, you can jump to any `nums[i + j]` where:

- `0 &lt;= j &lt;= nums[i]` and
- `i + j &lt; n`

Return _the minimum number of jumps to reach_ `nums[n - 1]`. The test cases are generated such that you can reach `nums[n - 1]`.

**Example 1:**

**Input:** nums = ``[2,3,1,1,4]``
**Output:** ``2``
**Explanation:** ``The minimum number of jumps to reach the last index is 2. Jump 1 step from index 0 to 1, then 3 steps to the last index.``

**Example 2:**

**Input:** nums = ``[2,3,0,1,4]``
**Output:** ``2``
## Solution

Le but est de créer des intervalles est de voir combien d'intervalles sont necessaires pour atteindre la fin. Pour cela on part du départ et on voit jusque où on peut sauter. Avec deux pointeurs on crée un intervalle du saut minimum au saut maximum. On garde la valeur de cet intervalle qui permet de faire le plus grand saut qui deviendra par la suite la borne supérieure de notre prochain intervalle. On met a jour le pointeur inférieur sur la borne inférieur du prochain intervalle soit le max de l'intervalle actuel + 1. Et on recommence jusqu’à ce que le pointeur supérieur atteigne la fin de la liste.
```python
class Solution:
    def jump(self, nums: List[int]) -> int:
        res = 0
        l = r = 0

        while r < len(nums)-1:
            farthest = 0
            for i in range(l, r+1):
                farthest = max(farthest, i+nums[i])
            l = r+1
            r = farthest
            res += 1
        return res
```
