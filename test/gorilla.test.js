// Fill the pile past the cap and check the gorilla runs its whole routine:
// hops in, beats, inhales every prop, then leaves and cleans itself up.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const R = path.resolve(__dirname, '..');
const strip = t => t.replace(/\{%-?[\s\S]*?-?%\}/g, '');
const sprite  = strip(fs.readFileSync(`${R}/_includes/drops.html`, 'utf8'));
const arm     = strip(fs.readFileSync(`${R}/_includes/arm.html`, 'utf8'));
const gorilla = strip(fs.readFileSync(`${R}/_includes/gorilla.html`, 'utf8'));

const dom = new JSDOM(`<!doctype html><html><body>
${sprite}
<div id="gorilla-art" hidden>${gorilla}</div>
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
  if (this.classList?.contains('gor-maw'))
    return { left:600, top:640, width:20, height:8, right:620, bottom:648, x:600, y:640 };
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

const click = (x, y) => {
  const t = window.document.querySelector('.land__in');
  for (const type of ['mousedown','mouseup'])
    t.dispatchEvent(new window.MouseEvent(type, { bubbles:true, clientX:x, clientY:y, button:0 }));
};

const CAP = parseInt(/var MAX_ITEMS = (\d+)/.exec(s.textContent)[1], 10);
console.log('cap =', CAP);

const phases = [];
const samples = [];
let suckStart = 0;
const watch = setInterval(() => {
  const g = window.document.querySelector('.gor');
  if (g) {
    const p = g.className.replace('gor is-','');
    if (phases[phases.length-1] !== p) phases.push(p);
    if (p === 'sucking') {
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
    const g0 = window.document.querySelector('.gor');
    console.log('gorilla present:', !!g0);
    if (g0) {
      const gx = parseFloat(g0.style.left);
      const xs = [...window.document.querySelectorAll('.drop-prop')].map(el => {
        const m = /translate\(([-\d.]+)px/.exec(el.style.transform); return m ? +m[1] : null;
      }).filter(v => v !== null);
      const near = Math.min(...xs.map(x => Math.abs(x - gx)));
      console.log('gorilla stands :', gx + 'px   nearest prop ' + Math.round(near) + 'px away');
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
      const gone = !window.document.querySelector('.gor');
      const clear = samples.find(s => s.n === 0);
      console.log('\nremaining over time:', samples.filter((_,i)=> i%3===0).map(s => s.n).join(' '));
      console.log('inhale lasted      :', (samples.length * 40) + 'ms over ' + samples.length + ' samples');
      console.log('phases seen    :', phases.join(' -> '));
      console.log('props left     :', left);
      console.log('gorilla left   :', gone);
      console.log('errors         :', errors.length ? errors : 'none');

      const ok = errors.length === 0
        && phases.join(',') === 'hopping,beating,sucking,leaving'
        && left === 0 && gone;
      console.log('\nRESULT:', ok ? 'PASS' : 'FAIL');
      process.exit(ok ? 0 : 1);
    }, 13000);
  }
}, 12);
