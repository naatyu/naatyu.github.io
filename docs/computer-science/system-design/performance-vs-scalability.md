---
title: "Performance vs. Scalability"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - cs/system-design
  - interview
draft: false
---

## Summary

Performance is a measure of system speed and resource efficiency for a single task, whereas scalability is the ability of the system to maintain that performance (or improve it proportionally) as both the overall workload and available resources increase.
## Concepts
- **Performance:** The efficiency of a system in terms of latency, throughput, and resource utilization (CPU, memory, disk I/O) for a specific workload. A performance problem means the system is "slow" even for a single user.
- **Scalability:** The measure of a system's ability to handle increasing load by adding resources proportionally. A scalability problem means the system is "fast" for one user but "slows down" as concurrency increases.
- **Latency:** The time required to process a single unit of work (e.g., milliseconds per request).
- **Throughput:** The volume of work processed per unit of time (e.g., Queries Per Second, QPS).
- **Heterogeneity:** The challenge of managing nodes of varying hardware generations and capabilities within a single horizontally scaled cluster.
- **Saturation Point:** The load level at which a system's resources (CPU, Disk, Network) are fully utilized and latency begins to increase exponentially as requests queue up.

## Strategic Comparison

### Identifying the Bottleneck
An engineer must distinguish between a **performance issue** and a **scalability issue** to apply the correct fix:
- **Performance Issue**: "The search query takes 5 seconds for every user."
  - **Fix**: Code optimization, indexing, caching, or upgrading to faster hardware (Vertical Scaling).
- **Scalability Issue**: "The search query takes 100ms for one user, but 10 seconds when 1,000 users are online."
  - **Fix**: Load balancing, database sharding, or adding more server nodes (Horizontal Scaling).

### The "Always-On" Constraint
A service is truly scalable if:
1. Adding resources results in a proportional increase in performance (Throughput).
2. Adding resources for redundancy (High Availability) does not degrade performance.

| Feature | Performance Optimization | Scalability Architecture |
| :--- | :--- | :--- |
| **Focus** | Speed / Efficiency | Capacity / Growth |
| **Typical Goal** | Reduce Latency (ms) | Increase Throughput (QPS) |
| **Techniques** | Profiling, Algorithms, Caching | Sharding, Load Balancing, Statelessness |
| **Hardware** | SOTA (State of the Art) CPU/RAM | Commodity Hardware Clusters |

## Best Practices
- **Optimize before Scaling**: Fixing an inefficient $O(n^2)$ algorithm (performance) is often cheaper and more effective than adding 10 servers to handle the load (scalability).
- **Monitor the Tail**: Use p95 and p99 latency to identify performance regressions that only appear under load (scalability issues).
- **Design for Statelessness**: Even if a system is currently fast, ensure it is designed to be stateless to allow for future horizontal scaling.

---
## Related
- [Scalability](/atlas/computer-science/system-design/scalability)
- [Latency vs Throughput](/atlas/computer-science/system-design/latency-vs-throughput)
- System Design MOC
