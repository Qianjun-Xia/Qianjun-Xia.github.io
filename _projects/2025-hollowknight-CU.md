---
title: "(ORCSE4529) Reinforcement Learning Course Project: Rise of the AI Knight"
collection: projects
permalink: /projects/hollowknight/
# date: 2025-11-24
# venue: "Under review"
---

![HollowKnight teaser](/images/projects/HollowKnight/teaser.png)

## Overview

This project investigates the development of reinforcement learning (RL) agents for the challenging action-platformer games **Hollow Knight** and **Silksong**. We explore whether improved performance, robustness, and training efficiency can be achieved through refined state representations and modern RL architectures.

Our objective is to design agents capable of learning navigation, combat, and evasion behaviors directly from **raw pixel observations** and **game-state variables** such as player health and boss health.

---

## Technical Approach

We draw inspiration from **model-based reinforcement learning (MBRL)**—particularly from [**STORM**](https://proceedings.neurips.cc/paper_files/paper/2023/hash/5647763d4245b23e6a1cb0a8947b38c9-Abstract-Conference.html), a stochastic Transformer-based architecture that represents images using categorical VAEs and predicts future dynamics in latent space.  
STORM demonstrates how **latent imagination**, **Transformer sequence modeling**, and **stochastic world representations** can significantly improve sample efficiency and long-horizon reasoning.  

---

## Outcomes

<iframe width="560" height="315"
    src="https://www.youtube.com/embed/Amnv1mkn3vo"
    title="YouTube video player"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen>
</iframe>

---

**Reference**

Zhang, W., Wang, G., Sun, J., Yuan, Y., & Huang, G. (2023).  
*STORM: Efficient Stochastic Transformer based World Models for Reinforcement Learning.*  
Advances in Neural Information Processing Systems (NeurIPS 2023).  
[PDF](https://proceedings.neurips.cc/paper_files/paper/2023/file/5647763d4245b23e6a1cb0a8947b38c9-Paper-Conference.pdf)



