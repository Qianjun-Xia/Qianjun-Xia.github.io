---
title: "RoboVoxel"
tagline: "Inferring soft-body physics from videos"
collection: projects
permalink: /projects/robovoxel/
teaser: /images/projects/RoboVoxel/teaser.webp
date: 2025-06-01
status: "Under Review"
kind: research
affiliation: "Columbia University · Creative Machines Lab"
advisors: "Jiong Lin, Prof. Hod Lipson"
excerpt: "Recasts system identification as video-to-image translation: a video transformer reads a short grayscale clip of a deformable body and predicts a voxel-level parameter field — stiffness, mass, actuator layout — that a spring-mass simulator can replay."
role: "Dataset generation, model design, training and evaluation"
tech: [PyTorch, Video Transformer, VAE, Evolution Gym, Physics Simulation]
---

A rigid robot arrives with a CAD model: clean masses, known inertias, documented
joint limits. A soft body arrives with none of that. Its material properties vary
across space, it deforms far past the linear regime, and its actuators may be
buried where no camera can see them.

**RoboVoxel** asks whether a short video is enough to guess the rest.

> Given a few seconds of a deformable body moving, can we recover the material
> field and actuator placement well enough to reproduce that motion in simulation?

## Method

The trick is to stop treating this as parameter fitting and treat it as
**translation**. The input is a grayscale video. The output is a single *parameter
image*, where each pixel is a voxel and each colour channel carries one physical
quantity — stiffness, mass, damping, actuator direction.

That image is exactly what the simulator eats. If the simulator's rollout matches
the original video, the inferred parameters mean something.

From grey motion, to coloured physics, and back to motion.

The pipeline has three parts:

1. **A synthetic dataset.** A modified 2D spring-mass environment, built on
   Evolution Gym, generates matched pairs for many random beams, blobs and soft
   robots: a grayscale motion sequence, and the colour parameter image that
   produced it.

2. **A frozen decoder.** A convolutional autoencoder is trained on parameter
   images alone, then frozen. It becomes a renderer: low-dimensional latent in,
   full-resolution parameter field out.

3. **A video transformer.** A TimeSformer-style model reads the grayscale frames
   and emits a latent vector for that frozen decoder. Training supervises the
   predicted parameter image directly.

To hand a prediction back to the simulator, the continuous output is clustered
into a discrete set of material and actuator types, then simulated.

## Results

{% include figures.html
   a="/images/projects/RoboVoxel/beam_output.gif" a_alt="Simulated beam rollout"
   b="/images/projects/RoboVoxel/blob_output.gif" b_alt="Simulated blob rollout"
   c="/images/projects/RoboVoxel/robot_output.gif" c_alt="Simulated soft robot rollout"
   caption="Rollouts driven by inferred parameters — a beam, a blob, and a soft robot." %}

## My contribution

Dataset generation and the simulator modifications, the model design for both the
parameter-image decoder and the video transformer, and the training and evaluation
that connects them.
