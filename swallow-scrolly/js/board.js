/* Go board SVG renderer — corner-focused 9×9 */

const LETTERS = 'ABCDEFGHJKLMNOPQRST';

function parseCoord(coord) {
  const col = LETTERS.indexOf(coord[0].toUpperCase());
  const row = 19 - parseInt(coord.slice(1), 10);
  return { col, row };
}

function cornerView(fullCol, fullRow) {
  // Top-left corner of 19×19 → local 9×9 grid (cols 0–8, rows 0–8 from top)
  return { x: fullCol, y: fullRow };
}

export function renderBoard(container, options = {}) {
  const {
    size = 9,
    stones = [],
    marks = [],
    ghost = [],
    annotations = [],
    width = 360,
    height = 360,
  } = options;

  const pad = 28;
  const inner = Math.min(width, height) - pad * 2;
  const cell = inner / (size - 1);

  const svg = d3.select(container).selectAll('svg.board').data([1]);
  const enter = svg.enter().append('svg').attr('class', 'board')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', width).attr('height', height);
  const g = enter.merge(svg).selectAll('g.root').data([1]);
  const gEnter = g.enter().append('g').attr('class', 'root');
  const root = gEnter.merge(g);

  svg.exit().remove();
  root.selectAll('*').remove();

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

  stones.forEach(({ coord, color, opacity = 1, delay = 0 }, i) => {
    const { col, row } = parseCoord(coord);
    const { x, y } = cornerView(col, row);
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    grid.append('circle')
      .attr('class', 'stone')
      .attr('cx', x * cell).attr('cy', y * cell)
      .attr('r', 0)
      .attr('fill', color === 'B' ? '#1a1a1a' : '#f5f5f0')
      .attr('stroke', color === 'B' ? '#000' : '#999')
      .attr('stroke-width', 0.5)
      .attr('opacity', opacity)
      .transition().delay(delay).duration(400)
      .attr('r', cell * 0.44);
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
      .attr('font-size', 12)
      .attr('fill', 'var(--text-muted)')
      .text(text);
  });
}
