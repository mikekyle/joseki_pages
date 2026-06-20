import { renderBoard } from './board.js';

const STATES = [
  'pattern-empty',
  'pattern-full',
  'histogram-all',
  'histogram-outliers',
  'next-moves',
  'follow-up',
  'payoff',
];

let data = null;
let reducedMotion = false;

function graphicWidth(defaultW = 380) {
  const el = document.getElementById('graphic');
  if (!el) return defaultW;
  return Math.min(defaultW, el.clientWidth || defaultW);
}

export function initViz(dataset) {
  data = dataset;
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const container = document.getElementById('graphic');
  container.innerHTML = '<div id="viz-root"></div>';
}

export function updateViz(stepIndex) {
  if (!data) return;
  const state = STATES[stepIndex] ?? STATES[0];
  const root = document.getElementById('viz-root');
  if (!root) return;
  root.innerHTML = '';

  switch (state) {
    case 'pattern-empty':
      renderBoard(root, { stones: [], annotations: ['Top-left corner'] });
      break;
    case 'pattern-full':
      renderBoard(root, {
        stones: data.moves.map((m, i) => ({
          ...m,
          delay: reducedMotion ? 0 : i * 150,
        })),
      });
      break;
    case 'histogram-all':
      drawHistogram(root, { highlight: null });
      break;
    case 'histogram-outliers':
      drawHistogram(root, { highlight: 'outliers' });
      break;
    case 'next-moves':
      drawNextMoves(root);
      break;
    case 'follow-up':
      renderBoard(root, {
        stones: [
          ...data.moves,
          { coord: 'F15', color: 'B' },
          { coord: 'G15', color: 'W' },
          { coord: 'F14', color: 'B' },
        ],
        marks: [{ coord: 'D14', label: '52%' }],
        annotations: [`Local play stays in corner ${data.stats.local_play_pct}% of the time`],
      });
      break;
    case 'payoff':
      renderBoard(root, {
        stones: data.moves,
        annotations: [
          `${data.meta.matches.toLocaleString()} pro-game matches`,
          `Median winrate ${data.stats.winrate_median}%`,
        ],
      });
      break;
    default:
      break;
  }
}

function drawHistogram(container, { highlight }) {
  const width = graphicWidth(380);
  const height = Math.round(width * 0.84);
  const margin = { top: 28, right: 12, bottom: 44, left: 36 };
  const bins = data.bins.map(b => ({ ...b }));

  const svg = d3.select(container).append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', 'auto');

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const x = d3.scaleBand().domain(bins.map(d => d.label)).range([0, innerW]).padding(0.15);
  const y = d3.scaleLinear().domain([0, d3.max(bins, d => d.count)]).nice().range([innerH, 0]);

  g.selectAll('rect')
    .data(bins)
    .join('rect')
    .attr('x', d => x(d.label))
    .attr('y', innerH)
    .attr('width', x.bandwidth())
    .attr('height', 0)
    .attr('fill', d => {
      if (highlight === 'outliers' && (d.label === '<30' || d.label === '70+')) return 'var(--accent)';
      return 'var(--chart-muted)';
    })
    .attr('rx', 3)
    .transition().duration(reducedMotion ? 0 : 500)
    .attr('y', d => y(d.count))
    .attr('height', d => innerH - y(d.count));

  g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('font-size', 10);

  g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', 10);

  svg.append('text')
    .attr('x', width / 2).attr('y', 16)
    .attr('text-anchor', 'middle')
    .attr('font-size', 12)
    .attr('fill', 'var(--text-muted)')
    .text(`Winrate distribution (n=${data.winrates.length})`);

  if (highlight === 'outliers') {
    svg.append('text')
      .attr('x', width / 2).attr('y', height - 8)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('fill', 'var(--accent)')
      .text(`Outliers: ${data.outliers.low}% – ${data.outliers.high}%`);
  }
}

function drawNextMoves(container) {
  const width = graphicWidth(380);
  const height = Math.round(width * 0.78);
  const margin = { top: 36, right: 12, bottom: 40, left: 40 };
  const moves = data.continuations;

  const svg = d3.select(container).append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', 'auto');

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const x = d3.scaleBand().domain(moves.map(d => d.move)).range([0, innerW]).padding(0.2);
  const y = d3.scaleLinear().domain([0, 60]).range([innerH, 0]);

  g.selectAll('rect')
    .data(moves)
    .join('rect')
    .attr('x', d => x(d.move))
    .attr('y', innerH)
    .attr('width', x.bandwidth())
    .attr('height', 0)
    .attr('fill', (d, i) => i === 0 ? 'var(--accent)' : 'var(--chart-muted)')
    .attr('rx', 3)
    .transition().duration(reducedMotion ? 0 : 500)
    .attr('y', d => y(d.pct))
    .attr('height', d => innerH - y(d.pct));

  g.selectAll('.label')
    .data(moves)
    .join('text')
    .attr('class', 'label')
    .attr('x', d => x(d.move) + x.bandwidth() / 2)
    .attr('y', d => y(d.pct) - 6)
    .attr('text-anchor', 'middle')
    .attr('font-size', 12)
    .attr('fill', 'var(--text)')
    .text(d => `${d.pct}%`);

  g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x));
  g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`));

  svg.append('text')
    .attr('x', width / 2).attr('y', 18)
    .attr('text-anchor', 'middle')
    .attr('font-size', 12)
    .attr('fill', 'var(--text-muted)')
    .text('Top AI-recommended next moves');
}
