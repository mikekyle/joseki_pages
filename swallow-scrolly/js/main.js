import { initViz, updateViz } from './viz.js';

let scroller;
let data;

function throttle(fn, wait) {
  let t = 0;
  return (...args) => {
    const now = Date.now();
    if (now - t >= wait) { t = now; fn(...args); }
  };
}

function handleStepEnter({ index }) {
  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.toggle('is-active', i === index);
  });
  updateViz(index);
}

async function loadData() {
  const res = await fetch('data/swallow.json');
  if (!res.ok) throw new Error('Failed to load data/swallow.json — serve via HTTP (e.g. python -m http.server)');
  return res.json();
}

function initScroller() {
  scroller = scrollama();
  scroller
    .setup({ step: '.step', offset: 0.55 })
    .onStepEnter(handleStepEnter);
  window.addEventListener('resize', throttle(() => scroller.resize(), 200));
}

async function main() {
  try {
    data = await loadData();
    document.getElementById('match-count').textContent = data.meta.matches.toLocaleString();
    initViz(data);
    initScroller();
    updateViz(0);
    document.querySelector('.step')?.classList.add('is-active');
  } catch (err) {
    document.getElementById('graphic').innerHTML =
      `<p class="error">${err.message}</p>`;
  }
}

main();
