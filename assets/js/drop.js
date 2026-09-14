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
  var MAX_ITEMS = 70;
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

    if (items.length > MAX_ITEMS) retire(items.shift());
  }

  function retire(item) {
    item.el.classList.add("is-going");
    window.Matter.Composite.remove(engine.world, item.body);
    setTimeout(function () {
      if (item.el.parentNode) item.el.parentNode.removeChild(item.el);
    }, 420);
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
