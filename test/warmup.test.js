// The world should be built before anyone clicks, and a burst of clicks during
// the load should all land. Both are what make the first click feel like the
// fiftieth.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const R = path.resolve(__dirname, '..');
const strip = t => t.replace(/\{%-?[\s\S]*?-?%\}/g, '');
const sprite  = strip(fs.readFileSync(`${R}/_includes/drops.html`, 'utf8'));
const arm     = strip(fs.readFileSync(`${R}/_includes/arm.html`, 'utf8'));
const gorilla = strip(fs.readFileSync(`${R}/_includes/gorilla.html`, 'utf8'));

const dom = new JSDOM(`<!doctype html><html><body>${sprite}
<div id="gorilla-art" hidden>${gorilla}</div>
<main class="surface"><section class="land"><div class="land__in">
  <div class="land__art">${arm}</div>
  <h1 class="land__name">Qianjun<br>Xia</h1>
  <p class="land__tag">Robotics</p>
  <nav class="land__nav"><ol><li><a href="#">Research</a></li></ol></nav>
</div></section></main></body></html>`,
  { pretendToBeVisual: true, runScripts: 'dangerously', url: 'http://localhost/' });

const { window } = dom;
const errors = [];
window.onerror = m => errors.push(m);
window.matchMedia = q => ({ matches:false, media:q, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} });
window.Element.prototype.getBoundingClientRect = function () {
  if (this.classList?.contains('land__name')) return {left:380,top:180,width:440,height:150,right:820,bottom:330,x:380,y:180};
  if (this.tagName === 'svg') return {left:420,top:20,width:320,height:150,right:740,bottom:170,x:420,y:20};
  return {left:0,top:0,width:0,height:0,right:0,bottom:0,x:0,y:0};
};
window.Range.prototype.getClientRects = function () {
  const r = this.startContainer.getBoundingClientRect?.() ?? {left:0,top:0,width:0,height:0};
  return [{left:r.left,top:r.top,width:r.width,height:r.height,right:r.right,bottom:r.bottom}];
};

// Serve matter.js on a deliberate delay, to open the race the queue must survive.
const matterJs = fs.readFileSync(`${R}/assets/js/lib/matter.min.js`, 'utf8');
let served = 0;
const headAppend = window.document.head.appendChild.bind(window.document.head);
window.document.head.appendChild = function (node) {
  if (node.tagName === 'SCRIPT' && node.src?.includes('matter')) {
    served++;
    node.textContent = matterJs; node.removeAttribute('src');
    const out = headAppend(node);
    setTimeout(() => node.onload?.(), 120);
    return out;
  }
  return headAppend(node);
};

const s = window.document.createElement('script');
s.textContent = fs.readFileSync(`${R}/assets/js/drop.js`, 'utf8');
window.document.body.appendChild(s);

const click = (x, y) => {
  const t = window.document.querySelector('.land__in');
  for (const type of ['pointerdown', 'pointerup'])
    t.dispatchEvent(new window.PointerEvent(type, { bubbles:true, clientX:x, clientY:y, button:0, pointerType:'mouse' }));
};

console.log('stage before idle  :', !!window.document.querySelector('.drop-stage'));

// no requestIdleCallback in jsdom, so the 1200ms fallback applies
setTimeout(() => {
  const warm = !!window.document.querySelector('.drop-stage');
  console.log('stage after idle   :', warm, '(built before any click)');
  console.log('matter fetched     :', served, 'time(s)');

  const t0 = Date.now();
  click(500, 100);
  const instant = window.document.querySelectorAll('.drop-prop').length;
  console.log('props right after one click:', instant, '(' + (Date.now()-t0) + 'ms)');

  for (let i = 0; i < 5; i++) click(480 + i * 20, 100);

  setTimeout(() => {
    const n = window.document.querySelectorAll('.drop-prop').length;
    console.log('props after 6 clicks:', n);
    console.log('errors             :', errors.length ? errors : 'none');
    const ok = warm && served === 1 && instant === 1 && n === 6 && !errors.length;
    console.log('\nRESULT:', ok ? 'PASS' : 'FAIL');
    process.exit(ok ? 0 : 1);
  }, 400);
}, 1700);
