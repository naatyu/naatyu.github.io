---
title: "Large Language Model Serving"
date: 2026-04-08
lastmod: 2026-08-05
tags:
  - cs/system-design
  - interview
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **API Gateway:** a management tool that acts as a single entry point for client requests to backend services.
- **Token Bucket Algorithm:** a rate-limiting algorithm that allows for bursts of traffic while maintaining a steady average rate.
- **Kubernetes:** an orchestration platform for automating the deployment and scaling of containerized applications.
- **Inference:** the execution of a trained machine learning model to produce a result from input data.

[Large Language Model Serving - ML Systems Design Interview](https://www.youtube.com/watch?v=3zqZijUxl6M)

The goal is to serve a system which can handle serving a LLM to millions of users.

# Functional requirements
This cover what the application does.
- User request handling through API or UI (web or software)
- Maintain session context for multi-turn conversion
- Model inference with multiple models and switch between them (while keeping conversation)
- Request formatting and delivery providing near-real time response to users

# Non-functional requirements
This cover performance based metrics.
- Scalable and performant meaning Low latency and optimized model inference and data transfert
- Reliability with uptime of 99.9% or higher

# High level design

Let's simulate a user request.

It first goes to the *API gateway*, used for API request or user interface. It serve as authentification, load balancing or rate limiting. We could use AWS api gateway with auth-O. For rate limiting we can use a redis-backed token bucket algorithm (each user is allocated a set number of tokens where each request 1 token, if tokens are exhausted, request are throttled until the bucket is full).

The request now goes to the request *processing layer*. This layer will do request routing and validation. We will use nginx, that will distribute the incoming traffic in the system based on request type, load conditions and routing rules. 
Our validation service need to be custom, in our case it can be a RestAPI using fastapi for exemple using pydantic for request verification. This will check for input formats and parameters, request size and structure but will also normalize inputs to ensure consistency and assign will the assign the priority queue the request will enter. For LLM services we can separate standard free users and enterprise paid tier users. The request would enter either standard queue for standard user or priority for paid users. 

We can now move on to the *orchestration layer*. It is the core of LLM services, it will coordinate all the aspects to process the request after the validation. It also implements decisions about how and where our request should be handled. To handle our 2 queues with millions of request we can have a request orchestrator based on kubernetes. It will analyse and decompose the task, then allocate ressources for all steps and conduct adaptative processing.
For exemple if we identify that this is a small coding task, it is high throughput and low complexity. The orchestrator will create a simple workflow enabling fast responses. For live coding task it would be identified as a time sensitive and high complexity task. The orchestrator would then create a lightweight, streaming workflow enabling quick responses, but the computational ressources will be higher. 
For ressource allocations, in the easy task we would assign it to a cluster with a fast model (if we were google it would be flash models for exemple). However for the complex task it would be assigned to a better model in a high capability cluster (pro version for google). 
For adaptive processing, the simple task would likely not need any since it is short context and simple and would mainly not need feedback and multi-turn. However for the more complex task we expected adaptive processing, with like upgrading model version or using multi-turn conversations.

Once this is done, the request can go to the *inference layer*. This layer has a coordinator, in this case an inference coordinator (kubernetes) with model inference clusters with GPUs.  We would have a model registry to track the different model versions and a model tuning and tracking service. 
Our request first goes to the coordinator, which read the requirements given by our orchestration layer. Then the coordinator will select the right model (flash for easy or pro for complex) and it will be finally processed by the LLM providing a response. The response will be analyzed by a service like W&B for observations and performances. 

We can now move to the *safety and monitoring* layer which conduct safety and content moderation. We could have a RestAPI acting as a filter for content policy and violations. We could leverage another lightweight model to check this. A [policy-adaptive guard model such as Shieldstral](/atlas/ai/architectures/model-reports/shieldstral) can condition the decision on a deployment-specific natural-language policy rather than exposing only a fixed taxonomy. This layer can also be used for monitoring leveraging gafana for exemple for live logs.

The output was approved, it can now be sent back to the user. The request will go back to the orchestration layer and go to the api gateway layer bypassing the request processing layer and be delivered back to the user.

![Large Language Model Serving 01](/attachments/computer-science/system-design/large-language-model-serving/large-language-model-serving-01.png)
