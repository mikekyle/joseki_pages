/* Go board SVG renderer — corner-focused 9×9 (classic script, no modules) */

(function (global) {
  const LETTERS = 'ABCDEFGHJKLMNOPQRST';
  const d3 = global.d3;

  function parseCoord(coord) {
    const col = LETTERS.indexOf(coord[0].toUpperCase());
    const row = 19 - parseInt(coord.slice(1), 10);
    return { col, row };
  }

  function cornerView(fullCol, fullRow) {
    return { x: fullCol, y: fullRow };
  }

  function graphicSize(container, fallback) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const w = el?.getBoundingClientRect?.().width || el?.clientWidth || 0;
    return Math.max(240, Math.min(fallback || 360, w || fallback || 360));
  }

  function renderBoard(container, options) {
    options = options || {};
    const size = graphicSize(container, options.width || 360);
    const width = size;
    const height = size;

    const {
      gridSize = 9,
      stones = [],
      marks = [],
      ghost = [],
      annotations = [],
    } = options;

    const host = d3.select(container);
    host.selectAll('svg.board').remove();

    const pad = 28;
    const inner = Math.min(width, height) - pad * 2;
    const cell = inner / (gridSize - 1);

    const svg = host.append('svg').attr('class', 'board')
      .attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('width', '100%')
      .attr('height', 'auto');

    const root = svg.append('g').attr('class', 'root');

    root.append('rect')
      .attr('width', width).attr('height', height)
      .attr('fill', 'var(--board-bg, #DCB35C)')
      .attr('rx', 6);

    const grid = root.append('g').attr('transform', 'translate(' + pad + ',' + pad + ')');

    for (let i = 0; i < gridSize; i++) {
      grid.append('line')
        .attr('x1', 0).attr('y1', i * cell)
        .attr('x2', inner).attr('y2', i * cell)
        .attr('stroke', '#4a3728').attr('stroke-width', 1);
      grid.append('line')
        .attr('x1', i * cell).attr('y1', 0)
        .attr('x2', i * cell).attr('y2', inner)
        .attr('stroke', '#4a3728').attr('stroke-width', 1);
    }

    [[2, 2], [6, 2], [2, 6], [6, 6]].forEach(function (pt) {
      grid.append('circle')
        .attr('cx', pt[0] * cell).attr('cy', pt[1] * cell)
        .attr('r', 3).attr('fill', '#4a3728');
    });

    ghost.forEach(function (g) {
      const pos = cornerView(parseCoord(g.coord).col, parseCoord(g.coord).row);
      if (pos.x < 0 || pos.x >= gridSize || pos.y < 0 || pos.y >= gridSize) return;
      grid.append('circle')
        .attr('cx', pos.x * cell).attr('cy', pos.y * cell)
        .attr('r', cell * 0.42)
        .attr('fill', 'none')
        .attr('stroke', g.color === 'B' ? '#333' : '#fff')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4 3')
        .attr('opacity', 0.5);
    });

    const reduced = global.matchMedia('(prefers-reduced-motion: reduce)').matches;

    stones.forEach(function (s) {
      const pos = cornerView(parseCoord(s.coord).col, parseCoord(s.coord).row);
      if (pos.x < 0 || pos.x >= gridSize || pos.y < 0 || pos.y >= gridSize) return;
      const stone = grid.append('circle')
        .attr('class', 'stone')
        .attr('cx', pos.x * cell).attr('cy', pos.y * cell)
        .attr('fill', s.color === 'B' ? '#1a1a1a' : '#f5f5f0')
        .attr('stroke', s.color === 'B' ? '#000' : '#999')
        .attr('stroke-width', 0.5)
        .attr('opacity', s.opacity == null ? 1 : s.opacity);

      if (reduced) {
        stone.attr('r', cell * 0.44);
      } else {
        stone.attr('r', 0)
          .transition().delay(s.delay || 0).duration(400)
          .attr('r', cell * 0.44);
      }
    });

    marks.forEach(function (m) {
      const pos = cornerView(parseCoord(m.coord).col, parseCoord(m.coord).row);
      grid.append('text')
        .attr('x', pos.x * cell).attr('y', pos.y * cell + 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', 11).attr('font-weight', 600)
        .attr('fill', 'var(--accent)')
        .text(m.label);
    });

    annotations.forEach(function (text, i) {
      root.append('text')
        .attr('x', width / 2)
        .attr('y', height - 8 - i * 14)
        .attr('text-anchor', 'middle')
        .attr('font-size', 11)
        .attr('fill', 'var(--text-muted)')
        .text(text);
    });
  }

  global.SwallowBoard = { renderBoard: renderBoard, graphicSize: graphicSize };
})(window);
