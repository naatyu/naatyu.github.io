---
title: "2 - Palindrome number"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **Palindrome:** a sequence that reads the same forward and backward.
- **String Slicing:** a syntax for extracting or reversing parts of a string.

Given an integer `x`, return `true` _if_ `x` _is a_ **palindrome**, and_ `false` _otherwise_.
An integer is a **palindrome** when it reads the same forward and backward.
For example, `121` is a palindrome while `123` is not.

**Example 1:**

**Input:** x = 121
**Output:** true
**Explanation:** 121 reads as 121 from left to right and from right to left.

**Example 2:**

**Input:** x = -121
**Output:** false
**Explanation:** From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.

**Example 3:**

**Input:** x = 10
**Output:** false
**Explanation:** Reads 01 from right to left. Therefore it is not a palindrome.

## Solution

Ma premiere solution qui passe:
```python
class Solution:
    def isPalindrome(self, x: int) -> bool:
        # Edge cases
        str_num = str(x)
        if str_num[0]=="-":
            return False
        elif len(str_num)<=2:
            return str_num[0] == str_num[-1]
  
        rounded_len = len(str_num)//2
        for i in range(rounded_len):
            print(str_num[i], str_num[-(i+1)])
            if str_num[i] == str_num[-(i+1)]:
                continue
            else:
                return False
        return True
```

Je gère en premier les cas ou c'est négatif, on sait déjà que ca marchera pas vu que aucun nombre fini par un moins. Ensuite dans le cas ou il y a que 2 nombres on peut faire un simple égal. Pour le reste, je calcule ou se trouve la moité des nombres puis je compare les chiffres des extrémités jusqu'au centre. techniquement c'est du $O(n/2)$ vu que on parcoure uniquement la moitié de la liste.

Ma deuxième solution avec le hint et un petit coup de Google:
```python
class Solution:
    def isPalindrome(self, x: int) -> bool:
        str_num = str(x)
        str_num_reversed = str_num[::-1]

        for i in range(len(str_num)):
            if str_num[i] != str_num_reversed[i]:
                return False
        return True
```
L'idée de la string était bonne ainsi que de parcourir des extrémités vers l'intérieur. Avec cette version j'ai réécris ma première version en mieux:
```python
class Solution:
    def isPalindrome(self, x: int) -> bool:
        str_num = str(x)
        for i in range(len(str_num)//2):
            if str_num[i] != str_num[-(i+1)]:
                return False
        return True
```
Pas besoin d'allouer une version reverse donc mieux en RAM et plus court. La meilleure version que j'ai trouvé qui est hyper efficace:
```python
class Solution:
    def isPalindrome(self, x: int) -> bool:
        x = str(x)
        return x == x[::-1]
```
Simple et efficace, rien à ajouter.
