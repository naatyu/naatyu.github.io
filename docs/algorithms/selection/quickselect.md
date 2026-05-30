---
title: "Quickselect Algorithm"
date: 2026-04-20
lastmod: 2026-04-28
tags:
  - algorithms
  - sorting
  - selection
  - quicksort
draft: false
---

## Summary

Quickselect is a selection algorithm to find the **k-th smallest (or largest) element** in an unordered list. It is related to the **Quicksort** algorithm but, instead of recursing into both sides of the partition, it only recurses into the side containing the desired index, achieving $O(N)$ average time complexity.
## Concepts
- **Pivot**: An element chosen from the array to partition the data.
- **Partitioning**: Rearranging the array so that all elements less than the pivot are to its left, and all elements greater are to its right.
- **Selection**: Finding a specific order statistic (e.g., the median or the 3rd smallest element).

## How It Works
1. **Pick a pivot** element from the array.
2. **Partition** the array:
   - Elements &lt; pivot move to the left.
   - Elements &gt; pivot move to the right.
   - The pivot is now in its **final sorted position** at index `p`.
3. **Compare**:
   - If `p == k`, we found the element. Return it.
   - If `k &lt; p`, recurse on the **left** subarray.
   - If `k &gt; p`, recurse on the **right** subarray.

## Python Implementation (Lomuto Partition)

```python
import random

def quickselect(nums, k):
    """
    Finds the k-th smallest element (0-indexed).
    To find k-th largest, pass len(nums) - k.
    """
    def partition(left, right, pivot_index):
        pivot_val = nums[pivot_index]
        # 1. Move pivot to the end
        nums[pivot_index], nums[right] = nums[right], nums[pivot_index]
        
        # 2. Move all smaller elements to the left
        store_index = left
        for i in range(left, right):
            if nums[i] < pivot_val:
                nums[store_index], nums[i] = nums[i], nums[store_index]
                store_index += 1
        
        # 3. Move pivot to its final place
        nums[right], nums[store_index] = nums[store_index], nums[right]
        return store_index

    def select(left, right, k_smallest):
        if left == right:
            return nums[left]
        
        # Randomized pivot to avoid O(N^2) worst case
        pivot_index = random.randint(left, right)
        
        # Partition and get the position of the pivot
        pivot_index = partition(left, right, pivot_index)
        
        if k_smallest == pivot_index:
            return nums[k_smallest]
        elif k_smallest < pivot_index:
            return select(left, pivot_index - 1, k_smallest)
        else:
            return select(pivot_index + 1, right, k_smallest)

    return select(0, len(nums) - 1, k)

# Example Usage
arr = [3, 2, 1, 5, 4, 6]
k = 3 # Find the 4th smallest (index 3)
print(f"The {k+1}-th smallest element is: {quickselect(arr, k)}")
```

## Step-by-Step Example
**Task**: Find the 2nd smallest element ($k=1$) in `[3, 2, 1, 5, 4]`.

1. **Initial**: `[3, 2, 1, 5, 4]`, $k=1$.
2. **Pick Pivot**: Assume pivot is `3` (index 0).
3. **Partition**:
   - Elements &lt; 3: `[2, 1]`
   - Elements &gt; 3: `[5, 4]`
   - Array becomes: `[2, 1, 3, 5, 4]`. Pivot `3` is at **index 2**.
4. **Decision**:
   - Target index $k=1$ is less than pivot index $2$.
   - **Recurse Left** on `[2, 1]`.
5. **New Step**: Pick pivot `2`.
   - Partition `[2, 1]` becomes `[1, 2]`. Pivot `2` is at **index 1**.
6. **Done**: Target index $k=1$ equals pivot index $1$. Return `2`.

## Complexity Analysis
- **Time Complexity (Average)**: $O(N)$. On average, we discard half the array at each step ($N + N/2 + N/4 \dots = 2N$).
- **Time Complexity (Worst)**: $O(N^2)$. Occurs when the pivot is consistently the smallest or largest element (e.g., sorted array with poor pivot choice). This is mitigated by **Randomized Quickselect**.
- **Space Complexity**: $O(1)$ (Iterative) or $O(\log N)$ (Recursive stack).

## Related
- Quicksort
- [Heap](/atlas/algorithms/data-structures/heap)
- LeetCode 215 - Kth Largest Element in an Array
- Median of Medians
