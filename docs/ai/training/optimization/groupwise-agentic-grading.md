---
title: "Groupwise Agentic Grading"
date: 2026-09-22
lastmod: 2026-09-22
tags:
  - ai/training
  - reinforcement-learning
  - agents
  - reward-modeling
draft: false
---

## Summary

Binary verifiers answer a necessary question:

$$
\text{Did the agent complete the task?}
$$

They do not answer:

$$
\text{Among successful agents, which solution should be reinforced most?}
$$

This becomes a serious limitation in group-relative RL. If every rollout passes, all binary rewards are equal and the group advantage is zero. If tests are incomplete, a brittle workaround can receive the same reward as a precise, maintainable solution.

MiMo-V2.6 introduces **groupwise agentic grading** to preserve binary outcomes as the correctness anchor while extracting additional signal from differences among trajectories. It uses two complementary methods:

- **Groupwise Reward Synthesis (GRS):** build task-specific rubrics offline and use them to refine rewards online.
- **Groupwise Advantage Redistribution (GAR):** compare a group online and redistribute existing positive advantage toward better passing solutions.

The important design principle is:

$$
\text{learned quality judgment}
\quad\text{refines but does not replace}\quad
\text{executable correctness}
$$

## Concepts

- **All-pass group:** every sampled response receives the same successful binary reward, so group-normalized advantages vanish.
- **Solution rubric:** task-specific criteria for implementation quality, edge cases, precision, and consistency with the surrounding system.
- **Behavior rubric:** criteria for the agent's process, such as gathering evidence and verifying its changes.
- **Advantage conservation:** redistributing learning weight among passing trajectories without increasing total positive advantage.
- **Confirmed-hack correction:** resetting a trajectory's effective reward to zero before group statistics are computed.
- **Prompt-mean loss:** average tokens within each response before averaging responses, preventing long trajectories from dominating.

## 1. Why binary reward becomes insufficient

Let a prompt produce $G$ trajectories with binary rewards $R_i\in\{0,1\}$. A simple group-relative advantage is:

$$
A_i
=
R_i-\bar{R}
$$

If all trajectories pass:

$$
R_1=\cdots=R_G=1
\quad\Rightarrow\quad
A_1=\cdots=A_G=0
$$

The task may still contain useful differences:

- one patch is minimal while another rewrites unrelated code
- one agent verifies edge cases while another merely satisfies visible tests
- one solution is robust while another swallows exceptions
- one trajectory uses leaked artifacts or an unintended shortcut
- one agent reaches the answer in ten turns and another in fifty

Binary reward therefore saturates before the policy has exhausted the task's learning value.

## 2. Two places to spend grader compute

Groupwise grading can happen offline or online:

| Method | When | Unit of judgment | Main advantage |
| :--- | :--- | :--- | :--- |
| GRS | Before RL | Several attempts used to build one task rubric | Rubric cost is amortized and all-pass groups remain useful |
| GAR | During RL | The current rollout group | Direct comparison using current policy behavior |

They solve related but different problems. GRS compiles grader reasoning into a reusable reward function. GAR keeps the grader in the loop and adapts to newly emerging behavior.

## 3. Groupwise Reward Synthesis

### Offline phase

For one task, collect several diverse attempts and give a rubric-building agent:

- the task specification
- the repository or environment
- the attempts and their outcomes
- relevant execution evidence

The attempts are not treated as ground truth. They help expose:

- alternative valid approaches
- recurring failure modes
- edge cases
- quality dimensions distributed across several solutions

The grader produces two reusable rubric families.

**Solution rubrics** evaluate the resulting artifact:

- satisfaction of requirements
- edge-case handling
- appropriate scope
- compatibility with surrounding code or data
- absence of unrelated changes

**Behavior rubrics** evaluate the trajectory:

- whether the agent gathered relevant evidence
- whether it tested the effects of its changes
- whether it recovered correctly from mistakes
- whether it used tools and the environment appropriately

### Online phase

Each new trajectory is graded independently against the cached task rubrics. If $R_i^{\text{test}}$ is the executable outcome, $S_i^{\text{sol}}$ the solution score, and $S_i^{\text{beh}}$ the behavior score:

$$
R_i
=
R_i^{\text{test}}
S_i^{\text{sol}}
S_i^{\text{beh}}
$$

The multiplicative form gives the executable verifier veto power:

$$
R_i^{\text{test}}=0
\quad\Rightarrow\quad
R_i=0
$$

A fluent grader cannot rescue a failing implementation. Among passing implementations, however, the rubric provides a continuous quality signal.

### Why synthesize from a group?

One successful solution does not reveal the full task. A group lets the rubric builder compare trade-offs and discover criteria that no single trajectory demonstrates completely.

The rubric should still be grounded in the specification. Otherwise, an incidental choice made by one good solution can become a false requirement for every future solution.

## 4. Groupwise Advantage Redistribution

GAR applies when the current group contains mixed outcomes and an online grader can compare the complete evidence.

The grader receives a shared workspace containing:

- task specification
- repository or environment state
- candidate patches or deliverables
- test outputs
- trajectory evidence

It first checks for hacks or leaked answers. Confirmed hacks receive effective reward zero before the group mean is recomputed.

It then ranks the passing solutions along five dimensions:

1. suitability of the approach
2. precision without omissions or unnecessary fallback behavior
3. minimality relative to the required change
4. avoidance of unintended effects
5. craftsmanship and consistency with the codebase

### Redistribution rule

Let:

$$
A_i=R_i-\bar{R}
$$

and define the passing set:

$$
\mathcal{P}=\{i:R_i=1\}
$$

The grader assigns quality factors $f_i\in(0,1]$ to passing trajectories. Lower-quality passes are downweighted. A common factor restores the removed positive mass:

$$
\lambda
=
\frac{\sum_{j\in\mathcal{P}}A_j}
{\sum_{j\in\mathcal{P}}f_jA_j}
$$

$$
A_i'
=
\begin{cases}
\lambda f_i A_i, & i\in\mathcal{P}\\
A_i, & i\notin\mathcal{P}
\end{cases}
$$

Therefore:

$$
\sum_{i\in\mathcal{P}}A_i'
=
\sum_{i\in\mathcal{P}}A_i
$$

GAR changes **where** the positive learning pressure goes, not how much positive pressure the group contains. The implementation caps $\lambda$ to avoid extreme amplification, then subtracts the new group mean so the complete group again has zero-mean advantage.

## 5. Why simple downweighting is not enough

Suppose weak passing trajectories are multiplied by a quality score but strong trajectories are unchanged. Total positive advantage decreases while negative advantage does not.

This changes the positive/negative balance and can cause excessive entropy growth: the optimizer suppresses failed behavior more strongly than it reinforces any successful alternative.

Renormalization prevents the grader from unintentionally changing the effective reward scale:

$$
\text{quality ranking}
\neq
\text{arbitrary change in gradient mass}
$$

This is the subtle but important part of GAR.

## 6. Behavioral regularization below the trajectory level

A sequence-level outcome cannot identify which turn was responsible. Agent trajectories should therefore be represented hierarchically:

$$
\text{Sample}
\rightarrow
\text{Sequence}
\rightarrow
\text{Context}
\rightarrow
\text{Segment}
$$

Rules can flag local problems such as:

- malformed formatting
- unavailable or invalid tool calls
- repetition
- garbled token patterns
- infrastructure failures unrelated to the policy

The training effect depends on outcome sign.

### Positive trajectory

Flagged tokens should not receive positive reinforcement. Their loss is masked, and the removed positive mass is redistributed to clean positive tokens.

### Negative trajectory

Flagged tokens are more plausible causes of failure. Their negative advantage is amplified by a factor $\kappa>1$, while clean tokens receive less negative weight.

Both transformations preserve total sign-specific advantage mass when possible. This performs local credit assignment without training a full process reward model.

## 7. Length regularization without punishing hard tasks

Unconditional length penalties can suppress exploration on hard prompts. MiMo instead applies a group-relative penalty only when the group pass rate exceeds a threshold.

Among successful trajectories, a chosen length percentile becomes the reference. Responses longer than the reference plus a tolerance receive a smoothly increasing, capped penalty.

The effect is curriculum-like:

- difficult prompt with few successes: preserve exploration
- easy prompt with many successes: prefer shorter successful behavior

The comparison is local to the prompt, so naturally long tasks are not judged against globally short ones.

## 8. Prompt-mean aggregation removes another length bias

Even with equal sequence advantages, a token-mean over the complete batch lets long responses contribute more gradient terms.

MiMo averages tokens inside each response first:

$$
\ell_i
=
\frac{1}{|o_i|}
\sum_t \ell_{i,t}
$$

then averages the group:

$$
\mathcal{L}
=
\frac{1}{G}
\sum_i \ell_i
$$

Each sampled response therefore receives equal outer weight regardless of length. This is separate from the explicit length penalty: one fixes loss aggregation, the other expresses a preference for efficient successful behavior.

## 9. Asynchronous grading

Groupwise grading can be expensive because the grader may inspect code, execute tests, and compare several long trajectories. It should run outside the critical rollout path:

1. rollouts write heavy payloads to distributed storage
2. lightweight group metadata reaches the scheduler
3. graders inspect the shared group asynchronously
4. returned rewards overwrite the provisional group rewards
5. the sampler computes final advantages and decides whether to retain the group

If the grader fails or returns an invalid result, training falls back to the original advantages. This makes learned grading an optional refinement rather than a single point of failure.

## 10. Reward hacking defenses

An online grader does not eliminate reward hacking. It creates another system the policy may learn to exploit.

A robust stack includes:

- executable tests as the base reward
- hidden references and grading artifacts
- environment cleanup before rollout
- network isolation
- dedicated adversarial probing of environments
- offline audits of suspicious successes
- explicit grader authority to invalidate confirmed hacks
- monitoring hack rate by task source and training step

The sequence matters: hack correction must occur **before** computing the group mean. Otherwise, the hacked reward contaminates every trajectory's advantage.

## 11. Failure modes

### Grader preference replaces task correctness

If rubric scores can make a failed trajectory positive, the learned judge has become the true objective. Keep outcome reward multiplicative or otherwise enforce a hard correctness gate.

### Rubrics overfit sampled attempts

A rubric builder may turn incidental implementation choices into requirements. Ask it to ground criteria in the task and allow multiple valid approaches.

### Comparative bias amplifies small differences

When candidates are effectively tied, forcing a strict ranking adds noise. The grader should be able to declare ties, and $\lambda$ should be capped.

### Advantage scale silently changes

Naively multiplying positive advantages by quality scores weakens positive learning relative to negative learning. Conserve positive mass and re-center the group.

### Grader latency determines throughput

Synchronous group comparison can stall collection. Decouple payload storage, run grading asynchronously, and preserve a safe fallback.

### Better reward, worse policy

A grader may reward verbose demonstrations of process rather than efficient task completion. Monitor pass rate, turns, tokens, patch size, held-out performance, and hack incidence together.

## 12. Practical implementation recipe

1. Start with deterministic or executable outcome verification.
2. Sample groups large enough to contain meaningful behavioral diversity.
3. Measure the all-pass and all-fail rates by task source.
4. Use GRS where binary reward frequently saturates.
5. Use GAR where current-group comparison is worth its online cost.
6. Let the grader invalidate only evidence-backed hacks.
7. Conserve positive advantage mass during quality redistribution.
8. Re-center advantages after every correction.
9. Apply segment-level masks and shaping for localized errors.
10. Use prompt-relative length control only after the group demonstrates competence.
11. Average tokens within a response before averaging responses.
12. Audit held-out task quality and trajectory efficiency, not reward alone.

## Main takeaway

Groupwise grading turns a rollout group from a collection of scalar outcomes into a comparative dataset. The safest version keeps a clean separation:

$$
\boxed{
\text{verifier decides success}
\quad;
\text{grader allocates learning signal among successes}
}
$$

That separation makes learned judgment useful without handing it complete control of the objective.

## Related

- [MiMo-V2.6: Scaling RL Towards Self-Improvement](/atlas/ai/architectures/model-reports/mimo-v2-6-scaling-rl-towards-self-improvement)
- [Group Relative Policy Optimization](/atlas/ai/training/optimization/group-relative-policy-optimization)
- [Reinforcement Learning with Verifiable Rewards](/atlas/ai/training/optimization/reinforcement-learning-with-verifiable-rewards)
- [Why Sparse-Reward LLM RL Can Work](/atlas/ai/training/optimization/why-sparse-reward-llm-rl-can-work)
- [Agentic Training Data and Environment Synthesis](/atlas/ai/training/data/agentic-training-data-and-environment-synthesis)
- [Long-Horizon Agentic RL Infrastructure](/atlas/ai/training/optimization/long-horizon-agentic-rl-infrastructure)

## Sources

- LLM-Core Xiaomi, [MiMo-V2.6: Scaling Reinforcement Learning Towards Self-Improvement](https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL/blob/main/MiMo_V2_6_technical_report.pdf)
