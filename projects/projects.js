import { fetchJSON, renderProjects } from "../global.js";
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function initProjects() {
  const projects = await fetchJSON("./lib/projects.json");
  const projectsContainer = document.querySelector(".latest-projects");
  const searchBar = document.querySelector(".searchBar");

  let query = "";
  let selectedIndex = -1; // -1 means no selection

  // --- FILTERING LOGIC ---
  function getFilteredProjects() {
    let filteredProjects = projects;

    // Apply search filter across all project metadata
    if (query) {
      filteredProjects = filteredProjects.filter(project => {
        const values = Object.values(project).join("\n").toLowerCase();
        return values.includes(query.toLowerCase());
      });
    }

    return filteredProjects;
  }

  function getVisibleProjects() {
    // Get filtered projects and take only first 3
    return getFilteredProjects().slice(0, 3);
  }

  // --- PIE CHART FUNCTION ---
  function renderPieChart(visibleProjects) {
    const svg = d3.select("#projects-pie-plot");
    const legend = d3.select(".legend");

    // Clear old chart and legend
    svg.selectAll("path").remove();
    legend.selectAll("*").remove();

    // Use only the visible 3 projects for the pie chart
    const rolledData = d3.rollups(
      visibleProjects,
      v => v.length,
      d => d.year
    );

    if (rolledData.length === 0) return;

    const data = rolledData.map(([year, count]) => ({ 
      label: year, 
      value: count 
    }));

    const colors = d3.scaleOrdinal(d3.schemeTableau10);
    const radius = 50;

    const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);
    const sliceGenerator = d3.pie().value(d => d.value);
    const arcData = sliceGenerator(data);
    const arcs = arcData.map((d) => arcGenerator(d));

    // Draw slices
    arcs.forEach((arc, i) => {
      svg
        .append('path')
        .attr('d', arc)
        .attr('fill', colors(i))
        .attr('class', selectedIndex === i ? 'selected' : '')
        .on('click', function() {
          // Toggle selection
          selectedIndex = selectedIndex === i ? -1 : i;

          // Update all path classes
          svg.selectAll('path')
            .attr('class', (_, idx) => selectedIndex === idx ? 'selected' : '');

          // Update all legend classes
          legend.selectAll('li')
            .attr('class', (_, idx) => selectedIndex === idx ? 'selected' : '');

          // Filter and render projects
          if (selectedIndex === -1) {
            renderProjects(visibleProjects, projectsContainer, 'h2');
          } else {
            const selectedYear = data[selectedIndex].label;
            const filteredByYear = visibleProjects.filter(p => p.year === selectedYear);
            renderProjects(filteredByYear, projectsContainer, 'h2');
          }
        });
    });

    // Legend
    data.forEach((d, i) => {
      legend.append('li')
        .attr('class', selectedIndex === i ? 'selected' : '')
        .attr('style', `--color:${colors(i)}`)
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
        .on('click', function() {
          // Toggle selection
          selectedIndex = selectedIndex === i ? -1 : i;

          // Update all path classes
          svg.selectAll('path')
            .attr('class', (_, idx) => selectedIndex === idx ? 'selected' : '');

          // Update all legend classes
          legend.selectAll('li')
            .attr('class', (_, idx) => selectedIndex === idx ? 'selected' : '');

          // Filter and render projects
          if (selectedIndex === -1) {
            renderProjects(visibleProjects, projectsContainer, 'h2');
          } else {
            const selectedYear = data[selectedIndex].label;
            const filteredByYear = visibleProjects.filter(p => p.year === selectedYear);
            renderProjects(filteredByYear, projectsContainer, 'h2');
          }
        });
    });
  }

  // --- UPDATE UI FUNCTION ---
  function updateUI() {
    // Get the 3 visible projects
    const visibleProjects = getVisibleProjects();

    // Decide what to display
    let displayedProjects = visibleProjects;
    
    if (selectedIndex !== -1) {
      // Get the year from the pie chart data
      const rolledData = d3.rollups(
        visibleProjects,
        v => v.length,
        d => d.year
      );
      const data = rolledData.map(([year, count]) => ({ 
        label: year, 
        value: count 
      }));
      
      if (selectedIndex < data.length) {
        const selectedYear = data[selectedIndex].label;
        displayedProjects = visibleProjects.filter(p => p.year === selectedYear);
      }
    }

    // Render projects and pie chart
    renderProjects(displayedProjects, projectsContainer, "h2");
    renderPieChart(visibleProjects);
  }

  // --- INITIAL RENDER ---
  updateUI();

  // --- SEARCH EVENT ---
  searchBar.addEventListener("input", (event) => {
    query = event.target.value;
    selectedIndex = -1; // Reset selection when searching
    updateUI();
  });

  // --- Title update ---
  const titleElement = document.querySelector("h1");
  if (titleElement) {
    titleElement.textContent = `My Projects (${projects.length})`;
  }
}

initProjects();