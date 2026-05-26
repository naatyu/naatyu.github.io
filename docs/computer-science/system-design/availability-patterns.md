---
title: "Availability Patterns"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - cs/system-design
  - interview
draft: false
---

## Summary

Availability patterns define architectural strategies to ensure a system remains operational and accessible during component failures, primarily through redundancy, automated failover, and data replication mechanisms.
## Concepts
- **High Availability (HA):** A system characteristic that guarantees a certain level of operational performance (uptime) over a specified period, typically expressed in "nines" (e.g., 99.9% or "three nines").
- **Failover:** The automatic process of switching service from a failed primary component to a redundant standby or active secondary component.
- **Active-Passive (Hot/Cold Standby):** A configuration where a primary node handles all traffic while a secondary node remains idle, synchronizing state until the primary fails.
- **Active-Active (Multi-Primary):** A setup where multiple nodes simultaneously process traffic and synchronize state, providing both higher throughput and seamless redundancy.
- **Master-Slave Replication:** A model where a primary node handles writes (replicated asynchronously or synchronously) and secondary nodes handle read traffic to distribute load.
- **Master-Master Replication:** A multi-primary model where any node can accept read and write operations, requiring complex conflict resolution (e.g., Vector Clocks, Last-Write-Wins).
- **Heartbeat:** A periodic "keep-alive" signal sent between nodes to monitor health. If a heartbeat is missed, the monitoring system triggers a failover.
- **Single Point of Failure (SPOF):** A component whose failure will bring down the entire system. Redundancy aims to eliminate all SPOFs.

## Strategic Implementation

### 1. Failover Mechanisms
- **Active-Passive**: The passive node "watches" the active node via heartbeats. If the active node fails, the passive node takes over its IP address (IP failover) and resumes service.
  - **Pros**: Simpler than Active-Active; lower data consistency risk.
  - **Cons**: Waste of resources (idle hardware); failover time depends on whether the standby is "hot" (ready) or "cold" (needs initialization).
- **Active-Active**: Both nodes handle a portion of the traffic.
  - **Pros**: Better resource utilization; provides both scalability and availability.
  - **Cons**: Higher complexity; requires careful session management and data synchronization.

### 2. Replication Models
| Model | Write Performance | Read Performance | Consistency |
| :--- | :--- | :--- | :--- |
| **Master-Slave** | High (single master) | Very High (scalable) | Eventual/Strong (depends on sync) |
| **Master-Master** | Very High (multi-master) | Very High | Conflict-prone (Eventual) |

## Quantifying Availability (The "Nines")
Availability is measured by the percentage of time a system is functional:

| Availability % | Downtime per Year | Downtime per Month |
| :--- | :--- | :--- |
| **99% (Two nines)** | 3.65 days | 7.20 hours |
| **99.9% (Three nines)** | 8.76 hours | 43.20 minutes |
| **99.99% (Four nines)** | 52.56 minutes | 4.32 minutes |
| **99.999% (Five nines)** | 5.26 minutes | 25.92 seconds |

### Calculating Total Availability
- **Series Components**: If component A (99%) and component B (99%) are in sequence, total availability is $0.99 \times 0.99 = 98.01\%$.
- **Parallel Components**: If component A (99%) and component B (99%) are redundant, total availability is $1 - (1 - 0.99) \times (1 - 0.99) = 99.99\%$.

## Best Practices
- **Geographic Redundancy**: Distribute nodes across different physical data centers to survive natural disasters.
- **Automated Health Checks**: Use load balancers or orchestration tools (Kubernetes) to automatically detect and replace unhealthy nodes.
- **Chaos Engineering**: Regularly test failover mechanisms by intentionally killing nodes in production (e.g., Netflix's Chaos Monkey).

---
## Related
- [Consistency patterns](/atlas/computer-science/system-design/consistency-patterns)
- [Availability vs Consistency (CAP)](/atlas/computer-science/system-design/availability-vs-consistency-cap)
- [Scalability](/atlas/computer-science/system-design/scalability)
- System Design MOC
