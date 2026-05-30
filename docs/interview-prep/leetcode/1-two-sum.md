---
title: "1 - Two sum"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **Hash Map:** a data structure that maps keys to values for efficient lookup, typically in $O(1)$ time.
- **Time Complexity:** the amount of time an algorithm takes to complete as a function of its input size.
- **Space Complexity:** the amount of memory an algorithm uses relative to its input size.

Given an array of integers `nums` and an integer `target`, return _indices of the two numbers such that they add up to `target`_.
You may assume that each input would have **_exactly_ one solution**, and you may not use the _same_ element twice.
You can return the answer in any order.

**Example 1:**
**Input:** ``nums = [2,7,11,15], target = 9``
**Output:** ``[0,1]``
**Explanation:** ``Because nums[0] + nums[1] == 9, we return [0, 1].``

**Example 2:**
**Input:** nums = ``[3,2,4], target = 6``
**Output:** ``[1,2]``

**Example 3:**
**Input:** nums = ``[3,3], target = 6``
**Output:** ``[0,1]``

## Solution

Solution la plus évidente mais en $O(n^2)$ en time complexity:
```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        for i in range(len(nums)):
            for j in range(i+1,len(nums)):
                if nums[i]+nums[j] == target:
                    return[i,j]
        return  []
```
On passe sur tous les nombres jusqu’à trouver la bonne paire. C'est le mode brute force.

Solution en $O(n)$:
```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        num_lookup = {}
        for j, num in enumerate(nums):
            num_lookup[num] = j
            
        for i, num in enumerate(nums):
            sub = target - num
            if sub in num_lookup and num_lookup[sub] != i:
                return [i, num_lookup[sub]]
        return  []
```
Dans un premier temps on crée le dictionnaire qui associe un nombre a son index. Dans un second temps on parcours la liste avec une boucle for $O(n)$. Dans cette boucle on calcule la difference entre le nombre actuel et le somme voulue. Cela nous donne le nombre que l'on doit trouver, il n'y a plus qu'a voir si ce nombre est dans la liste. Avec le dico précédemment créer, on peut chercher en $O(1)$ si ce nombre est dans la liste. Il n'y a plus qu'a parcourir la boucle jusqu’à trouver la bonne paire. Comme il faut créer un dico de la taille de la liste, on est en $O(n)$ sur la space complexity.

Il y a également une solution ou on peut faire qu'une passe sur la liste donc en $O(n)$:
```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        num_lookup = {}
        for i, num in enumerate(nums):
            sub = target - num
            if sub in num_lookup and num_lookup[sub] != i:
                return [i, num_lookup[sub]]
            num_lookup[num] = i

        return  []
```
On peuple le dico au fur et a mesure et des que la paire est trouvée, on return.
