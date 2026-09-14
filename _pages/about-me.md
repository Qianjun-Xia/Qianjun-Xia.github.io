---
layout: page
title: "About"
tagline: "Who I am and where I have been."
permalink: /about/
---

I am a Master's student in Mechanical Engineering (Research Track) at **Columbia
University**, concentrating on robotics and control. In the
[Creative Machines Lab](https://www.creativemachineslab.com/), advised by
[Jiong Lin](https://jl6017.github.io/) and [Hod Lipson](https://www.hodlipson.com/),
I work on recovering physics from video and putting it back into machines that move.

Before Columbia I earned my Bachelor's degree at **Shanghai Jiao Tong University**,
advised by [Prof. Dong Wang](https://me.sjtu.edu.cn/en/FullTimeTeacher/wangdong1.html),
where I built magnetic wire-guiding robots for minimally invasive surgery.

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
