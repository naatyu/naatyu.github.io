---
title: "Trees"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 7
tags:
  - algorithms
  - neetcode
  - trees
  - dfs
  - bfs
  - leetcode
draft: false
---

## Summary

Tree problems are recursive by structure: every child is the root of a smaller tree. The essential skill is deciding what information a subtree should return to its parent and whether nodes must be processed top-down, bottom-up, or level by level.

## Recognition signals

- hierarchical nodes with no cycles
- paths from a root to descendants
- depth, height, balance, or diameter
- ancestor relationships
- binary-search-tree ordering
- level-by-level output

## Core patterns

### 1. Recursive DFS

Use the call contract:

> `dfs(node)` returns everything the parent needs to know about the subtree rooted at `node`.

```python
def max_depth(root):
    if not root:
        return 0

    left_depth = max_depth(root.left)
    right_depth = max_depth(root.right)

    return 1 + max(left_depth, right_depth)
```

The base case must return the neutral value expected by the parent.

Traversal order depends on when work is done:

- preorder: process node before children
- inorder: process between left and right
- postorder: process after both children

### 2. Bottom-up aggregation

Height, balance, and diameter depend on child results. Compute both subtrees, update a global or nonlocal answer if needed, and return a smaller summary upward.

```python
def diameter_of_binary_tree(root):
    diameter = 0

    def height(node):
        nonlocal diameter
        if not node:
            return 0

        left = height(node.left)
        right = height(node.right)
        diameter = max(diameter, left + right)

        return 1 + max(left, right)

    height(root)
    return diameter
```

Distinguish:

- value returned to the parent
- final answer updated at the current node

### 3. Top-down state

Some problems need information from ancestors, such as the maximum value seen on the current path.

```python
def count_good_nodes(root):
    def dfs(node, path_max):
        if not node:
            return 0

        is_good = int(node.val >= path_max)
        next_max = max(path_max, node.val)

        return (
            is_good
            + dfs(node.left, next_max)
            + dfs(node.right, next_max)
        )

    return dfs(root, root.val) if root else 0
```

### 4. BFS by level

Use a queue when distance from the root or level grouping matters.

```python
from collections import deque

def level_order(root):
    if not root:
        return []

    queue = deque([root])
    result = []

    while queue:
        level = []

        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)

            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)

        result.append(level)

    return result
```

### 5. BST invariants

In a binary search tree:

- every value in the left subtree is below an upper bound
- every value in the right subtree is above a lower bound
- inorder traversal produces sorted values

Validate with bounds, not only by comparing a node with its direct children.

### 6. Lowest common ancestor

In a general binary tree, if one target is found in each side, the current node is the LCA. In a BST, ordering tells which branch contains both targets.

## Complexity

Most traversals visit each node once:

- time: $O(n)$
- recursive space: $O(h)$, where `h` is tree height
- BFS space: $O(w)$, where `w` is maximum width

A skewed tree has height $O(n)$.

## Common mistakes

- confusing node depth, subtree height, and number of edges
- validating a BST using only parent-child comparisons
- using shared mutable state without resetting it
- returning the global answer instead of the subtree summary
- forgetting the empty-tree case
- assuming recursion uses constant space

## Practice progression

1. Invert Binary Tree
2. Maximum Depth of Binary Tree
3. Diameter of Binary Tree
4. Balanced Binary Tree
5. Binary Tree Level Order Traversal
6. Validate Binary Search Tree
7. Kth Smallest Element in a BST
8. Lowest Common Ancestor
9. Binary Tree Maximum Path Sum
10. Serialize and Deserialize Binary Tree

## Related

- [Trees](/atlas/algorithms/data-structures/trees)
