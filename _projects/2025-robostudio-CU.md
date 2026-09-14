---
title: "M.E.H — Bipedal Robot"
tagline: "A low-cost walking biped built from scratch"
collection: projects
permalink: /projects/robostudio/
teaser: /images/projects/RoboticStudio/teaser.webp
date: 2025-05-01
status: "Completed"
kind: course
course: "MECEE4611 Robotics Studio"
affiliation: "Columbia University"
advisors: "Prof. Hod Lipson"
collaborators: "Zizai Ma"
excerpt: "A bipedal prototype reaching ~32 cm/s on flat ground under lightweight hardware and low-cost actuation. I owned the control side — gait planning, inverse kinematics, and the software architecture."
role: "Control algorithms, gait planning, inverse kinematics, software architecture"
tech: [Inverse Kinematics, Gait Planning, Embedded Control, CAD]
---

**M.E.H** is a bipedal robot built from nothing for MECEE4611 Robotics Studio,
Spring 2025, with Zizai Ma under Prof. Hod Lipson. Custom
mechanical design, embedded hardware, and a motion controller that had to work
within both.

It walks at about **32 cm/s** on flat ground — on lightweight parts and cheap
actuators, which is the constraint that made the controller interesting.

Zizai led mechanical design, fabrication and hardware integration. I took the
control side: gait planning, inverse kinematics, and the software architecture
tying them together.

## Legs and inverse kinematics

The leg linkage sets what the controller can ask for. Solving its inverse
kinematics gives the joint angles for a desired foot position, and the reachable
workspace tells the gait planner where it is allowed to put a foot down.

{% include figures.html
   a="/images/projects/RoboticStudio/leg.webp" a_alt="The physical leg linkage"
   b="/images/projects/RoboticStudio/ik.webp" b_alt="Inverse kinematics solution sweeping the leg workspace"
   caption="The leg as built, and the inverse-kinematics solution sweeping its workspace." %}

## Walking

Iterating between gait parameters and what the hardware would tolerate is most of
what turned a standing frame into a walking one. Low-cost actuators have backlash
and limited torque, so the gait had to stay inside what they could actually
deliver rather than what a simulator would allow.

{% include youtube.html id="LupJhmmK-0E" caption="M.E.H walking on flat ground." %}

## My contribution

Control algorithms, gait planning, the inverse-kinematics solver, and the overall
software architecture.
