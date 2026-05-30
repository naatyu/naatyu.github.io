---
title: "Group Relative Policy Optimization"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - unprocessed
draft: false
---

## Summary

[One sentence summary]
## Concepts
- **GRPO (Group Relative Policy Optimization):** a reinforcement learning algorithm that uses relative group rewards to optimize policies without a critic model.
- **KL Divergence:** a mathematical measure of how much one probability distribution differs from another, used to penalize large policy updates.
- **Advantage:** a score indicating how much better a specific outcome is compared to the average of its group.

[2402.03300](https://arxiv.org/pdf/2402.03300)

![Group Relative Policy Optimization 01](/attachments/ai/deep-learning/loss-functions/group-relative-policy-optimization/group-relative-policy-optimization-01.png)

Here $q$ is a question and $o$ is the output. In GRPO instead of having evaluating one output like in PPO we evaluate $G$ outputs. $r$ is the reward for the output. $A$ is the advantage, which measure how much better or worse a particular response id compared to the average quality of other responses.
**KL:** measure how one probability distribution differs from a second one. It "measure" the information lost from using one distribution to approximate another. It is from zero to positive and 0 means distributions are identical. In GRPO it is used as a regularization term during policy updates such that the new updated policy doesn't deviate too much (you try to minimize the KL between the old and new to make gradual steps).
The reward model can be a neural network or a rule base case (it's rule based in Deepseek math and Deepseek R1) 

![Group Relative Policy Optimization 02](/attachments/ai/deep-learning/loss-functions/group-relative-policy-optimization/group-relative-policy-optimization-02.png)
The division between the old policy and the new policy is to add momentum like in ADAM. The clip part is such that we have a "max" possible update. This ensure we can't do crazy updates. At the end we have the $KL$ divergence between new and old policy that is:
$$\mathbb{D}_{KL}[\pi_\theta||\pi_{ref}]=
rac{\pi_{ref}(o_{i,t}|q, o_{i,<t})}{\pi_{\theta}(o_{i,t}|q, o_{i,<t})} - log{
rac{\pi_{ref}(o_{i,t}|q, o_{i,<t})}{\pi_\theta(o_{i,t}|q, o_{i,<t})}} - 1$$
At the beginning, $
rac\{1\}\{G\}\sum_\{i=1\}^\{G\}$ is the average between all groups. A group is a outputs for a single question. 
Here $
rac\{1\}\{|\{o_i\}|\}\sum_\{t=1\}^\{|o_i|\}$ this is for all the outputs, we take the minimum between the momentum of the policies with the advantage and the clipped one (to not go too far) and then we subtract with the KL divergence because we want to maximize the GRPO objective (it act as a penalty so that the new GRPO objective is penalized when KL divergence is high since we don't want the new policy to change too much, $\beta$ determines how much we want to penalize it).  
The advantage is:
$$A_i=
rac{r_i-mean({r_1,r_2,...,r_G})}{std({r_1,r_2,...,r_G})}$$
We have the reward of the current point and the mean, std of the current group. The advantage is how much the reward is good compared to the group.

This is a schema of GRPO
![Group Relative Policy Optimization 03](/attachments/ai/deep-learning/loss-functions/group-relative-policy-optimization/group-relative-policy-optimization-03.png)
