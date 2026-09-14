---
title: "Rise of the AI Knight"
tagline: "Model-based RL agents for Hollow Knight"
collection: projects
permalink: /projects/hollowknight/
teaser: /images/projects/HollowKnight/teaser.webp
teaser_w: 1920
teaser_h: 800
date: 2025-05-01
status: "Completed"
kind: course
course: "ORCSE4529 Reinforcement Learning"
affiliation: "Columbia University"
excerpt: "RL agents that learn navigation, combat and evasion in Hollow Knight and Silksong from raw pixels plus game-state variables, drawing on STORM-style Transformer world models and latent imagination."
role: "State representation, world-model training, evaluation"
tech: [Reinforcement Learning, World Models, Transformers, Categorical VAE]
---

**Hollow Knight** and **Silksong** are hard for an agent in a specific way:
success needs long-horizon reasoning about a boss's attack pattern, from nothing
but the pixels on screen. Reward is sparse, episodes are long, and a mistake ends
the run.

The agents here learn navigation, combat and evasion from **raw pixel
observations** plus a handful of game-state variables — player health, boss
health. The question we set out to answer was whether better state
representations and modern architectures buy performance, robustness and sample
efficiency on a game this unforgiving.

## Approach

The work builds on **model-based RL**, and specifically on
[STORM](https://proceedings.neurips.cc/paper_files/paper/2023/hash/5647763d4245b23e6a1cb0a8947b38c9-Abstract-Conference.html)
— a stochastic Transformer world model that encodes frames with a categorical VAE
and predicts future dynamics in latent space.

Three things in that design matter for a game like this. **Latent imagination**
lets the agent practise inside its own model instead of burning real episodes.
**Transformer sequence modeling** carries context far enough back to cover a boss
cycle. And a **stochastic world representation** leaves room for an environment
that does not repeat itself exactly.

## Outcome

{% include youtube.html id="Amnv1mkn3vo" caption="The trained agent in combat." %}

## My contribution

State representation, world-model training, and evaluation.

## Reference

Zhang, W., Wang, G., Sun, J., Yuan, Y., & Huang, G. (2023).
*STORM: Efficient Stochastic Transformer based World Models for Reinforcement
Learning.* Advances in Neural Information Processing Systems (NeurIPS 2023).
[PDF](https://proceedings.neurips.cc/paper_files/paper/2023/file/5647763d4245b23e6a1cb0a8947b38c9-Paper-Conference.pdf)
