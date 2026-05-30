---
title: "Consistency Patterns"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - cs/system-design
  - interview
draft: false
---

## Summary

Consistency patterns define the degree of data synchronization across replicas in a distributed system, governing the critical tradeoff between data accuracy, system availability, and request latency.
## Concepts
- **Strong Consistency:** Guarantees that every read operation returns the most recent write. Achieved through synchronous replication and locking, which increases latency and reduces availability during partitions.
- **Eventual Consistency:** A model where all replicas will eventually converge to the same value if no new updates are made. Favors high availability and low latency (e.g., DNS, Amazon DynamoDB).
- **Weak Consistency:** Subsequent reads may or may not see the most recent write. Commonly used in real-time systems like VoIP or online gaming where outdated data is preferable to high latency.
- **Read-Your-Writes Consistency:** A guarantee that a process will always see its own updates immediately, even if they haven't propagated globally.
- **Causal Consistency:** Ensures that operations that are causally related are seen in the same order by all nodes (e.g., a comment and its reply).
- **Quorum Consensus (R + W &gt; N):** A mathematical rule for distributed systems where $N$ is the number of replicas, $W$ is the write quorum, and $R$ is the read quorum. If $R + W > N$, the system guarantees strong consistency.
- **Sloppy Quorum:** A technique used in eventually consistent systems where the first $W$ healthy servers on a hash ring are used for writes, even if they aren't the primary replicas, to ensure high availability.
- **Anti-Entropy Protocol:** A background process (often using Merkle trees) that compares and synchronizes data across replicas to resolve inconsistencies.

## Strategic Models and Trade-offs

### 1. Strong Consistency
In this model, any read from any node is guaranteed to be the most up-to-date.
- **Mechanism**: Synchronous replication. The write is only acknowledged after all replicas (or a majority) have confirmed the update.
- **Pros**: Simplifies application logic; data is always accurate.
- **Cons**: High latency for writes; system becomes unavailable if too many nodes fail or a network partition occurs (ref: [Availability vs Consistency (CAP)](/atlas/systems/distributed-systems/availability-vs-consistency-cap)).

### 2. Eventual Consistency
The system prioritizes availability. Updates are propagated asynchronously.
- **Mechanism**: Asynchronous replication. The master node acknowledges the write immediately and pushes updates to slaves in the background.
- **Pros**: Low latency; highly resilient to node failures.
- **Cons**: "Stale reads" can occur; requires conflict resolution (e.g., Vector Clocks, Last-Write-Wins).

### 3. Consistency vs. Latency (PACELC)
While CAP theorem describes system behavior under partitions, the **PACELC** theorem extends it:
- If there is a **P**artition, the system faces a tradeoff between **A**vailability and **C**onsistency.
- **E**lse (no partition), the system faces a tradeoff between **L**atency and **C**onsistency.

## Quorum Configuration Examples
For a cluster of $N = 3$ nodes:
- **Fast Reads ($R=1, W=3$)**: Highly available for reads, but writes are slow and vulnerable to any single node failure.
- **Fast Writes ($W=1, R=3$)**: Highly available for writes, but reads are slow and expensive.
- **Balanced Strong Consistency ($W=2, R=2$)**: Traditional quorum where any read is guaranteed to see the latest write because $2+2 > 3$.

---
## Related
- [Availability patterns](/atlas/systems/distributed-systems/availability-patterns)
- [Availability vs Consistency (CAP)](/atlas/systems/distributed-systems/availability-vs-consistency-cap)
- [Database Sharding](/atlas/systems/distributed-systems/database-sharding)
- System Design MOC
