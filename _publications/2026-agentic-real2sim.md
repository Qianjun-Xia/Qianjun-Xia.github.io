---
title: "Agentic Real2Sim: Physics-based World Modeling with Vision-Language Agents"
collection: publications
permalink: /publications/agentic-real2sim/
authors: "Guanxiong Chen*, Qianjun Xia*, Jiawei Peng*, Heng Zhang*, Pengyu Jing*, Bole Ma*, Justin Qian, Yixian Cheng, Ziyi Jiao, Bingyang Zhou, Yiduo Qu, Luoxin Ye, Kaifeng Zhang, Kunyi Wang, Weijia Zeng, Yunuo Chen, Pengzhi Yang, Ziqiu Zeng, Siyuan Luo, Huamin Wang, Chao Liu, Alan Yuille, Fan Shi, Changxi Zheng, Yunzhu Li, Chenfanfu Jiang, Peter Yichen Chen"
venue: "arXiv preprint"
year: 2026
status: preprint
status_label: "Preprint"
date: 2026-09-01
teaser: /images/projects/AgenticReal2Sim/teaser.webp
teaser_w: 800
teaser_h: 600
arxiv: https://arxiv.org/abs/2607.19190
code: https://github.com/agentic-real2sim/agentic_real2sim
site: https://agentic-real2sim.github.io/
paperurl: https://agentic-real2sim.github.io/static/paper/AR2S_2026-09-13-13-07_v1.pdf
excerpt: "An agentic framework that converts real robot-object interaction recordings into simulatable digital twins, spanning rigid manipulation, deformable interaction and humanoid motion."
---

\* Equal technical contribution.

Converting a real interaction into a simulation usually means hand-tuning models
and aligning coordinate frames by hand, once per scene. This work replaces that
with vision-language agents that recover geometries, object states and physical
parameters directly from the recording.

One pipeline covers **rigid-object manipulation**, **deformable-object
interaction** and **humanoid motion** — cases that previously needed separate,
specialised Real2Sim methods. An open-weight VLM backend reaches success rates
comparable to frontier models, which makes the pipeline cheap enough to run at
dataset scale. The resulting twins are used downstream for policy learning and
for evaluating policies against something that behaves like the world did.

Videos, an interactive scene viewer and the 25-episode DROID gallery are on the
[project site](https://agentic-real2sim.github.io/).
