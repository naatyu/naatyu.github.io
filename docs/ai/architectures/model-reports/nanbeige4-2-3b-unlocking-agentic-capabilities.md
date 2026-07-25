---
title: "Nanbeige4.2-3B: Unlocking Agentic Capabilities in a Compact Model"
date: 2026-07-25
lastmod: 2026-07-25
tags:
  - ai/llm
  - models
  - agents
  - looped-transformers
  - reinforcement-learning
draft: false
---

## Summary

Nanbeige4.2-3B is a compact general-purpose agent model with `3B` non-embedding parameters and about `4B` total parameters. It combines three ideas:

- a two-pass Looped Transformer pretrained from scratch on `28T` tokens
- large-scale synthesis of executable coding, tool-use, and office-agent trajectories
- a post-training pipeline that targets behavioral stability, reasoning efficiency, and long-horizon action quality separately

The architectural loop improves effective depth without storing another set of transformer layers, but it does not provide free computation. The shared stack is executed twice, and the final model keeps separate KV-cache state across the two passes because sharing the cache reduced quality.

The report's most reusable contribution may be its agent-training pipeline rather than the architecture. Tasks are grounded in executable environments, evolved from current model failures, generated through diverse agent scaffolds, and filtered at both trajectory and turn level. Reinforcement learning then combines outcome rewards, action-level process feedback, and difficulty-aware length control.

## Concepts

- **Looped Transformer:** a transformer that applies the same physical layer stack repeatedly, increasing effective computational depth without adding a new set of weights.
- **Physical depth:** the number of distinct stored layers.
- **Effective depth:** the number of layer applications after accounting for repeated passes.
- **Execution-grounded trajectory:** an agent interaction whose success can be checked in an actual or reconstructed environment.
- **Turn-level loss masking:** retaining a flawed turn and its consequences in the context while excluding that turn from the supervised loss.
- **Action-centric process reward:** intermediate feedback measuring whether an agent's individual actions are useful and correctly formed.

## 1. Model and objective

Nanbeige4.2-3B targets a different capability profile from the original [Nanbeige4-3B](/atlas/ai/architectures/model-reports/nanbeige4-3b-technical-report).

The earlier report concentrates on extracting reasoning ability from a small model using data filtering, FG-WSD, distillation, and multi-stage reasoning RL. Nanbeige4.2 retains the small-model objective but shifts the center of gravity toward:

- repository-level software engineering
- complex multi-tool workflows
- office and artifact production
- recovery over long interaction trajectories
- local personal-assistant deployment

The model has:

- approximately `4B` total parameters
- `3B` non-embedding parameters
- `28T` pretraining tokens
- a maximum context of `256K`
- thinking and non-thinking response modes

The released checkpoint configuration provides the architectural details omitted from the report's main text:

| Property | Value |
| :--- | ---: |
| Physical decoder layers | `22` |
| Loop passes | `2` |
| Effective layer applications | `44` |
| Hidden size | `3,072` |
| Intermediate size | `10,752` |
| Attention heads | `48` |
| KV heads | `8` |
| Head dimension | `128` |
| Vocabulary | `166,144` |

Its parameter count should not be mistaken for its compute cost. A looped model can have a small weight footprint while applying those weights multiple times per token.

## 2. Two-pass Looped Transformer

A standard stack applies each layer once:

$$
h^{(0)}
\xrightarrow{F_1}
\cdots
\xrightarrow{F_L}
h^{(1)}
$$

Nanbeige4.2 sends the result through the same stack again:

$$
h^{(0)}
\xrightarrow{F_{1:L}}
h^{(1)}
\xrightarrow{F_{1:L}}
h^{(2)}
$$

The second pass reuses the parameters of $F_{1:L}$. For the released checkpoint, `22` physical layers become `44` effective layer applications:

$$
\text{stored depth}=L,
\qquad
\text{effective depth}=2L
$$

This is recurrent depth in latent space. It is different from generating a longer textual chain of thought: both passes happen inside the forward computation used to predict a token.

### Train the loop from scratch

One possible route is:

1. pretrain an ordinary transformer
2. convert it into a looped model
3. continue training

The report calls this upcycling. Nanbeige instead trains the looped structure from initialization and reports that it performs substantially better.

The likely reason is distributional: from-scratch training lets every representation learn that it will be consumed by the same layers at a second effective depth. Adding the loop later asks a stack trained for one depth role to serve two roles suddenly.

### Why exactly two passes

The authors test different loop counts and choose two passes as the best trade-off:

- significant capacity gain relative to a standard transformer
- approximately `75%` of the standard model's token-processing efficiency
- marginal additional quality from more passes
- slower and less stable optimization with deeper recurrence

The report does not publish the complete loop-depth table, so the shape and scale of this trade-off cannot be independently inspected.

### KV-cache trade-off

Repeated depth creates an inference-memory question: should both passes have distinct KV-cache state?

Nanbeige compares:

- **shared cache:** both passes reuse KV state
- **full loop:** each pass keeps its own state

Sharing reduces KV-cache memory by half, but consistently produces smaller performance gains. Nanbeige4.2 therefore chooses the non-sharing configuration.

This exposes the real systems trade-off:

$$
\text{fewer unique weights}
\not\Rightarrow
\text{proportionally cheaper inference}
$$

Weight memory falls relative to an equally deep non-shared model, but sequential computation and cache storage remain substantial.

## 3. Pretraining

The `28T`-token corpus expands the previous Nanbeige mixture by increasing:

- mathematics
- code
- synthetic question answering
- STEM material

It also includes a small amount of agent-trajectory data. The authors treat this as an initial step toward learning agentic behavior during pretraining rather than introducing it entirely through post-training.

The implied non-embedding-parameter training density is:

$$
\frac{28T}{3B}
\approx
9{,}333
\text{ tokens per non-embedding parameter}
$$

This is another extreme example of inference-aware overtraining: spend heavily on data and training compute to obtain a small deployed model.

The base model improves substantially over Nanbeige4-3B-Base on the reported suite:

| Model | GSM8K | BBH | MBPP | MMLU-Pro | SuperGPQA | GPQA |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| Nanbeige4-3B | 85.9 | 70.7 | 60.7 | 47.6 | 24.8 | 36.2 |
| Nanbeige4.2-3B | **92.7** | **81.6** | **67.6** | **63.8** | **35.2** | **53.3** |

However, the report changes both architecture and data. It does not provide a matched-data comparison that isolates how much of the improvement comes from looping.

## 4. Agentic software-engineering data

The software-engineering pipeline converts historical repository activity into executable tasks.

### Repository to task

For a selected repository and reference patch:

1. check out the parent commit
2. reconstruct dependencies and test infrastructure
3. build a self-contained container
4. expose the unpatched repository and task description to the agent
5. keep the reference patch and grading tests hidden

The task must satisfy:

- **fail-to-pass tests:** fail before the reference patch and pass after it
- **pass-to-pass tests:** existing behavior continues to pass after the patch

This verifies that the task is both necessary and regression-safe.

### Evolve from model failures

The team runs the current model on seed tasks, categorizes recurring failure modes, and converts them into search cues for future repository and patch selection.

The data distribution therefore co-evolves with the model:

$$
\text{current failures}
\rightarrow
\text{new repository search}
\rightarrow
\text{new executable tasks}
\rightarrow
\text{new model}
$$

This is more targeted than continually sampling from a static pool.

### Scaffold diversity

The same tasks are attempted through several agent scaffolds, including:

- Claude Code
- OpenHands
- SWE-agent
- Codex-based drivers

The scaffolds differ in prompts, editing interfaces, and context-management policies. Aggregating their trajectories reduces the risk that the model learns one interface's accidental conventions instead of transferable search, debugging, and repair behavior.

Only patches that pass the target and regression tests are retained. Individual turns are additionally filtered for invalid tool calls, non-terminating loops, redundant actions, and context truncation.

## 5. Tool-use data from hybrid environments

Nanbeige constructs tool environments starting from thousands of Model Context Protocol specifications.

### Tool bundling

Tools are assessed for composability and grouped into bundles that can support multi-step tasks:

- search and retrieval
- data access
- repository operations
- code execution
- analysis and testing

### Three environment types

The pipeline combines:

1. **Local Python tools**
   Real data is collected and persisted locally, then exposed through executable Python functions.

2. **Live MCP services**
   Dynamic services such as search, scraping, and repository access remain online because static reconstruction would quickly become stale.

3. **Model-simulated tools**
   A model simulates services whose full runtime cannot be reproduced economically.

This hybrid design trades off reproducibility, realism, and scale. Simulated tools make synthesis cheap, while real and executable components prevent the entire task from becoming an ungrounded language exercise.

### Difficulty evolution

A task generator produces both:

- a natural-language instruction
- a Python verification function

A solver attempts the task several times. Tasks that are already solved reliably are made harder along dimensions such as:

- tool-chain depth
- parameter inference
- information-retrieval difficulty
- cross-tool composition

The objective is to keep data near the evolving capability frontier.

## 6. Artifact-centric office tasks

Office work is grounded in artifacts rather than abstract prompts. The source repository spans:

- documents
- slides
- spreadsheets
- code
- other structured files

Artifacts are clustered and sampled into coherent multi-file bundles. A synthesis agent explores each bundle inside a sandbox and produces:

- a task
- an evaluation rubric
- a tool-use trajectory
- final deliverable artifacts

An independent judge checks the deliverable against the task and rubric. Validated outputs are returned to the artifact repository as material for later synthesis rounds.

This recycling loop expands the task distribution over time, but it also risks self-reinforcing model-generated artifacts. Independent execution and rubric checks are therefore important quality gates.

## 7. Progressive SFT curriculum

SFT grows both context length and agent-data share:

| Stage | Context | Reasoning | General | Agentic |
| :--- | ---: | ---: | ---: | ---: |
| 1 | `64K` | `82.7%` | `11.6%` | `5.7%` |
| 2 | `128K` | `47.8%` | `22.7%` | `29.5%` |
| 3 | `256K` | `22.4%` | `8.7%` | `68.9%` |

The shares count supervised target tokens rather than examples. This matters because agent trajectories are much longer than ordinary QA samples.

The curriculum first establishes reasoning, then gradually shifts toward long-horizon interaction, tool feedback, and recovery. Context extension and capability specialization happen together.

### Turn-level loss masking

A successful trajectory can contain bad intermediate actions followed by recovery. Removing the bad turn and its observation would create an artificial history. Training on the bad action would teach the model to repeat it.

Nanbeige retains the full trajectory but assigns each assistant turn a binary mask:

$$
\mathcal{L}_{SFT}
=
\sum_t
m_t
\mathcal{L}_t,
\qquad
m_t\in\{0,1\}
$$

An unreliable action receives $m_t=0$. It remains visible to later turns, but contributes no imitation loss.

This preserves a useful distinction:

$$
\text{observe a mistake and its consequence}
\neq
\text{learn to produce the mistake}
$$

## 8. Two-stage RLHF for hybrid thinking

After SFT, the small model still exhibits:

- repetitive reasoning
- cyclic reflection
- delayed termination
- duplicated answers
- malformed formats
- abnormal continuations

Nanbeige applies a point-wise reward model that scores correctness, relevance, formatting, termination, safety, and user friendliness.

The first RLHF stage targets Think responses. The second focuses mainly on Non-Think general responses. Surprisingly, the behavioral regularization learned predominantly from Non-Think examples transfers back to Think mode.

This supports two interpretations:

1. repetition control and termination awareness are shared capabilities rather than response-mode-specific styles
2. RLHF can improve task success by preventing behavioral failures even when it adds no new domain knowledge

For example, on LiveCodeBench-V6, the reported progression is:

| Checkpoint | Accuracy | Bad-case rate | Average output tokens |
| :--- | ---: | ---: | ---: |
| SFT | 65.45 | 6.49 | 25,905 |
| Think RLHF | 68.51 | 0.95 | 16,781 |
| Non-Think RLHF | **72.10** | **0.00** | **15,182** |

All checkpoints are evaluated in Think mode. The gains therefore reflect cross-mode transfer rather than simply switching to shorter Non-Think inference.

## 9. Reasoning RL with length control

A global token penalty can suppress exploration on hard problems. Nanbeige instead builds a problem-specific budget.

For each problem $q$, collect historically correct responses and define:

$$
b_q
=
\operatorname{median}
\left\{
\text{length of correct historical rollouts for }q
\right\}
$$

During a constrained phase, a response of length $L_i$ receives:

$$
r_i
=
r_i^{base}
-
\alpha p_q
\left[
\frac{L_i-b_q}{L_{max}-b_q}
\right]_0^1
$$

where:

- $p_q$ is the fraction of correct responses in the current rollout group
- $\alpha$ bounds the maximum penalty
- $[x]_0^1$ clips $x$ to $[0,1]$

The design has three useful properties:

1. responses within the historical correct budget are never penalized
2. excess length is penalized more when the current policy already solves the problem reliably
3. hard problems retain room for longer exploration

Training alternates constrained phases with free-expansion phases where the length penalty is disabled. This prevents the policy from learning that short reasoning is always preferable.

## 10. Agentic RL with action-centric rewards

Long-horizon tasks make terminal rewards sparse. Nanbeige combines task-level outcomes with turn-level rubrics that measure:

- tool-call accuracy
- information gain from an action
- progress toward task completion
- recurring action errors

These process rewards improve credit assignment without replacing the final outcome check.

Data selection differs from the earlier Nanbeige reasoning-RL strategy. For agentic RL on a compact model, the team favors:

- shorter trajectories
- relatively high `pass@8`
- tasks that are already somewhat solvable

Hard, long-horizon agent tasks can produce feedback too sparse and unstable for a `3B` model. The learning frontier is therefore capability-dependent: reasoning RL may benefit from mixed outcomes, while agentic RL may need an easier starting distribution.

During training, the reported normalized single-turn error rate falls by about `20%`, while the validation score rises from `66.0` to a peak of `71.0`.

## 11. Results

Nanbeige4.2 is evaluated with a `256K` context. Code-agent runs allow up to `250` interaction turns, output limits of `32K`, and timeouts between four and ten hours. Most code-agent results are averaged over eight runs.

Selected results:

| Benchmark | Nanbeige4.2-3B | Qwen3.5-9B | Gemma4-12B |
| :--- | ---: | ---: | ---: |
| GDPval Rubrics | **74.3** | 61.9 | 68.5 |
| PinchBench-V2 | **74.7** | 68.2 | 53.8 |
| MCP-Atlas | **57.8** | 47.4 | 30.5 |
| SWE-Bench Verified | **63.6** | 53.1 | 44.2 |
| SWE-Bench Pro | **46.9** | 33.8 | 21.9 |
| Terminal-Bench 2.0 | **44.1** | 29.2 | 21.1 |
| GPQA-Diamond | **87.4** | 81.7 | 78.8 |
| LiveCodeBench-V6 | **72.5** | 65.6 | 72.0 |
| SciCode | 35.6 | 32.7 | **38.2** |
| IF-Bench | 54.6 | 54.1 | **73.5** |
| Recruit-Bench | 63.3 | 59.0 | **69.4** |

The model leads all reported general-agent and code-agent comparisons, but it does not dominate every reasoning and alignment task.

The complete RL pipeline also improves accuracy while reducing average output tokens on six reported benchmarks. This is stronger evidence than accuracy alone because it shows movement in both dimensions of the quality-cost trade-off.

## 12. What the report teaches

1. **Parameter count and computational depth are different resources.**
   Looping reduces unique weight storage, not the number of layer applications.

2. **Recurrent architectures should be pretrained recurrently.**
   Representations adapt better when reused depth is present from initialization.

3. **Agent data is an environment-construction problem.**
   The task, tools, state, verifier, and scaffold matter as much as the natural-language prompt.

4. **A trajectory can be useful without every action being imitable.**
   Turn-level masking preserves recovery contexts while excluding bad actions from the target.

5. **Behavioral RLHF can improve capability expression.**
   Preventing loops, malformed calls, and failure to terminate allows existing reasoning to complete tasks more reliably.

6. **Efficiency rewards should depend on competence.**
   Penalize excess reasoning aggressively only when the policy already solves the problem.

7. **Small agents may need easier RL tasks than small reasoners.**
   Long action horizons make sparse terminal rewards harder to learn from.

## 13. Limitations

The report leaves several important questions open:

- loop-depth and from-scratch comparisons are described without detailed numerical tables
- architecture and pretraining-data changes are not isolated
- the full training compute and serving cost are undisclosed
- separate KV caches weaken the apparent memory advantage at long context
- many task generators, reward systems, rubrics, and datasets are proprietary
- some evaluations use in-house harnesses or benchmarks
- several agent benchmarks rely on model judges
- maximum contexts, output budgets, timeouts, and turn limits are unusually large

Agent results depend on more than model weights:

$$
\text{agent score}
=
f(
\text{model},
\text{scaffold},
\text{tools},
\text{context policy},
\text{retry budget},
\text{judge}
)
$$

The paper often holds these settings constant across compared models, which is useful, but the resulting numbers should not be interpreted as scaffold-independent measures of intrinsic model quality.

## Related

- [Nanbeige4-3B Technical Report](/atlas/ai/architectures/model-reports/nanbeige4-3b-technical-report)
- [Looped Language Models (Ouro)](/atlas/ai/architectures/transformers/looped-language-models-ouro)
- [Sparse Layers in Looped Language Models](/atlas/ai/architectures/transformers/moe-looped-language-models)
- [Agentic Training Data and Environment Synthesis](/atlas/ai/training/data/agentic-training-data-and-environment-synthesis)
- [Reasoning Effort Control](/atlas/ai/inference-serving/performance/reasoning-effort-control)
- [Reinforcement Learning with Verifiable Rewards](/atlas/ai/training/optimization/reinforcement-learning-with-verifiable-rewards)
- [Progressive Context Extension](/atlas/ai/training/scaling/progressive-context-extension)
- [Overtraining and Inference-Aware Scaling](/atlas/ai/training/scaling/overtraining-and-inference-aware-scaling)
- [Nanbeige4.2-3B Technical Report](https://huggingface.co/Nanbeige/Nanbeige4.2-3B/blob/main/Nanbeige42_report.pdf)
- [Nanbeige4.2-3B configuration](https://huggingface.co/Nanbeige/Nanbeige4.2-3B/blob/main/config.json)
- [Nanbeige4.2-3B checkpoint](https://huggingface.co/Nanbeige/Nanbeige4.2-3B)
