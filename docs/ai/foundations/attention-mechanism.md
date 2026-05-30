---
title: "Attention Mechanism"
date: 2024-09-27
lastmod: 2026-05-04
tags:
  - ai/llm
  - theory/attention
draft: false
---

## Summary

A visual explanation of the transformer's attention mechanism, where embeddings are dynamically adjusted through Query, Key, and Value interactions.
## Concepts
- **Attention Mechanism:** a technique that allows a model to weigh the importance of different parts of the input data differently.
- **Query (Q):** a vector representing the current token's "search" for relevant context.
- **Key (K):** a vector that represents a token's content for matching against queries.
- **Value (V):** the actual information that is passed along once a match between query and key is found.
- **Self-Attention:** an attention mechanism where the queries, keys, and values all come from the same input sequence.
- **Masking:** a technique to prevent the model from "looking ahead" at future tokens during training.

## Content
 So let's say we have the embedding of the word man, a simple step in the embedding space can bring us to the embedding of woman
![Attention Mechanism 01](/attachments/ai/nlp/attention-mechanism/attention-mechanism-01.png)
So a change in this space can change the meaning of the embedding:
![Attention Mechanism 02](/attachments/ai/nlp/attention-mechanism/attention-mechanism-02.png)
The goal of the transformer is to adjust this embedding to refine the meaning.
Before attention, all tokens have the same embedding (recall that at the beginning of the transformer, all tokens are mapped to a learned embedding matrix $\mathcal{M}$ of dimension $vocab\_size \times embedding\_size$). So the goal of the attention block is to take a step in the embedding space such that the initial embedding of the token now take into account the context.
![Attention Mechanism 03](/attachments/ai/nlp/attention-mechanism/attention-mechanism-03.png)
Ici par exemple, l'attention permet de faire un step dans l'espace d'embedding pour que l'embedding du token tour soit mieux associé au contexte. De façon plus générale, l'attention permet de déplacer l'information contenue dans un token vers un autre. En réalité, cela peut provenir de plusieurs tokens plus ou moins loin.
Lets dive in a single head of attention. The attention head will produce a new embedding for each token, but this new embedding will be enhanced with the context of other tokens.
![Attention Mechanism 04](/attachments/ai/nlp/attention-mechanism/attention-mechanism-04.png)
The first step of the attention is the Query $Q$. This is a learnable matrix, usually of a lower dimension that the embedding like 128 for an embedding of 768 for exemple. The query will modify the embedding to kind of search for information, this is purely conceptual we don't exactly know what they are doing. Then we have the keys $K$. This is also a learnable matrix that modify, the embeddings. We can see the keys has answering the query (once again this is conceptual).
![Attention Mechanism 05](/attachments/ai/nlp/attention-mechanism/attention-mechanism-05.png)
The keys have same dimensions as the query matrix.
To see how well a key respond to a query, we use the dot product (high dot product mean that they are codirectional where on the other hand, they are orthogonal). We have the following equation:
$$dot\space product=Q \times K^{\intercal}$$
This give us a matrix where each data point correspond to how well the key respond to the query. In the above exemple, we can expect the dot product of $Q_4$ to be high with $K_2$ and $K_3$. But for other words, we expect the dot product to be low, since they don't respond well to the query. Since the dot product can vary from negative to positive infinity, we have to normalize the result. This can be seen as associating weights to embeddings.
![Attention Mechanism 06](/attachments/ai/nlp/attention-mechanism/attention-mechanism-06.png)
We can apply column-wise softmax to do that. This final grids of "weight" can be seen as an attention pattern. After applying the softmax, we have the following:
$$attention \space pattern=softmax(\frac{QK^\intercal}{\sqrt{d_k}})$$
We can see that a new term appeared, $d_k$. This term is mainly added for numerical stability, since value can be very large. It helps with vanishing gradient and avoiding being in the saturation regime of the softmax. This term represent the dimensionality of the keys and queries, for exemple in many implementations, we have a hidden size of 768 and 12 attention heads and the dimensionality would be $768/12$ which is $64$. This dimension affect the model capacity to represent complex relationships. 
![Attention Mechanism 07](/attachments/ai/nlp/attention-mechanism/attention-mechanism-07.png)
We don't want to allow later words to influence previous words, since it will impact the update of the attention and leak what comes next.
![Attention Mechanism 08](/attachments/ai/nlp/attention-mechanism/attention-mechanism-08.png)
Here red dot entries have to be forced to be zero since they represent information on later tokens (remember that the query kind of represent a question and the key answer, but we don't want the key to answer for tokens we are not supposed to see). But if we transforms them to 0, then the columns won't sum to one due to softmax and it won't be normalized. So one solution is to transform this to $-\infty$ so after applying softmax, they become 0 and columns are normalized. This is called masking. 
We can also point out that the size of this attention pattern is the squared of the context size, so it grows very fast, explaining it is hard to have large context size. 

### Optimization: KV Cache

During autoregressive generation (inference), calculating the attention pattern for every new token would be $O(N^2)$ if we re-processed the whole sequence. To optimize this, we use a [KV Cache](/atlas/ai/inference-serving/caching/kv-cache) to store the Key and Value projections of past tokens, reducing the per-token complexity.
For now, we only computed the pattern to which words are relevant to which other words. Now we need to update the embedding, knowing the pattern to use. So for that we have a third matrix, the value $V$. The goal of this matrix is by multiplying the value to the embedding, we get a value vector that we add to the embedding of the next word so that this word better represent the context. In the exemple, we compute the value of fluffy such that when adding this value to the token creature, it will add the meaning of fluffy to the embedding of creature.
![Attention Mechanism 09](/attachments/ai/nlp/attention-mechanism/attention-mechanism-09.png)
 So if we look back at the attention pattern, we will use this values to update the embedding of the word with the previous calculated "weight" attention and this will give us the step that we have to take to better encode the meaning of the token: ![Attention Mechanism 10](/attachments/ai/nlp/attention-mechanism/attention-mechanism-10.png)
 By adding all these scaled values we have a $\Delta E$ which represent the step to take in the embedding space. And then we only have to add this step to the original embedding to go to the direction encoding the new meaning. The value matrix is a squared matrix. But if we keep it like it, it will be way to large. So this single matrix is broken into two matrix by keeping the dimension size so we have $V=[embedding\_size\times d_k][d_k\times embedding\_size]$. This is a low rank transformation. If we take back the calculation, we use the $[d_k\times embedding\_size]$ matrix to compute with the attention pattern and this will produce $d_k$ dimensional vectors. We can then use the second part of the $V$ matrix, $[embedding\_size\times d_k]$  to rescale back to a $embedding\_size$ vector.
 *This is a single head of attention*, and specifically self attention. There is also cross-attention. This is used when we have different type of data like English and French phrases. We can then have queries computed with English tokens and keys with French tokens. This is used in the encoder-decoder architecture in the transformer but not in decoder only (since we only have one type of data). 
 In practice, we use multi-head attention to capture multiple attention patterns, where each head as a unique $W$, $K$ and $V$. In comparison to single head attention, we can see this as each head proposing a change in the embedding of the token, and then all these changes are summed to update the original embedding. There is also a change in multi head attention with the $V$ matrix, they are concatenated:
 ![Attention Mechanism 11](/attachments/ai/nlp/attention-mechanism/attention-mechanism-11.png)
 Since we have multiple block in the transformer, when we go deeper in the model, the embeddings take more and more meaning. And doing that mean that other tokens have more chance to influence the embedding of a token.
