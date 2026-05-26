---
title: "27 - Remove Element"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **Two-pointer Technique:** an algorithmic pattern that uses two pointers to process data, often to modify an array in-place.
- **In-place Algorithm:** an algorithm that transforms its input using a small, constant amount of extra storage.

Given an integer array `nums` and an integer `val`, remove all occurrences of `val` in `nums` [**in-place**](https://en.wikipedia.org/wiki/In-place_algorithm). The order of the elements may be changed. Then return _the number of elements in_ `nums` _which are not equal to_ `val`.

Consider the number of elements in `nums` which are not equal to `val` be `k`, to get accepted, you need to do the following things:

- Change the array `nums` such that the first `k` elements of `nums` contain the elements which are not equal to `val`. The remaining elements of `nums` are not important as well as the size of `nums`.
- Return `k`.

**Custom Judge:**

The judge will test your solution with the following code:
```python
int[] nums = [...]; // Input array
int val = ...; // Value to remove
int[] expectedNums = [...]; // The expected answer with correct length.
                            // It is sorted with no values equaling val.

int k = removeElement(nums, val); // Calls your implementation

assert k == expectedNums.length;
sort(nums, 0, k); // Sort the first k elements of nums
for (int i = 0; i < actualLength; i++) {
    assert nums[i] == expectedNums[i];
}
```
If all assertions pass, then your solution will be **accepted**.

**Example 1:**

**Input:** ``nums = [3,2,2,3], val = 3``
**Output:** ``2, nums = [2,2,_,_]``
**Explanation:** Your function should return k = 2, with the first two elements of nums being 2.
It does not matter what you leave beyond the returned k (hence they are underscores).

**Example 2:**

**Input:** nums = ``[0,1,2,2,3,0,4,2], val = 2``
**Output:** ``5, nums = [0,1,4,0,3,_,_,_]``
**Explanation:** Your function should return k = 5, with the first five elements of nums containing 0, 0, 1, 3, and 4.
Note that the five elements can be returned in any order.
It does not matter what you leave beyond the returned k (hence they are underscores).

## Solution

```python
class Solution:
    def removeElement(self, nums: List[int], val: int) -> int:
        tail = len(nums) - 1
        k = 0
        n = len(nums) - 1

        while n >= 0:
            print(k, nums, n, tail)
            k += 1
            if nums[n] == val:
                k -= 1
                nums[n] = nums[tail]
                nums[tail] = val
                while nums[tail] == val and tail > 0:
                    tail -= 1
            n -= 1
  
            if tail < n:
                n = tail
        return k
```

My first solution use 2 pointers, one for the tail and one of the current element. The goal is that all targeted values end up at the end of the list. For that I go through the list in reverse order while keeping a pointer to where I have to insert at the end of the list. Every time I insert a value at the end, tail goes up to fill a new value. We have to ensure that n is always equal or superior to tail, otherwise we have the case where numbers will be added at the front.

The optimized solution is to go through the array, keep a pointer to where to put values and add 1 to it every time the value is not the target value. We use this pointer as to where to put non target values. Yes this means that numbers will be swapped even if they don't need to.
```python
class Solution:
    def removeElement(self, nums: List[int], val: int) -> int:
        k = 0
        for i in range(len(nums)):
            if nums[i] != val:
                nums[k] = nums[i]
                k += 1
        return k
```
