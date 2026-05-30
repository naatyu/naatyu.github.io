---
title: "Trees"
date: 2026-04-28
lastmod: 2026-04-28
tags:
  - algorithms
  - data-structures
  - trees
  - leetcode
draft: false
---

## Summary

Trees are hierarchical data structures consisting of nodes connected by edges. They are the foundation for many complex algorithms, particularly in searching, sorting, and representing hierarchical data (like HTML DOM or File Systems).
## Concepts
- **Binary Tree:** A tree where each node has at most two children (left and right).
- **Binary Search Tree (BST):** A binary tree where the left child is smaller than the parent, and the right child is larger.
- **Balanced Tree:** A tree where the height of the left and right subtrees of any node differs by at most one (e.g., AVL, Red-Black).
- **Traversal:** The process of visiting all nodes in a specific order (DFS or BFS).

## Content

### 1. Python Node Boilerplate
Most LeetCode tree problems use this standard definition:

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
```

### 2. DFS (Depth-First Search)
DFS explores as far as possible along each branch before backtracking. In trees, it is almost always implemented **recursively**.

#### The Three Recursive Orders:
1.  **Pre-order** (Root, Left, Right): Useful for cloning a tree or prefix notation.
2.  **In-order** (Left, Root, Right): **Crucial for BSTs**—visits nodes in non-decreasing order.
3.  **Post-order** (Left, Right, Root): Useful for deleting trees or calculating bottom-up values (like height).

```python
def dfs(root):
    if not root:
        return
    # Pre-order: logic here
    dfs(root.left)
    # In-order: logic here
    dfs(root.right)
    # Post-order: logic here
```

### 3. BFS (Breadth-First Search / Level-Order)
BFS visits nodes level-by-level. It is implemented **iteratively** using a **Queue**.

```python
from collections import deque

def bfs(root):
    if not root:
        return []
    
    queue = deque([root])
    result = []
    
    while queue:
        level_size = len(queue)
        current_level = []
        for _ in range(level_size):
            node = queue.popleft()
            current_level.append(node.val)
            if node.left: queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(current_level)
    return result
```

### 4. Problem Pattern Recognition
When you see a tree problem, look for these signals:

#### A. "Find Depth/Height/Balance"
- **Instinct**: DFS (Post-order).
- **Reason**: You need to know the height of the children *before* you can calculate the height of the parent.

#### B. "Check if valid BST" or "Find K-th Smallest"
- **Instinct**: In-order Traversal.
- **Reason**: In-order traversal of a BST produces a sorted array.

#### C. "Shortest Path" or "Level Sums"
- **Instinct**: BFS.
- **Reason**: BFS naturally explores by distance from the root.

#### D. "Path Sum" or "Root to Leaf"
- **Instinct**: DFS (Pre-order) with state passing.
- **Reason**: You pass the current sum or path down to the children.

### 5. Essential BST Properties
1.  **Search/Insert/Delete**: $O(\log N)$ on average, $O(N)$ if unbalanced.
2.  **Min element**: The leftmost node.
3.  **Max element**: The rightmost node.
4.  **In-order Successor**: Smallest node in the right subtree.

### 6. Mental Shortcut: "The Base Case"
Tree problems are almost always solved by asking:
1.  What is the base case? (usually `if not root: return ...`)
2.  What should I return to my parent?
3.  What should I do at the current node?

## Related
- Binary Search Tree (BST)
- Lowest Common Ancestor (LCA)
- Tree Serialization
- Trie (Prefix Tree)
- Graph Algorithms
