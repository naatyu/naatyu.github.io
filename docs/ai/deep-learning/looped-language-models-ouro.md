---
title: "Looped Language Models (Ouro)"
date: 2026-05-19
lastmod: 2026-05-19
tags:
  - ai/deep-learning
  - ai/llm
  - architecture
  - reasoning
draft: false
---

## Summary

Ouro adds a third scaling axis to language models by letting the model spend extra recurrent computation in latent space before emitting each token.
## Concepts
- **Looped Language Model (LoopLM):** a transformer that can reuse its own layers multiple times on the same token representation before producing an output token.
- **Latent reasoning:** reasoning performed on hidden states instead of explicit vocabulary tokens.
- **Exit gate:** a learned module that decides whether the current latent state is good enough to emit the next token.
- **Overlooping:** running more recurrent loops than the model was trained for.
- **Knowledge storage:** memorizing and retrieving facts.
- **Knowledge manipulation:** composing, transforming, or reasoning over stored facts.

## Content

### Motivation

Classic [Scaling Laws](/atlas/ai/deep-learning/scaling-laws) treat pretraining as mostly two-dimensional:

- increase model parameters ($N$)
- increase training tokens ($D$)

Reasoning models add compute at inference time, but usually after pretraining:

- chain-of-thought
- long rollouts
- self-checking
- best-of-$N$ sampling
- verifier-guided search

Ouro's thesis is different: reasoning should be part of pretraining itself. Instead of teaching the model to think only in text after the base model is trained, Ouro trains the base model to do multi-step latent computation.

### Core architecture

A normal decoder-only transformer roughly does:

$$x_t \rightarrow h_t \rightarrow y_t$$

Ouro inserts a recurrent loop before token emission:

$$x_t \rightarrow h_t^{(1)} \rightarrow h_t^{(2)} \rightarrow ... \rightarrow y_t$$

At each loop, the latent vector is passed through an exit gate:

- if the gate exits, the model emits the next token
- if not, the latent vector is passed through the model again
- if the maximum loop count is reached, the model is forced to exit

This decouples parameter count from compute depth. The same parameters can be reused for more internal computation.

### Why latent loops matter

Text-based reasoning has three practical problems:

- It consumes context length.
- It increases KV-cache and generation cost.
- It forces reasoning through vocabulary tokens, which may be an inefficient representation for concepts.

Latent looping avoids generating a long chain of visible reasoning tokens. The model can spend extra compute internally, then emit only the final token.

This is similar in spirit to [Test-Time Compute](/atlas/ai/deep-learning/test-time-compute), but the compute is built into the model architecture and pretraining objective rather than added as a post-hoc inference strategy.

### Exit probability

The exit gate is a dense layer followed by a sigmoid. The sigmoid gives the conditional probability of exiting at loop $t$:

$$p_t = P(\text{exit at } t \mid \text{survived until } t)$$

To get the unconditional probability of exiting at loop $t$, multiply by the probability of surviving the earlier loops:

$$P_t = p_t \prod_{i<t}(1-p_i)$$

The probabilities are accumulated into a CDF. If the CDF crosses a threshold, the model exits. At the final allowed loop, the remaining probability mass is assigned to forced exit.

### Training objective

During training, the model does not stop early. It runs the full set of possible loops, computes the loss for each possible exit point, then combines them with the exit probabilities:

$$L = \sum_t P_t L_t$$

A naive version collapses because one loop can dominate early in training. If the final loop starts with slightly higher probability, it contributes more to the loss, gets trained more, becomes more confident, and eventually the model always exits there.

Ouro fixes this with entropy/KL regularization. The exit distribution is encouraged to stay spread across loops:

$$L_{total} = \sum_t P_t L_t + \beta D_{KL}(P_t || U_t)$$

Where:

- $P_t$ is the learned exit distribution
- $U_t$ is a uniform prior over loop depths
- $\beta$ controls how strongly the prior is enforced

They tested a geometric prior inspired by PonderNet, but the transcript says the uniform prior worked better because geometric priors undertrained later loops.

### KV-cache behavior

Looped models complicate KV caching.

During training and prefill:

- tokens are processed in parallel
- loop 1 is run for all tokens, then loop 2 for all tokens, etc.
- this preserves parallelism
- it cannot perfectly pass each token's final exit-loop KV cache into all later-token loops without making training sequential

During decoding:

- token $t+1$ cannot start until token $t$ is done
- several KV-cache strategies are possible

The transcript describes four strategies:

- use the corresponding loop KV cache, matching training
- use only the exit-loop KV cache
- average the KV cache across loops
- use only the first-loop KV cache

The first-loop cache performed poorly. The other strategies were similar, which suggests the model is somewhat robust to KV-cache policy at inference.

### Training pipeline

Reported Ouro models:

- Ouro 1.4B
- Ouro 2.6B
- thinking variants of both

The transcript says the models were trained at industrial scale on $7.7T$ tokens.

Pipeline detail:

- first pretrain the 1.4B model on $3T$ tokens
- fork into a larger 2.6B pathway
- duplicate non-embedding layers from the smaller model
- relax/train the larger model
- improve data quality across phases

The layer duplication resembles initializing the larger model as a deeper looped version of the smaller one.

### Results

The main reported claim is parameter efficiency:

- Ouro 2.6B can perform near or above larger Qwen3 and Gemma3 models on some benchmarks.
- Gemma 3 12B is roughly $5 \times$ larger than Ouro 2.6B.
- Qwen3 is roughly $3 \times$ larger and trained on almost $3 \times$ more tokens.
- Ouro thinking variants are competitive with 7B-8B reasoning models on harder math and reasoning benchmarks.

The important interpretation is not "loops always beat scale." It is that recurrent latent compute can improve parameter efficiency when the task benefits from internal computation.

### When looping helps

The transcript separates two abilities:

- knowledge storage and extraction
- knowledge manipulation

On synthetic biography-style tasks from the Physics of LLMs line of work, looping did not improve knowledge storage. This makes sense because looping does not add parameters.

On knowledge manipulation tasks, looping helped substantially. A one-loop model saturated quickly, while two and four loops improved accuracy. This suggests the gain comes from extra internal computation over existing knowledge, not from storing more knowledge.

### Loop count and extrapolation

The paper trained with a maximum of four loops and tested extrapolation beyond that.

Observed behavior:

- some easier benchmarks benefited from looping beyond four steps
- harder benchmarks often peaked around three to four loops
- too many loops could degrade performance

Practical rule:

- overlooping can be safer than underlooping on some tasks
- but loop count is task-dependent and should not be blindly increased

### Relation to other approaches

Ouro is related to:

- [Test-Time Compute](/atlas/ai/deep-learning/test-time-compute): spends more compute on harder problems
- Universal Transformers: recurrent depth in transformer models
- PonderNet: learned halting / adaptive computation
- chain-of-thought: multi-step reasoning, but in vocabulary space
- MoE: decouples parameter count from active compute in a different way
- [Moe Looped Language Models](/atlas/ai/deep-learning/moe-looped-language-models): sparse experts can restore expressivity lost by looping dense FFNs

The key difference is that Ouro performs the extra reasoning in latent space during pretraining, not as a text-only post-training behavior.

## Takeaways

- Scaling can happen through recurrent compute depth, not only parameters and data.
- Latent reasoning avoids spending context on visible chain-of-thought tokens.
- The exit gate needs regularization or it collapses to one loop depth.
- Looping helps knowledge manipulation more than knowledge storage.
- More loops are not always better; optimal loop count depends on the task.
- Ouro is especially interesting for small models because it improves parameter efficiency without increasing model size.

## Related
- [Scaling Laws](/atlas/ai/deep-learning/scaling-laws)
- [Test-Time Compute](/atlas/ai/deep-learning/test-time-compute)
- [Transformer Scaling Rules](/atlas/ai/deep-learning/transformer-scaling-rules)
- [Moe Looped Language Models](/atlas/ai/deep-learning/moe-looped-language-models)
- [Frontier Small Language Models](/atlas/ai/deep-learning/frontier-small-language-models)
- [Large Concept Models](/atlas/ai/deep-learning/large-concept-models)
- [AI Papers MOC](/atlas/ai/ai-papers-moc)
