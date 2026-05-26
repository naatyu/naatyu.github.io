---
title: "Design Youtube - System Design Interview"
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
- **Load Balancer:** a device that distributes network traffic across multiple servers to ensure reliability and performance.
- **Object Storage:** a storage architecture that manages data as objects, ideal for large, unstructured media files.
- **NoSQL:** a category of database systems that use non-relational data models, such as document or key-value pairs.
- **CDN (Content Delivery Network):** a distributed network of servers that caches content closer to users to reduce latency.
- **LRU Cache (Least Recently Used):** a caching strategy that evicts the least recently accessed items first.

[Design Youtube - System Design Interview](https://www.youtube.com/watch?v=jPKTo1iGQiE)

# Functional requirements

YouTube is a very broad system with a lot of services like ads, watch, upload, bot prevention, analytics and many others. First we can focus on the functional requirements that are upload a video and watch a video. 

# Non functional requirements

In first we have reliability, we don't want a use to upload a video and it becomes deleted or corrupted. 
We also have to keep scale in mind as a single video can have thousands of viewers in concurrency. Let's assume we have a 1B daily active users, they watch 5 videos per day and the ratio of view/upload is 100:1 (reads/write ratio). This mean 50M users will upload a video, and not all videos get a lot of views so only maybe 5% will have a lot of users. 
In term of availability we want to prioritize it over consistency. We should get a valid request every time we refresh a YouTube home page, it's ok that upload videos are not available immediately for all users. 
We also have latency, it should be as minimal as possible. When we click a video it should start immediately even if the full video is not loaded. We also shouldn't expect any buffering if we have a correct internet. 

# High level design

Let's start with uploading a video. Since almost 50M users will upload a video by day, we will need multiple servers, hence a load balancer. Let's assume the user has to redo the upload if there is a connection shortage. Once the video is uploaded, we want to store it in a object store database since it is better for media files (like AWS S3). We can assume that AWS will handle replication for us. This contain only the raw video we also need to store the metadata such as video title, description and user id. We can store this in a separate database (NoSQL like MongoDB that store in JSON format) with a link to the video in the raw object store db. 
When uploading a video we also need encoding to reduce the size of the video. This can't happen while uploading the video. We will need a queue that will send the video to an encoding service (multiple servers to handle the number of uploaded videos). Once video are encoded we need to store them in another object store, and also update the reference to the video in our metadata db. 

When watching a video we want reads to be as fast as possible and latency as low as possible. We can use caching for that from the encoded videos. We can use a CDN and when a user request a video it is read from the encoded object store and put in the CDN. We can also add memory caching for when querying the metadata database, with a LRU cache. 
![Design Youtube   System Design Interview 01](/attachments/computer-science/system-design/design-youtube-system-design-interview/design-youtube-system-design-interview-01.png)

# Design details

Let's tackle the encoding part first. We can assume one worker can handle one encoding, and we can use parallelism. Let's assume a worker can encode a video in 1 minute (it's probably more), since we have 50M upload/day -&gt; 500 upload/s -&gt; 30k upload/s. We should aim for around 30k workers. It's hard to get an accurate number of worker but this should be the scale. 
When we watch a video, we don't load the full video, we have the beginning chunk only. If we dig into how YouTube does this, they do request to load chunks of videos. So we don't need to send the full video. For that we can use TCP (UDP could be a choice but we are not live streaming, so less ideal) with HTTP.
We also want to add rate limiting when uploading videos. We could also have an auxiliary service for recommandation that fetch user metadata.
