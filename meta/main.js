import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      
      let ret = {
        id: commit,
        url: 'https://github.com/DerekYHuang/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,
        configurable: true,
        writable: false,
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  function addStat(label, value) {
    const div = dl.append('div');
    div.append('dt').text(label);
    div.append('dd').text(value);
  }

  addStat('Commits', commits.length);
  addStat('Files', d3.group(data, d => d.file).size);
  addStat('Total LOC', data.length);
  addStat('Max Depth', d3.max(data, d => d.depth));
  addStat('Longest Line', d3.max(data, d => d.length));
  
  const maxLinesPerCommit = d3.max(commits, c => c.totalLines);
  addStat('Max Lines', maxLinesPerCommit);
}

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id.substring(0, 7);
  
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
  
  time.textContent = commit.time;
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  
  const tooltipRect = tooltip.getBoundingClientRect();
  const tooltipHeight = tooltipRect.height;
  const viewportHeight = window.innerHeight;
  const offset = 15;
  
  let left = event.clientX + offset;
  let top = event.clientY + offset;
  
  if (top + tooltipHeight > viewportHeight - 20) {
    top = event.clientY - tooltipHeight - offset;
  }
  
  const tooltipWidth = tooltipRect.width;
  if (left + tooltipWidth > window.innerWidth - 20) {
    left = event.clientX - tooltipWidth - offset;
  }
  
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

// Global variables for scales (needed for brushing)
let xScale, yScale, commits;

function isCommitSelected(brushSelection, commit) {
  if (!brushSelection) {
    return false;
  }
  
  // Get the bounds of the brush selection
  const [[x0, y0], [x1, y1]] = brushSelection;
  
  // Get the commit's coordinates using the scales
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  
  // Check if the commit is within the brush bounds
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  // Clear and rebuild the container
  container.innerHTML = '';

  // Add each language as a div with dt and dd
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    const div = document.createElement('div');
    
    const dt = document.createElement('dt');
    dt.textContent = language.toUpperCase(); // Make language uppercase for consistency
    
    const dd = document.createElement('dd');
    dd.innerHTML = `${count}<br><span class="percentage">${formatted}</span>`;
    
    div.appendChild(dt);
    div.appendChild(dd);
    container.appendChild(div);
  }
}

function brushed(event) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
  );
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function renderScatterPlot(data, commitsData) {
  // Assign to global variable so brush functions can access it
  commits = commitsData;
  
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Assign to global variables so brush functions can access them
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3
    .scaleSqrt()
    .domain([minLines, maxLines])
    .range([3, 20]);

  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  gridlines.call(
    d3.axisLeft(yScale)
      .tickFormat('')
      .tickSize(-usableArea.width)
  );

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  const colorScale = d3
    .scaleSequential()
    .domain([0, 24])
    .interpolator((t) => {
      const hour = t * 24;
      
      if (hour < 6) {
        return d3.interpolateRgb('#0636baff', '#3b82f6')(hour / 6);
      } else if (hour < 12) {
        return d3.interpolateRgb('#3b82f6', '#fb923c')((hour - 6) / 6);
      } else if (hour < 18) {
        return d3.interpolateRgb('#fb923c', '#f97316')((hour - 12) / 6);
      } else {
        return d3.interpolateRgb('#f97316', '#0636baff')((hour - 18) / 6);
      }
    });

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  const dots = svg.append('g').attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', (d) => colorScale(d.hourFrac))
    .attr('stroke', (d) => d3.rgb(colorScale(d.hourFrac)).darker(0.5))
    .attr('stroke-width', 1)
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // Step 5.1-5.2: Add brush and raise dots above overlay
  svg.call(d3.brush().on('start brush end', brushed));
  svg.selectAll('.dots, .overlay ~ *').raise();
}

// Execute
let data = await loadData();
commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);