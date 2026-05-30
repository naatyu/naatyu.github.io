---
title: "1046 - Last Stone Weight"
date: 2026-04-20
lastmod: 2026-04-25
tags:
  - leetcode
  - algorithms
  - heap
  - greedy
draft: false
---

## Summary

Le problème consiste à simuler un jeu où l'on fracasse répétitivement les deux pierres les plus lourdes d'un ensemble jusqu'à ce qu'il n'en reste qu'une (ou aucune), ce qui se résout efficacement avec un **Max-Heap**.
## Concepts
- **Max-Heap (Tas-Max):** une structure de données de type arbre qui permet de récupérer l'élément maximal en $O(1)$ et de l'extraire en $O(\log N)$.
- **Priority Queue:** une file d'attente où chaque élément a une priorité, souvent implémentée avec un tas (heap).
- **Greedy (Glouton):** une stratégie qui fait le meilleur choix local à chaque étape (ici, prendre les deux plus grosses pierres).

## Description
On vous donne un tableau d'entiers `stones` où `stones[i]` est le poids de la $i$-ème pierre.
À chaque tour, nous choisissons les deux pierres les plus lourdes $x$ et $y$ (avec $x \le y$) et nous les fracassons :
- Si $x == y$, les deux pierres sont détruites.
- Si $x \neq y$, la pierre $x$ est détruite et la pierre $y$ prend le nouveau poids $y - x$.

À la fin du jeu, il reste au plus une pierre. Retournez son poids, ou 0 s'il n'en reste aucune.

**Exemple 1:**
**Input:** `stones = [2,7,4,1,8,1]`
**Output:** `1`
**Explication:** 
- On combine 7 et 8 $\rightarrow$ reste 1. Pierres : `[2,4,1,1,1]`
- On combine 2 et 4 $\rightarrow$ reste 2. Pierres : `[2,1,1,1]`
- On combine 2 et 1 $\rightarrow$ reste 1. Pierres : `[1,1,1]`
- On combine 1 et 1 $\rightarrow$ reste 0. Pierre : `[1]`
- Résultat final : 1.

## Solution

La solution optimale utilise une **file de priorité (heap)**. En Python, le module `heapq` implémente un **min-heap**. Pour simuler un **max-heap**, on multiplie tous les poids par -1.

```python
import heapq

class Solution:
    def lastStoneWeight(self, stones: List[int]) -> int:
        # On transforme la liste en max-heap en inversant les signes
        # heapq.heapify est en O(N)
        max_heap = [-s for s in stones]
        heapq.heapify(max_heap)
        
        # Tant qu'il y a plus d'une pierre
        while len(max_heap) > 1:
            # On extrait les deux plus lourdes (O(log N))
            stone1 = -heapq.heappop(max_heap)
            stone2 = -heapq.heappop(max_heap)
            
            if stone1 != stone2:
                # Si elles sont différentes, on rajoute la différence
                heapq.heappush(max_heap, -(stone1 - stone2))
        
        # S'il reste une pierre, on la retourne (en inversant le signe), sinon 0
        return -max_heap[0] if max_heap else 0
```

### Analyse de Complexité
- **Time Complexity**: $O(N \log N)$. 
    - La construction du tas (`heapify`) prend $O(N)$.
    - La boucle s'exécute $N-1$ fois au maximum.
    - Chaque opération `heappop` et `heappush` prend $O(\log N)$.
- **Space Complexity**: $O(N)$ pour stocker les éléments dans le tas (ou $O(1)$ si on modifie la liste d'entrée sur place, mais en Python on crée souvent une nouvelle liste pour les signes inversés).

## Pattern Recognition
Ce problème doit faire penser à un **max-heap** presque immédiatement.

Signal principal: à chaque étape, on a besoin des **deux plus grandes** pierres, puis on réinsère potentiellement un nouveau poids et on recommence.

Sans heap:
- soit on trie à nouveau après chaque opération
- soit on rescane le tableau pour retrouver les maximums

Avec un heap:
- extraction du plus grand en $O(\log N)$
- insertion du nouveau poids en $O(\log N)$
- accès naturel au "prochain meilleur candidat"

## Pourquoi le Heap ?
Sans tas, on devrait trier le tableau à chaque tour ($O(N^2 \log N)$) ou chercher les deux max manuellement à chaque tour ($O(N^2)$). Le tas permet de maintenir l'ordre partiel nécessaire pour extraire les maximums de manière très efficace.

## Related
- [Priority Queues](/atlas/algorithms/data-structures/priority-queues)
- [Heap](/atlas/algorithms/data-structures/heap)
- [Top K Pattern](/atlas/algorithms/patterns/top-k-pattern)
- Heapsort
- LeetCode 215 - Kth Largest Element in an Array
