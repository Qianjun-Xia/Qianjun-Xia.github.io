/*
 * Click anywhere that is not a control and a small object falls, tumbles
 * and settles at the bottom of the window.
 *
 * Matter.js is fetched on the first click, so a visitor who never clicks
 * never pays for it.
 */
(function () {
  "use strict";

  var MATTER_SRC = "/assets/js/lib/matter.min.js";
  var MAX_ITEMS = 70;

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

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var stage = null;      // the fixed overlay the props live in
  var engine = null;
  var walls = [];
  var items = [];        // { body, el }
  var loading = false;
  var queued = null;     // a click that arrived while the library loaded
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

  function start() {
    var M = window.Matter;
    engine = M.Engine.create();
    engine.gravity.y = 1.1;
    makeStage();
    buildWalls();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildWalls, 150);
    });

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
    el.innerHTML =
      '<svg viewBox="0 0 44 44"><use href="#' + p.id + '"></use></svg>';

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
