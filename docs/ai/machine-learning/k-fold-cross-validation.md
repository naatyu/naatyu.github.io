---
title: "K-Fold Cross-Validation"
date: 2026-05-05
lastmod: 2026-05-05
tags:
  - ai/machine-learning
  - evaluation
  - validation
draft: false
---

## Summary

K-Fold Cross-Validation is a resampling strategy that splits a dataset into $k$ folds, uses each fold once as the test set, and trains on the remaining $k-1$ folds. It gives a more reliable estimate of model performance than a single train-test split.
## Concepts
- **Fold**: A subset of the dataset used as either train or test in one iteration.
- **Train Split**: All folds except the current test fold.
- **Test Split**: The fold held out for evaluation in the current iteration.
- **Shuffle**: Randomly permuting indices before splitting to reduce ordering bias.
- **Remainder Distribution**: If $n_{samples}$ is not divisible by $k$, the extra samples are assigned to the first folds.

## Content

### 1. Idea
K-Fold Cross-Validation evaluates a model by repeating the train/test split $k$ times.

Each iteration:

- one fold is used as the test set
- the remaining $k-1$ folds are used as the training set

This ensures every sample appears in the test set exactly once.

### 2. Fold Size
If the dataset has $n$ samples and we want $k$ folds, the fold sizes are:

$$
\text{base} = \left\lfloor \frac{n}{k} \right\rfloor
$$

$$
\text{remainder} = n \bmod k
$$

Then:

- the first `remainder` folds get size `base + 1`
- the remaining folds get size `base`

Example:

- $n = 10$
- $k = 3$

Then:

- base size is $3$
- remainder is $1$
- fold sizes become `[4, 3, 3]`

### 3. Why It Is Useful
K-Fold Cross-Validation is useful because it:

- reduces dependence on one random split
- gives a more robust estimate of performance
- uses all samples for both training and validation across the full procedure

### 4. When to Use It
Use K-Fold Cross-Validation when:

- the dataset is not huge
- you want a stable estimate of model quality
- you care about variance introduced by a single split

Use a simple train/validation split when:

- the dataset is very large
- training cost is high
- you only need a quick sanity check

### 5. Implementation Logic
The standard implementation works on indices:

1. create the list of indices from `0` to `n_samples - 1`
2. shuffle the indices if requested
3. split the indices into `k` folds
4. for each fold:
   - use it as the test set
   - concatenate the remaining folds as the train set
5. return the list of `(train_indices, test_indices)` pairs

### 6. Reference Implementation

```python
import numpy as np

def k_fold_cross_validation(n_samples, k=5, shuffle=True):
    if k <= 1:
        raise ValueError("k must be at least 2")
    if n_samples < k:
        raise ValueError("n_samples must be at least k")

    indices = np.arange(n_samples)
    if shuffle:
        np.random.shuffle(indices)

    base_size = n_samples // k
    remainder = n_samples % k

    folds = []
    start = 0
    for fold_idx in range(k):
        fold_size = base_size + (1 if fold_idx < remainder else 0)
        folds.append(indices[start:start + fold_size])
        start += fold_size

    splits = []
    for i in range(k):
        test_indices = folds[i].tolist()
        train_indices = np.concatenate([folds[j] for j in range(k) if j != i]).tolist()
        splits.append((train_indices, test_indices))

    return splits
```

### 7. Example
For:

```python
k_fold_cross_validation(n_samples=10, k=5, shuffle=False)
```

The fold size is `2`, so the output is:

```python
[([2, 3, 4, 5, 6, 7, 8, 9], [0, 1]),
 ([0, 1, 4, 5, 6, 7, 8, 9], [2, 3]),
 ([0, 1, 2, 3, 6, 7, 8, 9], [4, 5]),
 ([0, 1, 2, 3, 4, 5, 8, 9], [6, 7]),
 ([0, 1, 2, 3, 4, 5, 6, 7], [8, 9])]
```

### 8. Notes
- The function returns index splits, not the data itself.
- Returning indices is more memory efficient and works for any dataset type.
- The random seed should be set externally if reproducible shuffling is needed.
- This implementation keeps the original index order when `shuffle=False`.

## Related
- 30 - Atlas/AI/Machine Learning/Support Vector Machines and the Margin
- 30 - Atlas/AI/Deep Learning/Batch size & Learning rate
- 30 - Atlas/AI/Machine Learning/Machine Learning MOC
