---
title: "LLM Text Watermarking with SynthID-Text"
date: 2026-08-22
lastmod: 2026-08-22
tags:
  - ai/serving
  - ai/llm
  - decoding
  - watermarking
draft: false
---

## Summary

An LLM text watermark is a **statistical signature in the generated token choices**. It is not metadata, a hidden Unicode character, or a recognizable writing style.

SynthID-Text embeds this signature by replacing ordinary next-token sampling with a keyed sampling procedure. A detector that knows the secret key can reconstruct the expected token scores and aggregate them over a passage, without access to the prompt or the LLM itself.

The watermark is therefore:

- preserved by copy and paste because it is encoded in the words themselves;
- probabilistic rather than definitive proof;
- easier to detect in long, high-entropy text;
- weakened by rewriting, paraphrasing, translation, and other token-level edits.

Anthropic announced that future Claude models will use a version of SynthID-Text. The result indicates that Claude was involved in producing or editing a passage, not that Claude originated its ideas or wrote the entire document.

## 1. Where the Watermark Is Added

At decoding step $t$, an autoregressive LLM produces a next-token distribution

$$
p_{\text{LM}}(x_t \mid x_{<t}).
$$

Temperature, top-k, or top-p may first transform this distribution. Ordinary decoding then samples the next token from it.

A generative watermark modifies only this last sampling stage:

$$
\text{logits}
\rightarrow
\text{temperature/top-k/top-p}
\rightarrow
\boxed{\text{keyed watermarked sampling}}
\rightarrow
x_t.
$$

It therefore requires no retraining and adds no extra tokens to the output. The signal is carried by *which plausible tokens are selected*.

This is fundamentally different from a post-hoc AI detector. A post-hoc detector tries to infer authorship from naturally occurring properties of text; a watermark deliberately creates a secret, testable statistical correlation during generation.

## 2. The Three Components

SynthID-Text consists of three parts:

1. A **random seed generator** derives a pseudorandom seed from a secret key and the recent token context.
2. A **sampling algorithm** uses that seed to correlate the selected token with the secret key.
3. A **scoring function** measures those correlations in a completed passage.

In the paper's main configuration, the seed at position $t$ is a keyed hash of the previous $H=4$ tokens:

$$
r_t = h(x_{t-H}, \ldots, x_{t-1}, k),
$$

where $k$ is the watermark key.

The context is important. The same candidate token receives unrelated pseudorandom scores after different preceding tokens. This prevents the watermark from reducing to a fixed list of preferred words.

## 3. Tournament Sampling

SynthID-Text uses **Tournament sampling** to select the next token.

For $m$ tournament layers:

1. Sample $2^m$ candidate tokens independently from $p_{\text{LM}}$. Candidates may repeat.
2. Use the keyed seed to assign every candidate a pseudorandom value under each watermark function $g_1, \ldots, g_m$.
3. Pair the candidates. In the first layer, the candidate with the larger $g_1$ value wins each pair; ties are broken randomly.
4. Pair the survivors and repeat with $g_2$, then $g_3$, and so on.
5. Emit the final survivor as $x_t$.

For example, three layers begin with $2^3=8$ sampled candidates:

$$
8 \xrightarrow{g_1} 4 \xrightarrow{g_2} 2 \xrightarrow{g_3} 1.
$$

Every competitor was sampled from the model distribution, but the key determines which competitors tend to survive. Across many positions, emitted tokens consequently have unusually high keyed scores.

### Not Just a Fixed Random Seed

Making ordinary sampling deterministic with a secret seed would make a response reproducible, but it would not give a cheap detector enough information to evaluate arbitrary text: the detector would need the original prompt and would have to rerun the LLM to reproduce its probability distributions.

Tournament sampling instead creates a correlation that can be recomputed directly from the observed tokens and their local contexts. That is the essential reason detection does not require the LLM.

## 4. Why It Can Preserve the Token Distribution

Choosing the higher pseudorandom score sounds as though it must favor certain words. However, the scores are random with respect to token identity when the key-derived seed is unknown.

With two competitors per match, the non-distortionary configuration preserves the original next-token distribution when averaged over the sampling randomness. Intuitively, if

$$
X_1, X_2 \sim p_{\text{LM}},
$$

and each candidate is equally likely to win under an independent random ranking, then the winner still has marginal distribution $p_{\text{LM}}$.

This does **not** mean that watermarked and unwatermarked runs produce the same text. It means the individual output distribution is preserved while correlations across token choices carry the signal. Repeated-context masking is used to retain the non-distortion property when the same local context occurs more than once.

SynthID-Text can also use a distortionary configuration with more competitors per match. That strengthens detectability, but introduces a quality and diversity tradeoff.

## 5. Detection Without the LLM

Given a candidate passage, the detector:

1. tokenizes it with the expected tokenizer;
2. reconstructs the keyed seed from each local context;
3. recomputes the token's values under the watermark functions;
4. aggregates evidence across positions and tournament layers;
5. compares the resulting score with a decision threshold.

A simplified mean score is

$$
S(x_{1:T}) = \frac{1}{mT'}
\sum_{t \in \mathcal{I}}
\sum_{\ell=1}^{m} g_\ell(x_t, r_t),
$$

where $\mathcal{I}$ is the set of usable positions and $T'=|\mathcal{I}|$. The paper also studies weighted, frequentist, and learned Bayesian scores.

Under unwatermarked text, the keyed values should resemble their random baseline. Under watermarked text, tournament winners accumulate systematically higher values. The detector measures this small bias over many tokens.

The threshold controls the usual statistical tradeoff:

- a lower threshold detects more watermarked passages but increases false positives;
- a higher threshold reduces false positives but misses more watermarked passages;
- the detector may abstain when there is insufficient evidence.

The output should therefore be interpreted as a likelihood or calibrated decision, not an infallible certificate.

## 6. Entropy Is the Watermark's Capacity

The watermark needs alternative plausible tokens through which it can encode a choice.

If the next-token distribution is nearly deterministic,

$$
p_{\text{LM}}(x^* \mid x_{<t}) \approx 1,
$$

almost every tournament candidate is $x^*$, so the key has little influence over the winner. That position carries little watermark evidence.

When several continuations are plausible, the tournament has meaningful choices and can embed a stronger signal. Consequently:

- long and open-ended prose is generally easier to detect;
- short answers provide too few observations;
- factual text, code, or low-temperature generation can offer less usable entropy;
- higher entropy creates more watermark capacity, although decoding quality still constrains how much randomness is desirable.

The watermark is thus distributed statistical evidence, not a bit hidden independently in every word.

## 7. What Editing Does

Because the seed depends on recent context, changing one token has two effects:

1. it replaces the keyed score at that position;
2. it changes the seeds, and therefore the expected scores, for several following positions.

Minor edits may leave enough untouched evidence for detection. More extensive transformations progressively scrub the signal:

- paraphrasing or rewriting with another model;
- translation and back-translation;
- replacing, inserting, or deleting many tokens;
- combining short fragments from different sources.

The watermark survives copy and paste because formatting is irrelevant, but it is not invariant to semantic rewriting. No text watermark can simultaneously constrain word choice and survive arbitrary replacement of those words.

## 8. What a Positive Result Actually Means

A positive Anthropic detector result would support the claim:

> This passage contains a statistical pattern consistent with text processed by a supported Claude model using Anthropic's key.

It does **not** by itself establish that:

- Claude originated the facts, argument, or creative ideas;
- every word was written by Claude;
- a particular user, organization, or conversation produced it;
- the text was produced entirely without human input;
- text with no detected watermark is human-written.

This distinction matters for editing and translation. A person may supply all of the original content, yet a sufficiently extensive Claude rewrite can leave a watermark because Claude selected the final tokens. Conversely, heavily edited Claude output may no longer be detectable.

The watermark carries no user identity. Attribution to a provider comes from possession of the corresponding secret detection key, not from personal information embedded in the passage.

## 9. Security and Deployment Limits

The secret key is part of the security boundary. Publishing it would let attackers attempt to forge high-scoring text or deliberately choose low-scoring tokens. Providers can instead expose a detection API, rate-limit queries, rotate keys, and calibrate thresholds internally.

Even with a secret key, generative watermarks are not a complete AI-detection system:

- providers must voluntarily implement compatible watermarking;
- decentralized open-weight deployments cannot easily be forced to use it;
- short or edited samples may yield false negatives;
- false-positive rates must be chosen and communicated carefully;
- stealing, spoofing, and scrubbing attacks remain active research problems.

Watermarks are best treated as one provenance signal alongside signed metadata, content credentials, platform records, and contextual evidence.

## 10. Claude's Deployment

Anthropic states that its text watermark is a version of the SynthID-Text approach. It is woven into token selection at the model level, so it is not removed by copying text between applications. Anthropic is implementing it for EU AI Act compliance and plans a detection API.

The rollout applies at launch to Claude models released on or after August 2, 2026, with support for earlier models being added during the legal transition period. This wording is about **model release dates**, so it should not be read as proof that every historical or currently available Claude response is already watermarked.

Files use a different mechanism: signed C2PA provenance metadata. Statistical text watermarking and file-level content credentials solve related but distinct problems.

## Key Takeaway

SynthID-Text turns the randomness already present in LLM decoding into a keyed statistical channel. Tournament sampling makes token choices correlate with a secret key while keeping them plausible; detection recovers that weak correlation across many tokens without rerunning the model.

Its strength is scalable, low-overhead provider attribution. Its weakness is intrinsic: evidence needs enough unchanged, sufficiently high-entropy text, and it fades as the words are rewritten.

## Related

- [LLM Decoding: Top-k Sampling and Temperature](/atlas/ai/inference-serving/decoding/llm-decoding-top-k-sampling-and-temperature)
- [Speculative Decoding](/atlas/ai/inference-serving/decoding/speculative-decoding)

## Sources

- [Anthropic: How Claude's text watermark works](https://www.anthropic.com/news/claude-text-watermark)
- [Dathathri et al.: Scalable watermarking for identifying large language model outputs](https://www.nature.com/articles/s41586-024-08025-4)
- [Google DeepMind: Watermarking AI-generated text and video with SynthID](https://deepmind.google/blog/watermarking-ai-generated-text-and-video-with-synthid/)

