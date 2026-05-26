---
title: "26 - Remove Duplicates from Sorted Array"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **Two-pointer Technique:** an algorithmic pattern using two indices to process a data structure, often to optimize time or space.
- **Set:** a collection of unique elements, useful for identifying duplicates.

Given an integer array `nums` sorted in **non-decreasing order**, remove the duplicates [**in-place**](https://en.wikipedia.org/wiki/In-place_algorithm) such that each unique element appears only **once**. The **relative order** of the elements should be kept the **same**. Then return _the number of unique elements in_ `nums`.

Consider the number of unique elements of `nums` to be `k`, to get accepted, you need to do the following things:

- Change the array `nums` such that the first `k` elements of `nums` contain the unique elements in the order they were present in `nums` initially. The remaining elements of `nums` are not important as well as the size of `nums`.
- Return `k`.

**Custom Judge:**

The judge will test your solution with the following code:
```
int[] nums = [...]; // Input array
int[] expectedNums = [...]; // The expected answer with correct length

int k = removeDuplicates(nums); // Calls your implementation

assert k == expectedNums.length;
for (int i = 0; i < k; i++) {
    assert nums[i] == expectedNums[i];
}
```
If all assertions pass, then your solution will be **accepted**.

**Example 1:**

**Input:** ``nums = [1,1,2]``
**Output:** ``2, nums = [1,2,_]``
**Explanation:** ``Your function should return k = 2, with the first two elements of nums being 1 and 2`` ``respectively.``
``It does not matter what you leave beyond the returned k (hence they are underscores).``

**Example 2:**

**Input:** ``nums = [0,0,1,1,1,2,2,3,3,4]``
**Output:** ``5, nums = [0,1,2,3,4,_,_,_,_,_]``
**Explanation:** ``Your function should return k = 5, with the first five elements of nums being 0, 1, 2, 3, ```
`and 4 respectively.`
`
``It does not matter what you leave beyond the returned k (hence they are underscores).``

## Solution

J'ai repris le même algorithme que dans le problème ``Remove interger``, et ca marche nickel !
```python
class Solution:
    def removeDuplicates(self, nums: List[int]) -&gt; int:
        k = 0
        seen = set()
        for i in range(len(nums)):
            if nums[i] not in seen:
                nums[k] = nums[i]
                seen.add(nums[i])
                k += 1
        return k
```
J'ai juste du ajouter un set des nombres déjà vu, techniquement c'est pas le plus opti en ram. il suffit de garder une variable qui sauve le dernier nombre vu et il suffit de vérifier si le nombre actuel et celui sauvegardé correspondent (vue que c'est sort). Pas de ré-explication de l'algo cf `Remove integer`. 
La solution opti:
```python
class Solution:
    def removeDuplicates(self, nums: List[int]) -&gt; int:
        k = 1
        for i in range(1, len(nums)):
            if nums[i] != nums[i-1]:
                nums[k] = nums[i]
                k += 1
        return k
```
