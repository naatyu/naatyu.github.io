---
title: "169 - Majority Element"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **Boyer-Moore Voting Algorithm:** an efficient $O(n)$ time and $O(1)$ space algorithm for finding the majority element in a sequence.

Given an array `nums` of size `n`, return _the majority element_.

The majority element is the element that appears more than `⌊n / 2⌋` times. You may assume that the majority element always exists in the array.

**Example 1:**
**Input:** ``nums = [3,2,3]``
**Output:** ``3``

**Example 2:**
**Input:** ``nums = [2,2,1,1,1,2,2]``
**Output:** ``2``

## Solution

The solution is to use the [Boyer-Moore voting algorithm](https://en.wikipedia.org/wiki/Boyer%E2%80%93Moore_majority_vote_algorithm). Here is the solution:
```python
class Solution:
    def majorityElement(self, nums: List[int]) -> int:
        best, count = 0, 0

        for i in nums:
            if count == 0:
                best = i
            count += (1 if i == best else -1)
        return best
```
C'est assez simple, on garde un compte qui s’incrémente si la valeur actuelle correspond a la valeur la plus vue et qui se décrémente si la valeur est différente. Des que le compte atteint 0, on change de meilleur valeur.
![Boyer moore](/attachments/computer-science/algorithms/leetcode-practice/169-majority-element/boyer-moore.png)
