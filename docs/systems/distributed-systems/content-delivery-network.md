---
title: "Content Delivery Network (CDN)"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - cs/system-design
  - interview
draft: false
---

## Summary

A Content Delivery Network (CDN) is a geographically distributed network of proxy servers that cache static assets (images, videos, JS, CSS) close to end-users, reducing network latency, origin load, and improving overall system availability.
## Concepts
- **Edge Server:** A geographically distributed CDN server that responds to requests from nearby users to minimize round-trip time (RTT).
- **Origin Server:** The source of truth for web content; edge servers fetch missing content from the origin.
- **Cache Invalidation:** The process of removing or updating cached files in the CDN before they expire (e.g., via API request or object versioning).
- **Cache Hit Ratio:** A metric measuring the percentage of requests served from the CDN cache versus those that required an origin fetch.
- **TTL (Time To Live):** A configuration that determines how long a file remains cached on the edge server before it is considered stale.
- **Pull Model:** A caching strategy where the CDN fetches content from the origin only after the first user request (best for infrequently accessed assets).
- **Push Model:** A strategy where content is pre-emptively uploaded to the CDN (best for high-traffic assets with predictable updates).
- **Anycast:** A network routing technique used by CDNs to route user requests to the nearest edge server using a single IP address.

## Strategic Workflow

### How it Works
1. **User Request**: A user requests a static asset (e.g., `image.png`) from a website.
2. **DNS Routing**: The DNS server routes the request to the nearest CDN Edge Server (often via Anycast).
3. **Cache Check**:
   - **Cache Hit**: The Edge Server serves the file directly from its local cache.
   - **Cache Miss**: The Edge Server requests the file from the **Origin Server**.
4. **Origin Response**: The Origin Server sends the file to the Edge Server.
5. **Edge Caching**: The Edge Server caches the file locally and returns it to the user.

### Key Benefits
- **Reduced Latency**: By shortening the physical distance between data and the user.
- **Improved Reliability**: If the origin server is temporarily down, the CDN can still serve cached assets.
- **Lower Bandwidth Costs**: Offloading traffic to the CDN reduces the egress costs from the origin cloud provider.
- **Scalability**: CDNs are designed to handle massive traffic spikes (e.g., flash crowds) that would overwhelm an origin server.

## Operational Considerations
- **Cost**: CDNs (e.g., CloudFront, Akamai) charge for data transfer. Cache infrequently accessed files sparingly to save costs.
- **Stale Content**: Setting an appropriate TTL is critical. Too long, and users see old data; too short, and the cache hit ratio drops.
- **Dynamic Content**: While primarily for static assets, some CDNs offer **Edge Computing** (e.g., Lambda@Edge) to process lightweight dynamic logic at the edge.
- **Failover Strategy**: If the CDN itself experiences an outage, the application should be configured to fail back to the origin server.

---
## Related
- [Scalability](/atlas/systems/distributed-systems/scalability)
- [Latency vs Throughput](/atlas/systems/performance/latency-vs-throughput)
- System Design MOC
