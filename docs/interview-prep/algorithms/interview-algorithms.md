---
title: "Interview Algorithms"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **Binary Search:** a logarithmic search algorithm that repeatedly halves the search interval.
- **DFS (Depth-First Search):** a traversal algorithm that explores branches as deeply as possible before backtracking.
- **BFS (Breadth-First Search):** a traversal algorithm that explores all nodes at a given level before moving deeper.
- **Insertion Sort:** a simple sorting algorithm that builds a sorted list one element at a time.
- **Merge Sort:** a divide-and-conquer sorting algorithm that merges smaller sorted lists.
- **Quick Sort:** a fast sorting algorithm that partitions an array around a pivot element.

[Top 7 Algorithms for Coding Interviews Explained SIMPLY (youtube.com)](https://www.youtube.com/watch?v=kp3fCihUXEg&t=48s)

# Search algorithms
## 1 - Binary search

Search algorithm to find a specific element in a sorted list. The algorithm time complexity is $O(log(n))$ and space complexity is $O(1)$.
We take the middle of the initial array and compare it with the value. If it is lower than middle then the value is in the first half of the array, otherwise it is in the second half. Then we do this again with the half where the array is only 2 numbers and return the correct one.
![Interview Algorithms 01](/attachments/computer-science/algorithms/interview-algorithms/interview-algorithms-01.png)
## 2 - Depth-First search

Algorithm to search in graphs and trees, time complexity is $O(V+E)$ where $V$ is the vertices/nodes and $E$ is the edges/branches, the space complexity is $O(V)$. In depth-first search, we want to start from the root node and go down as much as possible in one branch all the way to the end. When the end is reached we go back to an unvisited branch and go down to that one until we reach the end.
![Interview Algorithms 02](/attachments/computer-science/algorithms/interview-algorithms/interview-algorithms-02.gif)
A real life example of this algorithm is to solve a maze. 

## 3 - Breadth-First search

BFS is the counter part of DFS. The time complexity is also $O(V+E)$ and space complexity is $O(V)$. Instead of going down one branch as deep as possible, we first explore all possible nodes at one level. 
![Interview Algorithms 03](/attachments/computer-science/algorithms/interview-algorithms/interview-algorithms-03.gif)
A real life example of BFS is chess algorithms. 

# Sorting algorithms
## 1 - Insertion sort

The algorithm start by comparing the first element of the list with second. If the first element is higher than the second element then they are swapped. Then you continue to compare the 2nd and 3rd element and apply the swapping if the condition is met. If the element swapped in 2nd position is also smaller than first position, swap it one more time. This is the insertion sort. Since this algorithm is really easy, time complexity is in best case $O(n)$ and in worst case $O(n^2)$ and space complexity is $O(1)$. This algorithm is useful for list almost already sorted.
![Insertion sort example](/attachments/computer-science/algorithms/interview-algorithms/insertion-sort-example.gif)

## 2 - Merge sort

Merge sort is a sorting algorithm that fall into the divide and conquer type of algorithm (break the initial problem into smaller problems). This is a recursive algorithm. The algorithm start to split the array in half and split sub arrays until all arrays contains only pairs. Then all pairs of arrays compare the values and smaller value is put to the left and higher value to the right of the array. All pairs are sorted. Then pairs are merged with another pair and all values are put in the bigger array by adding in value order. This is done until sub arrays are merged. The time complexity is $O(n log(n))$ and space complexity is $O(n)$. Compare to insertion sort, merge sort is better for larger and unsorted arrays since time complexity is the same for all cases. 
![Merge sort example 300px](/attachments/computer-science/algorithms/interview-algorithms/merge-sort-example-300px.gif)

## 3 - Quick sort

Like merge sort, quick sort is a divide and conquer algorithm (also recursive). The algorithm start by choosing a pivot number ideally as close to the median of the list as possible. Then the pivot is moved at the end of the list and we set a starting pointer at the beginning of the array and an end pointer at the last number of the array before the pivot. The left pointer goes up and the right pointer goes down. If the left element is higher than the pivot and the right element is less than the pivot then the two elements are swapped. This is done until the two pointers meet, and then the pivot is back in place. We actually repeat this process on the sub lists created with the pivot. At the end, all sub lists are sorted. The time complexity is $O(nlog(n))$ in best case scenario and $O(n^2)$ in worst case scenario. The space complexity is $O(log(n))$ in best case and $O(n)$ in worst case scenario. 
![Hermes quicksort](/attachments/computer-science/algorithms/interview-algorithms/hermes-quicksort.webp)
The complexity looks worse than the previous algorithms, but in average, this is the fastest of all 3. This is thanks to inner loop optimization and this give a 2 to 3 times faster algorithm than merge sort. The space complexity is also better than merge sort. But all of this is base on quicksort being well optimized (no mistakes must be made). 

# Greedy algorithms

Greedy algorithms are algorithms that make the most optimal choice at every local decision point. They don't look much in the future, only what is the best next choice given the current situation. 

## 1 - When not to use greedy 

Greedy algorithms are not used for efficiency since they don't look at all every possible solutions. 
![Interview Algorithms 07](/attachments/computer-science/algorithms/interview-algorithms/interview-algorithms-07.png)
In this exemple the greedy algorithm choose the path with 16 dollars but the most efficient is the one with 3 dollars. The greedy algorithm can not reach this solution since it make only local decisions. 

## 2 - When to use greedy algorithm

Generally greedy algorithms are used when the number of possibilities is way to high even fort modern computers. For exemple imagine the previous exemples but with $2e64$ possible outcomes. This is way too much even for DFS or BFS. This is where greedy algorithms are used. The most famous problem is the travelling salesman.
