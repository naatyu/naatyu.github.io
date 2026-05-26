---
title: "Scalability"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - cs/system-design
  - interview
draft: false
---

## Summary

Scalability is the ability of a system to handle increasing load by adding resources, either vertically by enhancing individual nodes or horizontally by distributing traffic across multiple nodes, typically necessitating a transition to stateless architectures and distributed data management.
## Concepts
- **Vertical Scaling (Scale-Up):** Increasing the capacity (CPU, RAM, Disk) of a single server. Limited by hardware ceilings and lacks redundancy (Single Point of Failure).
- **Horizontal Scaling (Scale-Out):** Adding more servers to a pool to distribute load. Enables high availability and theoretical infinite scalability but increases architectural complexity.
- **Load Balancer:** A component that distributes incoming traffic across a pool of servers, abstracting server IPs from the client and providing health-check-based failover.
- **Statelessness:** An architectural constraint where servers do not store client state (e.g., sessions) locally, instead offloading it to shared persistent stores (NoSQL/Redis), allowing any node to process any request.
- **Database Replication:** A technique where data is copied from a primary (master) node to replicas (slaves), typically used to scale read-heavy workloads and provide data redundancy.
- **Database Sharding:** Horizontal partitioning of a database into smaller chunks (shards) based on a partition key (e.g., user_id), allowing the data tier to scale across multiple nodes.
- **Content Delivery Network (CDN):** A distributed network of proxy servers that cache static content (JS, CSS, images) geographically closer to users to minimize latency and origin load.
- **Cache Layer:** A high-speed, in-memory data store (e.g., Redis) used to reduce expensive database queries or computation by storing frequently accessed data.
- **Message Queue:** A durable buffer that facilitates asynchronous communication between decoupled services, enabling independent scaling and smoothing of traffic spikes.

## Scaling from Zero to Millions

### The Evolution Path
1. **Single Server Setup**: Web server and database on a single node. DNS maps domain to a single public IP.
2. **Database Separation**: Moving the database to a dedicated server allows independent scaling of compute and storage.
3. **Horizontal Scaling with Load Balancer**: Introducing a Load Balancer (LB) to distribute traffic to multiple web servers. This eliminates the web tier as a single point of failure (SPOF).
4. **Data Redundancy**: Implementing Master-Slave replication. Master handles writes; Slaves handle reads.
5. **Caching and CDNs**: Offloading static assets to CDNs and frequent queries to an in-memory cache (Redis/Memcached).
6. **Stateless Tier**: Moving session data out of web servers into a distributed cache or NoSQL database to allow horizontal scaling of the web tier.
7. **Multi-Data Center Support**: Using GeoDNS to route traffic to the nearest data center, improving global latency and providing disaster recovery.
8. **Asynchronous Processing**: Using message queues (RabbitMQ, Kafka) to decouple time-consuming tasks from the request-response cycle.
9. **Database Sharding**: Partitioning data across multiple database instances to overcome single-node storage and throughput limits.

### Architectural Trade-offs
### Vertical vs. Horizontal

While vertical scaling is simpler (no code changes), it has a hard hardware limit and is not cost-effective at high scales. Horizontal scaling requires the application to be stateless but provides superior reliability.
### Reliability and Availability
- **Failover**: If a master database or a web server fails, the system must automatically promote a slave or redirect traffic to healthy nodes.
- **SLA (Service Level Agreement)**: A goal for availability (e.g., 99.9% or "three nines"). High availability requires redundancy at every layer.

## Best Practices
- **Cache frequently, write through**: Use `Read-through` or `Write-through` patterns to keep data consistent.
- **Avoid Disk I/O**: Prefer memory-mapped files or in-memory stores for high-throughput operations.
- **Decouple Services**: Use microservices or message queues to prevent one failing component from bringing down the entire system.
- **Monitor Everything**: Metrics (CPU, Memory, QPS) and centralized logging are non-negotiable for identifying bottlenecks.

---
## Related
- [Load Balancer](/atlas/computer-science/system-design/components/load-balancer)
- [Consistency patterns](/atlas/computer-science/system-design/consistency-patterns)
- [Availability patterns](/atlas/computer-science/system-design/availability-patterns)
- [Database Sharding](/atlas/computer-science/system-design/strategies/database-sharding)
