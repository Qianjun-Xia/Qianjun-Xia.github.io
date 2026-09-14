---
layout: page
title: "Research"
tagline: "Physical intelligence: reading physics out of the world, and writing it back into machines."
permalink: /research/
wide: true
---

My work sits between **perception** and **physics**. A video shows what a body
did; a simulator needs to know what that body *is* — its stiffness, its mass,
where its actuators sit, how its parts connect. I build models that close that
gap, so that a machine can act on the physics rather than only observe it.

I am a Ph.D. student in the PhysAI Lab at UBC, supervised by
[Prof. Peter Yichen Chen](https://peterchencyc.com/).

## Directions

### World modeling from real interaction

Turning recordings of real robot-object interaction into simulatable digital
twins, so that policies can be trained and evaluated against something that
behaves like the world did. Vision-language agents recover geometry, object
state and physical parameters without per-scene hand tuning — across rigid
manipulation, deformable interaction and humanoid motion.

### Soft-body parameter estimation

Deformable bodies have properties that vary across space, deform far past the
linear regime, and hide their actuators where no camera can see them. I treat
system identification as a translation problem: from a short grayscale video to
a voxel-level parameter field a simulator can replay.

### Modeling and control of slender structures

Elastic-rod models for magnetically actuated guidewires — bending, torsion,
stretching and shear under a spatially varying field — and the control that
turns those models into autonomous navigation.

---

Media and write-ups are on the [projects](/projects/) page; papers are listed
under [publications](/publications/).
