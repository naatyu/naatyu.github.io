---
title: "Availability vs Consistency (CAP)"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - cs/system-design
  - interview
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **CAP Theorem:** states that a distributed system can only provide two of three guarantees: Consistency, Availability, and Partition tolerance.
- **Consistency:** every read receives the most recent write or an error.
- **Availability:** every request receives a response, without guarantee that it contains the most recent version.
- **Partition Tolerance:** the system continues to operate despite arbitrary partitioning due to network failures.
- **Eventual Consistency:** a consistency model that guarantees that if no new updates are made, eventually all accesses will return the last updated value.

In a distributed system we can only support two of the following guaranteed:
- Consistency - every read receives the most recent write or an error
- Availability - every request receives a response, without guarantee that it contains the most recent version of the information
- Partition tolerance - the system continues to operate despite arbitrary partitioning due to network failures

This is the CAP theorem. 

**CP - consistency and partition tolerance**
Waiting for a response from the partitioned node might result in a timeout error. CP is a good choice if we require atomic reads and writes (atomic operations are guaranteed to either complete entirely or not happen at all, there is no in between).

**AP - availability and partition tolerance**
Responses return the most readily available version of the data available on any node, which might not be the latest. Writes may also takes time to propagate. AP is a good choice if we need to allow for eventual consistency (doesn't guarantee immediate visibility of a write across all replicas) or when the system needs to continue working despite internal errors. 

**AC - availability and consistency**
Systems must be online and provide most up-to-date data across all nodes. This is in the price of no data partitions. If a data partition occurs, the system will become unavailable in the affected segments. This systems are usually not chosen for large-scale, fault-tolerant distributes applications.
