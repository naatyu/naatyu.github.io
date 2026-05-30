---
title: "Long Short-Term Memory Network (LSTM)"
date: 2026-05-07
lastmod: 2026-05-07
tags:
  - ai/deep-learning
  - architectures
  - rnn
  - theory
draft: false
---

## Summary

Long Short-Term Memory Networks are a type of recurrent neural network designed to preserve information over long sequences. They do this with a cell state and a set of gates that control what to forget, what to write, and what to expose.
## Concepts
- **Recurrent Neural Network (RNN):** A neural network that processes inputs sequentially and reuses state across time steps.
- **Hidden State:** The short-term state of the network at time $t$.
- **Cell State:** The long-term memory carried through the sequence.
- **Forget Gate:** Controls what part of the previous cell state should be removed.
- **Input Gate:** Controls what new information should be written to the cell state.
- **Output Gate:** Controls what part of the cell state should be exposed as hidden state.

## Content

### What It Represents
An LSTM is an RNN with memory control.

Instead of trying to store everything in a single hidden vector, it separates memory into:
- **$h_t$**: the visible hidden state
- **$c_t$**: the internal cell state that carries long-term information

The gates learn when to keep, update, or reveal information. This makes LSTMs much better than vanilla RNNs at handling long-range dependencies.

### Mathematical Structure
At time step $t$, the LSTM receives:
- current input $x_t$
- previous hidden state $h_{t-1}$
- previous cell state $c_{t-1}$

The gates are computed from the concatenation $[h_{t-1}, x_t]$:

$$f_t = \sigma(W_f [h_{t-1}, x_t] + b_f)$$
$$i_t = \sigma(W_i [h_{t-1}, x_t] + b_i)$$
$$\tilde{c}_t = \tanh(W_c [h_{t-1}, x_t] + b_c)$$
$$o_t = \sigma(W_o [h_{t-1}, x_t] + b_o)$$

Then the cell state and hidden state are updated as:

$$c_t = f_t \circ c_{t-1} + i_t \circ \tilde{c}_t$$
$$h_t = o_t \circ \tanh(c_t)$$

Where:
- $\sigma$ is the sigmoid function
- $\tanh$ is the hyperbolic tangent
- $\circ$ is element-wise multiplication

### Gate Interpretation
- **Forget gate $f_t$**: decides what information from $c_{t-1}$ to keep
- **Input gate $i_t$**: decides what new information to store
- **Candidate cell state $\tilde{c}_t$**: proposes new content to write
- **Output gate $o_t$**: decides what part of the memory becomes visible as $h_t$

### Forward Pass
To process a sequence:
1. Initialize $h_0$ and $c_0$
2. For each input $x_t$:
   - compute the forget gate
   - compute the input gate
   - compute the candidate cell update
   - update the cell state
   - compute the output gate
   - update the hidden state
3. Return:
   - the hidden states at every time step
   - the final hidden state
   - the final cell state

### Why It Works Better Than a Vanilla RNN
Vanilla RNNs repeatedly transform a single hidden state, which makes long-term dependencies hard to preserve.

LSTMs reduce this problem because:
- the cell state provides a more direct path for information
- the forget gate can preserve useful memory over many steps
- the input gate prevents irrelevant updates from overwriting the state

This helps with the vanishing gradient problem in sequence learning.

### Example Interpretation
For the input sequence:

$$[1.0, 2.0, 3.0]$$

with zero initial states, the LSTM processes each step sequentially and updates its memory at each time step.

The final hidden state summarizes the whole sequence, which is why LSTMs are useful for:
- time series forecasting
- speech recognition
- machine translation
- sequence classification

### Implementation Notes
For a minimal NumPy implementation:
- store one weight matrix and bias vector per gate
- concatenate $h_{t-1}$ and $x_t$ before each gate computation
- use sigmoid for the gates and tanh for the candidate/state output
- keep both the hidden states and cell states during the forward pass

For a sequence input shaped $(T, input\_size)$, the forward pass is $O(T)$ in time and stores $O(T)$ hidden outputs if all time steps are returned.

## Related
- [Activation functions](/atlas/ai/foundations/activation-functions)
- [Binary Cross-Entropy Loss](/atlas/ai/training/losses/binary-cross-entropy-loss)
- Transformers MOC
