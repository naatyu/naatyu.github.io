---
title: "Tries"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 8
tags:
  - algorithms
  - neetcode
  - trie
  - strings
  - leetcode
draft: false
---

## Summary

A trie stores strings by shared prefixes. Search time depends on word length rather than the number of stored words, making tries useful when prefix queries or character-by-character branching are central to the problem.

## Recognition signals

- repeated prefix searches
- autocomplete or dictionary lookup
- many words sharing prefixes
- wildcard characters
- searching a board against a large dictionary
- replacing words with their shortest known root

## Core structure

```python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_word = False


class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root

        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]

        node.is_word = True

    def search(self, word):
        node = self._find_node(word)
        return node is not None and node.is_word

    def starts_with(self, prefix):
        return self._find_node(prefix) is not None

    def _find_node(self, text):
        node = self.root

        for char in text:
            if char not in node.children:
                return None
            node = node.children[char]

        return node
```

`is_word` is necessary because a path can represent a prefix without representing a complete inserted word.

## Core patterns

### 1. Prefix lookup

Walking a prefix returns the trie node representing all words below that prefix. From there, DFS can enumerate completions.

### 2. Wildcard search

For an ordinary character, follow one edge. For `.`, branch into every child.

```python
def wildcard_search(root, word):
    def dfs(index, node):
        if index == len(word):
            return node.is_word

        char = word[index]

        if char == ".":
            return any(dfs(index + 1, child)
                       for child in node.children.values())

        if char not in node.children:
            return False

        return dfs(index + 1, node.children[char])

    return dfs(0, root)
```

The wildcard can make worst-case search exponential in word length because it explores multiple branches.

### 3. Trie plus board backtracking

For Word Search II:

1. insert all dictionary words into a trie
2. start DFS from each board cell
3. follow only characters present in the current trie node
4. emit a word when reaching a terminal node
5. mark the board cell as visited and restore it afterward

The trie prunes searches as soon as the current path is not a prefix of any word.

### 4. Store useful terminal metadata

Instead of reconstructing words, a terminal node can store:

- the complete word
- an identifier
- a frequency
- the best candidate for that prefix

## Complexity

For word length `L`:

- insert: $O(L)$
- exact search: $O(L)$
- prefix search: $O(L)$
- memory: proportional to the number of stored prefix nodes

Hash-map children save space for sparse alphabets. Fixed arrays can be faster for small known alphabets.

## Common mistakes

- forgetting `is_word`
- returning true for a prefix during exact search
- creating nodes during a read-only lookup
- failing to restore visited board cells
- exploring the board before checking the trie edge
- storing full strings at every node unnecessarily

## Practice progression

1. Implement Trie
2. Design Add and Search Words Data Structure
3. Replace Words
4. Word Search II

The key mental model is that a trie is a search-state compressor: all words with the same prefix share the same work.
