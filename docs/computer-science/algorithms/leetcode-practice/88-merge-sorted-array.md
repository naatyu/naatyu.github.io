---
title: "88 - Merge sorted array"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **Two-pointer Technique:** applied by iterating backward from the end of the arrays to merge them in-place.
- **Sorted Array:** an array where elements are arranged in a specific order, typically ascending.

You are given two integer arrays `nums1` and `nums2`, sorted in **non-decreasing order**, and two integers `m` and `n`, representing the number of elements in `nums1` and `nums2` respectively.

**Merge** `nums1` and `nums2` into a single array sorted in **non-decreasing order**.

The final sorted array should not be returned by the function, but instead be _stored inside the array_ `nums1`. To accommodate this, `nums1` has a length of `m + n`, where the first `m` elements denote the elements that should be merged, and the last `n` elements are set to `0` and should be ignored. `nums2` has a length of `n`.

**Example 1:**

**Input:** ``nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3``
**Output:** ``[1,2,2,3,5,6]``
**Explanation:** ``The arrays we are merging are [1,2,3] and [2,5,6].``
``The result of the merge is [1,2,2,3,5,6] with the underlined elements coming from nums1.``

**Example 2:**

**Input:** ``nums1 = [1], m = 1, nums2 = [], n = 0``
**Output:** ``[1]``
**Explanation:** ``The arrays we are merging are [1] and [].``
``The result of the merge is [1].``

**Example 3:**

**Input:** ``nums1 = [0], m = 0, nums2 = [1], n = 1``
**Output:** ``[1]``
**Explanation:** ``The arrays we are merging are [] and [1].``
``The result of the merge is [1].``
Note that because m = 0, there are no elements in nums1. The 0 is only there to ensure the merge result can fit in nums1.

## Solution

To start, let's merge from the last value in ``nums1``. Then it's a two pointer problem where we have a point at the largest value of ``nums1`` and a pointer at the largest value of ``nums2``. We can then go through the array backward and fill it or move values depending on which one is higher. In the case where we reach the end of nums1 but nums2 is not empty (for exemple if nums2 has lower numbers than the first numbers of nums1) we just have to fill nums1 with numbers in nums2.
```python
class Solution:
    def merge(self, nums1: List[int], m: int, nums2: List[int], n: int) -> None:
        """
        Do not return anything, modify nums1 in-place instead.
        """
        # Get last index where to start merging
        last_index = m+n-1
        while m > 0 and n > 0:
            if nums1[m-1] < nums2[n-1]:
                nums1[last_index] = nums2[n-1]
                n -= 1
            else:
                nums1[last_index] = nums1[m-1]
                m -= 1
            last_index -= 1

        # Fill if nums2 is not empty
        while n > 0:
            nums1[last_index] = nums2[n-1]
            n -= 1
            last_index -= 1
```
