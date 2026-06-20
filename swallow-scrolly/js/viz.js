/* Viz state machine (classic script) */

(function (global) {
  const d3 = global.d3;
  const renderBoard = global.SwallowBoard.renderBoard;
  const graphicSize = global.SwallowBoard.graphicSize;

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

  function initViz(dataset) {
    data = dataset;
    reducedMotion = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var container = document.getElementById('graphic');
    container.innerHTML = '<div id="viz-root"></div>';
  }

  function getRoot() {
    return document.getElementById('viz-root');
  }

  function chartWidth(defaultW) {
    var el = document.getElementById('graphic');
    return graphicSize(el, defaultW || 380);
  }

  function updateViz(stepIndex) {
    if (!data) return;
    var state = STATES[stepIndex] || STATES[0];
    var root = getRoot();
    if (!root) return;
    root.innerHTML = '';

    switch (state) {
      case 'pattern-empty':
        renderBoard(root, { stones: [], annotations: ['Top-left corner'] });
        break;
      case 'pattern-full':
        renderBoard(root, {
          stones: data.moves.map(function (m, i) {
            return { coord: m.coord, color: m.color, delay: reducedMotion ? 0 : i * 150 };
          }),
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
          stones: data.moves.concat([
            { coord: 'F15', color: 'B' },
            { coord: 'G15', color: 'W' },
            { coord: 'F14', color: 'B' },
          ]),
          marks: [{ coord: 'D14', label: '52%' }],
          annotations: ['Local play stays in corner ' + data.stats.local_play_pct + '% of the time'],
        });
        break;
      case 'payoff':
        renderBoard(root, {
          stones: data.moves,
          annotations: [
            data.meta.matches.toLocaleString() + ' pro-game matches',
            'Median winrate ' + data.stats.winrate_median + '%',
          ],
        });
        break;
    }
  }

  function drawHistogram(container, opts) {
    var width = chartWidth(380);
    var height = Math.round(width * 0.84);
    var margin = { top: 28, right: 12, bottom: 44, left: 36 };
    var bins = data.bins.map(function (b) { return Object.assign({}, b); });
    var highlight = opts.highlight;

    var svg = d3.select(container).append('svg')
      .attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('width', '100%').attr('height', 'auto');

    var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    var innerW = width - margin.left - margin.right;
    var innerH = height - margin.top - margin.bottom;

    var x = d3.scaleBand().domain(bins.map(function (d) { return d.label; })).range([0, innerW]).padding(0.15);
    var y = d3.scaleLinear().domain([0, d3.max(bins, function (d) { return d.count; })]).nice().range([innerH, 0]);

    g.selectAll('rect').data(bins).join('rect')
      .attr('x', function (d) { return x(d.label); })
      .attr('y', innerH)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('fill', function (d) {
        if (highlight === 'outliers' && (d.label === '<30' || d.label === '70+')) return 'var(--accent)';
        return 'var(--chart-muted)';
      })
      .attr('rx', 3)
      .transition().duration(reducedMotion ? 0 : 500)
      .attr('y', function (d) { return y(d.count); })
      .attr('height', function (d) { return innerH - y(d.count); });

    g.append('g').attr('transform', 'translate(0,' + innerH + ')').call(d3.axisBottom(x))
      .selectAll('text').attr('font-size', 10);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', 10);

    svg.append('text')
      .attr('x', width / 2).attr('y', 16)
      .attr('text-anchor', 'middle').attr('font-size', 12).attr('fill', 'var(--text-muted)')
      .text('Winrate distribution (n=' + data.winrates.length + ')');

    if (highlight === 'outliers') {
      svg.append('text')
        .attr('x', width / 2).attr('y', height - 8)
        .attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', 'var(--accent)')
        .text('Outliers: ' + data.outliers.low + '% – ' + data.outliers.high + '%');
    }
  }

  function drawNextMoves(container) {
    var width = chartWidth(380);
    var height = Math.round(width * 0.78);
    var margin = { top: 36, right: 12, bottom: 40, left: 40 };
    var moves = data.continuations;

    var svg = d3.select(container).append('svg')
      .attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('width', '100%').attr('height', 'auto');

    var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    var innerW = width - margin.left - margin.right;
    var innerH = height - margin.top - margin.bottom;

    var x = d3.scaleBand().domain(moves.map(function (d) { return d.move; })).range([0, innerW]).padding(0.2);
    var y = d3.scaleLinear().domain([0, 60]).range([innerH, 0]);

    g.selectAll('rect').data(moves).join('rect')
      .attr('x', function (d) { return x(d.move); })
      .attr('y', innerH)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('fill', function (d, i) { return i === 0 ? 'var(--accent)' : 'var(--chart-muted)'; })
      .attr('rx', 3)
      .transition().duration(reducedMotion ? 0 : 500)
      .attr('y', function (d) { return y(d.pct); })
      .attr('height', function (d) { return innerH - y(d.pct); });

    g.selectAll('.label').data(moves).join('text')
      .attr('class', 'label')
      .attr('x', function (d) { return x(d.move) + x.bandwidth() / 2; })
      .attr('y', function (d) { return y(d.pct) - 6; })
      .attr('text-anchor', 'middle').attr('font-size', 12).attr('fill', 'var(--text)')
      .text(function (d) { return d.pct + '%'; });

    g.append('g').attr('transform', 'translate(0,' + innerH + ')').call(d3.axisBottom(x));
    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(function (d) { return d + '%'; }));

    svg.append('text')
      .attr('x', width / 2).attr('y', 18)
      .attr('text-anchor', 'middle').attr('font-size', 12).attr('fill', 'var(--text-muted)')
      .text('Top AI-recommended next moves');
  }

  global.SwallowViz = { initViz: initViz, updateViz: updateViz, STATES: STATES };
})(window);
