// global.js
console.log("IT’S ALIVE!");

// ===== Helper =====
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// ===== Step 3: Automatic Navigation Menu =====

// Detect base path: local vs GitHub Pages
const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/" // Local dev
    : "/portfolio/"; // Replace 'portfolio' with your GitHub Pages repo name

// Define site pages
const pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "https://github.com/DerekYHuang", title: "Profile" },
  { url: "cv/", title: "CV/Resume" },
  { url: "meta/", title: "Meta" },
];

// Create <nav> and add to top of <body>
const nav = document.createElement("nav");
document.body.prepend(nav);

// Build navigation links
for (const p of pages) {
  let url = p.url;
  const title = p.title;

  // Prefix internal links with BASE_PATH
  if (!url.startsWith("http")) {
    url = BASE_PATH + url;
  }

  // Create <a> element
  const a = document.createElement("a");
  a.href = url;
  a.textContent = title;

  // Highlight the current page
  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links (like GitHub) in new tab
  if (a.host !== location.host) {
    a.target = "_blank";
  }

  // Add link to the nav
  nav.append(a);
}

// ===== Step 4: Dark Mode / Theme Switcher =====

// 1️⃣ Add theme switcher HTML
document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="system">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
`
);

// 2️⃣ Get the select element
const select = document.querySelector(".color-scheme select");

// 3️⃣ Function to apply the theme
function setColorScheme(scheme) {
  if (scheme === "system") {
    // Follow system preference
    document.documentElement.removeAttribute("data-theme");
  } else {
    // Apply specific theme
    document.documentElement.setAttribute("data-theme", scheme);
  }

  // Save the choice to localStorage
  localStorage.setItem("colorScheme", scheme);

  // Update dropdown
  select.value = scheme;
}

// 4️⃣ Load saved preference from localStorage
const savedScheme = localStorage.getItem("colorScheme") || "system";
setColorScheme(savedScheme);

// 5️⃣ Listen for changes in dropdown
select.addEventListener("input", (event) => {
  setColorScheme(event.target.value);
});


// ===== Lab4 - Step 1.2: Fetch JSON Helper =====
export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch JSON: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching or parsing JSON data:", error);
  }
}

// ===== Step 1.4: Render Projects =====
// global.js

export function renderProject(project) {
  const projectCard = document.createElement("div");
  projectCard.classList.add("project-card");

  // Project image
  const img = document.createElement("img");
  img.src = project.image;
  img.alt = project.title;

  // Title
  const title = document.createElement("h3");
  title.textContent = project.title.replace(/-/g, " ");

  // Description
  const description = document.createElement("p");
  description.textContent = project.description;

  // Year (added here)
  const year = document.createElement("p");
  year.textContent = project.year;
  year.classList.add("project-year");

  // Wrap description + year in same container
  const textContainer = document.createElement("div");
  textContainer.classList.add("project-text");
  textContainer.appendChild(description);
  textContainer.appendChild(year);

  // Combine everything into the card
  projectCard.appendChild(img);
  projectCard.appendChild(title);
  projectCard.appendChild(textContainer);

  return projectCard;
}

// Example renderProjects if you have it:
export function renderProjects(projects, container) {
  container.innerHTML = "";
  projects.forEach((project) => {
    container.appendChild(renderProject(project));
  });
}


// ===== Lab4 - Step 3: Fetch GitHub Data =====
export async function fetchGitHubData(username) {
  try {
    return await fetchJSON(`https://api.github.com/users/${username}`);
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
  }
}


