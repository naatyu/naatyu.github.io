---
title: "121 - Best time to buy and sell"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **Two-pointer Technique:** used here to track the minimum price and calculate potential profit in a single pass.
- **Sliding Window:** an algorithmic technique for tracking a subset of data over a larger sequence.

You are given an array `prices` where `prices[i]` is the price of a given stock on the `ith` day.

You want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.

Return _the maximum profit you can achieve from this transaction_. If you cannot achieve any profit, return `0`.

**Example 1:**

**Input:** prices = ``[7,1,5,3,6,4]``
**Output:** ``5``
**Explanation:** ``Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.``
``Note that buying on day 2 and selling on day 1 is not allowed because you must buy before you sell.``

**Example 2:**

**Input:** prices = ``[7,6,4,3,1]``
**Output:** ``0``
**Explanation:** ``In this case, no transactions are done and the max profit = 0.``

## Solution

Première solution avec de l'aide, il faut utiliser deux pointeurs:
```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        buy = 0
        sell = 1
        best_profit = 0

        while sell < len(prices):
            if prices[buy] < prices[sell]:
                if prices[sell] - prices[buy] > best_profit:
                    best_profit = prices[sell] - prices[buy]
            else:
                buy = sell
            sell += 1
        return best_profit
```
On garde un index du meilleur prix d'achat et de vente. On check si la diff entre les deux est meilleure que notre meilleur profit. Si le prix de vente est plus cher que le prix d'achat on check si le profit est meilleur et on update le meilleur profit si c'est le cas. En revanche, si le prix d'achat est plus faible que le prix de vente, on met à jour l'index du prix de vente avec celui de l'achat et on continue à itérer. Pour améliorer le code on peut utiliser le `max` avec best profit et le profit actuel plutôt que le `if`: `best_profit = max(best_profit, prices[sell] - prices[buy])`
