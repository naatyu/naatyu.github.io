---
title: "20 - Valid Parentheses"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **Stack:** a data structure that follows the Last-In-First-Out (LIFO) principle, ideal for matching nested structures.

Given a string `s` containing just the characters `'('`, `')'`, `'\{'`, `'\}'`, `'['` and `']'`, determine if the input string is valid.

An input string is valid if:

1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

**Example 1:**

**Input:** s = "()"

**Output:** true

**Example 2:**

**Input:** s = "()[]\{\}"

**Output:** true

**Example 3:**

**Input:** s = "(]"

**Output:** false

**Example 4:**

**Input:** s = "([])"

**Output:** true

## Solution

Ma "première" solution:
```python
class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        reverse_mapping = {"(": ")", "[": "]", "{": "}"}
        for char in s:
            if char in reverse_mapping.keys():
                stack.append(char)
            elif char in reverse_mapping.values():
                if not stack:
                    return False
                elif char != reverse_mapping[stack.pop()]:
                    return False
        return not stack
```
L'idée c'est d'utiliser une stack. Des qu'une parenthèse est ouvrante, je l'ajoute a la stack. Si elle est fermante, je vérifie que la dernière qui a été push sur la stack soit la version ouvrante de la parenthèse actuelle, d'ou le dict pour le mapping de l'inverse des parenthèses. Donc si on pop la liste et que c'est pas les mêmes, on peut direct return false. Il faut pas oublier de check si la liste possède un element car le pop d'une liste vide raise une erreur.
