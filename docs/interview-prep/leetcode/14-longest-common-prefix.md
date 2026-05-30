---
title: "14 - Longest common prefix"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **Prefix:** a sequence of characters at the beginning of a string.
- **Lexicographical Sorting:** alphabetical ordering that helps in identifying common prefixes between strings.

Write a function to find the longest common prefix string amongst an array of strings.

If there is no common prefix, return an empty string `""`.

**Example 1:**

**Input:** ``strs = ["flower","flow","flight"]``
**Output:** ``"fl"``

**Example 2:**

**Input:** strs = ``["dog","racecar","car"]``
**Output:** ``""``
**Explanation:** There is no common prefix among the input strings.

## Solution

Ma première solution:
```python
class Solution:
    def longestCommonPrefix(self, strs: List[str]) -> str:
        prefix = ""
        k = 0
        stop = False
        while stop != True:
            tmp = set([i[:k] for i in strs])
            print(tmp)
            if len(tmp) > 1 or k > 200:
                stop = True
                continue
            k+=1
            prefix = tmp.pop()
        return prefix
```
J'ai pas mal galérer au début parce que j'ai mal  lu/compris l'énoncé. Vu que c'est un prefix on cherche pas la suite de lettres commune la plus grande mais le prefix le plus grand donc que les lettres du début du mot. J'utilise le slicing pour avoir une liste des k premieres lettres de chaque mot. Vu que dans les contraintes il est dit que la longueur max d'un mot est de 200, des que k dépasse 200 ca veut dire que on a rien trouvé ou que c'est un cas spécial genre string vide.

Solution opti ou du moins la plus accepté:
```python
class Solution:
    def longestCommonPrefix(self, strs: List[str]) -> str:
        v = sorted(strs)
        common_prefix = ""
        for char1, char2 in zip(v[0], v[-1]):
            if char1 != char2:
                return common_prefix
            common_prefix += char1
        return common_prefix
```
L'idée c'est que si on sort une liste de string, ca va sort les mots par les lettres, donc les mots avec les prefixes similaires seront cote a cote. Du coup si tous les mots ont un prefix, le premier et le dernier mot du sort auront les memes premieres lettres. Il y a plus qu'a avancé et s’arrête jusqu’à ce que les lettres ne correspondent pas.
