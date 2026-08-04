---
title: "LLMs Can't Jump: Abduction and Scientific Invention"
date: 2026-08-04
lastmod: 2026-08-04
tags:
  - ai/foundations
  - llm
  - reasoning
  - scientific-discovery
  - world-models
draft: false
---

## Summary

*LLMs can't jump* is a position paper about a gap between solving a formally specified problem and inventing the concepts that make the problem solvable. It argues that current AI is strong at statistical induction and increasingly strong at deduction, but lacks **abduction**: generating a new explanatory hypothesis or axiom from sparse experience.

The paper uses Einstein's path to General Relativity as its central example. Once principles such as equivalence and general covariance are supplied, finding equations that satisfy them resembles constrained mathematical search. The harder act was inventing those principles when Newtonian mechanics still fit nearly all observations.

The useful conclusion is narrower than the title:

> Current discovery systems usually optimize candidates inside a human-specified representation, objective, and evaluator. Scientific invention can require creating or revising all three.

The paper does not experimentally or formally prove that Transformers cannot do this. It is best treated as a research framing and architectural proposal, not an impossibility result.

## 1. Einstein's discovery loop

The paper adopts a model that Einstein drew in a letter to Maurice Solovine:

```text
Sense experience E
       │
       │ intuitive jump J
       ▼
    Axioms A
       │
       │ logical deduction
       ▼
Consequences S
       │
       └── compared with experience
```

Logical deduction operates after the primitives and premises have been chosen. The jump from experience to axioms is not logically entailed by the observations; it proposes a way of representing and explaining them.

The paper maps this distinction to three modes of inference:

| Mode | Given | Produces | Typical computational analogue |
| --- | --- | --- | --- |
| Deduction | rule and case | result | execution, theorem proving, formal verification |
| Induction | cases and results | general rule | statistical learning, system identification, compression |
| Abduction | an outcome and background knowledge | plausible explanatory cause or hypothesis | hypothesis generation and inference to the best explanation |

Deduction preserves truth when its premises are true. Induction generalizes recurring relationships. Abduction is fallible and underdetermined: several hypotheses may explain the same observation, so priors, simplicity, causal structure, and experiment design matter.

## 2. Why General Relativity is the case study

When Einstein began developing General Relativity, Newtonian gravity was not failing across a large dataset. The equality of inertial and gravitational mass had strong empirical support, and Newtonian predictions were highly accurate. Mercury's anomalous perihelion was the prominent discrepancy, but an unseen planet such as the proposed Vulcan offered a comparatively local patch.

A learner driven only by immediate prediction error could therefore prefer repairing the existing theory. Curved spacetime initially expands the representational and mathematical search space rather than compressing a large collection of failed predictions.

Einstein instead pursued conceptual conflicts and physical principles:

- Newtonian action at a distance was uneasy beside field descriptions of electromagnetism.
- Special Relativity privileged inertial frames.
- Inertial and gravitational mass appeared equivalent.
- A satisfactory theory needed to recover Newtonian gravity in the weak-field limit.
- Conservation, covariance, and the role of energy constrained the possible equations.

His elevator and freely falling observer thought experiments gave physical meaning to the equivalence between gravity and acceleration. The paper treats this as **manipulative abduction**: construct a counterfactual experience, mentally intervene in it, notice an invariant relationship, and promote that relationship into a physical principle.

This separates two achievements:

1. **Premise generation:** formulate equivalence, geodesic motion, general covariance, stress-energy as a source, and the necessary limits.
2. **Downstream search:** find mathematical objects and field equations satisfying those requirements, then derive testable consequences.

Modern theorem provers and neuro-symbolic systems make the second increasingly plausible. Success at it does not by itself demonstrate the first.

## 3. Compression is powerful but incomplete

The paper challenges the view that scientific creativity is entirely compression progress: discovering a shorter program that predicts observations.

Compression explains much of data-rich discovery. Sparse regression can recover governing equations from trajectories, and learned systems can identify regularities that summarize many measurements. It is less obviously sufficient when:

- the existing theory already has low predictive error
- decisive observations do not yet exist
- a useful representation is initially more complex
- the search must invent a new variable, ontology, or experiment
- multiple theories explain the available evidence

Logical simplicity may also be retrospective. The final theory can be elegant even though reaching it required temporarily increasing complexity, exploring failed equations, and changing the language in which the problem was expressed.

This does not mean that compression is irrelevant. A broader system can use compression, consistency, invariance, explanatory scope, and causal intervention as complementary selection principles. The paper establishes tension with a narrow prediction-error account, not a proof that learning or compression cannot produce new concepts.

## 4. The proposed mechanism: interactive world models

The paper proposes physically grounded, action-controllable world models as a substrate for abduction.

```text
observation or conceptual tension
              ↓
invent a counterfactual situation
              ↓
intervene in an interactive world model
              ↓
observe invariants and causal changes
              ↓
propose concepts and explanatory hypotheses
              ↓
translate them into formal axioms
              ↓
deduce consequences and design tests
              └───────────────────────────↺
```

The important distinction is not language versus video, but **passive prediction versus intervention**.

A video model may generate a falling object because this continuation is common in its data. An inventive agent needs to vary mass, support, acceleration, frame of reference, or the presence of a field; inspect what changes; and distinguish a causal invariant from a visually plausible continuation.

Action-controllable generative environments such as Genie point toward this capability. For scientific use, however, plausible pixels are insufficient. The environment must preserve the relevant physics under interventions and expose uncertainty when it cannot.

The unsolved bridge is:

```text
latent or perceptual simulation
              ↓
candidate invariant or concept
              ↓
formal symbol, axiom, and test
```

Calling this bridge manipulative abduction identifies the missing computation but does not yet specify an implementable learning algorithm.

## 5. Implications for AI scientist systems

Most automated discovery systems receive substantial structure from humans:

- the objects that candidates may contain
- the programming or mathematical language
- the target metric
- the simulator or theorem checker
- the experimental budget
- the definition of success

They implement a loop such as:

```text
generate candidate → evaluate candidate → improve candidate
```

That loop can produce valuable and genuinely novel results. A more radical scientific system may also need to operate one level above it:

```text
identify a conceptual limitation
          ↓
invent new variables, representations, or premises
          ↓
construct an evaluator or discriminating experiment
          ↓
search and verify inside the new framework
```

This suggests that evaluations of artificial scientists should report how much of the discovery problem was supplied. At minimum, distinguish whether the system generated:

1. a candidate solution
2. the hypothesis class
3. the representation or ontology
4. the objective or scientific question
5. the experiment and evaluator

A system that optimizes within a fixed framework and one that changes the framework demonstrate different capabilities, even when both produce a new artifact.

## 6. What the paper does not establish

### There is no impossibility result

The paper provides no theorem about Transformers, architectural limitation, controlled benchmark, or experiment with a model restricted to knowledge available before General Relativity. “Can't” is a deliberately strong title for a proposed capability gap.

Transformers can implement search, simulation interfaces, Bayesian-like inference, and tool use as components of larger systems. Whether the resulting system should still be called an LLM is less important than measuring which part supplies the capability.

### Induction and abduction overlap computationally

Inferring a rule from two to five examples can be described as abduction because evidence is sparse. It can also be described as Bayesian induction using a strong prior learned from earlier data. Pretraining supplies a large hypothesis prior even when the current task supplies few observations.

A useful empirical definition therefore needs to measure extrapolation beyond memorized representations, not decide capability from philosophical terminology alone.

### “No data” does not mean “no learning signal”

Einstein lacked a large supervised dataset showing that Newtonian gravity was wrong, but he had many constraints: consistency with Special Relativity, equivalence experiments, Mercury's orbit, conservation laws, covariance, and the Newtonian limit.

An artificial system can optimize internal consistency, invariance, information gain, explanatory breadth, novelty, or expected value of experiments without a large raw prediction error. The difficulty is defining and balancing these objectives, not the complete absence of an objective.

### Grounding is neither proven necessary nor sufficient

An interactive world model can learn shortcuts or incorrect physics. Conversely, a language-model agent connected to accurate simulators, instruments, causal discovery tools, and formal verifiers may achieve useful abduction without human-like embodiment.

The paper motivates active grounding, but does not show that sensory grounding alone creates new concepts or that language-based systems cannot do so.

### One historical episode cannot cover all invention

Scientific discoveries also emerge from instrument anomalies, large empirical datasets, mathematical analogies, combinatorial search, accidents, and engineering optimization. The appropriate simulation substrate differs by field: physical interaction for physics, formal structures for mathematics, and executable systems for computer science.

## 7. A more testable research formulation

The claim becomes productive when converted from “LLMs cannot jump” into measurable questions:

- Can a system discover a useful latent variable absent from its provided vocabulary?
- Can it propose competing causal explanations from sparse evidence?
- Can it design an intervention that separates those explanations?
- Can it translate a learned invariant into a formal rule?
- Can it recognize that the current evaluator rewards the wrong behavior?
- Can it construct a better evaluator and justify the change?
- Does the result survive controls for training-data contamination and recombination?

A historical-isolation benchmark could restrict a system to knowledge available before a discovery, hide later terminology, and require prospective predictions or experiments. Such a benchmark would still not prove metaphysical creativity, but it would test premise and representation generation more directly than conventional question answering.

## Practical Takeaways

- Do not equate theorem proving with scientific invention.
- Record which premises, representation, goal, and evaluator humans supplied.
- Use active interventions, not passive multimodal prediction alone, when causal structure matters.
- Treat hypothesis diversity and discriminating experiment design as first-class capabilities.
- Couple generative world models to formalization and verification rather than expecting either subsystem to suffice.
- Read the title as a research challenge, not a demonstrated architectural limit.

## Related

- [Prediction, Compression, and Entropy](/atlas/ai/foundations/prediction-compression-and-entropy)
- [Agentic Training Data and Environment Synthesis](/atlas/ai/training/data/agentic-training-data-and-environment-synthesis)
- [Hybrid Reasoning Models](/atlas/ai/architectures/hybrid-reasoning-models)

## Sources

- Tom Zahavy, [*LLMs can't jump*](https://philsci-archive.pitt.edu/28024/1/Scientific_Invention_Position_Paper%20%2817%29.pdf), 2026
- C. S. Peirce, *Collected Papers of Charles Sanders Peirce*, 1934
- Lorenzo Magnani, *Abductive Cognition: The Epistemological and Eco-Cognitive Dimensions of Hypothetical Reasoning*, 2009
- Joel Bruce et al., [*Genie: Generative Interactive Environments*](https://arxiv.org/abs/2402.15391), 2024
- Thomas Hubert et al., [*Olympiad-level formal mathematical reasoning with reinforcement learning*](https://www.nature.com/articles/s41586-025-09833-y), 2025
- Alexander Novikov et al., [*AlphaEvolve: A coding agent for scientific and algorithmic discovery*](https://arxiv.org/abs/2506.13131), 2025
- Jürgen Schmidhuber, [*Driven by Compression Progress*](https://doi.org/10.1007/978-3-540-87702-8_4), 2008
