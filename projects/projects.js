import { fetchJSON, renderProjects } from "../global.js";

async function initProjects() {
  // Fetch the data
  const projects = await fetchJSON("./lib/projects.json");

  // Select the container in your HTML
  const projectsContainer = document.querySelector(".projects");

  // Render them dynamically
  renderProjects(projects, projectsContainer, "h2");

  // Count projects and display
  const titleElement = document.querySelector("h1");
  if (titleElement && Array.isArray(projects)) {
    titleElement.textContent = `My Projects (${projects.length})`;
  }
}

initProjects();
