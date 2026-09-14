// End-to-end: real landing markup + real drop.js, click it, check a prop
// appears, is driven by physics, and uses the sprite. This is the test that
// would have caught start() going missing.
const fs = require('fs');
const { JSDOM } = require('jsdom');

const path = require('path');
const R = path.resolve(__dirname, '..');
const strip = t => t.replace(/\{%-?[\s\S]*?-?%\}/g, '');
const sprite = strip(fs.readFileSync(`${R}/_includes/drops.html`, 'utf8'));
const arm    = strip(fs.readFileSync(`${R}/_includes/arm.html`, 'utf8'));

const dom = new JSDOM(`<!doctype html><html><body>
${sprite}
<main class="surface"><section class="land"><div class="land__in">
  <div class="land__art">${arm}</div>
  <h1 class="land__name">Qianjun<br>Xia</h1>
  <p class="land__tag">Robotics &amp; physical intelligence</p>
  <nav class="land__nav"><ol>
    <li><a href="/research/">Research</a></li>
    <li><a href="/projects/">Projects</a></li>
  </ol></nav>
  <p class="land__foot">Columbia University</p>
</div></section></main>
</body></html>`, { pretendToBeVisual: true, runScripts: 'dangerously', url: 'http://localhost/' });

const { window } = dom;
const errors = [];
window.addEventListener('error', e => errors.push('window error: ' + (e.error && e.error.message || e.message)));
window.onerror = (m) => errors.push('onerror: ' + m);

// jsdom has no layout engine, so hand out plausible boxes.
const BOXES = { land__name:[380,180,440,150], land__tag:[400,350,400,40],
                land__art:[420,20,320,150], land__foot:[430,520,340,24] };
window.Element.prototype.getBoundingClientRect = function () {
  for (const k in BOXES) if (this.classList && this.classList.contains(k)) {
    const [x,y,w,h] = BOXES[k];
    return { left:x, top:y, width:w, height:h, right:x+w, bottom:y+h, x, y };
  }
  if (this.tagName === 'A')   return { left:500, top:430, width:200, height:40, right:700, bottom:470, x:500, y:430 };
  if (this.tagName === 'svg') return { left:420, top:20,  width:320, height:150, right:740, bottom:170, x:420, y:20 };
  return { left:0, top:0, width:0, height:0, right:0, bottom:0, x:0, y:0 };
};
window.Range.prototype.getClientRects = function () {
  const el = this.startContainer;
  const r = el.getBoundingClientRect ? el.getBoundingClientRect() : { left:0, top:0, width:0, height:0 };
  return [{ left:r.left, top:r.top, width:r.width, height:r.height, right:r.right, bottom:r.bottom }];
};

// jsdom ships neither matchMedia nor the Fonts API.
window.matchMedia = q => ({ matches: false, media: q,
  addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} });

function inject(src, id) {
  const s = window.document.createElement('script');
  s.textContent = src;
  s.id = id;
  window.document.body.appendChild(s);
}

// drop.js injects a <script src=…matter…>; serve the vendored file for it.
const matterJs = fs.readFileSync(`${R}/assets/js/lib/matter.min.js`, 'utf8');
const headAppend = window.document.head.appendChild.bind(window.document.head);
window.document.head.appendChild = function (node) {
  if (node.tagName === 'SCRIPT' && node.src && node.src.includes('matter')) {
    node.textContent = matterJs;
    node.removeAttribute('src');
    const out = headAppend(node);
    node.onload && node.onload();
    return out;
  }
  return headAppend(node);
};

inject(fs.readFileSync(`${R}/assets/js/drop.js`, 'utf8'), 'drop');

const click = (x, y) => {
  const t = window.document.querySelector('.land__in');
  for (const type of ['mousedown', 'mouseup'])
    t.dispatchEvent(new window.MouseEvent(type, { bubbles:true, clientX:x, clientY:y, button:0 }));
};

click(600, 200);

setTimeout(() => {
  const props = window.document.querySelectorAll('.drop-prop');
  console.log('errors            :', errors.length ? errors : 'none');
  console.log('matter loaded     :', !!window.Matter);
  console.log('stage created     :', !!window.document.querySelector('.drop-stage'));
  console.log('props after click :', props.length);
  if (!props.length) { console.log('\nRESULT: FAIL — no prop spawned'); process.exit(1); }

  console.log('uses sprite       :', /<use href="#d-/.test(props[0].innerHTML));

  click(500, 120);
  click(700, 90);

  const yOf = el => {
    const m = /translate\([-\d.]+px,\s*([-\d.]+)px\)/.exec(el.style.transform);
    return m ? parseFloat(m[1]) : NaN;
  };

  setTimeout(() => {
    const all = window.document.querySelectorAll('.drop-prop');
    const ys = Array.from(all).map(yOf);
    const H = window.innerHeight;

    console.log('props after 3     :', all.length);
    console.log('driven by physics :', Array.from(all).every(e => /translate\(/.test(e.style.transform)));
    console.log('viewport height   :', H);
    console.log('resting y         :', ys.map(v => v.toFixed(0)).join(', '));

    // The name box is at y 180-330. A prop dropped onto it must stop there,
    // not continue to the floor — that is the text-collision assertion.
    const caught = ys.filter(y => y < H - 120).length;
    console.log('caught above floor:', caught, 'of', ys.length);

    const driven = Array.from(all).every(e => /translate\(/.test(e.style.transform));
    const ok = errors.length === 0 && all.length === 3 && driven && caught === 3;
    console.log('\nRESULT:', ok ? 'PASS' : 'FAIL');
    process.exit(ok ? 0 : 1);
  }, 1500);
}, 400);
