---
title: "Generalization Dynamics and Pretraining Checkpoint Selection"
date: 2026-10-02
lastmod: 2026-10-02
tags:
  - ai/training
  - pretraining
  - generalization
  - evaluation
draft: false
---

## Summary

Lower pretraining loss does not guarantee a better starting point for post-training. *Generalization Dynamics of LM Pre-training* observes **mode-hopping**: neighboring checkpoints alternate between following a misleading pattern and applying the task's underlying rule. Selected earlier checkpoints also transfer better after SFT in the paper's reasoning and alignment experiments.

The useful engineering lesson is to evaluate **resistance to shortcuts and post-training transfer**, alongside loss and ordinary benchmarks, when choosing a base checkpoint.

Source: [Wen et al., September 2026 — full paper](https://arxiv.org/html/2609.33150v1), especially Sections 2–5 and Appendices A, E, H, and I. All reproduced paper figures below are attributed individually; the checkpoint-selection diagram is an original explanatory illustration.

## 1. Smooth loss can hide unstable generalization

![Authors' schematic contrasting smooth pretraining loss and capability growth with repeatedly changing generalization behavior.](/img/generalization-dynamics/overview.png)

![Legend identifying larger and smaller models in the authors' overview.](/img/generalization-dynamics/overview-legend.png)

*Figure 1, [paper](https://arxiv.org/html/2609.33150v1#S0.F1). This is a conceptual schematic, not a measured training curve. Read the top row as the familiar training picture and the bottom row as possible generalization trajectories: frequent recovery with occasional collapse, persistent oscillation, or rare successful episodes.*

A model can know how to solve a problem while still favoring a competing shortcut in a particular prompt. The paper probes this conflict by deliberately making the shortcut tempting.

For example, demonstrations can have correct arithmetic answers that increase consecutively. At test time, calculating the answer and continuing the answer sequence give different results. This separates two behaviors that ordinary arithmetic examples would not distinguish.

The authors call the repeated switching **mode-hopping**. This is an operational description of behavior, not proof that the model possesses two discrete internal modes.

## 2. What the experiments measure

The study follows general-pretraining checkpoints of **OLMo3-7B/32B** and **Apertus-8B/70B**, excluding midtraining and long-context stages from the main dynamics analysis. Six prompting eval families test different shortcut conflicts:

| Probe | Tempting shortcut | Desired behavior |
|---|---|---|
| Flipped labels | Use the familiar meaning of a label | Infer the label mapping demonstrated in context |
| Repeated answers | Copy the answer repeated in demonstrations | Solve the new problem |
| Successive answers | Continue an answer sequence | Compute the answer even when it breaks the sequence |
| Truth versus plausibility | Prefer what sounds believable | Recognize surprising truths and common misconceptions |
| Cognitive reflection | Choose the intuitive wrong answer | Solve the underlying problem correctly |
| Multi-hop persona QA | Use disconnected biographical cues | Infer an identity and answer related factual questions |

Most evaluations compare probabilities of predefined correct and incorrect answer spans, rather than grading generated text. Persona QA instead uses generation. The paper reports averaging across four random seeds.

An explanatory score for an item is:

$$
m(x)=P_\theta(a_{\mathrm{correct}}\mid x)
     -P_\theta(a_{\mathrm{shortcut}}\mid x).
$$

Here $x$ is the prompt, $a_{\mathrm{correct}}$ is the task answer, and $a_{\mathrm{shortcut}}$ is the competing pattern-based answer. A positive margin favors the task answer. This pairwise preference is **not** unrestricted generation accuracy: the model could assign more probability to a third answer.

Tracking the continuous margin matters because hard accuracy can jump when a tiny probability difference crosses zero. The paper observes substantial fluctuations in soft probability margins too, so thresholding alone does not explain the result.

## 3. The fluctuations are large and persist late in training

![Measured accuracy across OLMo3 pretraining checkpoints on four successive-answer tasks, with frequent drops and recoveries.](/img/generalization-dynamics/successive-answers.png)

*Figure 4, [paper](https://arxiv.org/html/2609.33150v1#S3.F4). Blue is OLMo3-7B; green is OLMo3-32B. Follow each curve horizontally: more training tokens do not produce a monotonic increase in resistance to the answer-sequence shortcut. Stars mark the authors' Chinchilla-optimal token reference, not the best checkpoint on these tasks.*

One reported OLMo3-32B example on the arithmetic answer-sequence probe is:

| Pretraining tokens | Accuracy |
|---|---:|
| 2.17 trillion | 81.0% |
| 2.19 trillion | 0.0% |
| 2.21 trillion | 81.7% |

The collapse and recovery occur across **20 billion-token intervals**, not consecutive optimizer updates. “Sudden” is relative to the full pretraining trajectory.

The study checks several alternative explanations:

- Conventional benchmark curves are comparatively stable, so this is not a uniform collapse in every capability.
- Continuous probability margins fluctuate too; the effect is not only a hard-accuracy artifact.
- A single additional Adam step, including tests at unusually large learning rates, produces little change in these behaviors.
- Averaging five checkpoints mitigates but does not eliminate the observed fluctuations.

These checks narrow the explanation. They do not exclude every possible optimization mechanism or prove that other checkpoint-averaging recipes would fail.

## 4. Why checkpoint choice matters after SFT

The most practically relevant experiment selects two OLMo3-32B checkpoints using the diagnostic suite: **4.5T** and **4.9T** pretraining tokens. The earlier checkpoint performs better on the suite, and the authors test whether that advantage transfers through post-training.

![Math SFT improves MATH-500 for both checkpoints, while GPQA-Diamond improves for the 4.5T checkpoint and declines for the 4.9T checkpoint; additional checkpoints show differing transfer gains.](/img/generalization-dynamics/post-training-gpqa.png)

*Figure 13(a), [paper](https://arxiv.org/html/2609.33150v1#S5.F13). Read the top-left and top-right panels together: learning the fine-tuning domain and transferring beyond it are different outcomes. The bottom panels show changes after SFT across additional base checkpoints; the marked 4.5T checkpoint has particularly strong GPQA transfer.*

| Evaluation after post-training | Start from 4.5T | Start from 4.9T | Difference |
|---|---:|---:|---:|
| GPQA-Diamond after math SFT | 36.3% | 29.8% | +6.5 percentage points |
| Robustness to prefilling attacks after general SFT | 53% | 21% | +32 percentage points |

For the alignment experiment, general SFT uses **49K non-safety examples** from OLMo3's official post-training data and **1K safety examples** from STAR-1. A prefilling attack supplies an initial assistant continuation that tries to steer the model toward an unsafe response; robustness here measures resistance under the evaluated attack setup.

<img src="/img/generalization-dynamics/post-training-alignment.png" alt="The earlier 4.5T checkpoint gains substantially more robustness to prefilling attacks during SFT than the later 4.9T checkpoint." loading="lazy" style={{width: '100%', maxWidth: '560px', height: 'auto'}} />

*Figure 13(b), [paper](https://arxiv.org/html/2609.33150v1#S5.F13). The upper panel follows robustness during SFT. The lower panel compares robustness gains across base checkpoints. This is a specific safety-transfer experiment, not a comprehensive safety score.*

Do not generalize this into “earlier checkpoints are better.” The result is that **chronological order is an insufficient selection rule**. In-distribution performance can improve while downstream transfer deteriorates.

## 5. Proposed explanation: competition for capacity

The authors propose that shallow pattern-following computations and more generalizable computations compete for limited model capacity. Different windows of training data may shift which computations dominate behavior.

This is a **mechanistic hypothesis**. The paper does not directly establish circuit replacement through causal circuit interventions. Output behavior alone cannot tell us whether a useful computation was destroyed, became harder to activate, or lost out to another computation at prediction time.

Larger models often generalize more frequently on the same prompts, but still fluctuate on harder tasks. Appendix H also cautions that comparing models at equal training FLOPs does not show a generalization advantage for larger models in these experiments. More parameters are not a cost-free solution.

## 6. Can selecting data stabilize the behavior?

![Continued pretraining on selected data windows stabilizes arithmetic shortcut resistance in the desired direction, while random data gives fluctuating accuracy.](/img/generalization-dynamics/data-selection.png)

*Figure 14, [paper](https://arxiv.org/html/2609.33150v1#S5.F14). Green uses data associated with generalization in the original run, orange uses data associated with pattern-following, and gray is uncontrolled sampling. This is a small preliminary continuation experiment focused on one arithmetic probe. The horizontal tick labels appear non-monotonic in the published figure; do not infer exact elapsed-token intervals from them.*

The selection uses knowledge of which original pretraining windows improved or harmed the target probe. It is not a ready-made classifier that labels arbitrary documents “generalizable.”

The experiment suggests that training data can influence the dynamics, but it does not establish a scalable, broad-domain curation recipe. A production extension would need prospective selection, unrelated held-out probes, and checks that stabilizing one behavior does not harm others.

## 7. A practical checkpoint-selection workflow

![Proposed workflow: evaluate saved checkpoints with ordinary and shortcut-sensitive metrics, shortlist diverse candidates, run matched SFT experiments, and select on held-out transfer.](/img/generalization-dynamics/checkpoint-selection.svg)

*Original engineering diagram, motivated by the paper; not the authors' exact experimental protocol.*

For a real pretraining run:

1. **Save several viable candidates.** Retain intermediate checkpoints and the relevant data/optimizer metadata rather than preserving only the final weights.
2. **Track both capability and shortcut resistance.** Include held-out NLL, domain benchmarks, task-versus-shortcut probability margins, and a small generative audit.
3. **Avoid a one-probe winner.** Shortlist checkpoints that differ across several domains and prompt variants. The paper finds often-low correlations across different datasets.
4. **Run matched pilot SFT.** Use the same examples, masking, token budget, recipe, and evaluation harness for each candidate; repeat with multiple seeds where feasible.
5. **Select on held-out transfer.** Test tasks outside the SFT distribution, including the actual product domain and relevant robustness constraints.
6. **Confirm at the intended post-training budget.** A small pilot can misrank candidates whose learning curves differ. It is a screening tool, not a final guarantee.

For a coding model, useful original probe ideas include tracing code whose demonstration outputs all repeat, solving problems where superficial templates are misleading, and transferring from short-function SFT to held-out repository tasks. These are suggested adaptations, **not results demonstrated by this paper**.

## 8. Limits and interpretation

- **Diagnostic behavior is not a universal intelligence metric.** Correct answers do not prove a particular internal reasoning process; “System 1/2” and “parrot/intelligence” are interpretive labels.
- **Coverage is limited.** The study uses two model families; some tasks are templated, and persona QA has only five test questions per persona.
- **Checkpoint quality is task-dependent.** Strong behavior on one probe need not predict strong behavior everywhere.
- **Post-training evidence is encouraging, not universal.** The highlighted transfer experiments use OLMo3-32B; they do not establish the same ranking under every SFT or RL recipe.
- **No simple complexity proxy solves selection.** Appendix I tests activation/gradient metrics. Correlations depend strongly on dataset and layer; choosing the best layer even gives a random baseline a correlation around 0.4, illustrating selection bias.

The durable lesson is to treat **training progress, present capability, shortcut resistance, and adaptability** as separate things to measure.

## Related

- [Gradient Norm and Training Dynamics](/atlas/ai/training/optimization/gradient-norm-and-training-dynamics)
- [Training Loss Patterns](/atlas/ai/training/optimization/training-loss-patterns)
- [Data Mixture Optimization](/atlas/ai/training/data/data-mixture-optimization)
- [Supervised Fine-Tuning for LLMs](/atlas/ai/training/optimization/supervised-fine-tuning-for-llms)
- [LLM Ablation Strategy](/atlas/ai/evaluation-experimentation/llm-ablation-strategy)
- [Overtraining and Inference-Aware Scaling](/atlas/ai/training/scaling/overtraining-and-inference-aware-scaling)

## References

- Jiaxin Wen, Zhengxuan Wu, Dawn Song, and Lijie Chen. [Generalization Dynamics of LM Pre-training](https://arxiv.org/abs/2609.33150), September 27, 2026. [PDF](https://arxiv.org/pdf/2609.33150), [HTML with figures and appendices](https://arxiv.org/html/2609.33150v1).

Paper figures are reproduced as selected research excerpts for commentary. The arXiv distribution license is not an open reuse license; attribution here does not imply ownership or a blanket permission to reuse them elsewhere.
