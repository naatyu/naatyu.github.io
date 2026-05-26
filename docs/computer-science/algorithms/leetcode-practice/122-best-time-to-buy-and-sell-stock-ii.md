---
title: "122 - Best time to buy and sell stock II"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **Greedy Algorithm:** a strategy that captures every possible profit opportunity as it appears.

You are given an integer array `prices` where `prices[i]` is the price of a given stock on the `ith` day.

On each day, you may decide to buy and/or sell the stock. You can only hold **at most one** share of the stock at any time. However, you can buy it then immediately sell it on the **same day**.

Find and return _the **maximum** profit you can achieve_.

**Example 1:**

**Input:** prices = ``[7,1,5,3,6,4]``
**Output:** ``7``
**Explanation:** ``Buy on day 2 (price = 1) and sell on day 3 (price = 5), profit = 5-1 = 4.``
``Then buy on day 4 (price = 3) and sell on day 5 (price = 6), profit = 6-3 = 3.``
``Total profit is 4 + 3 = 7.``

**Example 2:**

**Input:** prices = ``[1,2,3,4,5]``
**Output:** ``4``
**Explanation:** ``Buy on day 1 (price = 1) and sell on day 5 (price = 5), profit = 5-1 = 4.``
``Total profit is 4.``

**Example 3:**

**Input:** prices = ``[7,6,4,3,1]``
**Output:** ``0``
**Explanation:** ``There is no way to make a positive profit, so we never buy the stock to achieve the maximum profit of 0.``

## Solution

Easy, on parcourt l'array et des que d'un jour à l'autre il y a un profit, on l'ajoute au total:
```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        buy = 0
        sell = 1
        max_profit = 0
        for i in range(1, len(prices)):
            profit = prices[sell] - prices[buy]
            if profit > 0:
                max_profit += profit
            buy += 1
            sell += 1
        return max_profit
```
Comme ca, des que un profit est possible, on le prends.
