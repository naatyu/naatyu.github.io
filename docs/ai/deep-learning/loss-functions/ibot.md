---
title: "iBOT & iBOT++ Loss"
date: 2026-05-27
lastmod: 2026-05-27
tags:
  - ai/cv
  - self-supervised-learning
  - masked-image-modeling
  - vision-transformer
  - vision-language
draft: false
---

## Summary

**iBOT** (Image BERT Pre-Training with Online Tokenizer, [Zhou et al., 2022](https://arxiv.org/abs/2111.07832), ICLR 2022) rethinks masked image modeling (MIM) by replacing fixed tokenizers with a **learnable online tokenizer** via self-distillation. It achieves **82.3% linear probing** and **87.8% fine-tuning accuracy** on ImageNet-1K, demonstrating that frozen iBOT features excel at dense prediction tasks (detection, segmentation).

**iBOT++** ([Cao et al., 2026](https://arxiv.org/abs/2604.12012), CVPR 2026) extends the objective within **TIPSv2** by applying the self-distillation loss to **both masked and unmasked tokens**, yielding dramatic gains in patch-text alignment. On ADE150 zero-shot segmentation, this modification alone delivers **+14.1 mIoU** (3.5 -> 17.6), and TIPSv2 models match or surpass recent vision encoders across 9 tasks and 20 datasets.

## Concepts
- **Online Tokenizer**: A teacher network whose representations serve as targets for the student; it is updated jointly with the student via self-distillation, avoiding a separate tokenizer pre-training stage.
- **Masked Image Modeling (MIM)**: Predicts representations (not pixels) of masked patches; iBOT uses feature-level targets from the teacher.
- **Self-Distillation on [CLS] Token**: Global semantics are captured by distilling the class token, complementing the local patch-level objective.
- **Patch-Text Alignment**: Dense correspondence between image patches and text embeddings; iBOT++ strengthens this by forcing all patches (masked and visible) to align with text.

## Content

### iBOT Loss: Architecture & Objectives

#### Student-Teacher Framework
- **Teacher**: EMA of student parameters, provides target features for masked patches.
- **Student**: Processes masked views and predicts teacher features for masked patches.
- **No Pre-trained Tokenizer**: The teacher's online tokenizer is learned end-to-end.

#### Loss Components
1. **Masked Patch Loss** ($\mathcal{L}_{patch}$)
   - For each masked patch $i$, student embedding $\mathbf{z}_i^s$ matches teacher embedding $\mathbf{z}_i^t$:
   $$\mathcal{L}_{patch} = \frac{1}{|M|}\sum_{i\in M} \left(1 - \frac{\mathbf{z}_i^s \cdot \mathbf{z}_i^t}{\|\mathbf{z}_i^s\| \|\mathbf{z}_i^t\|}\right)$$
   - Cosine similarity loss; alternative: MSE on $L_2$-normalized features.

2. **Class Token Loss** ($\mathcal{L}_{cls}$)
   - Student `[CLS]` token $\mathbf{c}^s$ distills teacher `[CLS]` token $\mathbf{c}^t$:
   $$\mathcal{L}_{cls} = 1 - \frac{\mathbf{c}^s \cdot \mathbf{c}^t}{\|\mathbf{c}^s\| \|\mathbf{c}^t\|}$$

**Total iBOT Loss**:
$$\mathcal{L}_{iBOT} = \lambda_{patch} \mathcal{L}_{patch} + \lambda_{cls} \mathcal{L}_{cls}$$

#### Training Details
- **Masking Strategy**: Random block-wise masking (e.g., 40% of patches).
- **Teacher Update**: Exponential Moving Average (EMA) with momentum $\tau$.
- **No Feature Normalization Heuristics**: Unlike DINO, iBOT does not require centering or sharpening.

### Why Online Tokenizer Matters
- **Semantic Tokenization**: Learns to group patches by semantic similarity (e.g., "dog head", "grass"), not just low-level texture.
- **Joint Optimization**: Tokenizer improves as the student learns better features, creating a positive feedback loop.
- **Simplicity**: Single-stage training; no dependency on dVAE or other pre-trained tokenizers.

### iBOT++: Extending Loss to All Tokens

#### Motivation
- Empirical finding: Self-distillation on patches **improves patch-text alignment beyond the teacher**.
- Hypothesis: Enforcing consistency across **all** patches (not just masked) strengthens local-global correspondence.

#### Modified Loss
- **All-Token Self-Distillation**: Every patch token (masked **and** visible) contributes:
  $$\mathcal{L}_{iBOT++} = \frac{1}{N}\sum_{i=1}^{N} \left(1 - \frac{\mathbf{z}_i^s \cdot \mathbf{z}_i^t}{\|\mathbf{z}_i^s\| \|\mathbf{z}_i^t\|}\right) + \lambda_{cls} \mathcal{L}_{cls}$$
- **No Masking in Loss**: The masking is still applied to the input, but the loss is computed for all tokens.

#### Impact on Patch-Text Alignment
- **Zero-Shot Segmentation**: +14.1 mIoU on ADE150 (absolute).
- **Dense Prediction**: Strong gains on COCO (object detection/segmentation) and depth estimation.
- **Retrieval**: Improved image-text and image-image retrieval scores.

### TIPSv2 Framework
iBOT++ is one of three key innovations in TIPSv2:

| Component | Description | Benefit |
|-----------|-------------|---------|
| **iBOT++** | All-token self-distillation loss | +14.1 mIoU (ADE150 zero-shot seg) |
| **Head-only EMA** | EMA applied only to loss head, not encoder | Memory-efficient, faster training |
| **Multi-Granularity Captions** | Synthetic captions at varying detail (PaliGemma, Gemini) | Richer text supervision |

### Performance Highlights
- **iBOT (2022)**: 82.3% linear probing, 87.8% fine-tuning (ImageNet-1K), SOTA on dense tasks.
- **TIPSv2 with iBOT++ (2026)**: Matches or surpasses recent vision encoders (e.g., SigLIP, CLIP) across 9 tasks.

## Comparison: iBOT vs. Traditional MIM

| Feature | iBOT | BEiT / Masked Autoencoder | DINO |
|---------|------|---------------------------|------|
| **Token Type** | Learned online tokenizer | Fixed dVAE tokenizer | None |
| **Target** | Teacher features | Pixel values or discrete tokens | None |
| **Objective** | Feature prediction (MIM) | Pixel/token reconstruction | Instance discrimination |
| **Global Semantics** | [CLS] token distillation | None (global context limited) | Instance-level |
| **Multi-Stage** | No (single-stage) | Yes (tokenizer pre-training) | No |
| **Dense Prediction** | Strong | Weak (pixel-level focus) | Limited |

## Related
- [DINOv2](/atlas/ai/deep-learning/dinov2)
- [LeJEPA Loss](/atlas/ai/deep-learning/loss-functions/lejepa)
- Self-Supervised Learning
- Vision Transformers
- [TIPSv2 Project Page](https://gdm-tipsv2.github.io/)
- [iBOT Paper](https://arxiv.org/abs/2111.07832)
- [TIPSv2 Paper](https://arxiv.org/abs/2604.12012)
