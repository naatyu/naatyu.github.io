---
title: "Law of Total Probability"
date: 2026-04-10
lastmod: 2026-04-10
tags:
  - math/probability
  - theory
draft: false
---

## Summary

A fundamental rule in probability theory that relates marginal probabilities to conditional probabilities by partitioning the sample space.
## Concepts
- **Partition:** A set of mutually exclusive and collectively exhaustive events $\{B_1, B_2, \dots, B_n\}$ such that their union is the entire sample space.
- **Conditional Probability:** The probability of an event $A$ given that event $B$ has occurred, denoted $P(A|B)$.
- **Marginal Probability:** The probability of an event irrespective of the outcome of other variables.

## Content

### The Rule
If $\{B_n : n = 1, 2, 3, \dots\}$ is a partition of the sample space, then for any event $A$:

$$P(A) = \sum_{n} P(A | B_n) P(B_n)$$

This formula is derived from the definition of conditional probability ($P(A \cap B) = P(A|B)P(B)$) and the fact that $A = \bigcup_n (A \cap B_n)$ for a partition $\{B_n\}$.

### Intuition
The Law of Total Probability allows us to calculate the probability of a complex event $A$ by "weighting" its probability in different scenarios ($B_n$) by the likelihood of those scenarios occurring. It is essentially a "weighted average" of conditional probabilities.

### Example: Diagnostic Test
Imagine a population where 1% of people have a disease ($D$). A test is 99% accurate for those with the disease ($T|D$) and has a 2% false positive rate for those without it ($T|\neg D$). What is the probability that a random person tests positive ($P(T)$)?

Using the Law of Total Probability:
- $P(D) = 0.01$
- $P(\neg D) = 0.99$
- $P(T|D) = 0.99$
- $P(T|\neg D) = 0.02$

$$P(T) = P(T|D)P(D) + P(T|\neg D)P(\neg D)$$
$$P(T) = (0.99 \times 0.01) + (0.02 \times 0.99)$$
$$P(T) = 0.0099 + 0.0198 = 0.0297$$

### Relationship to Bayes' Theorem
The Law of Total Probability is often used as the denominator in Bayes' Theorem to normalize the posterior probability.

## Related
- Mathematics MOC
- Probability MOC
- Bayes' Theorem
- Conditional Probability
