---
title: "55 - Jump Game"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **Greedy Algorithm:** an approach that makes the locally optimal choice at each step with the hope of finding a global optimum.
- **Dynamic Programming:** a method for solving complex problems by breaking them down into simpler subproblems and storing their results.

You are given an integer array `nums`. You are initially positioned at the array's **first index**, and each element in the array represents your maximum jump length at that position.

Return `true` _if you can reach the last index, or_ `false` _otherwise_.

**Example 1:**

**Input:** nums = ``[2,3,1,1,4]``
**Output:** ``true``
**Explanation:** ``Jump 1 step from index 0 to 1, then 3 steps to the last index.``

**Example 2:**

**Input:** nums = ``[3,2,1,0,4]``
**Output:** ``false``
**Explanation:** ``You will always arrive at index 3 no matter what. Its maximum jump length is 0, which makes it impossible to reach the last index.``

## Solution

The solution is to start from the end and see if we can reach it. If we can, then we update the position from which we reached the end as the new goal to reach. At the end if we reached index 0 then we won otherwise we loose:
```python
class Solution:
    def canJump(self, nums: List[int]) -> bool:
        goal = len(nums) - 1

        for i in range(len(nums) - 1, -1, -1):
            if i + nums[i] >= goal:
                goal = i
                
        return True if goal == 0 else False
```
