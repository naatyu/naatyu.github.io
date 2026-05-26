---
title: "13 - Roman to integer"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **Roman Numerals:** a numeral system based on combinations of letters from the Latin alphabet.
- **Mapping:** the association of symbols from one system (Roman) to values in another (integer).

Roman numerals are represented by seven different symbols: `I`, `V`, `X`, `L`, `C`, `D` and `M`.

**Symbol**       **Value**
I             1
V             5
X             10
L             50
C             100
D             500
M             1000

For example, `2` is written as `II` in Roman numeral, just two ones added together. `12` is written as `XII`, which is simply `X + II`. The number `27` is written as `XXVII`, which is `XX + V + II`.

Roman numerals are usually written largest to smallest from left to right. However, the numeral for four is not `IIII`. Instead, the number four is written as `IV`. Because the one is before the five we subtract it making four. The same principle applies to the number nine, which is written as `IX`. There are six instances where subtraction is used:

- `I` can be placed before `V` (5) and `X` (10) to make 4 and 9. 
- `X` can be placed before `L` (50) and `C` (100) to make 40 and 90. 
- `C` can be placed before `D` (500) and `M` (1000) to make 400 and 900.

Given a roman numeral, convert it to an integer.

**Example 1:**

**Input:** s = "III"
**Output:** 3
**Explanation:** III = 3.

**Example 2:**

**Input:** s = "LVIII"
**Output:** 58
**Explanation:** L = 50, V= 5, III = 3.

**Example 3:**

**Input:** s = "MCMXCIV"
**Output:** 1994
**Explanation:** M = 1000, CM = 900, XC = 90 and IV = 4.

## Solution

```python
class Solution:
    def romanToInt(self, s: str) -> int:
        symbols = {
            "I": 1,
            "V": 5,
            "X": 10,
            "L": 50,
            "C": 100,
            "D": 500,
            "M": 1000
        }
  
        sum = 0
        previous_char_value = 0
        for c in s:
            if previous_char_value == 1 and c in ["V", "X"]:
                sum += symbols[c] - 1*2
            elif previous_char_value == 10 and c in ["L", "C"]:
                sum += symbols[c] - 10*2
            elif previous_char_value == 100 and c in ["D", "M"]:
                sum += symbols[c] - 100*2
            else:
                sum += symbols[c]
            previous_char_value = symbols[c]
  
        return sum
```
Première solution qui passe mais pas propre et surement pas opti.

Deuxième version plus opti, il fallait voir le pattern ou les cas spéciaux apparaissent quand le chiffre suivant est supérieur au chiffre actuel:
```python
class Solution:
    def romanToInt(self, s: str) -> int:
        symbols = {
            "I": 1,
            "V": 5,
            "X": 10,
            "L": 50,
            "C": 100,
            "D": 500,
            "M": 1000
        }
  
        sum = 0
        for i in range(len(s)):
            if i < len(s) - 1 and symbols[s[i]] < symbols[s[i+1]]:
                sum -= symbols[s[i]]
            else:
                sum += symbols[s[i]]

        return sum
```

C'est la solution la plus opti.
