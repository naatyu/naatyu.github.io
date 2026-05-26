---
title: "189 - Rotate Array"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **In-place Algorithm:** an algorithm that transforms the input without using extra space proportional to the input size.
- **Modulo Operation:** finds the remainder of a division, useful for handling cyclic array indices.

Given an integer array `nums`, rotate the array to the right by `k` steps, where `k` is non-negative.

**Example 1:**

**Input:** ``nums = [1,2,3,4,5,6,7], k = 3``
**Output:** ``[5,6,7,1,2,3,4]``
**Explanation:**
``rotate 1 steps to the right: [7,1,2,3,4,5,6]``
``rotate 2 steps to the right: [6,7,1,2,3,4,5]``
``rotate 3 steps to the right: [5,6,7,1,2,3,4]``

**Example 2:**

**Input:** ``nums = [-1,-100,3,99], k = 2``
**Output:** ``[3,99,-1,-100]``
**Explanation:** 
``rotate 1 steps to the right: [99,-1,-100,3]``
``rotate 2 steps to the right: [3,99,-1,-100]``

## Solution

Ma première solution mais nécessite $O(n)$ en space complexity:
```python
class Solution:
    def rotate(self, nums: List[int], k: int) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        tmp = nums.copy()
        for i in range(len(nums)):
            shifted_idx = (i+k)%len(nums)
            nums[shifted_idx] = tmp[i]
```
Simple, on itere sur l'array et on shift l'index en fonction du k. On utilise le % pour profiter que on peut pas aller au dela de la taille de l'array.
La version opti consiste a d'abord reverse l'array entière puis a reverse en bloc comme suit
![189   Rotate Array 01](/attachments/computer-science/algorithms/leetcode-practice/189-rotate-array/189-rotate-array-01.png)
```python
class Solution:
    def rotate(self, nums: List[int], k: int) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        k=k%len(nums)
        nums[:] = nums[::-1]
        nums[:k] = nums[:k][::-1]
        nums[k:] = nums[k:][::-1]
```
On calcule K avec le modulo pour savoir de combien on shift pour éviter de faire plusieurs fois le tour de l'array.
