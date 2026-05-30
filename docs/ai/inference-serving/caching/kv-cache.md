---
title: "KV Cache"
date: 2026-04-20
lastmod: 2026-05-04
tags:
  - ai/llm
  - nlp
  - optimization
  - serving
draft: false
---

## Summary

The Key-Value (KV) Cache is a memory optimization technique for autoregressive LLM inference. It stores the **Key** and **Value** tensors of previously processed tokens to avoid redundant computations during the sequential generation of new tokens, trading memory for significant speed gains.
## 1. The Core Problem: Autoregressive Redundancy
In LLMs, tokens are generated one-by-one. To predict token $n$, the model must attend to all tokens $1$ to $n-1$.
- **Without Cache**: At each step, the model would recompute the activations for all previous tokens. This leads to $O(N^2)$ total computation for a sequence of length $N$.
- **With Cache**: Since the past tokens don't change, we can save their **Key** and **Value** projections from the attention layers and only compute the **Query** for the new token.

## 2. How it Works
During the **Prefill** phase, the model processes the entire prompt and populates the cache.
During the **Decode** phase:
1.  The model computes $Q, K, V$ for the *latest* token only.
2.  The new $K$ and $V$ are appended to the existing KV cache.
3.  Attention is computed by matching the current $Q$ against the entire (cached + new) $K$ and $V$ tensors.
4.  The process repeats for the next token.

## 3. Memory Consumption
The KV cache can become massive, often exceeding the size of the model weights for long context lengths.
The size (in bytes) is approximately:
$$\text{Size} = 2 \times \text{layers} \times \text{heads} \times \text{d\_head} \times \text{context\_length} \times \text{bytes\_per\_param}$$
*(The factor of 2 accounts for both Keys and Values).*

### Example (Llama-3 8B):
- 32 layers, 32 heads, 128 head dim, FP16 (2 bytes).
- At 8k context: $2 \times 32 \times 32 \times 128 \times 8192 \times 2 \approx \mathbf{4.3 \text{ GB}}$.

## 4. Key Optimizations

| Optimization | Description |
| :--- | :--- |
| **Multi-Query Attention (MQA)** | All heads share a single Key and Value head. Reduces cache size by $N_{heads}$. |
| **Grouped-Query Attention (GQA)** | Heads are grouped, and each group shares one KV head. A middle ground between MQA and MHA. |
| **PagedAttention** | Manages cache memory in non-contiguous "pages" (like OS virtual memory) to reduce fragmentation and allow sharing. |
| **Quantization** | Storing the cache in INT8 or FP8 to reduce memory footprint by 50%. |

## Related
- [Attention Mechanism](/atlas/ai/foundations/attention-mechanism)
- [Disaggregated Prefill-Decode Serving](/atlas/ai/inference-serving/serving-architectures/disaggregated-prefill-decode-serving)
- [LLM Inference Economics](/atlas/ai/inference-serving/performance/llm-inference-economics)
- Throughput vs Latency
