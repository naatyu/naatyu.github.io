---
title: "Brain Teaser Problem-Solving Toolkit"
date: 2026-08-30
lastmod: 2026-08-31
tags:
  - interview-prep
  - brain-teasers
  - probability
  - problem-solving
draft: false
---

## Summary

Most quantitative brain teasers do not require advanced mathematics. They require recognizing a small set of reusable structures: conditional probability, counting, expectation, information bounds, invariants, worst-case reasoning, rates, and state-based recursion.

The most important habit is to model the problem before calculating:

1. What are the possible states or hidden cases?
2. What is random, and what probability model is actually given?
3. What does each action change or reveal?
4. Is the question asking for a possibility, a probability, an average, or a guarantee?
5. What assumptions would be needed for the calculation?

## 1. Start by Classifying the Question

Similar-looking puzzles can ask fundamentally different things.

| Wording | Typical objective |
| --- | --- |
| “Is it possible?” | Construct one valid example |
| “Must this happen?” | Prove a universal claim |
| “With what probability?” | Specify a probability model and measure an event |
| “On average?” | Compute an expectation |
| “Guarantee” | Solve against the worst possible case |
| “Minimum number?” | Prove both a lower bound and a matching strategy |

Do not silently replace one objective with another. A strategy that succeeds quickly on average may have a poor or even unbounded worst case.

## 2. Probability Rules

### Complement

For any event $A$:

$$
P(A^c)=1-P(A).
$$

This is especially useful for “at least one” questions:

$$
P(X\geq 1)=1-P(X=0).
$$

For ten independent fair-die rolls:

$$
P(\text{at least one six})
=1-\left(\frac{5}{6}\right)^{10}.
$$

### Addition rule

For any events $A$ and $B$:

$$
P(A\cup B)=P(A)+P(B)-P(A\cap B).
$$

Only when $A$ and $B$ are mutually exclusive does this reduce to

$$
P(A\cup B)=P(A)+P(B).
$$

### Multiplication rule and independence

The general rule is

$$
P(A\cap B)=P(A)P(B\mid A).
$$

If $A$ and $B$ are independent, then $P(B\mid A)=P(B)$ and

$$
P(A\cap B)=P(A)P(B).
$$

Never multiply probabilities merely because events occur at different times. Independence is an assumption that must be justified.

### Conditional probability

$$
P(A\mid B)=\frac{P(A\cap B)}{P(B)},
\qquad P(B)>0.
$$

Conditioning changes the sample space: once $B$ is known, outcomes outside $B$ are irrelevant.

### Total probability and Bayes' rule

If $B_1,\ldots,B_n$ are mutually exclusive and exhaustive cases:

$$
P(A)=\sum_i P(A\mid B_i)P(B_i).
$$

Bayes' rule reverses a condition:

$$
P(B_i\mid A)
=
\frac{P(A\mid B_i)P(B_i)}
{\sum_j P(A\mid B_j)P(B_j)}.
$$

In puzzles involving tests, boxes, doors, families, or hidden types, explicitly listing the prior cases often prevents base-rate mistakes.

## 3. Counting the Sample Space

Counting is useful only after defining exactly what counts as a distinct outcome.

### Product rule

If a construction has $a$ choices at one stage and $b$ choices at the next, it has $ab$ possible ordered constructions.

### Standard cases

Choose $k$ objects from $n$ without order:

$$
{n\choose k}=\frac{n!}{k!(n-k)!}.
$$

Choose and order $k$ distinct objects from $n$:

$$
P(n,k)=\frac{n!}{(n-k)!}.
$$

Order all $n$ distinct objects:

$$
n!.
$$

For sequences of length $k$ chosen from $n$ options with repetition allowed, the count is

$$
n^k.
$$

### Important warning

The shortcut

$$
P(A)=\frac{|A|}{|\Omega|}
$$

is valid only when the elementary outcomes in $\Omega$ are equally likely. Counting cases does not by itself establish equal probability.

## 4. Expectation

For a discrete random variable $X$:

$$
\mathbb{E}[X]=\sum_x xP(X=x).
$$

### Linearity of expectation

For any random variables $X_1,\ldots,X_n$:

$$
\mathbb{E}\left[\sum_i X_i\right]
=
\sum_i\mathbb{E}[X_i].
$$

Independence is **not** required.

### Indicator variables

Define

$$
I_i=
\begin{cases}
1 & \text{if event }i\text{ occurs},\\
0 & \text{otherwise}.
\end{cases}
$$

Then

$$
\mathbb{E}[I_i]=P(I_i=1).
$$

If $X$ counts how many events occur, write $X=\sum_i I_i$. This turns a difficult distribution problem into a sum of simple probabilities.

For example, in a uniformly random permutation of $n$ objects, let $I_i$ indicate that object $i$ remains in its original position. Since $P(I_i=1)=1/n$:

$$
\mathbb{E}[\text{fixed points}]
=\sum_{i=1}^n\frac1n
=1.
$$

The fixed-point events are dependent, but linearity still works.

### First-step equations

For expected waiting times, define a state by the useful information retained from the past and condition on the next transition.

To find the expected number of fair-coin tosses before `HH`, define:

- $E_0$: expected remaining tosses with no useful suffix;
- $E_1$: expected remaining tosses when the current suffix is `H`.

Then:

$$
E_0=1+\frac12E_1+\frac12E_0,
$$

because `H` moves to state 1 and `T` returns to state 0, and

$$
E_1=1+\frac12\cdot 0+\frac12E_0,
$$

because another `H` finishes, while `T` resets the useful suffix. Solving gives

$$
E_0=6.
$$

This is dynamic programming over stochastic states.

## 5. Poisson Processes and Random Arrivals

A Poisson process models events that occur independently at a constant average rate. Typical interview wording includes calls arriving at a help desk, customers entering a store, defects appearing along a cable, or failures occurring over time.

Let $N(t)$ be the number of arrivals during an interval of length $t$, and let $\lambda$ be the average number of arrivals per unit time. Under the Poisson-process assumptions:

- counts in disjoint intervals are independent;
- the distribution of a count depends only on the interval's length;
- the rate $\lambda$ is constant;
- two or more arrivals in a sufficiently short interval are negligible compared with one arrival.

Then:

$$
N(t)\sim\operatorname{Poisson}(\lambda t),
$$

and

$$
P(N(t)=k)
=e^{-\lambda t}\frac{(\lambda t)^k}{k!}.
$$

Both the mean and variance are $\lambda t$:

$$
\mathbb{E}[N(t)]=\operatorname{Var}(N(t))=\lambda t.
$$

Always make the units match. If the rate is six calls per hour and the interval is ten minutes, then

$$
\lambda t
=6\frac{\text{calls}}{\text{hour}}\cdot\frac16\text{ hour}
=1.
$$

Therefore the probability of at least one call is

$$
P(N(t)\geq1)
=1-P(N(t)=0)
=1-e^{-1}.
$$

### Arrival counts and waiting times are two views of the same process

If $T_1$ is the waiting time until the next arrival, then

$$
P(T_1>t)
=P(N(t)=0)
=e^{-\lambda t}.
$$

Thus the interarrival time is exponentially distributed:

$$
T_1\sim\operatorname{Exponential}(\lambda),
$$

with

$$
P(T_1\leq t)=1-e^{-\lambda t},
\qquad
f_{T_1}(t)=\lambda e^{-\lambda t},
$$

and

$$
\mathbb{E}[T_1]=\frac1\lambda,
\qquad
\operatorname{Var}(T_1)=\frac1{\lambda^2}.
$$

This gives a useful translation:

```text
number of arrivals in time t  <->  Poisson(lambda * t)
time until the next arrival   <->  Exponential(lambda)
```

The waiting time $T_k$ until the $k$-th arrival is Gamma distributed, or Erlang distributed when $k$ is an integer:

$$
T_k\sim\operatorname{Gamma}(k,\text{ rate }\lambda),
\qquad
\mathbb{E}[T_k]=\frac{k}{\lambda}.
$$

The event that the $k$-th arrival occurs by time $t$ is exactly the event that at least $k$ arrivals occur by time $t$:

$$
P(T_k\leq t)=P(N(t)\geq k).
$$

### Memorylessness

The exponential distribution is memoryless:

$$
P(T_1>s+t\mid T_1>s)=P(T_1>t).
$$

If no arrival occurred during the first $s$ minutes, the remaining waiting-time distribution is the same as it was initially. Time already spent waiting does not make an arrival "due."

This property follows from the Poisson assumptions; it should not be applied to scheduled buses, aging hardware, or any process whose future rate depends on its history.

### Combining and splitting streams

The superposition of independent Poisson processes is another Poisson process. If independent streams have rates $\lambda_1,\ldots,\lambda_m$, their combined rate is

$$
\lambda_{\text{total}}=\sum_i\lambda_i.
$$

For two streams, the time to the next arrival of either type is exponential with rate $\lambda_1+\lambda_2$, and

$$
P(\text{stream 1 arrives first})
=\frac{\lambda_1}{\lambda_1+\lambda_2}.
$$

Conversely, if every event in a Poisson process of rate $\lambda$ is independently retained with probability $p$, the retained events form a Poisson process of rate $p\lambda$. The discarded events independently form one of rate $(1-p)\lambda$. This is called **thinning**.

### Conditioning on the total count

Given that exactly $n$ events occurred in an interval of length $t$, their locations within that interval behave like $n$ independent uniform points, sorted into arrival order. Consequently, for a subinterval of length $s\leq t$:

$$
N(s)\mid N(t)=n
\sim
\operatorname{Binomial}\left(n,\frac{s}{t}\right).
$$

This is useful when a question gives the total number of arrivals and asks where within the interval they occurred.

### Common Poisson-process traps

- A rate is not a probability. Convert it into the dimensionless mean $\lambda t$ first.
- Poisson counts describe a fixed interval; exponential variables describe waiting times.
- The average waiting time $1/\lambda$ is not a guarantee and is not the median.
- A constant long-run average alone does not establish a Poisson process; independence and a stable rate also matter.
- Scheduled, bursty, capacity-limited, self-exciting, or state-dependent arrivals are generally not Poisson.
- After conditioning on a fixed total count, counts in subintervals are no longer independent.

## 6. Information Bounds and Decision Trees

Suppose there are $N$ possible hidden worlds and each experiment has at most $b$ distinguishable outcomes. After $k$ experiments, a decision tree has at most $b^k$ leaves. Therefore a necessary condition for identifying the world is

$$
b^k\geq N,
$$

or

$$
k\geq\left\lceil\log_bN\right\rceil.
$$

For a balance scale, one weighing has at most three outcomes: left heavy, balanced, or right heavy. For yes/no questions, $b=2$.

### Necessary does not mean sufficient

The bound only says that fewer experiments cannot work. It does **not** prove that a strategy using that many experiments exists.

Real puzzles may impose additional constraints:

- some outcome branches may be impossible;
- branches may have very unequal sizes;
- an experiment may not separate arbitrary sets of cases;
- a counterfeit coin may be either heavier or lighter, doubling the hidden states;
- adaptive and non-adaptive strategies may have different power.

To prove an optimum, combine:

1. a **lower bound**, showing that fewer steps are impossible;
2. a **construction**, giving a strategy that meets the bound.

## 7. Pigeonhole Principle and Guarantees

If more than $n$ objects are placed into $n$ boxes, some box contains at least two objects.

More generally, placing $N$ objects into $n$ boxes guarantees that some box contains at least

$$
\left\lceil\frac{N}{n}\right\rceil
$$

objects.

Example: with 12 birth months, 13 people guarantee that two share a birth month.

The word “guarantee” should trigger adversarial reasoning: construct the arrangement that delays the desired event for as long as possible, then add one more object or step.

## 8. Invariants

An invariant is a quantity or property that every legal move preserves.

Common candidates include:

- parity;
- a sum or difference;
- color counts;
- a value modulo $m$;
- permutation parity;
- connectivity or component count.

### Mutilated chessboard

Remove two opposite corners from an ordinary $8\times8$ chessboard. Opposite corners have the same color, so the remaining board has 30 squares of one color and 32 of the other.

Every domino placed on adjacent squares covers exactly one black and one white square. A domino tiling would therefore cover equal numbers of both colors, which is impossible.

The invariant is the difference between the numbers of covered black and white squares.

## 9. Monovariants

A monovariant changes strictly in one direction after every legal move. If it is bounded, it can prove termination.

Typical forms are:

$$
M_{t+1}<M_t
$$

or

$$
M_{t+1}>M_t.
$$

The proof needs both properties:

1. strict progress after every move;
2. a bound that prevents indefinite progress.

A decreasing nonnegative integer is a particularly convenient monovariant because it can decrease only finitely many times.

## 10. Symmetry

Symmetry can collapse many cases into one, but visual similarity alone does not prove equal probability.

Cases are equiprobable when the random process itself is invariant under a transformation exchanging them. For a fair die, relabeling the six faces leaves the procedure unchanged, so all faces have equal probability.

Useful questions are:

- Can I rotate, reflect, permute, or relabel one case into another?
- Does that transformation preserve the random experiment?
- Are there exceptional cases with a smaller or larger symmetry class?

Symmetry is a proof tool, not a license to assume uniformity.

## 11. Rates, Speed, and Units

### Relative speed

For two objects moving directly toward one another at constant speeds $v_1$ and $v_2$, their separation closes at

$$
v_{\text{rel}}=v_1+v_2.
$$

If their initial separation is $D$, the collision time is

$$
t=\frac{D}{v_1+v_2}.
$$

A fly moving continuously at speed $v_f$ until the collision therefore travels

$$
d_f=v_ft.
$$

There is no need to sum its infinitely many back-and-forth trips.

### Work rates

If one machine completes one unit of work in time $T$, its constant rate is

$$
r=\frac1T.
$$

For independent machines working simultaneously on perfectly divisible work:

$$
r_{\text{total}}=\sum_i r_i,
\qquad
T_{\text{total}}=\frac1{r_{\text{total}}}.
$$

These assumptions matter. Human workers can interfere, tasks may have sequential dependencies, and rates may vary with time. In those cases, rates do not simply add.

### Dimensional analysis

Track units throughout the calculation:

$$
\text{distance}=\text{speed}\times\text{time},
$$

$$
\text{work}=\text{rate}\times\text{time}.
$$

An equation whose units do not match is wrong regardless of its arithmetic.

## 12. Algebra and Representation

When the trick is unclear, name the unknown quantities and translate each sentence into a constraint.

For age puzzles, for example:

$$
x=\text{father's current age},
\qquad
y=\text{child's current age}.
$$

Statements about the past or future must shift both ages by the same duration. A common mistake is to apply the time shift to only one person.

More generally, choose a representation that makes legal operations simple:

- a table for conditional cases;
- a graph for crossings and routes;
- a state tuple for switches or containers;
- a decision tree for adaptive questions;
- equations for conserved quantities.

## 13. Small Cases, Edge Cases, and Working Backward

### Test small cases

Compute $n=1,2,3,4$ to discover patterns, expose hidden assumptions, or find counterexamples.

Small cases can suggest a conjecture, but they do not prove it. After spotting a pattern, look for an invariant, induction, recurrence, bijection, or counting argument.

### Test edge cases

Ask what happens when:

- a set is empty;
- probabilities are 0 or 1;
- two values are equal;
- a minimum or maximum is attained;
- only one object remains.

Edge cases often reveal that a proposed strategy is underspecified.

### Work backward

When the final state is highly constrained, ask which moves could immediately precede it. Continue reversing until the start state is reached.

This is especially useful for river crossings, measuring-jug problems, switches, and constrained move sequences. Verify that every reversed move corresponds to a legal forward move.

## 14. Hidden Assumptions

Consider the statement:

> The probability of seeing at least one truck during one hour is $0.99$. What is the probability during half an hour?

The one-hour probability alone is insufficient. To obtain a unique answer, one might additionally assume that the two half-hours are statistically identical and independent.

Under those assumptions, let $q$ be the probability of no truck during one half-hour. Then

$$
q^2=P(\text{no truck in one hour})=0.01,
$$

so

$$
q=0.1
$$

and

$$
P(\text{at least one truck in half an hour})=1-q=0.9.
$$

Without those assumptions, many half-hour processes are compatible with the same one-hour probability. Recognizing underdetermination is part of solving the puzzle.

## 15. A Practical Solving Framework

Before calculating, ask:

1. **Objective:** possibility, probability, expectation, or guarantee?
2. **States:** what hidden worlds or configurations are possible?
3. **Model:** which outcomes are random, and are they equally likely?
4. **Assumptions:** independence, replacement, constant rates, perfect information?
5. **Structure:** complement, conditioning, symmetry, invariant, or monovariant?
6. **Information:** how many cases must each action distinguish?
7. **Representation:** table, graph, equations, state machine, or decision tree?
8. **Simplification:** can small cases or backward reasoning reveal the pattern?
9. **Optimality:** do I have both an impossibility bound and a matching strategy?
10. **Sanity check:** are probabilities in $[0,1]$, units consistent, and edge cases correct?

## 16. Common Failure Modes

- Multiplying probabilities without establishing independence.
- Treating mutually exclusive events as independent; except for zero-probability cases, they are not.
- Counting outcomes and assuming they are equally likely.
- Confusing “expected” with “guaranteed.”
- Presenting an information lower bound as a constructive solution.
- Using symmetry without checking that the random process preserves it.
- Inferring a theorem from a few small examples.
- Simulating a long process when total time, work, or distance is enough.
- Adding rates when the work is not divisible or workers interact.
- Solving a strengthened version based on an unstated assumption.
- Giving a strategy without proving it is optimal.

## Recommended Learning Order

The highest-value progression is:

1. complements, conditioning, independence, and Bayes' rule;
2. product-rule counting, permutations, and combinations;
3. expectation, indicator variables, and first-step equations;
4. Poisson counts, exponential waiting times, and memorylessness;
5. pigeonhole and worst-case reasoning;
6. information bounds and decision trees;
7. invariants and monovariants;
8. rates, algebraic modeling, and dimensional analysis;
9. lower bounds plus matching constructions.

## Related

- [Law of Total Probability](/atlas/math/probability/law-of-total-probability)
- [Entropy](/atlas/math/probability/entropy)
- [Prediction, Compression, and Entropy](/atlas/ai/foundations/prediction-compression-and-entropy)
- [Backtracking](/atlas/interview-prep/neetcode-roadmap/backtracking)
- [One-Dimensional Dynamic Programming](/atlas/interview-prep/neetcode-roadmap/one-dimensional-dynamic-programming)
- [Math and Geometry](/atlas/interview-prep/neetcode-roadmap/math-and-geometry)
