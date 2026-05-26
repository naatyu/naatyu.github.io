---
title: "Load Balancer"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - cs/system-design
  - component
draft: false
---

## Summary

A Load Balancer is a critical architectural component that distributes incoming traffic across a pool of servers (server farm) to ensure high availability, prevent resource saturation, and provide a single entry point for clients while abstracting backend infrastructure.
## Concepts
- **Load Balancer (LB):** A device or software acting as a reverse proxy, distributing network or application traffic across multiple backend servers.
- **Health Check:** A mechanism where the LB periodically pings backend servers to ensure they are responsive; unhealthy servers are automatically removed from the traffic pool.
- **Round Robin:** A basic load balancing algorithm that cycles through a list of servers, sending each new request to the next server in sequence.
- **Sticky Session (Session Persistence):** An optimization that ensures all requests from a specific client are routed to the same backend server, typically for session-state consistency (best avoided in stateless architectures).
- **Layer 4 (L4) Load Balancing:** Routing based on network-level protocol information (IP and TCP/UDP ports) without inspecting the message content (highly efficient).
- **Layer 7 (L7) Load Balancing:** Routing based on application-layer data (HTTP headers, URLs, cookies), enabling sophisticated content-based routing (e.g., routing `/api/` to different servers than `/static/`).
- **SSL Termination:** The process of decrypting SSL/TLS traffic at the load balancer level to reduce the computational load on backend servers.
- **Anycast:** A network addressing and routing methodology in which a single IP address is shared by multiple servers in different locations; the network routes traffic to the "nearest" node.

## Strategic Benefits

### 1. High Availability (HA)
- **Automatic Failover**: If a web server crashes, the LB detects the failure via **Health Checks** and redirects traffic to healthy nodes.
- **Maintenance**: Servers can be taken offline for updates one by one without causing system downtime.

### 2. Scalability
- **Horizontal Scaling**: New servers can be added to the pool seamlessly. The LB automatically starts distributing traffic to them, allowing the system to handle massive traffic spikes.
- **Traffic Shaping**: The LB can use algorithms like **Weighted Round Robin** to send more traffic to high-performance servers and less to older ones.

### 3. Security and Abstraction
- **IP Masking**: Clients connect to the LB's public IP, keeping the private IPs of the backend web servers hidden.
- **WAF Integration**: Load balancers often integrate Web Application Firewalls (WAF) to filter out malicious traffic (e.g., SQL injection, XSS) before it reaches the app.

## Common Routing Algorithms
| Algorithm | Best Use Case |
| :--- | :--- |
| **Round Robin** | Servers are of equal specification and tasks are lightweight. |
| **Least Connections** | Requests have varying processing times (e.g., chat systems). |
| **IP Hash** | When session persistence is needed but statelessness isn't fully implemented. |
| **Least Latency** | When consistent response time is critical for the user experience. |

## Implementation Considerations
- **Load Balancer as SPOF**: If the LB fails, the entire system goes down. Solution: Use multiple LBs in an **Active-Passive** or **Active-Active** configuration with **Heartbeats**.
- **Hardware vs. Software**: Hardware LBs (e.g., F5) are powerful but expensive. Software LBs (e.g., Nginx, HAProxy, AWS ELB) are flexible and easier to scale in cloud environments.

---
## Related
- [Scalability](/atlas/computer-science/system-design/scalability)
- [Availability patterns](/atlas/computer-science/system-design/availability-patterns)
- System Design MOC
