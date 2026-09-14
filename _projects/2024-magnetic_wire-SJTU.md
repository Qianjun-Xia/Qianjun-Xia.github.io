---
title: "Magnetic Guidewire Robot"
tagline: "Magnetically actuated vascular guidewire with Cosserat-rod modeling"
collection: projects
permalink: /projects/magnetic_wire/
teaser: /images/projects/MagneticWire/teaser.webp
teaser_w: 1920
teaser_h: 785
date: 2024-06-01
status: "To be Submitted"
kind: research
affiliation: "Shanghai Jiao Tong University"
advisors: "Prof. Dong Wang"
excerpt: "A hard-magnetic guidewire steered by a permanent magnet on an industrial robot arm, built to cut surgeons' X-ray exposure in minimally invasive cardiovascular procedures. Combines a Cosserat-rod deformation model, a Qt control platform, and vision feedback for autonomous navigation and error recovery."
role: "Teleoperation framework, Qt/PyQt control platform, Cosserat-rod model, experiments"
tech: [Cosserat Rod, PyQt, Industrial Robotics, Vision Feedback, Control]
---

In a cardiovascular intervention the surgeon stands beside the patient, pushing a
guidewire through vessels they can only see on X-ray — and absorbing that X-ray
for every minute of the procedure.

This project removes the hand from the wire. A **hard-magnetic guidewire** is
steered from outside the body by a permanent magnet on an industrial robot arm,
which bends and turns the tip through tortuous vasculature without anyone
standing in the beam.

## The system

Two subsystems, one operator.

**Teleoperation.** A single Xbox controller drives all three actuators at once —
the industrial arm carrying the magnet, the feeding mechanism advancing the wire,
and the distal rotary motor. Real-time filtering keeps latency low enough that a
human can take over the moment something looks wrong.

{% include youtube.html id="2Hiq2QMg2gk" caption="Manual teleoperation: one controller, three actuators." %}

**Control platform.** A Qt/PyQt application on the PC: GUI built in QtDesigner,
with a script editor, console, live camera view and one-click macros. Procedures
can be scripted in Python and replayed, which is what turns a manual rig into a
repeatable one. An emergency stop halts every device through a multi-threaded
control path.

## Modeling the wire

Predicting where a magnetically loaded wire will go means modeling how it
deforms. Constant-curvature and Kirchhoff models are not enough here, so the wire
is treated as a **Cosserat rod** — a slender body free to bend, twist, stretch
and shear.

The rod is discretised with a finite-difference scheme that couples position,
orientation, curvature, and internal forces and moments. Magnetic torque enters
both from a uniform field and from the **dipole field** of the external permanent
magnet, so the simulation runs under the spatially varying field the wire
actually sees.

{% include figures.html
   a="/images/projects/MagneticWire/cosserat_plane.png" a_alt="Planar Cosserat rod model of the guidewire"
   b="/images/projects/MagneticWire/cosserat_space.gif" b_alt="Spatial deformation under a magnetic dipole field"
   caption="Planar rod model, and spatial deformation under the magnet's dipole field." %}

Sweeping these simulations builds a lookup from magnet pose to tip deflection.
That table is what the path-following controller steers against.

## In the phantom

A transparent 3D-printed vascular phantom with multiple bifurcations stands in
for patient anatomy. The complete system — controller, software, vision feedback,
magnetic actuation — was evaluated on two tasks.

**Following a path.** The guidewire tracks a preset route through the branches
and reaches the target under autonomous control.

**Recovering from a wrong turn.** When the wire enters the wrong branch, the
system sees the deviation on camera, retracts to the previous junction, recomputes
the magnet pose from the rod model, and advances again along the correct path.
Catching a mistake and undoing it is the part that matters clinically.

{% include youtube.html id="vY4k4M6qtvw" caption="Autonomous navigation, and recovery after entering a wrong branch." %}

## My contribution

- The unified manual control framework — Xbox controller through the PC to the
  arm, feeder and distal motor — including real-time filtering and signal routing.
- The Qt/PyQt platform: GUI, scripting interface, macros, and the multi-threaded
  emergency stop.
- Formulating and implementing the Cosserat-rod model, its finite-difference
  discretisation, and the magnetic loading.
- Running the phantom experiments, and integrating vision feedback with control
  to demonstrate autonomous navigation and error recovery.
