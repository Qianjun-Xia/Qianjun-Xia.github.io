---
layout: page
title: "About"
tagline: "Who I am and where I have been."
permalink: /about/
---

I am a Ph.D. student in **Computer Science** at the **University of British
Columbia**, in the PhysAI Lab, supervised by
[Prof. Peter Yichen Chen](https://peterchencyc.com/). The lab builds simulators
of the 3D physical world to make physical AI possible — which is the question I
had been circling from the hardware side, and now get to work on directly.

Before UBC I took my Master's in Mechanical Engineering at **Columbia
University**, in the
[Creative Machines Lab](https://www.creativemachineslab.com/) with
[Jiong Lin](https://jl6017.github.io/) and
[Prof. Hod Lipson](https://www.hodlipson.com/), on recovering physical
parameters of deformable bodies from video. Before that I built magnetic
wire-guiding robots for minimally invasive surgery at **Shanghai Jiao Tong
University**, advised by
[Prof. Dong Wang](https://me.sjtu.edu.cn/en/FullTimeTeacher/wangdong1.html).

The through-line is the same either way: getting physics out of the world
accurately enough that a machine can act on it.

## Education

{% for e in site.data.cv.education %}
**{{ e.what }}** — {{ e.where }}
{{ e.when }}{% if e.note %} · {{ e.note }}{% endif %}
{% endfor %}

## Experience

{% for e in site.data.cv.experience %}
**{{ e.what }}** — {{ e.where }}
{{ e.when }}
{{ e.note }}
{% endfor %}

## Toolbox

{% for s in site.data.cv.skills %}
**{{ s.group }}** — {{ s.items | join: " · " }}
{% endfor %}

## Elsewhere

<a class="btn" href="mailto:{{ site.author.email }}">Email</a>
<a class="btn btn--ghost" href="https://github.com/{{ site.author.github }}">GitHub</a>
{% if site.author.googlescholar %}<a class="btn btn--ghost" href="{{ site.author.googlescholar }}">Scholar</a>{% endif %}
{% if site.author.linkedin %}<a class="btn btn--ghost" href="https://www.linkedin.com/in/{{ site.author.linkedin }}">LinkedIn</a>{% endif %}
<a class="btn btn--ghost" href="/cv/">CV</a>
