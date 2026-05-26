---
title: "8 Most Important System Design Concepts You Should Know"
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
- **Write-through Caching:** a strategy where data is written to the cache and the database simultaneously.
- **LSM-tree (Log-Structured Merge-tree):** a data structure optimized for high write throughput by flushing sorted files to disk.
- **Sharding:** the process of splitting a large database into smaller, more manageable pieces called shards.
- **Index:** a data structure that improves the speed of data retrieval operations on a database.

[8 Most Important System Design Concepts You Should Know](https://www.youtube.com/watch?v=BTjxUS_PylA)

# Heavy read apps

In some app, like a news website, there is a few publisher and a lot of readers. This create a big mismatch between read and writes. For that we can use caching, we have a CDN and before checking the database, it will check the cache (Redis or memcached for exemple).
This also add challenges such as keeping the cache in sync with the database. We can use a TTL on keys (caching is key-value store) to keep data on sync or write-through caching (we write to the cache and the db at the same time).
Caching is especially useful for read-heavy, low-churn (change very slowly) data such as static pages or product listings.

# Write heavy apps

Systems like social medias receive a lot of write operations. To handle this we can use asynchronous writes with message queues and workers handling the write operation. This will send the write operation in the queue and the system will process it only if it has the ressources to. We can use user instant feedback that data was written even though it is still in the queue. For exemple on twitter on can make the user see it's own tweet while it is still on the job queue and other user will only see it in tens of seconds.
In second we can use LSM-tree base databases like Cassandra. Theses databases collect writes in memory and periodically flushes them to disk as sorted files. As it grows they merge files to reduce the number of lookups during read. Write operations will be very fast but read operation will be slower and slower as it need to check multiple files.

# Single point of failure

With a single point of failure, a whole system can go down. This can be solved with redundancy and failover. We can implement database redundancy. This will increase availability but introduces complexity in consistency management. 

# High availability

Systems like payment need high availability. This require load balancing and replication working together. For databases, a primary replica setup is standard, the main replica handle writes while others handle reads. If the main one failed, another replica can take over as the primary one. We can also have multiple-primary replication for distributing writes geographically, but it comes with more complex consistency trade-offs. 

# High latency

Users in Australia shouldn't wait for the content to load from servers in Europe. CDNs can solve this by caching content closer to users, reducing latency. Static content (videos and images for exemple) works well with CDNs. For dynamic content we can add edge computing as a complement. The TTL then depend on data content, it can be long for a video (few chance that it change) and shorter for user profile. 

# Large files

With large amount of data, modern platforms use 2 types of storage: block storage and object storage. 
- Block storage has low latency and high IOPs. It is ideal for frequently accessing small files.
- Object storage on the other hand costs less and is designed to handle large, static files like videos and backups at scale. 
Most platform combine theses with user data going in block storage and media files going in Object storage. 

# Monitoring

With all these systems running we need to monitor them. We can use modern monitoring tools such as Prometheus for collecting logs and metrics and Grafana for visualization. We can also use OpenTelemetry to debug performance bottlenecks across components. At scale this is a lot of logs, they key is to sample routine events, keep detailed logs for critical operations and set up alerts that trigger only for real problems. 

# Slow database queries

One of the most common slow down is slow database query. Indexing is the first line of defense. Without it we need to scan every line to find what we need. With indexing we can directly jump to the right data. We can further use composite index for multi columns queries (index on multiple columns) to enhance performances. But this also slow down writes because they need to be updated as data changes.
If indexing is not enough we can consider sharding, splitting the database across different machine and use strategies such as range-based or hash-based distribution. This also adds complexity and can be challenging to reverse. Tools like Vitess can simplify this for MySQL databases.
