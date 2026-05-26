---
title: "Latency vs. Throughput"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - cs/system-design
  - interview
draft: false
---

## Summary

Latency is the time delay for a single request/response cycle, whereas throughput measures the volume of work processed in a given time period; high-performance systems aim for maximal throughput within acceptable latency bounds.
## Concepts
- **Latency (RTT):** The total time from when a request is sent until the response is received (Round Trip Time). Measured in milliseconds (ms).
- **Throughput (QPS/TPS):** The number of successful requests or operations a system can handle per unit of time (e.g., Queries Per Second, Transactions Per Second).
- **Bandwidth:** The maximum theoretical capacity of a communication channel to transfer data.
- **Tail Latency (p99):** The latency experienced by the worst 1% of users. Critical for user experience in distributed systems where one slow service (long tail) can delay the entire response.
- **Little's Law:** A fundamental queuing theory principle: $L = \lambda W$, where $L$ is the number of items in the system, $\lambda$ is the arrival rate (throughput), and $W$ is the wait time (latency).
- **Jitter:** The variation in latency over time, which can disrupt real-time communication or media streaming.
- **90th/95th/99th Percentile:** Metrics used to represent the distribution of latency. p99 means 99% of requests are faster than this value.

## Strategic Trade-offs

### The Relationship
In a well-balanced system, increasing throughput initially has little effect on latency. However, as the system reaches its capacity limit (saturation point), queues begin to form, causing latency to increase exponentially.
- **Goal**: Maximize throughput while keeping p99 latency within the Service Level Agreement (SLA).

### Optimization Strategies
| Focus | Optimization Technique |
| :--- | :--- |
| **Low Latency** | Use in-memory caches (Redis), edge computing (CDNs), and protocol optimizations (HTTP/3, gRPC). |
| **High Throughput** | Use message queues for asynchronous processing, batching requests, and horizontal scaling. |

### Real-world Examples
- **Memory vs. Disk**: Accessing memory is high throughput and low latency. Accessing disk is low throughput and high latency.
- **Batching**: Sending 100 small messages individually (Low latency for the first message) vs. Sending them in one batch (High throughput, but higher latency for individual messages).

## Back-of-the-Envelope Estimations
Senior engineers use these numbers to evaluate if a design is feasible:
- **L1 Cache reference**: 0.5 ns
- **Main memory reference**: 100 ns
- **Compress 1K bytes with Zippy**: 3,000 ns
- **Send 2K bytes over 1 Gbps network**: 20,000 ns
- **Read 1 MB sequentially from memory**: 250,000 ns
- **Round trip within same datacenter**: 500,000 ns
- **Disk seek**: 10,000,000 ns
- **Read 1 MB sequentially from disk**: 20,000,000 ns
- **Send packet CA-&gt;Netherlands-&gt;CA**: 150,000,000 ns

---
## Related
- [Scalability](/atlas/computer-science/system-design/scalability)
- [Content delivery network](/atlas/computer-science/system-design/content-delivery-network)
- System Design MOC
