---
title: "Intervals"
date: 2026-07-24
lastmod: 2026-07-24
sidebar_position: 13
tags:
  - algorithms
  - neetcode
  - intervals
  - sorting
  - leetcode
draft: false
---

## Summary

Interval problems become manageable after imposing an order. Sorting by start time or end time turns arbitrary overlaps into local comparisons with the current frontier.

## Recognition signals

- meetings, bookings, ranges, or time windows
- overlapping segments
- insert, merge, remove, or count intervals
- maximum simultaneous events
- minimum resources needed for schedules

## Basic relations

For intervals `[a, b]` and `[c, d]`:

- they overlap when `max(a, c) <= min(b, d)` for closed intervals
- they are disjoint when `b < c` or `d < a`

Check whether the problem treats touching endpoints as overlapping. Meeting intervals often use half-open semantics where one meeting ending at time `t` does not overlap another starting at `t`.

## Core patterns

### 1. Sort and merge

```python
def merge_intervals(intervals):
    intervals.sort(key=lambda interval: interval[0])
    merged = []

    for start, end in intervals:
        if not merged or start > merged[-1][1]:
            merged.append([start, end])
        else:
            merged[-1][1] = max(merged[-1][1], end)

    return merged
```

Invariant: `merged` is sorted, contains no overlaps, and represents every processed interval.

Only the last merged interval can overlap the next interval because starts are sorted.

### 2. Insert into sorted disjoint intervals

Process three phases:

1. append intervals completely before the new interval
2. merge every overlapping interval into the new interval
3. append intervals completely after it

This runs in $O(n)$ because the input is already ordered and disjoint.

### 3. Remove overlaps greedily

To keep the maximum number of non-overlapping intervals, sort by end time and keep the interval that finishes earliest.

When two intervals overlap, discarding the one with the later end leaves more room for future intervals.

### 4. Meeting rooms with a min-heap

Sort meetings by start time. Keep active meeting end times in a min-heap.

- remove meetings that have ended
- add the current meeting's end
- maximum heap size is the required number of rooms

### 5. Sweep line

Convert intervals into events:

- `+1` at a start
- `-1` at an end

Sort the events and accumulate the active count. Tie-breaking at equal coordinates depends on endpoint semantics.

An ordered map or prefix-sum array can replace explicit event sorting when coordinates are bounded.

## Choosing the sort key

- sort by start: merging and chronological scanning
- sort by end: maximizing compatible intervals
- sort events: active-overlap counts

The sort key should make the next decision depend only on the current frontier.

## Complexity

Most interval problems cost:

- sorting: $O(n \log n)$
- scan: $O(n)$
- total: $O(n \log n)$

## Common mistakes

- ignoring whether endpoints are closed or half-open
- comparing only against the original interval instead of the expanding merged interval
- sorting by start when a greedy proof requires earliest end
- using quadratic pairwise overlap checks
- processing end events after start events when equal timestamps should not overlap
- mutating caller-owned intervals unexpectedly

## Practice progression

1. Insert Interval
2. Merge Intervals
3. Non-overlapping Intervals
4. Meeting Rooms
5. Meeting Rooms II
6. Minimum Interval to Include Each Query
