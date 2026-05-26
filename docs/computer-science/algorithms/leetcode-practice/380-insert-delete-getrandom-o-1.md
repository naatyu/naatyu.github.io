---
title: "380 - Insert Delete GetRandom O(1)"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **Hash Map:** a data structure that provides $O(1)$ average time complexity for search, insert, and delete operations.
- **Dynamic Array:** a contiguous block of memory that can grow in size, allowing $O(1)$ access to elements by index.

Implement the `RandomizedSet` class:

- `RandomizedSet()` Initializes the `RandomizedSet` object.
- `bool insert(int val)` Inserts an item `val` into the set if not present. Returns `true` if the item was not present, `false` otherwise.
- `bool remove(int val)` Removes an item `val` from the set if present. Returns `true` if the item was present, `false` otherwise.
- `int getRandom()` Returns a random element from the current set of elements (it's guaranteed that at least one element exists when this method is called). Each element must have the **same probability** of being returned.

You must implement the functions of the class such that each function works in **average** `O(1)` time complexity.

**Example 1:**

**Input**
``["RandomizedSet", "insert", "remove", "insert", "getRandom", "remove", "insert", "getRandom"]
[[], [1], [2], [2], [], [1], [2], []]``
**Output**
``[null, true, false, true, 2, true, false, 2]``

**Explanation**
``RandomizedSet randomizedSet = new RandomizedSet();``
``randomizedSet.insert(1); // Inserts 1 to the set. Returns true as 1 was inserted successfully.``
``randomizedSet.remove(2); // Returns false as 2 does not exist in the set.``
``randomizedSet.insert(2); // Inserts 2 to the set, returns true. Set now contains [1,2].``
``randomizedSet.getRandom(); // getRandom() should return either 1 or 2 randomly.``
``randomizedSet.remove(1); // Removes 1 from the set, returns true. Set now contains [2].``
``randomizedSet.insert(2); // 2 was already in the set, so return false.``
``randomizedSet.getRandom(); // Since 2 is the only number in the set, getRandom() will always return 2.``

## Solution

La plus part de la solution provient du fait d'utiliser une hashmap. Pour le insert et delete c'est assez facile mais le `GetRandom`, il faut être un peu plus malin. Pour cela dans la hash map on met la valeur ainsi que sont index par rapport a une liste que l'on garde de côté. Ainsi quand on veut get un random il suffit de faire un `random.choice`, déjà inclut dans python. Il faut bien gérer l'insert et surtout le delete. La strat pour rester en $O(1)$ est de remplacer la valeur que l'on souhaite supprimer par la derniere valeur de la liste. Récupérer l'index de la valeur que l'on veut supprimer est en $O(1)$ grace a la hashmap on il suffit de l'écraser et une fois cela fait on peut pop la liste pour supprimer la dernier valeur afin d'éviter le double. Ne pas oublier de mettre à jour l'index dans la hashmap.
```python
class RandomizedSet:
    def __init__(self):
        self.hashmap = {}
        self.numList = []

    def insert(self, val: int) -> bool:
        if val in self.hashmap.keys():
            return False
        else:
            self.hashmap[val] = len(self.numList)
            self.numList.append(val)
            return True

    def remove(self, val: int) -> bool:
        if val not in self.hashmap.keys():
            return False
        else:
            idx = self.hashmap[val]
            lastVal = self.numList[-1]
            self.numList[idx] = lastVal
            self.numList.pop()
            self.hashmap[lastVal] = idx
            del self.hashmap[val]
            return True

    def getRandom(self) -> int:
        return random.choice(self.numList)
```
