/*
 * Click anywhere that is not a control and a small object falls, tumbles and
 * settles — on the page's own text and images, which act as ledges.
 *
 * Matter.js is fetched on the first click, so a visitor who never clicks never
 * pays for it.
 */
(function () {
  "use strict";

  var MATTER_SRC = "/assets/js/lib/matter.min.js";
  // When the pile reaches this, the gorilla comes and clears it.
  var MAX_ITEMS = 45;

  // How long each beat of the gorilla's routine lasts.
  var HOP_MS = 900;
  var BEAT_MS = 1200;
  var SUCK_MS = 6500;   // ceiling; it leaves as soon as the pile is gone
  var PEEL_MS = 1400;   // spread of the moment each prop is caught
  var LEAVE_MS = 700;
  var MAX_LEDGES = 140;
  // A prop falling at speed can pass through a body thinner than the distance
  // it covers in one step, so thin ledges are padded. Axis-aligned ones grow
  // downwards, keeping their top edge where it is drawn.
  var MIN_LEDGE_H = 16;

  // Physics shape per sprite. Rounds tumble and roll; boxes stack.
  var PROPS = [
    { id: "d-nut",    shape: "circle", size: 40 },
    { id: "d-gear",   shape: "circle", size: 44 },
    { id: "d-bolt",   shape: "rect",   size: 40, w: 0.32, h: 0.9 },
    { id: "d-spring", shape: "rect",   size: 42, w: 0.66, h: 0.72 },
    { id: "d-voxel",  shape: "rect",   size: 40, w: 0.76, h: 0.78 },
    { id: "d-wheel",  shape: "circle", size: 44 },
    { id: "d-chip",   shape: "rect",   size: 40, w: 0.62, h: 0.66 },
    { id: "d-grip",   shape: "rect",   size: 40, w: 0.54, h: 0.82 },
    { id: "d-star",   shape: "circle", size: 40 },
    { id: "d-leaf",   shape: "circle", size: 38 },
    { id: "d-bean",   shape: "circle", size: 36 },
    { id: "d-plane",  shape: "rect",   size: 40, w: 0.82, h: 0.76 },
    { id: "d-blob",   shape: "circle", size: 40 }
  ];

  // Text whose line boxes catch falling props. Kept to prominent type —
  // every line of every paragraph would bury the page in ledges.
  var TEXT_LEDGES = [
    ".land__name", ".land__tag", ".land__nav a", ".land__foot",
    ".head__title", ".head__tag", ".bar__mark", ".bar__nav a",
    ".prose h2", ".prose h3", ".group__title",
    ".plate__name", ".plate__meta", ".pub__title", ".badge", ".btn"
  ].join(",");

  // Things that catch props by their whole box rather than their text.
  var BOX_LEDGES = [
    ".plate__img", ".hero-figure", ".facts",
    ".fig > img", ".fig__row img", ".fig__video", ".pub__thumb"
  ].join(",");

  // The arm illustration, in its own viewBox (0 0 320 150). Segments are
  // {x1,y1,x2,y2,t}; boxes are {x,y,w,h}. Mapped to the screen at measure
  // time, so a prop lands on a link rather than on the artwork's bounding box.
  var ARM_VB = { w: 320, h: 150 };
  var ARM_SEGMENTS = [
    { x1: 18,  y1: 134, x2: 302, y2: 134, t: 5 },   // ground line
    { x1: 56,  y1: 108, x2: 92,  y2: 60,  t: 10 },  // link 1
    { x1: 92,  y1: 60,  x2: 168, y2: 44,  t: 10 },  // link 2
    { x1: 168, y1: 44,  x2: 222, y2: 78,  t: 10 }   // link 3
  ];
  var ARM_BOXES = [
    { x: 30,  y: 104, w: 52, h: 30 },               // base
    { x: 236, y: 86,  w: 26, h: 26 }                // the block it holds
  ];

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var stage = null;
  var engine = null;
  var walls = [];
  var ledges = [];       // static bodies mirroring text lines and boxes
  var items = [];        // { body, el, half }
  var loading = false;
  var queued = null;
  var raf = 0;
  var last = 0;

  var gorilla = null;   // { el, phase, mouth: {x, y} }

  // ---------------------------------------------------------------- setup

  function makeStage() {
    stage = document.createElement("div");
    stage.className = "drop-stage";
    stage.setAttribute("aria-hidden", "true");
    document.body.appendChild(stage);
  }

  function buildWalls() {
    var M = window.Matter;
    var w = window.innerWidth;
    var h = window.innerHeight;
    var t = 200; // thick, so nothing tunnels through at speed

    for (var i = 0; i < walls.length; i++) M.Composite.remove(engine.world, walls[i]);

    walls = [
      M.Bodies.rectangle(w / 2, h + t / 2, w + t * 2, t, { isStatic: true }),
      M.Bodies.rectangle(-t / 2, h / 2, t, h * 3, { isStatic: true }),
      M.Bodies.rectangle(w + t / 2, h / 2, t, h * 3, { isStatic: true })
    ];
    M.Composite.add(engine.world, walls);
  }

  // ---------------------------------------------------------------- ledges

  // Ledges are measured ONCE, in document coordinates. Scrolling then costs
  // one subtraction per ledge — no getBoundingClientRect, so no forced
  // reflow on the scroll path. Re-measuring happens only on resize, on font
  // load, and when the layout is known to have changed.
  function measure() {
    var sx = window.pageXOffset;
    var sy = window.pageYOffset;
    var out = [];
    var range = document.createRange();

    function push(r, angle) {
      if (out.length >= MAX_LEDGES) return;
      if (r.w < 12 || r.h < 5) return;

      var h = r.h;
      var y = r.y;
      if (h < MIN_LEDGE_H) {
        if (angle) {
          h = MIN_LEDGE_H;             // rotated: grow about the centre line
        } else {
          y += (MIN_LEDGE_H - h) / 2;  // upright: grow downwards only
          h = MIN_LEDGE_H;
        }
      }

      out.push({ x: r.x + sx, y: y + sy, w: r.w, h: h, a: angle || 0 });
    }

    function pushRect(r) {
      push({ x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height });
    }

    // Prominent type, one body per rendered line box.
    var texts = document.querySelectorAll(TEXT_LEDGES);
    for (var i = 0; i < texts.length; i++) {
      var el = texts[i];
      if (el.hasAttribute("data-no-collide")) continue;
      try {
        range.selectNodeContents(el);
        var lines = range.getClientRects();
        for (var j = 0; j < lines.length; j++) pushRect(lines[j]);
      } catch (e) {
        pushRect(el.getBoundingClientRect());
      }
    }

    // Images and panels, by their whole box.
    var boxes = document.querySelectorAll(BOX_LEDGES);
    for (var k = 0; k < boxes.length; k++) {
      if (boxes[k].hasAttribute("data-no-collide")) continue;
      pushRect(boxes[k].getBoundingClientRect());
    }

    // The arm, by its actual links rather than its bounding box.
    var art = document.querySelector(".land__art svg");
    if (art && !art.hasAttribute("data-no-collide")) {
      var box = art.getBoundingClientRect();
      var k2 = box.width / ARM_VB.w;          // the SVG scales uniformly
      var ox = box.left;
      var oy = box.top + (box.height - ARM_VB.h * k2) / 2;

      for (var a = 0; a < ARM_SEGMENTS.length; a++) {
        var g = ARM_SEGMENTS[a];
        var dx = (g.x2 - g.x1) * k2;
        var dy = (g.y2 - g.y1) * k2;
        push({
          x: ox + (g.x1 + g.x2) / 2 * k2,
          y: oy + (g.y1 + g.y2) / 2 * k2,
          w: Math.sqrt(dx * dx + dy * dy),
          h: g.t * k2
        }, Math.atan2(dy, dx));
      }

      for (var b = 0; b < ARM_BOXES.length; b++) {
        var q = ARM_BOXES[b];
        push({
          x: ox + (q.x + q.w / 2) * k2,
          y: oy + (q.y + q.h / 2) * k2,
          w: q.w * k2,
          h: q.h * k2
        });
      }
    }

    range.detach && range.detach();
    return out;
  }

  function rebuildLedges() {
    var M = window.Matter;
    for (var i = 0; i < ledges.length; i++) M.Composite.remove(engine.world, ledges[i].body);
    ledges = [];

    var rects = measure();
    for (var j = 0; j < rects.length; j++) {
      var r = rects[j];
      var body = M.Bodies.rectangle(r.x, r.y, r.w, r.h, {
        isStatic: true,
        angle: r.a,
        friction: 0.6,
        restitution: 0.1
      });
      M.Composite.add(engine.world, body);
      ledges.push({ body: body, docX: r.x, docY: r.y });
    }
    placeLedges();
  }

  // The props live in a viewport-fixed stage, so the ledges track the scroll.
  function placeLedges() {
    var M = window.Matter;
    var sx = window.pageXOffset;
    var sy = window.pageYOffset;
    for (var i = 0; i < ledges.length; i++) {
      M.Body.setPosition(ledges[i].body, {
        x: ledges[i].docX - sx,
        y: ledges[i].docY - sy
      });
    }
  }

  function start() {
    var M = window.Matter;
    engine = M.Engine.create();
    engine.gravity.y = 1.1;
    makeStage();
    buildWalls();
    rebuildLedges();

    var scrollQueued = false;
    window.addEventListener("scroll", function () {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(function () {
        scrollQueued = false;
        placeLedges();
      });
    }, { passive: true });

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        buildWalls();
        rebuildLedges();
      }, 150);
    });

    // Web fonts land after first paint and move every line box.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(rebuildLedges);
    }

    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------- loop

  var STEP = 1000 / 60;
  var owed = 0;

  function tick(now) {
    var M = window.Matter;

    // Fixed timestep, so the pile behaves the same at 60Hz and 120Hz.
    // The backlog is capped, so a stalled tab resumes instead of catching up.
    owed = Math.min(owed + (now - last), STEP * 3);
    last = now;

    while (owed >= STEP) {
      M.Engine.update(engine, STEP);
      owed -= STEP;
    }

    stepGorilla(now);

    for (var i = 0; i < items.length; i++) {
      var b = items[i].body;
      items[i].el.style.transform =
        "translate(" + (b.position.x - items[i].half) + "px," +
        (b.position.y - items[i].half) + "px) rotate(" + b.angle + "rad)";
    }

    raf = requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------- props

  function spawn(x, y) {
    var M = window.Matter;
    var p = PROPS[Math.floor(Math.random() * PROPS.length)];
    var size = p.size * (0.82 + Math.random() * 0.36);
    var half = size / 2;

    var opts = {
      restitution: 0.36,
      friction: 0.42,
      frictionAir: 0.012,
      density: 0.0016,
      angle: (Math.random() - 0.5) * 1.2
    };

    var body = p.shape === "circle"
      ? M.Bodies.circle(x, y, half * 0.86, opts)
      : M.Bodies.rectangle(x, y, size * p.w, size * p.h, opts);

    // A small sideways nudge so a column of clicks does not stack dead straight.
    M.Body.setVelocity(body, { x: (Math.random() - 0.5) * 4, y: 0 });
    M.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.25);

    var el = document.createElement("div");
    el.className = "drop-prop";
    el.style.width = el.style.height = size + "px";
    el.innerHTML = '<svg viewBox="0 0 44 44"><use href="#' + p.id + '"></use></svg>';

    stage.appendChild(el);
    M.Composite.add(engine.world, body);
    items.push({ body: body, el: el, half: half });

    if (items.length >= MAX_ITEMS) summonGorilla();
  }

  // ---------------------------------------------------------------- gorilla

  // Once the pile is full a gorilla hops in, beats its chest, and inhales the
  // lot. It runs as a small state machine on timers; the inhale itself is
  // physics — every prop is pulled toward the mouth each step.
  function summonGorilla() {
    if (gorilla) return;
    var art = document.getElementById("gorilla-art");
    if (!art) return;                    // page did not ship the artwork

    var el = document.createElement("div");
    el.className = "gor is-hopping";
    el.innerHTML = art.innerHTML;

    el.style.left = pickSpot() + "px";

    stage.appendChild(el);
    gorilla = { el: el, phase: "hop", until: performance.now() + HOP_MS };
  }

  // Where along the bottom edge the gorilla should stand: clear of the page's
  // own content, and as far from the pile as that allows.
  //
  // Scoring a handful of candidates is enough and costs nothing — fifteen
  // positions against at most 45 props and 140 ledges, once, when it is
  // summoned. A continuous optimum would cost far more and look no different.
  var GOR_HALF_W = 78;
  var GOR_H = 150;

  function pickSpot() {
    var vw = window.innerWidth;
    var top = window.innerHeight - GOR_H;
    var lo = GOR_HALF_W + 8;
    var hi = vw - GOR_HALF_W - 8;
    if (hi < lo) return vw / 2;

    var best = null;

    for (var n = 0; n < 15; n++) {
      var x = lo + (hi - lo) * (n / 14);

      // Would it stand over something on the page?
      var covers = false;
      for (var i = 0; i < ledges.length; i++) {
        var b = ledges[i].body.bounds;
        if (b.max.y > top && b.max.x > x - GOR_HALF_W && b.min.x < x + GOR_HALF_W) {
          covers = true;
          break;
        }
      }

      // How far is the nearest prop? The pile sits on the floor, so the
      // horizontal gap is the one that matters.
      var near = Infinity;
      for (var j = 0; j < items.length; j++) {
        var gap = Math.abs(items[j].body.position.x - x);
        if (gap < near) near = gap;
      }
      if (near === Infinity) near = vw;

      // Covering content is disqualifying, but never fatal: if the page fills
      // the whole bottom edge, the least bad spot still wins.
      var score = near - (covers ? 1e6 : 0);
      if (!best || score > best.score) best = { x: x, score: score };
    }

    return Math.round(best.x);
  }

  // The mouth in viewport coordinates, read off the rendered SVG.
  function mouthAt() {
    var maw = gorilla.el.querySelector(".gor-maw");
    if (!maw) return null;
    var r = maw.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function setPhase(phase, ms) {
    gorilla.phase = phase;
    gorilla.until = performance.now() + ms;
    gorilla.el.className = "gor is-" + phase;
  }

  function stepGorilla(now) {
    if (!gorilla) return;

    if (gorilla.phase === "hop" && now >= gorilla.until) {
      setPhase("beating", BEAT_MS);
      return;
    }

    if (gorilla.phase === "beating" && now >= gorilla.until) {
      setPhase("sucking", SUCK_MS);
      return;
    }

    if (gorilla.phase === "sucking") {
      inhale(now);
      if (items.length === 0 || now >= gorilla.until) {
        while (items.length) swallow(items.pop());
        setPhase("leaving", LEAVE_MS);
      }
      return;
    }

    if (gorilla.phase === "leaving" && now >= gorilla.until) {
      if (gorilla.el.parentNode) gorilla.el.parentNode.removeChild(gorilla.el);
      gorilla = null;
    }
  }

  function inhale(now) {
    var M = window.Matter;
    var mouth = mouthAt();
    if (!mouth) return;

    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i];

      // Each prop is caught a moment after the last, so the pile is drawn off
      // as a stream instead of the whole heap lifting on one frame.
      if (it.suckAt === undefined) it.suckAt = now + Math.random() * PEEL_MS;
      if (now < it.suckAt) continue;

      var p = it.body.position;
      var dx = mouth.x - p.x;
      var dy = mouth.y - p.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;

      if (d < 34) {                       // close enough to be swallowed
        items.splice(i, 1);
        swallow(it);
        continue;
      }

      // Props stop colliding once they are in the draught, so they stream in
      // rather than dragging across the text they had landed on.
      //
      // This clears the collision mask rather than setting isSensor, because
      // Matter reads isSensor when it creates a contact pair and never again —
      // a prop already resting on a ledge keeps its existing pair and stays
      // stuck. The mask is consulted every step, so it takes effect at once.
      if (!it.sucked) {
        it.sucked = true;
        it.body.collisionFilter.mask = 0;
        it.body.frictionAir = 0.02;      // light damping, so they arrive without orbiting
        // A little spread per prop, so the pile peels away in a stream rather
        // than every piece launching on the same frame.
        it.suck = 0.7 + Math.random() * 0.6;
        M.Body.setAngularVelocity(it.body, (Math.random() - 0.5) * 0.6);
      }

      // Cancel the prop's weight first, otherwise the draught is fighting
      // gravity the whole way up and the far end of the pile never arrives.
      var lift = it.body.mass * engine.gravity.y * engine.gravity.scale;

      // A near-constant pull, not one that falls off with distance: the props
      // furthest away are exactly the ones that need help crossing the room,
      // and the speed cap below is what stops the near ones overshooting.
      // Air friction caps speed at force / (mass * frictionAir), so this
      // coefficient is sized against the damping set above.
      var pull = 0.0042 * it.suck * it.body.mass;
      M.Body.applyForce(it.body, p, {
        x: (dx / d) * pull,
        y: (dy / d) * pull - lift
      });

      // Without a ceiling the pull near the mouth is strong enough to carry a
      // prop clean past the capture radius in one step, and it never arrives.
      var v = it.body.velocity;
      var sp = Math.sqrt(v.x * v.x + v.y * v.y);
      if (sp > 4.5) M.Body.setVelocity(it.body, { x: v.x / sp * 4.5, y: v.y / sp * 4.5 });
    }
  }

  function swallow(item) {
    item.el.classList.add("is-eaten");
    window.Matter.Composite.remove(engine.world, item.body);
    setTimeout(function () {
      if (item.el.parentNode) item.el.parentNode.removeChild(item.el);
    }, 260);
  }

  // ---------------------------------------------------------------- input

  function loadMatter(then) {
    if (window.Matter) return then();
    if (loading) return;
    loading = true;

    var s = document.createElement("script");
    s.src = MATTER_SRC;
    s.onload = then;
    s.onerror = function () { loading = false; };
    document.head.appendChild(s);
  }

  // Anything a visitor might be aiming at, rather than the page itself.
  var INTERACTIVE = "a,button,input,textarea,select,label,summary,details,iframe,video,audio,[role=button]";

  var downX = 0, downY = 0, downOK = false;

  document.addEventListener("mousedown", function (e) {
    downX = e.clientX;
    downY = e.clientY;
    var t = e.target;
    downOK = e.button === 0 && !!t && typeof t.closest === "function" && !t.closest(INTERACTIVE);
  });

  document.addEventListener("mouseup", function (e) {
    if (!downOK) return;
    downOK = false;

    // A drag is a selection or a scroll, not a click.
    if (Math.abs(e.clientX - downX) > 6 || Math.abs(e.clientY - downY) > 6) return;

    var sel = window.getSelection();
    if (sel && String(sel).length) return;

    drop(e.clientX, e.clientY);
  });

  function drop(x, y) {
    if (engine) return spawn(x, y);

    queued = { x: x, y: y };
    loadMatter(function () {
      loading = false;
      if (!window.Matter) return;
      start();
      if (queued) {
        spawn(queued.x, queued.y);
        queued = null;
      }
    });
  }

  // Pause the loop while the tab is hidden.
  document.addEventListener("visibilitychange", function () {
    if (!engine) return;
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf) {
      last = performance.now();
      owed = 0;
      raf = requestAnimationFrame(tick);
    }
  });
})();
