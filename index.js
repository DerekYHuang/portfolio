// index.js
import { fetchJSON, renderProjects, fetchGitHubData } from "./global.js";

async function initHomePage() {
  try {
    // 1. Fetch all projects from the JSON file
    const projects = await fetchJSON("./lib/projects.json");

    // 2. Take only the first 3
    const latestProjects = projects.slice(0, 3);

    // 3. Select the container on the home page
    const projectsContainer = document.querySelector(".projects");

    // 4. Render the latest projects inside it
    renderProjects(latestProjects, projectsContainer, "h3");
  } catch (error) {
    console.error("Error loading latest projects:", error);
  }
}

async function loadGitHubStats() {
  try {
    const githubData = await fetchGitHubData("DerekYHuang");
    const profileStats = document.querySelector("#profile-stats");
    console.log("GitHub data:", githubData);

    if (profileStats && githubData) {
    profileStats.innerHTML = `
      <h2>My GitHub Profile/Stats</h2>
      <dl class="github-stats">
        <div>
          <dt>FOLLOWERS</dt>
          <dd>${githubData.followers}</dd>
        </div>
        <div>
          <dt>FOLLOWING</dt>
          <dd>${githubData.following}</dd>
        </div>
        <div>
          <dt>PUBLIC REPOS</dt>
          <dd>${githubData.public_repos}</dd>
        </div>
        <div>
          <dt>PUBLIC GISTS</dt>
          <dd>${githubData.public_gists}</dd>
        </div>
      </dl>
    `;
  }

  } catch (error) {
    console.error("Error displaying GitHub stats:", error);
  }
}

// Run both functions when the page loads
initHomePage();
loadGitHubStats();
