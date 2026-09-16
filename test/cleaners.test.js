// Fill the pile past its cap and check each cleaner runs its whole routine and
// leaves nothing behind — the gorilla drawing the props into its mouth, the cat
// knocking them off the side of the window.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const R = path.resolve(__dirname, '..');
const strip = t => t.replace(/\{%-?[\s\S]*?-?%\}/g, '');
const sprite  = strip(fs.readFileSync(`${R}/_includes/drops.html`, 'utf8'));
const arm     = strip(fs.readFileSync(`${R}/_includes/arm.html`, 'utf8'));
const gorilla = strip(fs.readFileSync(`${R}/_includes/gorilla.html`, 'utf8'));
const cat     = strip(fs.readFileSync(`${R}/_includes/cat.html`, 'utf8'));

const WHO = process.argv[2] || 'gorilla';
const PHASES = {
  gorilla: 'hopping,beating,sucking,leaving',
  cat: 'padding,eyeing,sweeping,leaving',
};
// The phase that actually empties the pile, sampled to check it does the work
// rather than leaving it to the sweep at the end.
const CLEARING = { gorilla: 'sucking', cat: 'sweeping' };
if (!PHASES[WHO]) { console.error('unknown cleaner:', WHO); process.exit(2); }

const dom = new JSDOM(`<!doctype html><html data-cleaner="${WHO}"><body>
${sprite}
<div id="gorilla-art" hidden>${gorilla}</div>
<div id="cat-art" hidden>${cat}</div>
<main class="surface"><section class="land"><div class="land__in">
  <div class="land__art">${arm}</div>
  <h1 class="land__name">Qianjun<br>Xia</h1>
  <p class="land__tag">Robotics &amp; physical intelligence</p>
  <nav class="land__nav"><ol><li><a href="#">Research</a></li></ol></nav>
  <p class="land__foot">UBC</p>
</div></section></main>
</body></html>`, { pretendToBeVisual: true, runScripts: 'dangerously', url: 'http://localhost/' });

const { window } = dom;
const errors = [];
window.addEventListener('error', e => errors.push(e.error?.message || e.message));
window.onerror = m => errors.push('onerror: ' + m);

const BOXES = { land__name:[380,180,440,150], land__tag:[400,350,400,40],
                land__art:[420,20,320,150], land__foot:[430,520,340,24] };
window.Element.prototype.getBoundingClientRect = function () {
  for (const k in BOXES) if (this.classList?.contains(k)) {
    const [x,y,w,h] = BOXES[k];
    return { left:x, top:y, width:w, height:h, right:x+w, bottom:y+h, x, y };
  }
  // jsdom has no layout, so give the cleaner's moving parts plausible boxes
  // relative to where it was placed. Without these the paws sit at 0,0 and
  // every prop is out of reach.
  const fig = this.closest?.('.gor, .cat');
  if (fig) {
    const fx = parseFloat(fig.style.left) || window.innerWidth / 2;
    const fy = window.innerHeight;
    const at = (dx, dy, w, h) => ({ left: fx + dx, top: fy + dy, width: w, height: h,
                                    right: fx + dx + w, bottom: fy + dy + h, x: fx + dx, y: fy + dy });
    if (this.classList?.contains('gor-maw'))     return at(-10, -78, 20, 8);
    if (this.classList?.contains('cat-bristles')) return at(6, -20, 38, 18);
    if (this.classList?.contains('cat-paw--l'))  return at(-40, -30, 18, 22);
    if (this.classList?.contains('cat-paw--r'))  return at(22, -30, 18, 22);
    if (this.classList?.contains('cat-head'))    return at(-42, -132, 84, 80);
    return at(-75, -150, 150, 150);
  }
  if (this.tagName === 'A')   return { left:500, top:430, width:200, height:40, right:700, bottom:470, x:500, y:430 };
  if (this.tagName === 'svg') return { left:420, top:20, width:320, height:150, right:740, bottom:170, x:420, y:20 };
  return { left:0, top:0, width:0, height:0, right:0, bottom:0, x:0, y:0 };
};
window.Range.prototype.getClientRects = function () {
  const r = this.startContainer.getBoundingClientRect?.() ?? {left:0,top:0,width:0,height:0};
  return [{ left:r.left, top:r.top, width:r.width, height:r.height, right:r.right, bottom:r.bottom }];
};
window.matchMedia = q => ({ matches:false, media:q, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} });

const matterJs = fs.readFileSync(`${R}/assets/js/lib/matter.min.js`, 'utf8');
const headAppend = window.document.head.appendChild.bind(window.document.head);
window.document.head.appendChild = function (node) {
  if (node.tagName === 'SCRIPT' && node.src?.includes('matter')) {
    node.textContent = matterJs; node.removeAttribute('src');
    const out = headAppend(node); node.onload?.(); return out;
  }
  return headAppend(node);
};

const s = window.document.createElement('script');
s.textContent = fs.readFileSync(`${R}/assets/js/drop.js`, 'utf8');
window.document.body.appendChild(s);

// The toy listens for pointer events, and drops on the press.
const click = (x, y) => {
  const t = window.document.querySelector('.land__in');
  for (const type of ['pointerdown', 'pointerup'])
    t.dispatchEvent(new window.PointerEvent(type, {
      bubbles: true, clientX: x, clientY: y, button: 0, pointerType: 'mouse'
    }));
};

const CAP = parseInt(/var MAX_ITEMS = (\d+)/.exec(s.textContent)[1], 10);
console.log('cap =', CAP);

const phases = [];
const samples = [];
let suckStart = 0;
const watch = setInterval(() => {
  const g = window.document.querySelector('.gor, .cat');
  if (g) {
    // the element may carry extra state classes; the phase is the first one
    const p = g.className.replace(/^(gor|cat) is-/, '').split(' ')[0];
    if (phases[phases.length-1] !== p) phases.push(p);
    if (p === CLEARING[WHO]) {
      if (!suckStart) suckStart = Date.now();
      samples.push({ t: Date.now() - suckStart,
                     n: window.document.querySelectorAll('.drop-prop:not(.is-eaten)').length });
    }
  }
}, 40);

let n = 0;
const fill = setInterval(() => {
  click(500 + (n % 7) * 40, 120);
  if (++n >= CAP) {
    clearInterval(fill);
    console.log('clicks fired   :', n);
    console.log('props on stage :', window.document.querySelectorAll('.drop-prop').length);
    const g0 = window.document.querySelector('.gor, .cat');
    console.log('cleaner present:', !!g0, '(' + WHO + ')');
    if (g0) {
      const gx = parseFloat(g0.style.left);
      const xs = [...window.document.querySelectorAll('.drop-prop')].map(el => {
        const m = /translate\(([-\d.]+)px/.exec(el.style.transform); return m ? +m[1] : null;
      }).filter(v => v !== null);
      const near = Math.min(...xs.map(x => Math.abs(x - gx)));
      console.log('it stands at   :', gx + 'px   nearest prop ' + Math.round(near) + 'px away');
      // content boxes stubbed in this harness, bottom-most is land__foot at y 520-544
      console.log('viewport       :', window.innerWidth + 'x' + window.innerHeight +
                  '   its footprint spans x ' + Math.round(gx-78) + '–' + Math.round(gx+78) +
                  ', y ' + (window.innerHeight-150) + '–' + window.innerHeight);
    }

    setTimeout(() => {
      clearInterval(watch);
      const left = window.document.querySelectorAll('.drop-prop').length;
      const mouth = { x: 610, y: 644 };
      console.log('\nstragglers (mouth at 610,644):');
      window.document.querySelectorAll('.drop-prop').forEach(el => {
        const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(el.style.transform);
        if (!m) { console.log('   no transform'); return; }
        const x = +m[1], y = +m[2];
        console.log(`   at (${x.toFixed(0)}, ${y.toFixed(0)})  distance ${Math.hypot(x-mouth.x, y-mouth.y).toFixed(0)}`);
      });
      const gone = !window.document.querySelector('.gor, .cat');
      const clear = samples.find(s => s.n === 0);
      console.log('\nremaining over time:', samples.filter((_,i)=> i%3===0).map(s => s.n).join(' '));
      console.log('clearing took     :', (samples.length * 40) + 'ms over ' + samples.length + ' samples');
      console.log('phases seen    :', phases.join(' -> '));
      console.log('props left     :', left);
      console.log('it left        :', gone);
      console.log('errors         :', errors.length ? errors : 'none');

      const ok = errors.length === 0
        && phases.join(',') === PHASES[WHO]
        && left === 0 && gone;
      console.log('\nRESULT:', ok ? 'PASS' : 'FAIL');
      process.exit(ok ? 0 : 1);
    }, 16000);
  }
}, 12);
