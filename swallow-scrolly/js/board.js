/* Go board SVG renderer — corner-focused 9×9 */

const LETTERS = 'ABCDEFGHJKLMNOPQRST';

function parseCoord(coord) {
  const col = LETTERS.indexOf(coord[0].toUpperCase());
  const row = 19 - parseInt(coord.slice(1), 10);
  return { col, row };
}

function cornerView(fullCol, fullRow) {
  return { x: fullCol, y: fullRow };
}

export function renderBoard(container, options = {}) {
  const host = d3.select(container);
  const box = host.node()?.getBoundingClientRect() ?? { width: 360 };
  const base = Math.min(options.width || 360, box.width || 360, 360);

  const {
    size = 9,
    stones = [],
    marks = [],
    ghost = [],
    annotations = [],
    width = base,
    height = base,
  } = options;

  const pad = 28;
  const inner = Math.min(width, height) - pad * 2;
  const cell = inner / (size - 1);

  const host = d3.select(container);
  host.selectAll('svg.board').remove();

  const svg = host.append('svg').attr('class', 'board')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', 'auto');

  const root = svg.append('g').attr('class', 'root');

  root.append('rect')
    .attr('width', width).attr('height', height)
    .attr('fill', 'var(--board-bg, #DCB35C)')
    .attr('rx', 6);

  const grid = root.append('g').attr('transform', `translate(${pad},${pad})`);

  for (let i = 0; i < size; i++) {
    grid.append('line')
      .attr('x1', 0).attr('y1', i * cell)
      .attr('x2', inner).attr('y2', i * cell)
      .attr('stroke', '#4a3728').attr('stroke-width', 1);
    grid.append('line')
      .attr('x1', i * cell).attr('y1', 0)
      .attr('x2', i * cell).attr('y2', inner)
      .attr('stroke', '#4a3728').attr('stroke-width', 1);
  }

  [[2, 2], [6, 2], [2, 6], [6, 6]].forEach(([hx, hy]) => {
    grid.append('circle')
      .attr('cx', hx * cell).attr('cy', hy * cell)
      .attr('r', 3).attr('fill', '#4a3728');
  });

  ghost.forEach(({ coord, color }) => {
    const { col, row } = parseCoord(coord);
    const { x, y } = cornerView(col, row);
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    grid.append('circle')
      .attr('cx', x * cell).attr('cy', y * cell)
      .attr('r', cell * 0.42)
      .attr('fill', 'none')
      .attr('stroke', color === 'B' ? '#333' : '#fff')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4 3')
      .attr('opacity', 0.5);
  });

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  stones.forEach(({ coord, color, opacity = 1, delay = 0 }) => {
    const { col, row } = parseCoord(coord);
    const { x, y } = cornerView(col, row);
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const stone = grid.append('circle')
      .attr('class', 'stone')
      .attr('cx', x * cell).attr('cy', y * cell)
      .attr('fill', color === 'B' ? '#1a1a1a' : '#f5f5f0')
      .attr('stroke', color === 'B' ? '#000' : '#999')
      .attr('stroke-width', 0.5)
      .attr('opacity', opacity);

    if (reduced) {
      stone.attr('r', cell * 0.44);
    } else {
      stone.attr('r', 0)
        .transition().delay(delay).duration(400)
        .attr('r', cell * 0.44);
    }
  });

  marks.forEach(({ coord, label }) => {
    const { col, row } = parseCoord(coord);
    const { x, y } = cornerView(col, row);
    grid.append('text')
      .attr('x', x * cell).attr('y', y * cell + 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11).attr('font-weight', 600)
      .attr('fill', 'var(--accent)')
      .text(label);
  });

  annotations.forEach((text, i) => {
    root.append('text')
      .attr('x', width / 2)
      .attr('y', height - 8 - i * 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('fill', 'var(--text-muted)')
      .text(text);
  });
}
