---
title: "Non-Maximum Suppression (NMS)"
date: 2026-04-16
lastmod: 2026-04-17
tags:
  - ai/computer-vision
  - post-processing
  - object-detection
draft: false
---

## Summary

Non-Maximum Suppression (NMS) is a fundamental post-processing technique used in virtually all modern object detection systems. It filters out redundant, overlapping bounding boxes predicted for the same object instance, keeping only the most confident detection.
## Concepts
- **Intersection over Union (IoU)**: A metric that measures the overlap between two bounding boxes.
- **Confidence Score**: The probability predicted by the detector that a bounding box contains a specific object.
- **Hard Suppression**: Removing boxes entirely if their overlap exceeds a threshold.
- **Soft Suppression**: Reducing the confidence score of overlapping boxes instead of removing them.

## Content

### 1. The Core Problem
Object detectors (like YOLO, SSD, or Faster R-CNN) often generate multiple predictions at different scales and locations for the same object. This happens because:
- Detectors use a **sliding window** approach or **anchor boxes**.
- A single object may trigger high confidence scores in several nearby anchor boxes.
- The result is often 10+ overlapping detections for a single instance (e.g., a car or a face).

### 2. Intersection over Union (IoU)
The IoU metric is the primary tool for measuring redundancy:
$$\text{IoU}(A, B) = \frac{|A \cap B|}{|A \cup B|} = \frac{\text{Area of Intersection}}{\text{Area of Union}}$$

For two boxes with coordinates $[x_1^A, y_1^A, x_2^A, y_2^A]$ and $[x_1^B, y_1^B, x_2^B, y_2^B]$:
1. **Intersection coordinates**:
   - $x_1^\cap = \max(x_1^A, x_1^B), y_1^\cap = \max(y_1^A, y_1^B)$
   - $x_2^\cap = \min(x_2^A, x_2^B), y_2^\cap = \min(y_2^A, y_2^B)$
2. **Intersection area**: $\text{Area}^\cap = \max(0, x_2^\cap - x_1^\cap) \times \max(0, y_2^\cap - y_1^\cap)$
3. **Union area**: $\text{Area}^\cup = \text{Area}_A + \text{Area}_B - \text{Area}^\cap$

### 3. The NMS Algorithm
The standard greedy NMS algorithm follows these steps:
1. **Sort** all boxes by confidence score in descending order.
2. **Select** the box with the highest score ($M$) and add it to the final output list.
3. **Compute IoU** between $M$ and all remaining boxes in the set.
4. **Remove** boxes from the set if their $\text{IoU} > \text{threshold}$ (common defaults are 0.45 or 0.5).
5. **Repeat** from step 2 until no boxes remain in the set.

#### Complexity
- **Time Complexity**: $O(N^2)$ in the worst case, where $N$ is the number of boxes (due to pairwise comparisons).
- **Space Complexity**: $O(N)$ for storing indices and intermediate results.

### 4. Variants of NMS
*   **Soft-NMS**: Instead of hard removal, it decays the confidence scores of overlapping boxes. This prevents missing objects in highly crowded scenes (e.g., people standing in front of each other).
    - $s_i = s_i \cdot e^{-\text{IoU}^2/\sigma}$
*   **Weighted NMS**: Instead of picking just one box, it combines overlapping boxes using a weighted average of their coordinates based on scores.
*   **DIoU-NMS**: Uses Distance-IoU, which considers the distance between box centers to better handle cases where objects are partially occluded but have high overlap.

### 5. Applications
- **YOLO, SSD, Faster R-CNN**: Used as the final stage of the inference pipeline.
- **Face Detection**: Essential for removing duplicate face boxes in images.
- **Pedestrian Detection**: Critical for autonomous driving to distinguish between individuals in a crowd.
- **OCR**: Text detection pipelines use NMS to merge overlapping text region detections.

## Related
- IoU vs DIoU vs CIoU
- Anchor Boxes
- Object Detection Metrics
