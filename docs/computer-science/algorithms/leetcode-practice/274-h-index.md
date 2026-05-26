---
title: "274 - H-Index"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **H-index:** a metric that quantifies a researcher's productivity and citation impact.
- **Counting Sort:** a non-comparative sorting algorithm that operates in linear time by counting occurrences of each value.

Given an array of integers `citations` where `citations[i]` is the number of citations a researcher received for their `ith` paper, return _the researcher's h-index_.

According to the [definition of h-index on Wikipedia](https://en.wikipedia.org/wiki/H-index): The h-index is defined as the maximum value of `h` such that the given researcher has published at least `h` papers that have each been cited at least `h` times.

**Example 1:**

**Input:** citations = ``[3,0,6,1,5]``
**Output:** ``3``
**Explanation:** ``[3,0,6,1,5] means the researcher has 5 papers in total and each of them had received 3, 0, 6, 1, 5 citations respectively.``
``Since the researcher has 3 papers with at least 3 citations each and the remaining two with no more than 3 citations each, their h-index is 3.``

**Example 2:**

**Input:** citations = ``[1,3,1]``
**Output:** ``1``

## Solution

On sort la liste, on initialise le h index à 0 puis on parcourt la liste à l'envers. Des que le nombre actuel est supérieur au H index, on augmente le H index de 1 et on continue dans la liste.
```python
class Solution:
    def hIndex(self, citations: List[int]) -> int:
        sorted_hindex = sorted(citations)
        hindex = 0

        for i in range(len(sorted_hindex)-1, -1, -1):
            if sorted_hindex[i] > hindex:
                hindex += 1
            else:
                break
        return hindex
```
La solution est au mieux $O(n)$ et sinon en $O(nlogn)$. 
Solution en $O(n)$:
```python
class Solution:
    def hIndex(self, citations: List[int]) -> int:
        n = len(citations)
        papers_count = [0] * (n+1)

        for c in citations:
            papers_count[min(n, c)] += 1
            
        h = n
        papers = papers_count[n]

        while papers < h:
            h -= 1
            papers += papers_count[h]

        return h
```
On créer d'abord une liste pour compter le nombre de papiers avec une citation similaire. L'index représente le nombre de citations (si c'est plus que la longueur de la liste on met au dernier index) et la valeur de nombre de papiers a cette citation. On parcourt ensuite la liste à l'envers en partant du h index max possible et puis on décrémente le h index et augmente le nombre de papiers au fur et a mesure jusqu’à ce que le nombre de papiers soit supérieur ou égal au h index.
