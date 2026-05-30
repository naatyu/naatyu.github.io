---
title: "TTS Concurrent Real-Time Stream Capacity"
date: 2026-04-20
lastmod: 2026-04-24
tags:
  - ai/serving
  - tts
  - optimization
  - system-design
draft: false
---

## Summary

Capacity planning for Text-to-Speech (TTS) streaming services involves identifying the tightest constraint among compute, memory, and network resources. The goal is to maximize the number of concurrent streams while maintaining a **Real-Time Factor (RTF)** below 1 to ensure seamless playback.
## 1. Real-Time Factor (RTF)
RTF is the primary metric for audio generation speed. It measures how much compute time is required to generate a specific duration of audio.

$$RTF = \frac{\text{Processing Time}}{\text{Audio Duration}}$$

- **RTF &lt; 1**: The system generates audio faster than real-time (safe for streaming).
- **RTF = 1**: The system is at the limit; any jitter will cause playback stutter.
- **RTF &gt; 1**: The system cannot sustain a single real-time stream alone.

### Compute Capacity ($C_{compute}$)
A single GPU provides 1 second of compute per real second. Across $N$ GPUs:
$$C_{compute} = \lfloor \frac{N}{RTF} \rfloor$$

---

## 2. Resource Constraints

The maximum capacity of a TTS system is determined by its **tightest bottleneck**:
$$C_{max} = \min(C_{compute}, C_{memory}, C_{bandwidth})$$

### A. Memory Constraint ($C_{memory}$)
Each concurrent stream requires VRAM for decoder states, KV caches (for autoregressive models like Bark), and output buffers.
$$C_{memory} = \lfloor \frac{M}{m} \rfloor$$
*   $M$: Total available GPU VRAM (MB).
*   $m$: VRAM required per concurrent stream (MB).

### B. Network Bandwidth Constraint ($C_{bandwidth}$)
Each stream transmits audio at a specific bitrate $b$ (kbps).
$$C_{bandwidth} = \lfloor \frac{B \times 1000}{b} \rfloor$$
*   $B$: Total outbound bandwidth (Mbps).
*   $b$: Audio bitrate (kbps) (e.g., 128 kbps for standard speech).

---

## 3. Practical Example: Identifying the Bottleneck

**Scenario:**
- **Hardware**: 1x NVIDIA A10G (24 GB VRAM).
- **Network**: 100 Mbps uplink.
- **Model**: $RTF = 0.05$, $m = 400$ MB per stream.
- **Audio**: 128 kbps bitrate.

**Calculations:**
1.  **Compute**: $1 / 0.05 = \mathbf{20}$ streams.
2.  **Memory**: $24,000 / 400 = \mathbf{60}$ streams.
3.  **Bandwidth**: $(100 \times 1000) / 128 \approx \mathbf{781}$ streams.

**Result**: The bottleneck is **Compute**. Adding more GPUs or optimizing the model (e.g., via TensorRT) is the most effective way to scale.

---

## 4. Optimization Strategies

| Bottleneck | Solutions |
| :--- | :--- |
| **Compute** | Use smaller/distilled models, FP16/INT8 quantization, or faster kernels (Flash Attention). |
| **Memory** | Use **KV Cache Quantization**, shared weights, or offload inactive states to system RAM. |
| **Bandwidth** | Use efficient codecs like **Opus** or **EnCodec**, or reduce the sampling rate (e.g., 24kHz to 16kHz). |

## Related
- [Disaggregated Prefill-Decode Serving](/atlas/ai/inference-serving/serving-architectures/disaggregated-prefill-decode-serving)
- Throughput vs Latency
- Audio Encoders and Decoders
- Quantization Methods
