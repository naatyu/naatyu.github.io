---
title: "Agentic Training Data and Environment Synthesis"
date: 2026-07-25
lastmod: 2026-07-27
tags:
  - ai/training
  - agents
  - data
  - tool-use
  - reinforcement-learning
draft: false
---

## Summary

Agentic training data is not merely a collection of prompts and answers. A useful training example may require an initial state, tools, hidden information, an executable environment, a sequence of actions, intermediate observations, and a verifier that determines whether the final state is correct.

The central engineering problem is therefore:

$$
\text{build scalable environments that produce grounded learning signal}
$$

Strong pipelines combine real and synthetic components, use execution to validate outcomes, vary the agent scaffold to prevent interface overfitting, and evolve tasks as the model improves. They also distinguish between a successful trajectory and a flawless trajectory: incorrect intermediate actions can remain valuable recovery contexts without becoming imitation targets.

## Concepts

- **Agentic trajectory:** a sequence of model messages, tool calls, environment observations, and state changes directed toward a task.
- **Executable environment:** a runtime in which actions have real stateful consequences and success can be checked.
- **Agent scaffold:** the surrounding system that defines prompts, tools, editing interfaces, state handling, and context management.
- **Outcome verifier:** a procedure that judges the final task result.
- **Process rubric:** criteria that score the quality of intermediate actions.
- **Task evolution:** increasing or redirecting task difficulty using evidence from the current model's successes and failures.
- **Turn-level loss masking:** excluding an unreliable action from the supervised objective while keeping it in the trajectory context.

## 1. Why ordinary instruction data is insufficient

A conventional SFT example has the form:

$$
(x,y)
$$

where $x$ is an instruction and $y$ is a target response.

An agent task is closer to:

$$
(
x,
s_0,
\mathcal{A},
\tau,
s_T,
V
)
$$

where:

- $s_0$ is the initial environment state
- $\mathcal{A}$ is the available action or tool space
- $\tau$ is the interaction trajectory
- $s_T$ is the final state
- $V$ is the verifier

The natural-language answer may be less important than whether the environment changed correctly.

For example, a coding agent can produce an eloquent explanation while leaving tests failing. An office agent can describe a correct spreadsheet while delivering a broken workbook. Training data must therefore ground supervision in state and execution.

## 2. The basic synthesis loop

A general pipeline is:

1. construct or select an environment
2. sample assets and an initial state
3. synthesize a task
4. build an independent verifier
5. let one or more agents attempt the task
6. execute the verifier
7. filter trajectories and individual turns
8. add useful failures to the next task-generation cycle

The verifier should be designed alongside the task, not added after trajectory generation. Otherwise, the generated instruction may ask for properties that cannot be measured reliably.

## 3. Repository-level software-engineering tasks

Code repositories provide unusually strong supervision because behavior can be executed.

### Reconstruct the environment

Starting from a historical change:

- identify the parent commit
- reconstruct dependencies and test infrastructure
- build an isolated container
- expose the unpatched repository to the agent
- hide the reference patch and grading tests

The environment should be self-contained enough that repeated attempts remain comparable.

### Validate necessity and regressions

Two test groups serve different purposes:

- **fail-to-pass:** demonstrates that the requested behavior is absent before the patch and fixed afterward
- **pass-to-pass:** checks that unrelated existing behavior remains intact

A valid task should satisfy both:

$$
V_{F2P}(s_{base})=0,
\qquad
V_{F2P}(s_{patched})=1
$$

$$
V_{P2P}(s_{base})=1,
\qquad
V_{P2P}(s_{patched})=1
$$

This filters tasks whose tests are flaky, whose reference patch is insufficient, or whose description does not match the intended behavior.

### Hide the answer without hiding the problem

The agent receives:

- repository state
- task description
- ordinary project tooling

It should not receive:

- the reference patch
- grading-specific tests
- metadata that trivially identifies the fix

This avoids converting software engineering into patch imitation.

## 4. Hybrid tool environments

Not every useful tool can be reproduced in one way. A scalable synthesis system can combine three environment types.

### Local executable tools

Real data is collected, stored locally, and exposed through deterministic functions or APIs.

Advantages:

- reproducible
- cheap to execute
- easy to verify
- safe to run at scale

Limitations:

- becomes stale
- cannot capture every external service behavior

### Live services

Search, web retrieval, repository hosting, and other time-sensitive tools may remain connected to live services.

Advantages:

- realistic
- current
- exposes genuine external uncertainty

Limitations:

- non-deterministic
- rate limited
- harder to reproduce
- may change after the dataset is constructed

### Model-simulated tools

A model can emulate systems that are expensive or impossible to deploy for every rollout.

Advantages:

- flexible
- scalable
- supports rare or proprietary interfaces

Limitations:

- simulation errors become training signal
- agents may learn simulator artifacts
- success may not transfer to the real service

A useful mixture uses simulation for breadth and executable or live components for grounding.

## 5. Tool composition from specifications

Tool documentation, including MCP specifications, can seed environment synthesis.

The pipeline:

1. collect tool schemas and documentation
2. assess which tools can be composed meaningfully
3. group complementary tools into bundles
4. reconstruct executable interfaces where possible
5. generate tasks that require multiple tools
6. generate a verifier independently

Composability matters more than raw tool count. Thousands of isolated tools do not automatically create useful multi-step tasks.

Good bundles create information dependencies:

$$
\text{output of tool A}
\rightarrow
\text{parameter for tool B}
\rightarrow
\text{evidence checked by tool C}
$$

## 6. Artifact-centric office tasks

Office agents manipulate deliverables, so their tasks should be grounded in artifacts:

- documents
- spreadsheets
- slide decks
- PDFs
- code
- structured data

A scalable process:

1. collect multi-format artifacts across domains
2. cluster them by topic and structure
3. sample coherent multi-artifact bundles
4. let a task generator explore the bundle
5. produce a task and evaluation rubric
6. execute an agent in a sandbox
7. judge the deliverable and trajectory

Evaluation should inspect the actual artifact, not only the assistant's final message.

For example:

- spreadsheet formulas should recalculate correctly
- slides should contain the required evidence and remain readable
- documents should satisfy factual and formatting constraints
- cross-file references should be consistent

### Artifact recycling

Validated outputs can become source material for later synthesis rounds. This expands the available task graph:

$$
\text{source artifacts}
\rightarrow
\text{task}
\rightarrow
\text{new deliverable}
\rightarrow
\text{future source artifact}
$$

The risk is synthetic drift. Recycled artifacts need quality gates, provenance metadata, and periodic anchoring to human-created sources.

## 7. Use diverse agent scaffolds

A trajectory depends on both model and scaffold:

$$
\tau
\sim
\pi_\theta(
\cdot
\mid
\text{prompt},
\text{tools},
\text{editing interface},
\text{context policy}
)
$$

If all training trajectories use one scaffold, the model may overfit to:

- one system prompt
- one tool schema
- one patching mechanism
- one context-compression policy
- one observation format

Running the same task through several scaffolds exposes different valid strategies:

- broad exploration
- localized search
- direct editing
- test-first debugging
- different recovery behavior

The desired target is scaffold-invariant competence, not imitation of one agent product.

## 8. White-box configurable harnesses

Scaffold diversity is more useful when the harness itself is represented as configurable modules rather than several opaque applications.

Kimi K3 decomposes a harness into:

- tools
- system prompts
- context-management policy
- skills and memory
- subagent configuration

A task can then sample or select these components dynamically. The same environment layer can reproduce several agent products while keeping task state and verification consistent.

This makes scaffold variation a controlled data dimension:

$$
\text{task}
\times
\text{tool set}
\times
\text{context policy}
\times
\text{subagent policy}
$$

It also supports cleaner ablations. If performance changes, one can attribute it to a specific harness component rather than to an entirely different runner.

## 9. Knowledge-graph-guided task synthesis

K3 uses a self-expanding hierarchical directed acyclic graph to organize task concepts.

The process is:

1. start from broad seed concepts
2. retrieve public source material
3. expand each concept into finer prerequisites or subtopics
4. reuse an existing related node instead of duplicating it
5. stop when a concept is sufficiently atomic
6. sample related nodes across levels to synthesize tasks

This produces structured combinations rather than independent prompt topics. A task can require dependencies that span:

- general and specialized knowledge
- several tools
- text and vision
- multiple levels of abstraction

The graph is valuable because it makes coverage and difficulty inspectable. However, model-generated graph structure can encode false dependencies or synthetic biases, so nodes still need source grounding and deduplication.

## 10. Autonomous Execution Tasks

K3 formalizes open-ended agent tasks as:

$$
\mathcal{E}
=
\left(
s_0,
g,
\mathcal{A},
B,
V
\right)
$$

where:

- $s_0$ is the initial state
- $g$ is a constrained goal
- $\mathcal{A}$ is the available tool set
- $B$ is the execution or submission budget
- $V$ is an independent verifier

There is no reference trajectory. The agent must decide how to decompose the goal, recover from failures, and terminate.

Public verifier output may provide limited diagnostics, but hidden checks are held out and isolated from agent tools. Submission limits and penalties discourage solving the task by repeatedly probing the grader.

This is closer to real agent deployment than trajectory imitation:

$$
\text{learn a successful policy}
\neq
\text{copy one successful path}
$$

## 11. Filter trajectories and turns separately

Trajectory success is necessary but not sufficient.

A successful run may contain:

- invalid tool calls
- redundant searches
- loops
- guesses that happen to work
- a mistake followed by recovery

Conversely, a failed trajectory may contain locally valuable actions.

### Trajectory-level filtering

Use final execution to retain trajectories that satisfy:

- task-specific success
- regression safety
- deliverable validity
- environment consistency

### Turn-level filtering

Each assistant action can receive a binary mask:

$$
m_t
\in
\{0,1\}
$$

The supervised loss becomes:

$$
\mathcal{L}
=
\sum_t
m_t
\mathcal{L}_t
$$

If a bad action produces an observation that later enables recovery:

- keep the action and observation in context
- set $m_t=0$
- train on the later recovery turn

This teaches:

$$
\text{how to recover after an error}
$$

without teaching:

$$
\text{how to make the error}
$$

## 12. Evolve tasks with the model

A fixed dataset eventually becomes:

- too easy
- irrelevant to the current failure profile
- dominated by already-solved interaction patterns

Task evolution uses the current policy as a measurement instrument.

### Capability-gap mining

1. run the model on a seed suite
2. classify recurring failure modes
3. translate failures into search criteria
4. collect environments and assets that expose those weaknesses
5. synthesize new tasks

For code, the search criterion may identify repository structures or patch types. For tools, it may target longer chains or harder parameter inference. For office work, it may add cross-artifact dependencies.

### Difficulty dimensions

Difficulty should be factored rather than represented by one scalar:

- trajectory length
- tool-chain depth
- number of parameters inferred
- information-retrieval ambiguity
- cross-tool dependencies
- cross-artifact dependencies
- recovery requirements
- verification complexity

This makes task evolution controllable. If a task becomes too easy, the generator can increase a specific dimension instead of adding arbitrary complexity.

## 13. Match task difficulty to the learning stage

The hardest tasks are not always the most useful.

For outcome-based learning:

- always-failing tasks provide little positive signal
- always-succeeding tasks provide little discrimination

Long-horizon agents add another problem: even a partially capable model may receive only a final failure after many actions.

Useful curricula therefore depend on both:

- pass rate
- trajectory horizon

Small models may need relatively short and frequently solvable agent tasks before progressing toward longer horizons. A reasonable objective is:

$$
\max
\frac{\text{useful learning signal}}
{\text{rollout tokens and environment cost}}
$$

not:

$$
\max
\text{task difficulty}
$$

## 14. Outcome and process rewards

Outcome rewards answer:

> Did the final task succeed?

Process rewards answer:

> Did this action move the agent toward success?

Useful action-level dimensions include:

- tool-call validity
- parameter correctness
- information gain
- state progress
- unnecessary repetition
- recovery after failure

Combining them gives denser credit:

$$
R(\tau)
=
R_{outcome}(\tau)
+
\lambda
\sum_t
R_{process}(a_t,s_t)
$$

Process rubrics must not overpower the outcome verifier. An agent that performs locally plausible actions but never completes the task should not outrank a successful unconventional strategy.

## 15. Failure modes

### Simulator overfitting

The model learns predictable behavior of virtual tools that does not transfer to real services.

### Verifier leakage

Task descriptions or visible files reveal hidden-test structure and let the agent optimize the checker rather than the intended behavior.

### Scaffold overfitting

The model works through one prompt and tool interface but fails under another.

### Synthetic drift

Recycling generated tasks and artifacts gradually amplifies model errors or reduces diversity.

### Reward-model substitution

A rubric judge becomes easier to satisfy than the actual user objective.

### Excessive trajectory pruning

Keeping only clean, direct successes removes examples of debugging, recovery, and adaptation.

## Practical Heuristics

- Build the verifier at the same time as the task.
- Keep grading tests hidden and audit them for leakage.
- Use both target tests and regression tests for code.
- Count target tokens and environment steps, not only examples.
- Mix executable, live, and simulated tools deliberately.
- Generate trajectories through multiple scaffolds.
- Preserve recovery contexts while masking bad actions.
- Track difficulty across several interpretable dimensions.
- Feed recurring model failures back into task generation.
- Measure outcome quality, action errors, trajectory length, and environment cost together.
- Periodically re-anchor recycled synthetic artifacts to human-created sources.

## Related

- [Nanbeige4.2-3B](/atlas/ai/architectures/model-reports/nanbeige4-2-3b-unlocking-agentic-capabilities)
- [Reinforcement Learning with Verifiable Rewards](/atlas/ai/training/optimization/reinforcement-learning-with-verifiable-rewards)
- [Supervised Fine-Tuning for LLMs](/atlas/ai/training/optimization/supervised-fine-tuning-for-llms)
- [Data Mixture Optimization](/atlas/ai/training/data/data-mixture-optimization)
- [Reasoning Effort Control](/atlas/ai/inference-serving/performance/reasoning-effort-control)
- [Long-Horizon Agentic RL Infrastructure](/atlas/ai/training/optimization/long-horizon-agentic-rl-infrastructure)
- [Kimi K3](/atlas/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence)
- [Nanbeige4.2-3B Technical Report](https://huggingface.co/Nanbeige/Nanbeige4.2-3B/blob/main/Nanbeige42_report.pdf)
- Kimi Team, [Kimi K3: Open Frontier Intelligence — Technical Report](https://github.com/MoonshotAI/Kimi-K3/blob/main/k3_tech_report.pdf)
