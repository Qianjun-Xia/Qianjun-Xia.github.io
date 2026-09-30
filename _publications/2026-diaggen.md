---
title: "DiagGen: Agentic Generation of Deformable Assets with Sim-based Diagnostics for Robotic Simulation"
collection: publications
permalink: /publications/diaggen/
authors: "Guanxiong Chen*, Yiduo Qu*, Qianjun Xia*, Pengyu Jing, Yixian Cheng, Bole Ma, Pengzhi Yang, Bingyang Zhou, Ziming Li, Shashwat Suri, Gongbo Sun, Chao Liu, Peter Yichen Chen, Ziqiu Zeng, Fan Shi"
venue: "arXiv preprint"
year: 2026
status: preprint
status_label: "Preprint"
date: 2026-09-19
teaser: /images/projects/DiagGen/teaser.webp
teaser_w: 1920
teaser_h: 800
arxiv: https://arxiv.org/abs/2609.23103
code: https://github.com/diaggen/diaggen
site: https://diaggen.github.io/
paperurl: https://diaggen.github.io/static/DiagGen_pub-release_26-09-19-14-27.pdf
video: https://www.youtube.com/watch?v=_sARsG-4vyM
excerpt: "From a single image to a deformable asset that can be tested, repaired and used in simulation: an agentic pipeline generates part-aware geometry and materials, and a diagnostic agent uses simulation feedback to route targeted repairs."
---

\* Equal technical contribution.

A simulator needs more from an object than its shape. It needs to know which
parts are which, how stiff each one is, how they hold together under contact —
and a mesh lifted from a photograph carries none of that reliably.

**DiagGen** generates the asset and then *checks its own work*. Part-aware
geometry and material properties come from an everyday image; the result is
then put through controlled interactions in a physics simulator, and a
diagnostic agent probes the regions where the outcome is most informative. What
it finds is routed back as repair cues — to segmentation, to material
inference, or to mesh processing, depending on where the fault lies.

Evaluated on 40 assets, the feedback is useful and repair gives moderate
improvements. The generated assets hold up in contact-rich manipulation and
drop into reconstructed real-world scenes, where their connectivity and
material behaviour make a visible difference downstream.

The asset gallery, interactive 3D previews and the full method are on the
[project site](https://diaggen.github.io/).
