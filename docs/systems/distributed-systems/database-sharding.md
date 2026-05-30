---
title: "Database Sharding"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - cs/system-design
  - strategy
draft: false
---

## Summary

Database sharding is a horizontal scaling technique that partitions a large dataset into smaller, faster, and more manageable chunks (shards) distributed across multiple nodes to overcome the storage and throughput limits of a single server.
## Concepts
- **Shard:** A horizontal partition of data; each shard contains a unique subset of the total dataset but shares the same schema as other shards.
- **Sharding Key (Partition Key):** A critical column (e.g., `user_id`) used by a hash function to determine which shard a specific data row is assigned to.
- **Resharding:** The complex process of redistributing data across shards when a single shard reaches its capacity or when the sharding key results in uneven data distribution.
- **Celebrity Problem (Hotspot):** A performance bottleneck occurring when a specific shard is overwhelmed by excessive access to a particular key (e.g., a high-profile user's data).
- **Consistent Hashing:** An advanced hashing technique that maps keys to a "ring" to minimize data movement when shards (nodes) are added or removed from the system.
- **Cross-shard Join:** A query that requires data from multiple shards. This is highly inefficient in distributed systems and often requires de-normalization to resolve.
- **Virtual Nodes:** A technique used in consistent hashing to represent a single physical node multiple times on the hash ring, ensuring a more uniform distribution of data.

## Strategic Implementation

### Why Shard?
- **Horizontal Scaling**: When vertical scaling (adding RAM/CPU) hits its hardware limit or becomes prohibitively expensive.
- **Improved Throughput**: Parallelizing read/write operations across multiple database instances.
- **Storage Limits**: When the total dataset size exceeds the disk capacity of a single high-end server.

### Choosing a Sharding Key
The sharding key is the most important factor in a successful sharding strategy. A poor key leads to **data skew** and **hotspots**.
- **High Cardinality**: Choose keys with many unique values.
- **Uniform Distribution**: Ensure the hash function distributes data evenly across all shards.
- **Access Patterns**: Group data that is frequently accessed together (e.g., sharding by `tenant_id` in a multi-tenant SaaS).

### Common Challenges and Solutions
1. **Resharding**: When a shard becomes too large, it must be split. Using **Consistent Hashing** significantly simplifies this process by reducing remapping from $O(n)$ to $O(k/n)$.
2. **The Celebrity Problem**: If a specific key is accessed too frequently (e.g., Justin Bieber's profile), that shard will bottleneck. Solutions include further partitioning the data for that specific key or using a caching layer (Redis) to absorb the hits.
3. **Joins and De-normalization**: Performing joins across multiple shards is extremely slow. Systems often **denormalize** data so that all information needed for a query is contained within a single shard.
4. **Referential Integrity**: Many distributed databases do not support foreign key constraints across shards. This must be managed at the application layer.

## Comparison: Vertical vs. Horizontal Scaling
| Feature | Vertical Scaling (Scale-Up) | Horizontal Scaling (Sharding) |
| :--- | :--- | :--- |
| **Complexity** | Low (no architectural changes) | High (requires data partitioning) |
| **Cost** | Grows exponentially with hardware | Grows linearly with standard hardware |
| **Limit** | Hard hardware ceiling | Theoretically infinite |
| **Failover** | Single Point of Failure (SPOF) | Built-in redundancy (multiple nodes) |

---
## Related
- [Scalability](/atlas/systems/distributed-systems/scalability)
- Consistent Hashing
- System Design MOC
