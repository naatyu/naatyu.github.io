---
title: "Speculative Decoding"
date: 2026-07-23
lastmod: 2026-09-03
tags:
  - ai/inference
  - decoding
  - performance
  - speculative-decoding
draft: false
---

## Summary

Speculative decoding accelerates autoregressive generation by separating **cheap prediction** from **authoritative verification**. A drafter proposes several future tokens, then the target model scores them together in one forward pass. An exact acceptance-and-correction rule commits the longest valid prefix while preserving the target model's output distribution.

The method exploits a hardware asymmetry:

- decoding one token at a time is often memory-bandwidth-bound and underuses the accelerator;
- scoring several already-known positions resembles a small prefill and exposes parallel work;
- a target verification pass can therefore validate several tokens for much less wall-clock time than generating them through separate target passes.

The field has progressed from separate draft models to tree proposals, multiple prediction heads, feature-level autoregressive drafters, parallel block-diffusion drafters, and finally hybrid systems such as **DSpark** that optimize both proposal quality and serving-time verification cost.

![Autoregressive decoding compared with speculative decoding](/attachments/ai/inference-serving/speculative-decoding/speculative-decoding-loop.svg)

## Concepts

- **Target model $p$:** the authoritative model whose distribution must be reproduced.
- **Draft model $q$:** a cheaper approximation that proposes future tokens.
- **Draft length $\gamma$:** maximum number of proposed tokens in a round.
- **Acceptance probability:** probability that a proposed token survives exact verification.
- **Acceptance length:** number of useful tokens committed per verification round; papers differ on whether the correction or bonus token is included, so always check the definition.
- **Bonus token:** an additional target token available when the entire draft is accepted.
- **Residual distribution:** corrected distribution sampled after the first rejection.
- **Tree attention:** an attention mask that lets multiple candidate branches be verified in one flattened sequence without information leaking between branches.
- **Lossless:** preserves the target decoding distribution, not merely benchmark accuracy or greedy text on a few prompts.
- **Suffix decay:** declining acceptance probability at later positions of a draft block.

## 1. Why Autoregressive Decoding Is Slow

An autoregressive language model factorizes a sequence as

$$
p(x_{1:T})=\prod_{t=1}^{T}p(x_t\mid x_{<t}).
$$

At inference time, token $x_{t+1}$ cannot be sampled before $x_t$ is known. With a KV cache, each step processes only the newest token, but every layer still needs to read its weights and update the cache. At small batch sizes, this has low arithmetic intensity: moving parameters from HBM often costs more than the matrix arithmetic.

Ordinary decoding therefore follows a long serial critical path:

```text
target forward -> sample x1 -> target forward -> sample x2 -> ...
```

Training and prefill are different. When a block of tokens is already known, a causal Transformer can score all its positions in parallel. Speculative decoding manufactures a tentative known block cheaply, allowing the target to use this parallel verification mode.

This does not remove autoregressive dependencies. It predicts them speculatively and uses the target to determine how far the speculation was valid.

## 2. One Speculative-Decoding Round

Assume the accepted prefix is $x_{<t}$ and choose draft length $\gamma$.

1. The drafter autoregressively proposes $\tilde x_t,\ldots,\tilde x_{t+\gamma-1}$ and stores each proposal distribution $q_i$.
2. The target consumes the proposed block in one forward pass and produces $p_1,\ldots,p_{\gamma+1}$.
3. Verification proceeds from left to right.
4. Accepted proposals are committed until the first rejection.
5. At rejection position $i$, a correction token is sampled from a residual distribution and later proposals are discarded.
6. If all $\gamma$ proposals are accepted, one bonus token is sampled from $p_{\gamma+1}$.

The round always makes progress. Even if the first proposal is rejected, its replacement is sampled from a distribution that completes an exact target sample.

### Logit alignment

Transformer outputs are shifted relative to input tokens. If the verification input is

```text
[accepted prefix] [d1] [d2] ... [dγ]
```

then the logit at the final prefix position scores `d1`, the logit after `d1` scores `d2`, and so forth. Many first implementations fail because of a one-position indexing error rather than a mathematical error.

## 3. Exact Rejection Sampling

At one position, let the draft propose $x\sim q$. Accept it with probability

$$
A(x)=\min\left(1,\frac{p(x)}{q(x)}\right).
$$

In code, the usual test is

```python
accept = uniform_0_1() <= min(1.0, p[x] / q[x])
```

with numerically safe handling of zero probabilities.

The probability mass accepted through proposal $x$ is

$$
q(x)A(x)=\min(p(x),q(x)).
$$

If the proposal is rejected, sample the correction from

$$
r(x)
=
\frac{[p(x)-q(x)]_+}
{\sum_y[p(y)-q(y)]_+},
$$

where $[z]_+=\max(z,0)$.

### Proof that the output follows $p$

The total acceptance probability is

$$
\alpha
=
\sum_x\min(p(x),q(x))
=
1-\operatorname{TV}(p,q),
$$

where

$$
\operatorname{TV}(p,q)=\frac12\sum_x|p(x)-q(x)|.
$$

The rejection probability is therefore

$$
1-\alpha=\sum_x[p(x)-q(x)]_+.
$$

For any token $x$, the final output probability is

$$
\underbrace{\min(p(x),q(x))}_{\text{accepted proposal mass}}
+
\underbrace{(1-\alpha)r(x)}_{\text{correction mass}}
=
\min(p(x),q(x))+[p(x)-q(x)]_+
=p(x).
$$

Thus the drafter changes efficiency, not the final distribution.

### Numerical example

Suppose

| Token | Target $p$ | Draft $q$ | Acceptance $\min(1,p/q)$ | Accepted mass $\min(p,q)$ |
| --- | ---: | ---: | ---: | ---: |
| cat | 0.40 | 0.50 | 0.80 | 0.40 |
| dog | 0.30 | 0.20 | 1.00 | 0.20 |
| bear | 0.20 | 0.10 | 1.00 | 0.10 |
| cow | 0.10 | 0.20 | 0.50 | 0.10 |

Accepted mass totals $0.80$. The missing target mass is $0.10$ on `dog` and $0.10$ on `bear`, so after a rejection:

$$
r(\text{dog})=r(\text{bear})=0.5.
$$

Sampling directly from $p$ after rejection would double-count mass already accepted through $q$ and would not be exact.

### Greedy decoding

For temperature-zero greedy decoding, the verifier can simply accept proposals while they equal the target argmax and use the first target argmax mismatch as the correction. This reproduces the target's greedy sequence, but it is not a substitute for rejection sampling when stochastic sampling is desired.

### Sampler consistency

The $p$ and $q$ used in the ratio must be the actual distributions from which target and draft tokens are sampled, after relevant temperature, top-k, top-p, token bans, repetition penalties, and other logit transforms. Applying inconsistent transforms silently breaks exactness.

## 4. From One Token to a Draft Block

Verification is causal. Distribution $p_i$ is conditioned on the accepted prefix and the earlier proposed tokens. Once proposal $i$ is rejected, $p_{i+1}$ was computed under a prefix that did not occur, so every later draft token must be discarded.

If every proposal is accepted, the verification pass has already computed the distribution after the last draft token. Sampling a bonus token from it makes the maximum progress $\gamma+1$ tokens per target pass.

Assume for intuition that every draft position has the same conditional acceptance probability $\alpha$. The expected number of committed tokens, including the correction or bonus token, is

$$
\mathbb{E}[N]
=
1+\alpha+\alpha^2+\cdots+\alpha^\gamma
=
\frac{1-\alpha^{\gamma+1}}{1-\alpha}.
$$

If one draft step costs a fraction $c$ of one target decoding step and verification costs approximately one target step, the idealized speedup is

$$
S(\gamma)
=
\frac{1-\alpha^{\gamma+1}}
{(1-\alpha)(1+\gamma c)}.
$$

This formula explains why:

- higher target–draft overlap raises speedup;
- a slower but more accurate drafter may lose to a cheaper drafter;
- extending the draft eventually has diminishing returns;
- the best $\gamma$ depends on the workload and hardware.

In a real engine, verification is not exactly one ordinary decode step, acceptance varies by position, and synchronization, kernels, batching, and cache operations matter. Measure end-to-end time.

## 5. Why Tree Drafting Helps

A linear draft loses every token after the first rejection. A draft tree preserves alternative continuations.

```text
                         fox
                    /     |      \
                 jumps   runs    sleeps
                /   \      \
              over  high   away
```

The target can verify all nodes in one flattened sequence if:

- each node receives a position ID matching its depth;
- its attention mask exposes only the shared prefix and its own ancestors;
- siblings and unrelated branches cannot attend to one another.

For example, `over` may attend to the accepted prefix, `fox`, `jumps`, and itself—but not `runs` or `away`.

The mask for flattened nodes is

$$
M_{ij}=
\begin{cases}
0 & \text{if node }j\text{ is an ancestor of node }i\text{ or }i=j,\\
-\infty & \text{otherwise.}
\end{cases}
$$

Tree verification exchanges more target-side tokens for a better chance of finding a long valid path. A larger tree can therefore improve latency at low concurrency yet harm throughput when verification tokens consume scarce batch capacity.

## 6. Historical Progression

![History of speculative decoding architectures](/attachments/ai/inference-serving/speculative-decoding/speculative-decoding-history.svg)

### 2018: blockwise parallel decoding

Stern, Shazeer, and Uszkoreit trained multiple predictors for future offsets and accepted the longest prefix validated by the base model. It preserved greedy decoding in its exact setting and established the central “predict a block, validate a prefix” pattern.

### 2022–2023: exact speculative decoding and sampling

Leviathan, Kalman, and Matias introduced the modern exact rejection-sampling algorithm in late 2022; Chen et al. independently developed speculative sampling shortly afterward. These methods made stochastic acceleration distribution-preserving and applicable to existing target models with a separate small drafter.

### 2023–2024: trees and self-drafting heads

SpecInfer organized candidates from one or more small models into a token tree and verified its paths in parallel. Medusa removed the separate draft backbone by attaching several lightweight heads to the target's final hidden state; the heads predict different future offsets and form a sparse candidate tree.

### 2024: native MTP and feature autoregression

Independent multi-token-prediction heads provide parallel future guesses but do not condition later positions on the guesses sampled earlier in the block.

DeepSeek-V3 instead used sequential MTP modules. Each module combines the preceding prediction-depth representation with the embedding of the preceding future token, preserving a causal chain across depths. The report used one additional MTP depth at inference and reported an 85–90% acceptance rate for the extra token and 1.8× tokens per second in its setting.

EAGLE moved drafting from discrete tokens to target hidden features. It predicts the target's second-to-top-layer feature autoregressively, while conditioning on the actually sampled token to resolve feature uncertainty.

### 2024–2025: dynamic trees and scalable feature reuse

EAGLE-2 observed that acceptance depends on context, not only tree position. It expands and reranks a dynamic draft tree using calibrated draft confidence rather than spending a fixed node budget everywhere.

EAGLE-3 removed the feature-regression constraint, predicts draft tokens directly, fuses features from multiple target layers, and trains later rollout steps on earlier model-generated draft states (“training-time test”). This reduces the train–inference mismatch and lets performance improve with more drafter training data.

### 2026: parallel block drafting

DFlash replaces sequential drafting with a small block-diffusion model. It predicts a masked token block in one parallel forward pass, conditioned on fused target features injected as keys and values into every draft layer.

DFlash2 adds local dynamic causal convolutions and a low-rank candidate-path selector to improve within-block consistency while keeping the heavy draft pass parallel. As of September 2026, public implementations and a technical blog describe it, but there is no corresponding peer-reviewed paper; reported results should be interpreted with that maturity level in mind.

DSpark combines a DFlash-style parallel backbone with a very cheap sequential transition head, a confidence head, and hardware-aware verification scheduling. It addresses both suffix coherence and production throughput.

## 7. Architecture Taxonomy

| Family | Proposal dependency | Target reuse | Main strength | Main limitation |
| --- | --- | --- | --- | --- |
| Separate small LM | Autoregressive | None | Easy baseline; no target retraining | Extra weights/KV cache; draft latency scales with $\gamma$ |
| Prompt/ngram lookup | Retrieved continuation | Prompt tokens | Almost free; strong for repetitive text | Works only when useful repeats exist |
| Medusa heads | Parallel independent offsets | Final hidden state | Lightweight and parallel | Weak dependency between future positions |
| Native chained MTP | Sequential modules | Shared target embedding/head | Learned during pretraining; causal lookahead | Fixed modules/horizon; sequential cost |
| EAGLE/EAGLE-2 | Autoregressive features | Top target features | High-quality flexible drafting | Serial draft loop and tree cost |
| EAGLE-3 | Autoregressive tokens | Multi-layer feature fusion | Better scaling and train–test alignment | Still serial over draft depth |
| DFlash | Parallel block | Multi-layer target KV injection | One draft pass; deeper drafter is affordable | Independent slots cause suffix decay |
| DFlash2 | Parallel block + cheap path walk | Same as DFlash | Better local mixing and candidate selection | Public training recipe is not fully established |
| DSpark | Parallel backbone + serial Markov/RNN head | Same as DFlash | Parallel capacity plus local coherence | More components; calibration and scheduling complexity |

Classic two-model drafting usually assumes the same tokenizer and vocabulary. This is an engineering requirement of the simple token-wise algorithm, not a fundamental law: vocabulary-translation schemes exist, but retokenization boundaries and probability accounting make exact implementation substantially harder.

## 8. Medusa and Multi-Token Prediction

### Medusa

Medusa attaches heads $h_1,\ldots,h_K$ to the target's final hidden state. Head $h_j$ predicts the token $j$ positions ahead. Taking several top candidates from each head creates a sparse tree.

The key advantage is reuse: there is no second full model or separate drafter prefill. The limitation is conditional independence—head $h_3$ does not naturally observe the actual token sampled by $h_1$ before making its prediction.

Medusa-1 freezes the target and trains only the heads, allowing exact target verification. Medusa's relaxed “typical acceptance” variant admits more candidates but does not preserve the target distribution in the same strict sense; lossless and relaxed modes must not be conflated.

### Independent versus chained MTP

Independent heads predict

$$
q_j(x_{t+j}\mid h_t)
$$

in parallel. Chained MTP instead represents

$$
q_j(x_{t+j}\mid h_t,x_{t+1:t+j-1}),
$$

so later predictions use earlier future tokens. The chain is more coherent but adds sequential work.

MTP may serve two roles:

1. an auxiliary pretraining loss that encourages planning and denser supervision;
2. a deployment-time drafter for speculative decoding.

Those claims should be evaluated separately: a training objective can improve the base model even if its serving implementation is not the fastest drafter.

## 9. The EAGLE Family

### EAGLE: feature-level autoregression

Tokens are discrete and multimodal, while hidden features offer a continuous prediction target. EAGLE predicts the next second-to-top-layer target feature, then passes it through the frozen target LM head to obtain draft logits.

A feature alone is uncertain because several next tokens may be plausible. EAGLE therefore conditions the next feature prediction on both:

- the previous predicted feature;
- the token actually sampled from that feature.

The token selects the discrete branch; the feature carries rich target state.

### EAGLE-2: spend nodes where confidence is high

A static tree assumes every context deserves the same branching pattern. EAGLE-2 uses cumulative path confidence to expand promising nodes and select the final verification tree. Obvious continuations stay narrow; ambiguous positions receive branches.

### EAGLE-3: optimize the real rollout

EAGLE-3 makes three important changes:

1. remove direct feature-regression loss and optimize token prediction;
2. fuse lower, middle, and upper target-layer features;
3. expose training to model-generated intermediate draft states, not only teacher-forced states.

The last point is analogous to training on the states the drafter will encounter during recursive inference. It reduces compounding distribution shift across draft steps.

## 10. DFlash: Parallel Drafting

DFlash starts each block from an **anchor**, the last authoritative target token. The remaining positions are mask embeddings. A small bidirectional draft stack predicts all future positions simultaneously.

The target's hidden features are critical. DFlash:

1. extracts hidden states from several target layers for every verified prefix position;
2. concatenates and projects them into the draft width;
3. injects the projected sequence into the key/value context of every draft layer;
4. processes the anchor and masks with bidirectional within-block attention;
5. reuses the target embedding and LM head to produce draft logits.

Injecting target features into every layer avoids the dilution that occurs when context is supplied only as the bottom-layer input. Because all block positions run together, DFlash can afford a deeper draft network without paying one forward pass per proposed token.

### Training

The target is frozen. Training examples are generated or scored by the target, and random response positions become clean anchors. Tokens after each anchor are masked to form blocks. The drafter predicts the masked continuation while attending to the corresponding target features.

Early draft errors invalidate the suffix, so DFlash uses position-decayed loss weights such as

$$
w_k=\exp\left(-\frac{k-1}{\gamma}\right).
$$

The main weakness is slot independence. Every position sees the other mask representations but not the concrete token sampled at earlier positions. Marginally plausible tokens can combine into an incoherent path, producing suffix decay.

## 11. DSpark

![DSpark speculative decoding architecture](/attachments/ai/inference-serving/speculative-decoding/dspark-architecture.svg)

DSpark is best understood as three coordinated optimizations:

$$
\text{latency per committed token}
\approx
\frac{T_{\text{draft}}+T_{\text{verify}}}
{\text{committed tokens}}.
$$

It attacks every term: a parallel backbone keeps drafting cheap, a sequential head raises accepted length, and a scheduler avoids wasteful verification.

### 11.1 Parallel backbone

The backbone follows DFlash. It consumes an anchor plus mask slots, uses fused target features through KV injection, and emits hidden states $h_k$ and unary logits $U_k(v)$ for all positions in one forward pass.

In DSpark's formulation, the anchor position is also used to predict the first draft token, so an input of one anchor plus $\gamma-1$ masks yields $\gamma$ proposals.

### 11.2 Lightweight sequential head

Instead of rerunning the draft Transformer for each position, DSpark performs only a cheap left-to-right adjustment of the already-computed unary logits:

$$
p_k(v\mid x_{<k})
\propto
\exp\left(U_k(v)+B_k(x_{<k},v)\right).
$$

The default Markov head uses only the preceding sampled token:

$$
B(x_{k-1},\cdot)
=
W_1[x_{k-1}]W_2,
$$

where $W_1\in\mathbb{R}^{V\times r}$ and $W_2\in\mathbb{R}^{r\times V}$ form a low-rank approximation to a $V\times V$ transition table. The paper uses $r=256$ by default.

This head can turn independently plausible marginals such as `of problem` and `no course` into coherent conditional sequences such as `of course` and `no problem`.

The paper also evaluates an RNN head that carries the whole within-block prefix. It brings only modest additional gains at longer blocks and is more complex to deploy, so the Markov head is the default.

### 11.3 Confidence head

For position $k$, the exact expected probability of accepting a draft proposal is the distribution overlap

$$
c_k^*
=
\sum_v\min(p_k^d(v),p_k^t(v))
=
1-\frac12\|p_k^d-p_k^t\|_1.
$$

DSpark trains a small sigmoid head to estimate the conditional survival probability $c_k$ from backbone state $h_k$ and the previous-token Markov embedding:

$$
c_k
=
\sigma\left(w^\top[h_k;W_1[x_{k-1}]]\right).
$$

It uses binary cross-entropy against the soft label $c_k^*$. The estimated probability that the prefix through position $j$ survives is

$$
a_j=\prod_{i=1}^{j}c_i.
$$

Because products amplify calibration error, DSpark applies sequential temperature scaling on held-out data. Ranking confidence is not enough; the scheduler needs trustworthy probability magnitudes.

### 11.4 Hardware-aware prefix scheduler

Verifying a long block is cheap when the engine is lightly loaded but consumes valuable batch slots under high concurrency. DSpark profiles the target engine's steps-per-second curve $\operatorname{SPS}(B)$ as a function of verification batch size $B$.

Across active requests, it considers extra draft positions in descending prefix-survival probability and estimates throughput:

$$
\Theta
=
\text{expected committed tokens per step}
\times
\operatorname{SPS}(B).
$$

It extends per-request verification prefixes while $\Theta$ improves, then stops. Under low load it can verify longer speculative suffixes; under high load it reserves capacity for proposals with higher expected return.

The prefix constraint is essential: position $j$ cannot be verified as useful without earlier positions. Scheduler implementations must preserve per-request causal prefixes and avoid decisions that depend on information beyond the chosen truncation point.

### 11.5 What DSpark reported

On Qwen3 4B, 8B, and 14B offline evaluations, DSpark reported higher accepted length than both EAGLE-3 and DFlash. In live DeepSeek-V4 serving, it reported 60–85% faster per-user generation for V4-Flash and 57–78% for V4-Pro than an MTP-1 production baseline at matched aggregate throughput.

These are system-specific results, not portable constants. Hardware, kernels, model family, workload, concurrency, sampling settings, and service-level constraints determine realized speedup.

## 12. DFlash2 Versus DSpark

Both try to repair DFlash suffix decay while preserving a parallel backbone.

### DFlash2

- adds two-tap grouped dynamic causal convolutions around attention and MLP sublayers;
- mixes local neighboring features inside the block in parallel;
- keeps the top $K$ unary candidates per slot;
- uses a low-rank predecessor-conditioned selector to walk a coherent path through those candidate lists.

The selector score has the general form

$$
s_k(b\mid a)
=
U_k(b)
+
\left\langle
e_{\text{prev}}(a)\odot g(h_k),
e_{\text{next}}(b)
\right\rangle.
$$

The expensive backbone remains parallel; only a short candidate walk is sequential.

### DSpark

- adds a full-vocabulary Markov or RNN transition bias to unary logits;
- samples a causally factorized draft distribution;
- explicitly predicts and calibrates acceptance probability;
- schedules verification length using current hardware load.

DFlash2 focuses primarily on draft coherence and candidate selection. DSpark couples draft coherence to a production scheduling objective.

## 13. Implementation Roadmap

Implement in layers. Do not begin with DSpark.

### Stage 1: exact chain algorithm

Build speculative sampling with two small compatible causal LMs.

```python
while not finished:
    draft_tokens, draft_probs = draft(prefix, gamma)
    target_probs = verify_in_one_pass(prefix, draft_tokens)

    for i, token in enumerate(draft_tokens):
        ratio = target_probs[i][token] / draft_probs[i][token]
        if random_uniform() <= min(1.0, ratio):
            commit(token)
        else:
            residual = positive_part(target_probs[i] - draft_probs[i])
            commit(sample(normalize(residual)))
            break
    else:
        commit(sample(target_probs[gamma]))  # bonus token
```

First use full-precision probabilities and no exotic sampler. Optimize only after distributional tests pass.

### Stage 2: cache lifecycle

Track separate target and draft KV-cache lengths.

- Draft cache advances by $\gamma$ proposals.
- Target verification tentatively advances through the block.
- On rejection, trim both caches to the committed prefix.
- On full acceptance, retain the verified block and append the bonus-token state correctly.
- Never leave rejected suffix entries addressable by later tokens.

Cache rollback bugs may produce plausible but silently incorrect text.

### Stage 3: correctness tests

Test invariants before performance:

1. With $q=p$, every proposal should be accepted apart from numerical edge cases.
2. Under greedy decoding, output tokens must match ordinary target decoding exactly.
3. For a tiny categorical model, empirical output frequencies must match $p$ after many trials.
4. For short toy sequences, compare joint sequence frequencies—not only one-token marginals.
5. Fix RNG streams so baseline and speculative paths can be debugged reproducibly.
6. Test $q(x)=0$, $p(x)=0$, EOS inside the draft, top-k boundaries, and finite-precision normalization.

“The text looks the same” is not a distributional test.

### Stage 4: instrumentation

Record at least:

- accepted-prefix length histogram;
- conditional acceptance by draft position;
- target–draft total variation or overlap;
- draft, verification, sampling, synchronization, and cache-update latency;
- target verification tokens per committed token;
- tokens/s and inter-token latency by concurrency;
- memory consumed by draft weights and KV cache;
- results by domain, temperature, context length, and output length.

### Stage 5: trees

Implement flattened tree indices, depth-based position IDs, ancestor masks, node-to-parent arrays, and cache compaction. Compare extra accepted length with extra verification tokens. A correct tree that creates an expensive irregular kernel may still be slower than a chain.

### Stage 6: learned target-conditioned drafter

Freeze the target and collect:

- target-generated token sequences;
- target distributions or logits for soft supervision;
- hidden states from selected target layers;
- tokenizer and chat-template metadata.

Train on target outputs from the deployment domains. Drafter quality degrades under domain, sampling-temperature, and context-length shift.

### Stage 7: DFlash backbone

Implement:

1. multi-layer target-feature capture;
2. concatenation, projection, and RMS normalization;
3. per-layer KV injection;
4. anchor-plus-mask block construction;
5. bidirectional within-block attention with no cross-block leakage;
6. shared frozen embedding and LM head;
7. position-weighted token or distillation loss.

Validate target-feature indexing carefully: each block must see only information available at its anchor, never future clean target states.

### Stage 8: DSpark heads

Add the Markov head before the RNN head:

1. compute all unary logits $U_k$ once;
2. sample position 1;
3. look up its low-rank predecessor embedding;
4. add the transition bias to $U_2$ and sample;
5. repeat without rerunning the backbone.

Train the confidence head against exact overlap labels $1-\operatorname{TV}(p_k^d,p_k^t)$. Evaluate discrimination and calibration separately. Then calibrate cumulative prefix-survival probabilities on held-out target rollouts.

### Stage 9: scheduler and production engine

Profile $\operatorname{SPS}(B)$ on the actual engine and hardware. Implement per-request verification lengths, continuous-batching integration, GPU-resident metadata, CUDA-graph-compatible shapes, and asynchronous overlap where possible.

The final optimization target is a Pareto frontier over:

- per-user generation speed;
- aggregate throughput;
- tail inter-token latency;
- memory and operational complexity.

Optimizing acceptance length alone is insufficient.

## 14. Common Implementation Errors

- Comparing a draft token with the wrong shifted target logit.
- Sampling from $p$ instead of the residual $(p-q)_+$ after rejection.
- Applying temperature or truncation differently to stored and verified probabilities.
- Forgetting the bonus token when the entire block is accepted.
- Keeping stale KV entries after suffix rejection.
- Treating greedy token equality as proof of stochastic exactness.
- Allowing sibling leakage in a flattened tree attention mask.
- Using future target hidden states when training a target-conditioned drafter.
- Reporting acceptance rate without draft latency and verification-token cost.
- Benchmarking only batch size 1, only code, or only temperature 0.
- Assuming a larger draft block is free because its draft pass is parallel; verification still consumes tokens and memory.
- Calling a relaxed acceptance heuristic “lossless.”

## 15. How to Read Benchmark Claims

Before comparing reported speedups, check:

| Question | Why it matters |
| --- | --- |
| What is the baseline implementation? | A weak baseline inflates speedup |
| Greedy or stochastic sampling? | Acceptance behavior changes with entropy |
| What hardware and numerical format? | Kernel and bandwidth balance changes |
| What batch size/concurrency? | Speculation often helps latency more than saturated throughput |
| What does $\tau$ include? | Papers use different acceptance-length conventions |
| Same target outputs/distribution? | Relaxed verification can trade quality for speed |
| Are drafter and scheduler costs included? | Algorithmic acceptance is not wall-clock speed |
| Which workload and context length? | Code, chat, reasoning, and long context behave differently |
| How many verification tokens? | Large trees or blocks can waste serving capacity |

There is no universally fastest drafter. Speculative decoding is a joint model–algorithm–kernel–scheduler problem.

## Key Takeaway

The invariant across the entire history is simple:

> Guess future tokens cheaply, verify them in parallel with the authoritative model, and commit only what an exact verifier permits.

Progress comes from improving three quantities:

$$
\boxed{
\text{draft faster}
\quad+
\text{accept longer}
\quad+
\text{verify smarter}
}
$$

Separate small models addressed the first version of the problem. Trees made verification robust to branching. Medusa and MTP moved lookahead into the model. EAGLE exploited target features. DFlash parallelized the heavy draft computation. DSpark adds just enough sequential dependency for coherence and schedules verification according to its expected return under real serving load.

## Related

- [LLM Decoding: Top-k Sampling and Temperature](/atlas/ai/inference-serving/decoding/llm-decoding-top-k-sampling-and-temperature)
- [KV Cache](/atlas/ai/inference-serving/caching/kv-cache)
- [Large Language Model Serving](/atlas/ai/inference-serving/serving-architectures/large-language-model-serving)
- [LLM Inference Economics](/atlas/ai/inference-serving/performance/llm-inference-economics)
- [Roofline Model](/atlas/systems/performance/roofline-model)
- [Kimi K3: Open Frontier Intelligence](/atlas/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence)
- [Gemma 4 Technical Report](/atlas/ai/architectures/model-reports/gemma-4-technical-report)

## Sources

- Stern, Shazeer, and Uszkoreit, [Blockwise Parallel Decoding for Deep Autoregressive Models](https://arxiv.org/abs/1811.03115) (2018)
- Leviathan, Kalman, and Matias, [Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) (2022/2023)
- Chen et al., [Accelerating Large Language Model Decoding with Speculative Sampling](https://arxiv.org/abs/2302.01318) (2023)
- Miao et al., [SpecInfer: Accelerating Generative LLM Serving with Tree-based Speculative Inference and Verification](https://arxiv.org/abs/2305.09781) (2023/2024)
- Cai et al., [Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) (2024)
- Li et al., [EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) (2024)
- Li et al., [EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees](https://arxiv.org/abs/2406.16858) (2024)
- DeepSeek-AI, [DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) (2024)
- Li et al., [EAGLE-3: Scaling up Inference Acceleration via Training-Time Test](https://arxiv.org/abs/2503.01840) (2025)
- Chen, Liang, and Liu, [DFlash: Block Diffusion for Flash Speculative Decoding](https://arxiv.org/abs/2602.06036) (2026)
- Cheng et al., [DSpark: Confidence-Scheduled Speculative Decoding with Semi-Autoregressive Generation](https://arxiv.org/abs/2607.05147) (2026)
- Z Lab, [DFlash code and models](https://github.com/z-lab/dflash)
