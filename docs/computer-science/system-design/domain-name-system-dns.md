---
title: "Domain Name System (DNS)"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - cs/system-design
  - interview
draft: false
---

## Summary

The Domain Name System (DNS) is a hierarchical, distributed database that translates human-readable domain names into machine-readable IP addresses, serving as the fundamental discovery mechanism for internet services.
## Concepts
- **A Record (Address):** Maps a domain name (e.g., `example.com`) to an IPv4 address.
- **AAAA Record:** Maps a domain name to an IPv6 address.
- **CNAME Record (Canonical Name):** Maps an alias domain (e.g., `www.example.com`) to its canonical domain name (`example.com`).
- **NS Record (Name Server):** Specifies the authoritative DNS servers responsible for a domain's records.
- **MX Record (Mail Exchange):** Directs email traffic to the mail servers responsible for the domain.
- **TTL (Time to Live):** The duration (in seconds) for which a DNS record is cached by recursive resolvers before it must be refreshed from the authoritative source.
- **Recursive Resolver:** A DNS server (often provided by an ISP or public providers like Google/Cloudflare) that queries the DNS hierarchy to find an IP address for the user.
- **Authoritative Name Server:** The final stop in a DNS query; it holds the actual record requested and returns the IP address.
- **GeoDNS (Anycast DNS):** A routing technique that returns different IP addresses based on the user's geographic location to minimize latency and origin load.

## The DNS Lookup Process
1. **User Request**: User enters `example.com` in a browser.
2. **Local Cache Check**: The browser and OS check their local cache. If found, the IP is returned immediately.
3. **Recursive Resolver**: If not in cache, the request is sent to a recursive resolver (e.g., Google 8.8.8.8).
4. **Root Name Server**: The resolver queries a Root Server (`.`), which points to the **TLD (Top-Level Domain) Server** (e.g., `.com`).
5. **TLD Name Server**: The TLD server points to the **Authoritative Name Server** for `example.com`.
6. **Authoritative Response**: The Authoritative Server returns the **A Record** (IP address) to the resolver.
7. **Caching and Return**: The resolver caches the IP for the duration of the **TTL** and returns it to the user's browser.

## Routing Strategies
Advanced DNS providers (Route53, Cloudflare) use DNS to perform high-level load balancing:
- **Weighted Round Robin**: Distributes traffic across different server IPs based on assigned weights (useful for A/B testing or canary deployments).
- **Latency-based Routing**: Returns the IP of the data center that provides the lowest latency for the user.
- **Geolocation-based Routing**: Routes traffic based on the user's physical country or region.
- **Failover Routing**: Automatically switches the IP record to a secondary standby server if the primary health check fails.

## Operational Considerations
- **DDoS Vulnerability**: DNS is a frequent target for Distributed Denial of Service (DDoS) attacks. Using a managed provider with high capacity and Anycast is critical for resilience.
- **Propagation Delay**: When a DNS record is updated, it takes time for the old record to expire from recursive caches globally (determined by the TTL).
- **Security (DNSSEC)**: A suite of extensions that provide cryptographic authentication of DNS data to prevent "DNS spoofing" or "man-in-the-middle" attacks.

---
## Related
- [Scalability](/atlas/computer-science/system-design/scalability)
- [Content delivery network](/atlas/computer-science/system-design/content-delivery-network)
- System Design MOC
