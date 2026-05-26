---
title: "21 - Merge Two Sorted Lists"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **Linked List:** a data structure where each element points to the next, allowing for efficient insertions and deletions.
- **Dummy Node:** a placeholder node used to simplify linked list operations, particularly at the head of the list.

You are given the heads of two sorted linked lists `list1` and `list2`.

Merge the two lists into one **sorted** list. The list should be made by splicing together the nodes of the first two lists.

Return _the head of the merged linked list_.

**Example 1:**

![](https://assets.leetcode.com/uploads/2020/10/03/merge_ex1.jpg)

**Input:** ``list1 = [1,2,4], list2 = [1,3,4]``
**Output:** ``[1,1,2,3,4,4]``

**Example 2:**

**Input:** ``list1 = [], list2 = []``
**Output:** ``[]``

**Example 3:**

**Input:** ``list1 = [], list2 = [0]``
**Output:** ``[0]``

## Solution

Première solution avec aide:
```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeTwoLists(
        self, list1: Optional[ListNode], list2: Optional[ListNode]
    ) -> Optional[ListNode]:
        dummy = ListNode()
        tail = dummy
        while list1 and list2:
            print(tail)
            if list1.val >= list2.val:
                tail.next = list2
                list2 = list2.next
            else:
                tail.next = list1
                list1 = list1.next
            tail = tail.next

        if list1:
            tail.next = list1
        else:
            tail.next = list2

        return dummy.next
```
Linked list : `ListNode\{val: 1, next: ListNode\{val: 3, next: ListNode\{val: 4, next: None\}\}\}`, le next représente la suite la liste. L'idée est donc de comparer la valeur entre l1 et l2 puis on met à jour le next de notre list de départ par la liste qui a la valeur la plus petite. Des que l'une des deux listes vaut ``None`` il suffit de donner comme next la liste pas encore vide.
Ici de la façon dont c'est référencé en python, on a dummy qui est la référence vers la tête de la liste et tail le dernier element. Donc même si tail avance dans la liste, ca continue de mettre à jour dummy.
