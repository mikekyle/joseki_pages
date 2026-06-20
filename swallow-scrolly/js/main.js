import { initViz, updateViz } from './viz.js';

let scroller;
let data;
let activeStep = -1;

function throttle(fn, wait) {
  let t = 0;
  return (...args) => {
    const now = Date.now();
    if (now - t >= wait) { t = now; fn(...args); }
  };
}

function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}

/** Pudding: set step heights in px from innerHeight — never use vh for steps */
function layoutSteps() {
  const h = window.innerHeight;
  const stepH = isMobile()
    ? Math.round(h * 0.92)
    : Math.round(h * 0.75);

  document.querySelectorAll('.step').forEach((el) => {
    el.style.minHeight = `${stepH}px`;
  });

  if (isMobile()) {
    const graphicH = Math.min(320, Math.max(240, Math.round(h * 0.36)));
    document.documentElement.style.setProperty('--graphic-height-mobile', `${graphicH}px`);
  }
}

function setActiveStep(index) {
  if (index === activeStep) return;
  activeStep = index;
  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.toggle('is-active', i === index);
  });
  updateViz(index);
}

function handleStepEnter({ index }) {
  setActiveStep(index);
}

async function loadData() {
  const res = await fetch('data/swallow.json');
  if (!res.ok) throw new Error('Failed to load data/swallow.json — serve via HTTP (e.g. python -m http.server)');
  return res.json();
}

function initScroller() {
  layoutSteps();
  scroller = scrollama();
  scroller
    .setup({
      step: '.step',
      offset: isMobile() ? 0.72 : 0.55,
      debug: false,
    })
    .onStepEnter(handleStepEnter);

  const onResize = throttle(() => {
    layoutSteps();
    scroller.resize();
  }, 200);

  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
}

async function main() {
  try {
    data = await loadData();
    document.getElementById('match-count').textContent = data.meta.matches.toLocaleString();
    initViz(data);
    initScroller();
    setActiveStep(0);
    // Scrollama measures after layout + fonts
    requestAnimationFrame(() => {
      layoutSteps();
      scroller.resize();
    });
  } catch (err) {
    document.getElementById('graphic').innerHTML =
      `<p class="error">${err.message}</p>`;
  }
}

main();
