const profileCard = document.getElementById("profileCard");

function escapeHTML(text) {
    return String(text ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getUsernameFromUrl() {
    const parts = window.location.pathname.split("/");
    return parts[parts.length - 1];
}

function getInitials(name) {
    if (!name) return "?";

    const parts = name.trim().split(" ").filter(Boolean);

    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function isValidUrl(url) {
    try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol);
    } catch {
        return false;
    }
}

function renderError(title, message) {
    profileCard.innerHTML = `
        <div class="profile-error">
            <div>
                <i class="fa-solid fa-circle-exclamation"></i>
                <h1>${escapeHTML(title)}</h1>
                <p>${escapeHTML(message)}</p>
            </div>
        </div>
    `;
}

function renderProfile(profile) {
    const avatar = profile.profileImg
        ? `<img src="${escapeHTML(profile.profileImg)}" alt="${escapeHTML(profile.name)}">`
        : `<span>${getInitials(profile.name)}</span>`;

    const title = profile.title
        ? `<p class="profile-title">${escapeHTML(profile.title)}</p>`
        : "";

    const statusBadge = profile.openToWork
        ? `
            <div class="profile-status">
                <i class="fa-solid fa-circle"></i>
                Open to work
            </div>
        `
        : `
            <div class="profile-status neutral">
                <i class="fa-solid fa-circle"></i>
                Not looking
            </div>
        `;

    const location = profile.location
        ? `
            <div class="profile-meta-item">
                <i class="fa-solid fa-location-dot"></i>
                ${escapeHTML(profile.location)}
            </div>
        `
        : "";

    const skills = Array.isArray(profile.skills) && profile.skills.length > 0
        ? `
            <section class="profile-section">
                <h2>Skills</h2>

                <div class="skills-list">
                    ${profile.skills.map((skill) => `
                        <span class="skill-pill">${escapeHTML(skill)}</span>
                    `).join("")}
                </div>
            </section>
        `
        : "";

    const githubLink = profile.githubUrl && isValidUrl(profile.githubUrl)
        ? `
            <a class="profile-link" href="${escapeHTML(profile.githubUrl)}" target="_blank" rel="noopener noreferrer">
                <i class="fa-brands fa-github"></i>
                GitHub
            </a>
        `
        : "";

    const portfolioLink = profile.portfolioUrl && isValidUrl(profile.portfolioUrl)
        ? `
            <a class="profile-link secondary" href="${escapeHTML(profile.portfolioUrl)}" target="_blank" rel="noopener noreferrer">
                <i class="fa-solid fa-globe"></i>
                Portfolio
            </a>
        `
        : "";

    const linkedinLink = profile.linkedinUrl && isValidUrl(profile.linkedinUrl)
        ? `
            <a class="profile-link secondary" href="${escapeHTML(profile.linkedinUrl)}" target="_blank" rel="noopener noreferrer">
                <i class="fa-brands fa-linkedin"></i>
                LinkedIn
            </a>
        `
        : "";

    const contactLink = profile.contactEmail
        ? `
            <a class="profile-link secondary" href="mailto:${escapeHTML(profile.contactEmail)}">
                <i class="fa-solid fa-envelope"></i>
                Contact
            </a>
        `
        : "";

    const projects = Array.isArray(profile.projects) && profile.projects.length > 0
        ? `
            <section class="profile-section">
                <h2>Featured projects</h2>

                <div class="projects-grid">
                    ${profile.projects.map((project) => {
                        const github = project.githubUrl && isValidUrl(project.githubUrl)
                            ? `<a href="${escapeHTML(project.githubUrl)}" target="_blank" rel="noopener noreferrer">GitHub</a>`
                            : "";

                        const demo = project.demoUrl && isValidUrl(project.demoUrl)
                            ? `<a href="${escapeHTML(project.demoUrl)}" target="_blank" rel="noopener noreferrer">Demo</a>`
                            : "";

                        const techStack = Array.isArray(project.techStack) && project.techStack.length > 0
                            ? `
                                <div class="project-tech">
                                    ${project.techStack.map((tech) => `
                                        <span>${escapeHTML(tech)}</span>
                                    `).join("")}
                                </div>
                            `
                            : "";

                        const projectLinks = github || demo
                            ? `
                                <div class="project-links">
                                    ${github}
                                    ${demo}
                                </div>
                            `
                            : "";

                        return `
                            <article class="project-card">
                                <h3>${escapeHTML(project.name)}</h3>

                                ${
                                    project.description
                                        ? `<p>${escapeHTML(project.description)}</p>`
                                        : ""
                                }

                                ${techStack}
                                ${projectLinks}
                            </article>
                        `;
                    }).join("")}
                </div>
            </section>
        `
        : "";

    profileCard.innerHTML = `
        <div class="profile-cover"></div>

        <div class="profile-content">
            <div class="profile-top">
                <div class="profile-avatar">
                    ${avatar}
                </div>

                ${statusBadge}
            </div>

            <div class="profile-name-row">
                <h1>${escapeHTML(profile.name)}</h1>
                ${title}
                <p class="profile-username">@${escapeHTML(profile.username)}</p>
            </div>

            ${
                location
                    ? `<div class="profile-meta">${location}</div>`
                    : ""
            }

            ${
                profile.bio
                    ? `<p class="profile-bio">${escapeHTML(profile.bio)}</p>`
                    : `<p class="profile-bio">This user has not added a bio yet.</p>`
            }

            ${skills}

            ${projects}

            ${
                githubLink || portfolioLink || linkedinLink || contactLink
                    ? `
                        <div class="profile-links">
                            ${githubLink}
                            ${portfolioLink}
                            ${linkedinLink}
                            ${contactLink}
                        </div>
                    `
                    : ""
            }

            <div class="profile-footer">
                Built with Job Tracker.
            </div>
        </div>
    `;
}

async function loadProfile() {
    const username = getUsernameFromUrl();

    if (!username) {
        renderError("Profile not found", "No username was provided.");
        return;
    }

    try {
        const response = await fetch(`/api/public/users/${username}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not load profile.");
        }

        renderProfile(result.profile);

        document.title = `${result.profile.name} | Job Tracker`;

    } catch (error) {
        renderError("Profile unavailable", error.message);
    }
}

loadProfile();