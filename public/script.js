let currentUser = null;

async function loadCurrentUser() {
    try {
        const response = await fetch("/api/auth/me", {
            credentials: "include"
        });

        const result = await response.json();

        if (!response.ok) {
            window.location.replace("/auth.html");
            return false;
        }

        currentUser = result.user;
        updateUserUI();

        return true;

    } catch (error) {
        window.location.replace("/auth.html");
        return false;
    }
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const elements = {
    // Main navigation
    tabButtons: $$(".tab-btn[data-tab]"),
    tabContents: $$(".tab-content"),
    pageTitle: $("#pageTitle"),

    // Language
    langSelects: $$(".lang-select"),

    // Settings tabs
    settingsTabs: $$(".settings-tab"),
    settingsPanels: $$(".settings-panel-tab"),
    saveSettingsBtn: $("#saveSettingsBtn"),
    profileProjectsInput: $("#profileProjectsInput"),

    // Theme
    themeToggle: $("#themeToggle"),
    themeIcon: $("#themeIcon"),
    themeText: $("#themeText"),

    // Data/privacy
    exportDataBtn: $("#exportDataBtn"),
    deleteAccountBtn: $("#deleteAccountBtn"),

    // Applications form
    applicationForm: $("#applicationForm"),
    companyInput: $("#companyInput"),
    roleInput: $("#roleInput"),
    locationInput: $("#locationInput"),
    dateInput: $("#dateInput"),
    statusInput: $("#statusInput"),
    notesInput: $("#notesInput"),
    applicationsList: $("#applicationsList"),
    applicationsCount: $("#applicationsCount"),
    statusFilter: $("#statusFilter"),
    applicationViewButtons: $$(".application-view-btn"),

    // Confirm modal
    confirmOverlay: $("#confirmOverlay"),
    confirmTitle: $("#confirmTitle"),
    confirmMessage: $("#confirmMessage"),
    confirmCancelBtn: $("#confirmCancelBtn"),
    confirmActionBtn: $("#confirmActionBtn"),

    // Dashboard
    totalApplicationsStat: $("#totalApplicationsStat"),
    activeApplicationsStat: $("#activeApplicationsStat"),
    archivedApplicationsStat: $("#archivedApplicationsStat"),
    interviewsStat: $("#interviewsStat"),
    offersStat: $("#offersStat"),
    rejectedStat: $("#rejectedStat"),
    dashboardChart: $("#dashboardChart"),
    recentApplicationsList: $("#recentApplicationsList"),
    followUpsSummary: $("#followUpsSummary"),
    followUpsList: $("#followUpsList"),
    dashboardGraphTitle: $("#dashboardGraphTitle"),
    dashboardGraphText: $("#dashboardGraphText"),
    graphDots: $$(".graph-dot"),

    // User UI
    sidebarUsername: $("#sidebarUsername"),
    sidebarUserEmail: $("#sidebarUserEmail"),
    sidebarAvatar: $("#sidebarAvatar"),
    settingsProfileAvatar: $("#settingsProfileAvatar"),
    settingsDisplayName: $("#settingsDisplayName"),
    settingsEmail: $("#settingsEmail"),
    settingsUserId: $("#settingsUserId"),
    settingsCreatedAt: $("#settingsCreatedAt"),

    // Profile edit
    editProfileImgBtn: $("#editProfileImgBtn"),
    profileImageInput: $("#profileImageInput"),
    editDisplayNameBtn: $("#editDisplayNameBtn"),
    changePasswordBtn: $("#changePasswordBtn"),
    profileModalOverlay: $("#profileModalOverlay"),
    profileModalClose: $("#profileModalClose"),
    profileModalTitle: $("#profileModalTitle"),
    profileModalText: $("#profileModalText"),
    profileModalMessage: $("#profileModalMessage"),
    displayNameForm: $("#displayNameForm"),
    passwordForm: $("#passwordForm"),
    newDisplayName: $("#newDisplayName"),
    currentPasswordInput: $("#currentPasswordInput"),
    newPasswordInput: $("#newPasswordInput"),

    // Public profile
    profileUsernameInput: $("#profileUsernameInput"),
    profileTitleInput: $("#profileTitleInput"),
    profileBioInput: $("#profileBioInput"),
    profileSkillsInput: $("#profileSkillsInput"),
    profileLocationInput: $("#profileLocationInput"),
    profileGithubInput: $("#profileGithubInput"),
    profilePortfolioInput: $("#profilePortfolioInput"),
    profileLinkedinInput: $("#profileLinkedinInput"),
    profileContactEmailInput: $("#profileContactEmailInput"),
    profileOpenToWorkInput: $("#profileOpenToWorkInput"),
    profileVisibilitySelect: $("#profileVisibilitySelect"),
    savePublicProfileBtn: $("#savePublicProfileBtn"),

    profilePublicLink: $("#profilePublicLink"),
    viewPublicProfileBtn: $("#viewPublicProfileBtn"),
    copyPublicProfileBtn: $("#copyPublicProfileBtn"),

    profileProjectsList: $("#profileProjectsList"),
    profileProjectsCount: $("#profileProjectsCount"),
    addProfileProjectBtn: $("#addProfileProjectBtn"),

    projectModalOverlay: $("#projectModalOverlay"),
    projectModalClose: $("#projectModalClose"),
    projectModalTitle: $("#projectModalTitle"),
    projectForm: $("#projectForm"),
    projectNameInput: $("#projectNameInput"),
    projectDescriptionInput: $("#projectDescriptionInput"),
    projectTechInput: $("#projectTechInput"),
    projectGithubInput: $("#projectGithubInput"),
    projectDemoInput: $("#projectDemoInput"),

    // Preferences
    dateFormatSelect: $("#dateFormatSelect"),

    // Misc
    logoutBtn: $("#logoutBtn"),
    introOverlay: $("#introOverlay"),

    // Notifications
    inboxBtn: $("#inboxBtn"),
    inboxBadge: $("#inboxBadge"),
    notificationBackdrop: $("#notificationBackdrop"),
    notificationDrawer: $("#notificationDrawer"),
    notificationList: $("#notificationList"),
    notificationSubtitle: $("#notificationSubtitle"),
    closeNotificationsBtn: $("#closeNotificationsBtn"),
    expandNotificationsBtn: $("#expandNotificationsBtn"),
    markAllNotificationsReadBtn: $("#markAllNotificationsReadBtn"),
    toastContainer: $("#toastContainer"),

    // Application detail modal
    applicationDetailOverlay: $("#applicationDetailOverlay"),
    applicationDetailClose: $("#applicationDetailClose"),
    applicationDetailCloseFooter: $("#applicationDetailCloseFooter"),
    applicationDetailArchiveBtn: $("#applicationDetailArchiveBtn"),
    applicationDetailDeleteBtn: $("#applicationDetailDeleteBtn"),
    applicationDetailStatus: $("#applicationDetailStatus"),
    applicationDetailArchivedBadge: $("#applicationDetailArchivedBadge"),
    applicationDetailCompany: $("#applicationDetailCompany"),
    applicationDetailRole: $("#applicationDetailRole"),
    applicationDetailLocation: $("#applicationDetailLocation"),
    applicationDetailDate: $("#applicationDetailDate"),
    applicationDetailCreatedAt: $("#applicationDetailCreatedAt"),
    applicationDetailUpdatedAt: $("#applicationDetailUpdatedAt"),
    applicationDetailNotes: $("#applicationDetailNotes"),
    applicationDetailEditBtn: $("#applicationDetailEditBtn"),

    applicationEditForm: $("#applicationEditForm"),
    applicationEditCancelBtn: $("#applicationEditCancelBtn"),
    editApplicationCompany: $("#editApplicationCompany"),
    editApplicationRole: $("#editApplicationRole"),
    editApplicationLocation: $("#editApplicationLocation"),
    editApplicationDate: $("#editApplicationDate"),
    editApplicationStatus: $("#editApplicationStatus"),
    editApplicationNotes: $("#editApplicationNotes"),

    toggleApplicationFormBtn: $("#toggleApplicationFormBtn"),
    applicationsLayout: $("#applicationsLayout"),
    applicationFormCard: $("#applicationFormCard"),

    // Footer
    miniFooter: $("#miniFooter"),
    miniFooterToggle: $("#miniFooterToggle"),
};

let translations = {};
let currentTab = "dashboard";
let currentLanguage = localStorage.getItem("language") || "sv";
let currentApplicationsView = "active";
let currentGraphIndex = 0;
let dashboardGraphInterval = null;
let confirmCallback = null;
let editingProjectIndex = null;

let publicProfileProjects = [];
let notifications = [];
let applications = [];

/* ----------------------------- Helpers ----------------------------- */
function t(key, fallback = key) {
    return translations[key] || fallback;
}

function translateWithMeta(key, fallback, meta = {}) {
    let text = t(key, fallback);

    Object.entries(meta).forEach(([name, value]) => {
        text = text.replaceAll(`{${name}}`, value ?? "");
    });

    return text;
}

function escapeHTML(text) {
    return String(text ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function parseDateString(dateString) {
    if (!dateString) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    return new Date(dateString);
}

function formatDateByPreference(dateString) {
    const date = parseDateString(dateString);

    if (!date || Number.isNaN(date.getTime())) {
        return "-";
    }

    const format = localStorage.getItem("dateFormat") || "yyyy-mm-dd";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    if (format === "dd/mm/yyyy") return `${day}/${month}/${year}`;
    if (format === "mm/dd/yyyy") return `${month}/${day}/${year}`;

    return `${year}-${month}-${day}`;
}

function getDaysSince(dateString) {
    const date = parseDateString(dateString);

    if (!date || Number.isNaN(date.getTime())) return 0;

    const today = new Date();
    return Math.floor((today - date) / (1000 * 60 * 60 * 24));
}

function getStartOfWeek(date) {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);

    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    return start;
}

async function refreshCurrentUser() {
    if (!currentUser || !currentUser.id) return;

    try {
        const result = await apiRequest(`/api/users/${currentUser.id}`);

        currentUser = result.user;
        updateUserUI();

    } catch (error) {
        console.error("Could not refresh user:", error);
    }
}

function updatePublicProfileInputs() {
    if (!currentUser) return;

    if (elements.profileUsernameInput) {
        elements.profileUsernameInput.value = currentUser.username || "";
    }

    if (elements.profileTitleInput) {
        elements.profileTitleInput.value = currentUser.title || "";
    }

    if (elements.profileBioInput) {
        elements.profileBioInput.value = currentUser.bio || "";
    }

    if (elements.profileSkillsInput) {
        elements.profileSkillsInput.value = Array.isArray(currentUser.skills)
            ? currentUser.skills.join(", ")
            : "";
    }

    if (elements.profileLocationInput) {
        elements.profileLocationInput.value = currentUser.location || "";
    }

    if (elements.profileGithubInput) {
        elements.profileGithubInput.value = currentUser.githubUrl || "";
    }

    if (elements.profilePortfolioInput) {
        elements.profilePortfolioInput.value = currentUser.portfolioUrl || "";
    }

    if (elements.profileLinkedinInput) {
        elements.profileLinkedinInput.value = currentUser.linkedinUrl || "";
    }

    if (elements.profileContactEmailInput) {
        elements.profileContactEmailInput.value = currentUser.contactEmail || "";
    }

    if (elements.profileOpenToWorkInput) {
        elements.profileOpenToWorkInput.checked = currentUser.openToWork ?? true;
    }

    if (elements.profileVisibilitySelect) {
        elements.profileVisibilitySelect.value = currentUser.profileVisibility || "private";
    }

    publicProfileProjects = Array.isArray(currentUser.projects)
        ? [...currentUser.projects]
        : [];

    renderProfileProjectCards();

    if (elements.profilePublicLink) {
        elements.profilePublicLink.textContent = currentUser.username
            ? getPublicProfileUrl()
            : "No username yet";
    }
}

function projectsToText(projects) {
    if (!Array.isArray(projects)) return "";

    return projects.map((project) => {
        const techStack = Array.isArray(project.techStack)
            ? project.techStack.join(", ")
            : "";

        return [
            project.name || "",
            project.description || "",
            techStack,
            project.githubUrl || "",
            project.demoUrl || ""
        ].join(" | ");
    }).join("\n");
}

function parseProjectsFromText(text) {
    if (!text) return [];

    return text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [name, description, techStack, githubUrl, demoUrl] = line
                .split("|")
                .map((part) => part.trim());

            return {
                name: name || "",
                description: description || "",
                techStack: techStack
                    ? techStack.split(",").map((tech) => tech.trim()).filter(Boolean)
                    : [],
                githubUrl: githubUrl || "",
                demoUrl: demoUrl || ""
            };
        })
        .filter((project) => project.name)
        .slice(0, 4);
}

function getPublicProfileUrl() {
    if (!currentUser || !currentUser.username) return "";

    return `${window.location.origin}/u/${currentUser.username}`;
}

function renderProfileProjectCards() {
    if (!elements.profileProjectsList) return;

    if (elements.profileProjectsCount) {
        elements.profileProjectsCount.textContent = `${publicProfileProjects.length} / 4 projects`;
    }

    if (publicProfileProjects.length === 0) {
        elements.profileProjectsList.innerHTML = `
            <div class="empty-projects">
                ${t("noProjectsYet", "No projects added yet.")}
            </div>
        `;
        return;
    }

    elements.profileProjectsList.innerHTML = publicProfileProjects.map((project, index) => {
        const techStack = Array.isArray(project.techStack) && project.techStack.length > 0
            ? `
                <div class="profile-project-tech">
                    ${project.techStack.map((tech) => `
                        <span>${escapeHTML(tech)}</span>
                    `).join("")}
                </div>
            `
            : "";

        return `
            <article class="profile-project-card">
                <div class="profile-project-card-header">
                    <div>
                        <h4>${escapeHTML(project.name)}</h4>
                        ${
                            project.description
                                ? `<p>${escapeHTML(project.description)}</p>`
                                : `<p>${t("noProjectDescription", "No description added.")}</p>`
                        }
                    </div>

                    <div class="profile-project-actions">
                        <button class="project-icon-btn" type="button" data-project-action="edit" data-project-index="${index}" title="${t("edit", "Edit")}">
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button class="project-icon-btn danger" type="button" data-project-action="delete" data-project-index="${index}" title="${t("delete", "Delete")}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>

                ${techStack}
            </article>
        `;
    }).join("");
}

function openProjectModal(index = null) {
    if (!elements.projectModalOverlay || !elements.projectForm) return;

    editingProjectIndex = index;

    const isEditing = index !== null;
    const project = isEditing ? publicProfileProjects[index] : null;

    if (elements.projectModalTitle) {
        elements.projectModalTitle.textContent = isEditing
            ? t("editProject", "Edit project")
            : t("addProject", "Add project");
    }

    elements.projectNameInput.value = project?.name || "";
    elements.projectDescriptionInput.value = project?.description || "";
    elements.projectTechInput.value = Array.isArray(project?.techStack)
        ? project.techStack.join(", ")
        : "";
    elements.projectGithubInput.value = project?.githubUrl || "";
    elements.projectDemoInput.value = project?.demoUrl || "";

    elements.projectModalOverlay.classList.add("active");
}

function closeProjectModal() {
    if (!elements.projectModalOverlay) return;

    elements.projectModalOverlay.classList.remove("active");
    editingProjectIndex = null;

    if (elements.projectForm) {
        elements.projectForm.reset();
    }
}

function handleProjectSubmit(event) {
    event.preventDefault();

    const project = {
        name: elements.projectNameInput.value.trim(),
        description: elements.projectDescriptionInput.value.trim(),
        techStack: elements.projectTechInput.value
            .split(",")
            .map((tech) => tech.trim())
            .filter(Boolean),
        githubUrl: elements.projectGithubInput.value.trim(),
        demoUrl: elements.projectDemoInput.value.trim()
    };

    if (!project.name) {
        showToast({
            type: "info",
            title: t("info", "Info"),
            message: translations.projectNameRequired || "Project name is required."
        });
        return;
    }

    if (editingProjectIndex === null && publicProfileProjects.length >= 4) {
        showToast({
            type: "info",
            title: t("info", "Info"),
            message: translations.maxProjectsReached || "You can only add up to 4 projects."
        });
        return;
    }

    if (editingProjectIndex !== null) {
        publicProfileProjects[editingProjectIndex] = project;
    } else {
        publicProfileProjects.push(project);
    }

    renderProfileProjectCards();
    closeProjectModal();
}

function deleteProfileProject(index) {
    publicProfileProjects.splice(index, 1);
    renderProfileProjectCards();
}

function setupPublicProfile() {
    if (elements.savePublicProfileBtn) {
        elements.savePublicProfileBtn.addEventListener("click", savePublicProfile);
    }

    if (elements.addProfileProjectBtn) {
        elements.addProfileProjectBtn.addEventListener("click", () => {
            openProjectModal();
        });
    }

    if (elements.projectModalClose) {
        elements.projectModalClose.addEventListener("click", closeProjectModal);
    }

    if (elements.projectModalOverlay) {
        elements.projectModalOverlay.addEventListener("click", (event) => {
            if (event.target === elements.projectModalOverlay) {
                closeProjectModal();
            }
        });
    }

    if (elements.projectForm) {
        elements.projectForm.addEventListener("submit", handleProjectSubmit);
    }

    if (elements.profileProjectsList) {
        elements.profileProjectsList.addEventListener("click", (event) => {
            const button = event.target.closest("[data-project-action]");
            if (!button) return;

            const action = button.dataset.projectAction;
            const index = Number(button.dataset.projectIndex);

            if (action === "edit") {
                openProjectModal(index);
            }

            if (action === "delete") {
                deleteProfileProject(index);
            }
        });
    }

    if (elements.viewPublicProfileBtn) {
        elements.viewPublicProfileBtn.addEventListener("click", () => {
            const url = getPublicProfileUrl();

            if (!url) {
                showToast({
                    type: "info",
                    title: t("info", "Info"),
                    message: translations.noUsernameYet || "Add a username first."
                });
                return;
            }

            window.open(url, "_blank");
        });
    }

    if (elements.copyPublicProfileBtn) {
        elements.copyPublicProfileBtn.addEventListener("click", async () => {
            const url = getPublicProfileUrl();

            if (!url) {
                showToast({
                    type: "info",
                    title: t("info", "Info"),
                    message: translations.noUsernameYet || "Add a username first."
                });
                return;
            }

            try {
                await navigator.clipboard.writeText(url);
                showToast({
                    type: "success",
                    title: t("success", "Success"),
                    message: translations.profileLinkCopied || "Profile link copied."
                });
            } catch (error) {
                showToast({
                    type: "error",
                    title: t("error", "Error"),
                    message: url || "Error copying URL"
                });
            }
        });
    }
}

async function loadNotifications() {
    if (!currentUser || !currentUser.id) return;

    try {
        const result = await apiRequest(`/api/users/${currentUser.id}/notifications`);

        notifications = result.notifications || [];
        renderNotifications();

    } catch (error) {
        console.error("Could not load notifications:", error);
    }
}

function getNotificationIcon(type) {
    const icons = {
        profile_view: "fa-eye",
        application_created: "fa-briefcase",
        application_updated: "fa-pen",
        system: "fa-inbox"
    };

    return icons[type] || "fa-inbox";
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) {
        return t("justNow", "Just now");
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes} ${t("minutesAgo", "min ago")}`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours} ${t("hoursAgo", "h ago")}`;
    }

    const days = Math.floor(hours / 24);

    return `${days} ${t("daysAgoShort", "d ago")}`;
}

function renderNotifications() {
    if (!elements.notificationList) return;

    const unreadCount = notifications.filter((notification) => !notification.read).length;

    if (elements.inboxBadge) {
        elements.inboxBadge.textContent = unreadCount;
        elements.inboxBadge.classList.toggle("active", unreadCount > 0);
    }

    if (elements.notificationSubtitle) {
        elements.notificationSubtitle.textContent = unreadCount === 0
            ? t("noUnreadNotifications", "No unread notifications")
            : `${unreadCount} ${t("unreadNotifications", "unread notifications")}`;
    }

    if (notifications.length === 0) {
        elements.notificationList.innerHTML = `
            <div class="notification-empty">
                <div>
                    <i class="fa-solid fa-inbox"></i>
                    <h4>${t("emptyInbox", "Inbox is empty")}</h4>
                    <p>${t("emptyInboxText", "Profile views and updates will appear here.")}</p>
                </div>
            </div>
        `;
        return;
    }

    elements.notificationList.innerHTML = notifications.map((notification) => {
        const notificationImage = notification.meta?.profileImg
            ? `<img src="${escapeHTML(notification.meta.profileImg)}" alt="" class="notification-avatar-img">`
            : `<i class="fa-solid ${getNotificationIcon(notification.type)}"></i>`;

        return `
            <article class="notification-item ${notification.read ? "" : "unread"}">
                <div class="notification-type-icon">
                    ${notificationImage}
                </div>

                <div class="notification-content">
                    <h4>${escapeHTML(getNotificationTitle(notification))}</h4>
                    <p>${escapeHTML(getNotificationMessage(notification))}</p>
                    <span class="notification-time">${getTimeAgo(notification.createdAt)}</span>
                </div>

                <div class="notification-menu">
                    ${
                        notification.read
                            ? ""
                            : `
                                <button class="notification-mini-btn" type="button" data-notification-action="read" data-id="${notification.id}" title="Mark as read">
                                    <i class="fa-solid fa-check"></i>
                                </button>
                            `
                    }

                    <button class="notification-mini-btn danger" type="button" data-notification-action="delete" data-id="${notification.id}" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

function openNotifications() {
    elements.notificationDrawer?.classList.add("active");
    elements.notificationBackdrop?.classList.add("active");
    loadNotifications();
}

function closeNotifications() {
    elements.notificationDrawer?.classList.remove("active");
    elements.notificationBackdrop?.classList.remove("active");
}

function toggleNotificationsExpanded() {
    elements.notificationDrawer?.classList.toggle("expanded");
}

async function markNotificationAsRead(notificationId) {
    try {
        await apiRequest(`/api/users/${currentUser.id}/notifications/${notificationId}/read`, {
            method: "PATCH"
        });

        notifications = notifications.map((notification) => {
            if (notification.id === notificationId) {
                return {
                    ...notification,
                    read: true
                };
            }

            return notification;
        });

        renderNotifications();

    } catch (error) {
        showToast({
            type: "error",
            title: t("error", "Error"),
            message: error.message
        });
    }
}

async function markAllNotificationsAsRead() {
    try {
        await apiRequest(`/api/users/${currentUser.id}/notifications/read-all`, {
            method: "PATCH"
        });

        notifications = notifications.map((notification) => {
            return {
                ...notification,
                read: true
            };
        });

        renderNotifications();

    } catch (error) {
        showToast({
            type: "error",
            title: t("error", "Error"),
            message: error.message
        });
    }
}

async function deleteNotification(notificationId) {
    try {
        await apiRequest(`/api/users/${currentUser.id}/notifications/${notificationId}`, {
            method: "DELETE"
        });

        notifications = notifications.filter((notification) => {
            return notification.id !== notificationId;
        });

        renderNotifications();

    } catch (error) {
        showToast({
            type: "error",
            title: t("error", "Error"),
            message: error.message
        });
    }
}

function setupNotifications() {
    if (elements.inboxBtn) {
        elements.inboxBtn.addEventListener("click", openNotifications);
    }

    if (elements.closeNotificationsBtn) {
        elements.closeNotificationsBtn.addEventListener("click", closeNotifications);
    }

    if (elements.notificationBackdrop) {
        elements.notificationBackdrop.addEventListener("click", closeNotifications);
    }

    if (elements.expandNotificationsBtn) {
        elements.expandNotificationsBtn.addEventListener("click", toggleNotificationsExpanded);
    }

    if (elements.markAllNotificationsReadBtn) {
        elements.markAllNotificationsReadBtn.addEventListener("click", markAllNotificationsAsRead);
    }

    if (elements.notificationList) {
        elements.notificationList.addEventListener("click", (event) => {
            const button = event.target.closest("[data-notification-action]");
            if (!button) return;

            const { notificationAction, id } = button.dataset;

            if (notificationAction === "read") {
                markNotificationAsRead(id);
            }

            if (notificationAction === "delete") {
                deleteNotification(id);
            }
        });
    }
}

function getNotificationTitle(notification) {
    if (notification.titleKey) {
        return translateWithMeta(
            notification.titleKey,
            notification.title || "Notification",
            notification.meta
        );
    }

    return notification.title || t("notification", "Notification");
}

function getNotificationMessage(notification) {
    if (notification.messageKey) {
        return translateWithMeta(
            notification.messageKey,
            notification.message || "",
            notification.meta
        );
    }

    return notification.message || "";
}

function showToast({
    type = "info",
    title = "",
    message = "",
    duration = 3200
}) {
    if (!elements.toastContainer) return;

    const icons = {
        success: "fa-check",
        error: "fa-xmark",
        warning: "fa-triangle-exclamation",
        info: "fa-circle-info"
    };

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fa-solid ${icons[type] || icons.info}"></i>
        </div>

        <div class="toast-content">
            ${title ? `<h4>${escapeHTML(title)}</h4>` : ""}
            ${message ? `<p>${escapeHTML(message)}</p>` : ""}
        </div>
    `;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("removing");

        toast.addEventListener("animationend", () => {
            toast.remove();
        });
    }, duration);
}

function setButtonLoading(button, isLoading, loadingText = t("saving", "Saving...")) {
    if (!button) return;

    const icon = button.querySelector("i");
    const text = button.querySelector("span");

    if (isLoading) {
        button.dataset.originalIcon = icon?.className || "";
        button.dataset.originalText = text?.textContent || "";

        button.disabled = true;
        button.classList.add("is-loading");

        if (icon) icon.className = "fa-solid fa-spinner";
        if (text) text.textContent = loadingText;

        return;
    }

    button.disabled = false;
    button.classList.remove("is-loading");

    if (icon && button.dataset.originalIcon) {
        icon.className = button.dataset.originalIcon;
    }

    if (text && button.dataset.originalText) {
        text.textContent = button.dataset.originalText;
    }
}

/* ----------------------------- Auth / User ----------------------------- */
async function logout() {
    try {
        await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include"
        });
    } finally {
        window.location.replace("/auth.html");
    }
}

function confirmLogout() {
    openConfirmModal({
        title: t("logoutConfirmTitle", "Log out?"),
        message: t(
            "logoutConfirmMessage",
            "Are you sure you want to log out of your account?"
        ),
        confirmText: t("logout", "Logout"),
        type: "danger",
        onConfirm: logout
    });
}

function saveCurrentUser(user) {
    currentUser = user;
    updateUserUI();
}

function getUserInitials(name) {
    if (!name) return "?";

    const parts = name.trim().split(" ").filter(Boolean);

    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function renderUserAvatar(container, user) {
    if (!container || !user) return;

    if (user.profileImg) {
        container.innerHTML = `
            <img src="${user.profileImg}" alt="${escapeHTML(user.name)}" class="avatar-img">
        `;
        return;
    }

    container.innerHTML = `
        <span>${getUserInitials(user.name)}</span>
    `;
}

function updateUserUI() {
    if (!currentUser) return;

    if (elements.sidebarUsername) elements.sidebarUsername.textContent = currentUser.name;
    if (elements.sidebarUserEmail) elements.sidebarUserEmail.textContent = currentUser.email;

    if (elements.settingsDisplayName) elements.settingsDisplayName.textContent = currentUser.name;
    if (elements.settingsEmail) elements.settingsEmail.textContent = currentUser.email;
    if (elements.settingsUserId) elements.settingsUserId.textContent = currentUser.id;
    if (elements.settingsCreatedAt) {
        elements.settingsCreatedAt.textContent = formatDateByPreference(currentUser.createdAt);
    }

    renderUserAvatar(elements.sidebarAvatar, currentUser);
    renderUserAvatar(elements.settingsProfileAvatar, currentUser);
    updatePublicProfileInputs();
}

/* ----------------------------- API ----------------------------- */
async function patchUser(url, data) {
    const response = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const rawResponse = await response.text();

    let result;

    try {
        result = rawResponse ? JSON.parse(rawResponse) : {};
    } catch (error) {
        console.error("Server returned non-JSON response:");
        console.error(rawResponse);

        throw new Error(
            `Servern skickade inte JSON. Status: ${response.status}. Kolla server-routen: ${url}`
        );
    }

    if (!response.ok) {
        throw new Error(result.message || "Something went wrong.");
    }

    return result;
}

/* ----------------------------- i18n ----------------------------- */

async function loadLanguage(lang) {
    try {
        const response = await fetch(`/lang/${lang}.json`);

        if (!response.ok) {
            throw new Error(`Could not load ${lang}.json. Status: ${response.status}`);
        }

        translations = await response.json();

        $$("[data-i18n]").forEach((element) => {
            const key = element.dataset.i18n;
            if (translations[key]) element.textContent = translations[key];
        });

        $$("[data-i18n-placeholder]").forEach((element) => {
            const key = element.dataset.i18nPlaceholder;
            if (translations[key]) element.placeholder = translations[key];
        });

        $$("[data-i18n-title]").forEach((element) => {
            const key = element.dataset.i18nTitle;

            if (translations[key]) {
                element.title = translations[key];
                element.setAttribute("aria-label", translations[key]);
            }
        });

        if (elements.pageTitle) {
            elements.pageTitle.textContent = t(currentTab, currentTab);
        }

        document.documentElement.lang = lang;
        localStorage.setItem("language", lang);
        currentLanguage = lang;

        elements.langSelects.forEach((select) => {
            select.value = lang;
        });

        updateThemeButton();
        renderAll();
        renderNotifications();
    } catch (error) {
        console.error("Language loading error:", error);
        renderAll();
    }
}

/* ----------------------------- Theme / Preferences ----------------------------- */

function applySavedTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.classList.toggle("dark", savedTheme === "dark");
    updateThemeButton();
}

function updateThemeButton() {
    const { themeToggle, themeIcon, themeText } = elements;

    if (!themeToggle || !themeIcon || !themeText) return;

    const isDark = document.body.classList.contains("dark");

    themeIcon.className = isDark ? "fa-solid fa-moon" : "fa-solid fa-sun";
    themeText.textContent = isDark ? t("darkMode", "Dark mode") : t("lightMode", "Light mode");
}

function saveSettings() {
    const button = elements.saveSettingsBtn;
    if (!button) return;

    const icon = button.querySelector("i");
    const text = button.querySelector("span");

    button.classList.remove("saved");
    button.classList.add("saving");

    icon.className = "fa-solid fa-spinner";
    text.textContent = t("savingSettings", "Saving...");

    setTimeout(() => {
        button.classList.remove("saving");
        button.classList.add("saved");

        icon.className = "fa-solid fa-check";
        text.textContent = t("settingsSaved", "Saved!");

        setTimeout(() => {
            button.classList.remove("saved");

            icon.className = "fa-solid fa-floppy-disk";
            text.textContent = t("saveSettings", "Save settings");
        }, 1600);
    }, 700);
}

function setSettingsAutoSaveMode() {
    if (!elements.saveSettingsBtn) return;

    elements.saveSettingsBtn.classList.add("auto-save");
    elements.saveSettingsBtn.innerHTML = `
        <i class="fa-solid fa-check"></i>
        <span>${t("settingsAutoSaved", "Inställningar sparas automatiskt")}</span>
    `;
}

/* ----------------------------- Main tabs ----------------------------- */

function openMainTab(tabName) {
    const button = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (button) button.click();
}

function setupMainTabs() {
    elements.tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const selectedTab = button.dataset.tab;
            currentTab = selectedTab;

            elements.tabButtons.forEach((btn) => btn.classList.remove("active"));
            elements.tabContents.forEach((content) => content.classList.remove("active"));

            button.classList.add("active");

            const selectedContent = document.getElementById(selectedTab);
            if (selectedContent) selectedContent.classList.add("active");

            if (elements.pageTitle) {
                elements.pageTitle.textContent = t(selectedTab, button.textContent.trim());
            }
        });
    });
}

function setupSettingsTabs() {
    elements.settingsTabs.forEach((button) => {
        button.addEventListener("click", () => {
            const selectedSettingsTab = button.dataset.settingsTab;

            elements.settingsTabs.forEach((tab) => tab.classList.remove("active"));
            elements.settingsPanels.forEach((panel) => panel.classList.remove("active"));

            button.classList.add("active");

            const selectedPanel = document.getElementById(`settings-${selectedSettingsTab}`);
            if (selectedPanel) selectedPanel.classList.add("active");
        });
    });
}

/* ----------------------------- Applications ----------------------------- */

function getStatusLabel(status) {
    const statusKeys = {
        notApplied: "statusNotApplied",
        applied: "statusApplied",
        interview: "statusInterview",
        offer: "statusOffer",
        rejected: "statusRejected"
    };

    return t(statusKeys[status], status);
}

function getStatusOptions(selectedStatus) {
    const statuses = ["notApplied", "applied", "interview", "offer", "rejected"];

    return statuses.map((status) => {
        return `
            <option value="${status}" ${selectedStatus === status ? "selected" : ""}>
                ${getStatusLabel(status)}
            </option>
        `;
    }).join("");
}

function getVisibleApplications() {
    const selectedFilter = elements.statusFilter ? elements.statusFilter.value : "all";

    return applications
        .map((application) => ({
            ...application,
            archived: application.archived || false
        }))
        .filter((application) => {
            return currentApplicationsView === "archived" ? application.archived : !application.archived;
        })
        .filter((application) => {
            return selectedFilter === "all" || application.status === selectedFilter;
        });
}

function renderApplications() {
    const { applicationsList, applicationsCount } = elements;

    if (!applicationsList || !applicationsCount) return;

    const visibleApplications = getVisibleApplications();

    applicationsCount.textContent = `${visibleApplications.length} ${
        visibleApplications.length === 1
            ? t("applicationSingular", "application")
            : t("applicationPlural", "applications")
    }`;

    if (visibleApplications.length === 0) {
        const isArchivedView = currentApplicationsView === "archived";

        applicationsList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid ${isArchivedView ? "fa-box-archive" : "fa-folder-open"}"></i>
                <h4>
                    ${
                        isArchivedView
                            ? t("emptyArchivedTitle", "No archived applications")
                            : t("emptyApplicationsTitle", "No applications yet")
                    }
                </h4>
                <p>
                    ${
                        isArchivedView
                            ? t("emptyArchivedText", "Archived applications will appear here.")
                            : t("emptyApplicationsText", "Add your first job application to get started.")
                    }
                </p>
            </div>
        `;
        return;
    }

    applicationsList.innerHTML = visibleApplications.map((application) => {
        const archiveButton = application.archived
            ? `
                <button class="unarchive-application-btn" data-action="unarchive" data-id="${application.id}" title="${t("unarchive", "Unarchive")}">
                    <i class="fa-solid fa-box-open"></i>
                </button>
            `
            : `
                <button class="archive-application-btn" data-action="archive" data-id="${application.id}" title="${t("archive", "Archive")}">
                    <i class="fa-solid fa-box-archive"></i>
                </button>
            `;

        return `
            <div 
                class="application-card" 
                data-application-id="${application.id}"
                role="button"
                tabindex="0"
                title="${t("viewApplicationDetails", "View application details")}"
            >
                <div>
                    <h4 class="application-company">${escapeHTML(application.company)}</h4>
                    <p class="application-role">${escapeHTML(application.role)}</p>

                    <div class="application-meta">
                        <span>
                            <i class="fa-solid fa-location-dot"></i>
                            ${escapeHTML(application.location || "-")}
                        </span>

                        <span>
                            <i class="fa-solid fa-calendar"></i>
                            ${formatDateByPreference(application.date)}
                        </span>
                    </div>

                    ${
                        application.notes
                            ? `<p class="application-notes">${escapeHTML(application.notes)}</p>`
                            : ""
                    }
                </div>

                <div class="application-actions">
                    <select class="status-select status-${application.status}" data-action="status" data-id="${application.id}">
                        ${getStatusOptions(application.status)}
                    </select>

                    <div class="application-action-buttons">
                        ${archiveButton}

                        <button class="delete-application-btn" data-action="delete" data-id="${application.id}" title="${t("delete", "Delete")}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function getApplicationById(id) {
    return applications.find((application) => {
        return application.id === id;
    });
}

function openApplicationDetailModal(applicationId) {
    
    const application = getApplicationById(applicationId);

    if (!application || !elements.applicationDetailOverlay) return;

    setApplicationEditMode(false);

    if (elements.applicationDetailStatus) {
        elements.applicationDetailStatus.textContent = getStatusLabel(application.status);
        elements.applicationDetailStatus.className = `application-detail-label status-${application.status}`;
    }

    if (elements.applicationDetailArchivedBadge) {
        elements.applicationDetailArchivedBadge.classList.toggle("active", Boolean(application.archived));
    }

    if (elements.applicationDetailCompany) {
        elements.applicationDetailCompany.textContent = application.company || "-";
    }

    if (elements.applicationDetailRole) {
        elements.applicationDetailRole.textContent = application.role || "-";
    }

    if (elements.applicationDetailLocation) {
        elements.applicationDetailLocation.textContent = application.location || "-";
    }

    if (elements.applicationDetailDate) {
        elements.applicationDetailDate.textContent = formatDateByPreference(application.date);
    }

    if (elements.applicationDetailCreatedAt) {
        elements.applicationDetailCreatedAt.textContent = formatDateByPreference(application.createdAt);
    }

    if (elements.applicationDetailUpdatedAt) {
        elements.applicationDetailUpdatedAt.textContent = formatDateByPreference(application.updatedAt);
    }

    if (elements.applicationDetailNotes) {
        elements.applicationDetailNotes.textContent = application.notes || t("noNotesAdded", "No notes added.");
    }

    if (elements.applicationDetailArchiveBtn) {
        const isArchived = Boolean(application.archived);

        elements.applicationDetailArchiveBtn.dataset.applicationId = application.id;
        elements.applicationDetailArchiveBtn.dataset.archived = String(isArchived);

        elements.applicationDetailArchiveBtn.innerHTML = isArchived
            ? `
                <i class="fa-solid fa-box-open"></i>
                <span>${t("unarchive", "Unarchive")}</span>
            `
            : `
                <i class="fa-solid fa-box-archive"></i>
                <span>${t("archive", "Archive")}</span>
            `;
    }

    if (elements.applicationDetailDeleteBtn) {
        elements.applicationDetailDeleteBtn.dataset.applicationId = application.id;
    }

    elements.applicationDetailOverlay.dataset.applicationId = application.id;
    elements.applicationDetailOverlay.classList.add("active");
    elements.applicationDetailOverlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closeApplicationDetailModal() {
    if (!elements.applicationDetailOverlay) return;

    elements.applicationDetailOverlay.classList.remove("active");
    elements.applicationDetailOverlay.setAttribute("aria-hidden", "true");
    elements.applicationDetailOverlay.dataset.applicationId = "";
    document.body.classList.remove("modal-open");
}

function setupApplicationDetailModal() {
    if (!elements.applicationDetailOverlay) return;

    elements.applicationDetailClose?.addEventListener("click", closeApplicationDetailModal);
    elements.applicationDetailCloseFooter?.addEventListener("click", closeApplicationDetailModal);

    elements.applicationDetailArchiveBtn?.addEventListener("click", async () => {
        const applicationId = elements.applicationDetailOverlay?.dataset.applicationId;

        if (!applicationId) return;

        const application = getApplicationById(applicationId);

        if (!application) return;

        const success = application.archived
            ? await unarchiveApplication(applicationId)
            : await archiveApplication(applicationId);

        if (success) {
            closeApplicationDetailModal();
        }
    });

    elements.applicationDetailDeleteBtn?.addEventListener("click", () => {
        const applicationId = elements.applicationDetailOverlay?.dataset.applicationId;

        if (!applicationId) return;

        closeApplicationDetailModal();
        deleteApplication(applicationId);
    });

    elements.applicationDetailOverlay.addEventListener("click", (event) => {
        if (event.target === elements.applicationDetailOverlay) {
            closeApplicationDetailModal();
        }
    });

    elements.applicationDetailEditBtn?.addEventListener("click", openApplicationEditMode);

    elements.applicationEditCancelBtn?.addEventListener("click", () => {
        setApplicationEditMode(false);
    });

    elements.applicationEditForm?.addEventListener("submit", handleApplicationEditSubmit);

    document.addEventListener("keydown", (event) => {
        if (
            event.key === "Escape" &&
            elements.applicationDetailOverlay.classList.contains("active")
        ) {
            closeApplicationDetailModal();
        }
    });
}

async function addApplication(event) {
    event.preventDefault();

    const submitButton = elements.applicationForm?.querySelector("button[type='submit']");

    const newApplication = {
        company: elements.companyInput.value.trim(),
        role: elements.roleInput.value.trim(),
        location: elements.locationInput.value.trim(),
        date: elements.dateInput.value,
        status: elements.statusInput.value,
        notes: elements.notesInput.value.trim()
    };

    try {
        setButtonLoading(submitButton, true, t("adding", "Adding..."));

        await createApplication(newApplication);
        elements.applicationForm.reset();

    } catch (error) {
        showToast({
            type: "error",
            title: t("error", "Error"),
            message: error.message
        });

    } finally {
        setButtonLoading(submitButton, false);
    }
}

async function updateApplicationStatus(id, newStatus) {
    try {
        await patchApplication(id, {
            status: newStatus
        });

    } catch (error) {
        showToast({
            type: "error",
            title: t("error", "Error"),
            message: error.message
        });
    }
}

async function archiveApplication(id) {
    try {
        await patchApplication(id, {
            archived: true,
            archivedAt: new Date().toISOString()
        });

        return true;

    } catch (error) {
        showToast({
            type: "error",
            title: t("error", "Error"),
            message: error.message
        });

        return false;
    }
}

async function unarchiveApplication(id) {
    try {
        await patchApplication(id, {
            archived: false,
            archivedAt: null
        });

        return true;

    } catch (error) {
        showToast({
            type: "error",
            title: t("error", "Error"),
            message: error.message
        });

        return false;
    }
}

function deleteApplication(id) {
    openConfirmModal({
        title: translations.deleteApplicationTitle || "Delete application?",
        message: translations.deleteApplicationConfirm || "Are you sure you want to delete this application? This action cannot be undone.",
        confirmText: translations.delete || "Delete",
        type: "danger",
        onConfirm: async () => {
            const card = document.querySelector(`[data-application-id="${id}"]`);

            if (card) {
                card.classList.add("deleting");
            }

            setTimeout(async () => {
                try {
                    await removeApplication(id);

                } catch (error) {
                    showToast({
                        type: "error",
                        title: t("error", "Error"),
                        message: error.message
                    });
                    renderAll();
                }
            }, 420);

            showToast({
                type: "success",
                title: t("success", "Success"),
                message: translations.deleteApplicationToast || "You deleted an application!"
            });
        }
    });
}

function setupApplications() {
    if (elements.applicationForm) {
        elements.applicationForm.addEventListener("submit", addApplication);
    }

    if (elements.statusFilter) {
        elements.statusFilter.addEventListener("change", renderApplications);
    }

    elements.applicationViewButtons.forEach((button) => {
        button.addEventListener("click", () => {
            currentApplicationsView = button.dataset.view;

            elements.applicationViewButtons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");

            renderApplications();
        });
    });

    if (!elements.applicationsList) return;

    elements.applicationsList.addEventListener("change", (event) => {
        const target = event.target;

        if (target.dataset.action === "status") {
            updateApplicationStatus(target.dataset.id, target.value);
        }
    });

    elements.applicationsList.addEventListener("click", (event) => {
        const actionButton = event.target.closest("[data-action]");

        if (actionButton) {
            const { action, id } = actionButton.dataset;

            if (action === "archive") archiveApplication(id);
            if (action === "unarchive") unarchiveApplication(id);
            if (action === "delete") deleteApplication(id);

            return;
        }

        const clickedCard = event.target.closest(".application-card");

        if (!clickedCard) return;

        openApplicationDetailModal(clickedCard.dataset.applicationId);
    });

    elements.applicationsList.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;

        const clickedCard = event.target.closest(".application-card");

        if (!clickedCard) return;

        event.preventDefault();
        openApplicationDetailModal(clickedCard.dataset.applicationId);
    });
}

function setupApplicationFormToggle() {
    if (!elements.toggleApplicationFormBtn || !elements.applicationsLayout) return;

    const savedState = localStorage.getItem("applicationFormCollapsed") === "true";

    elements.applicationsLayout.classList.toggle("form-collapsed", savedState);
    updateApplicationFormToggleButton(savedState);

    elements.toggleApplicationFormBtn.addEventListener("click", () => {
        const isCollapsed = elements.applicationsLayout.classList.toggle("form-collapsed");

        localStorage.setItem("applicationFormCollapsed", String(isCollapsed));
        updateApplicationFormToggleButton(isCollapsed);
    });
}

function updateApplicationFormToggleButton(isCollapsed) {
    if (!elements.toggleApplicationFormBtn) return;

    const label = isCollapsed
        ? t("showForm", "Visa formulär")
        : t("hideForm", "Dölj formulär");

    elements.toggleApplicationFormBtn.title = label;
    elements.toggleApplicationFormBtn.setAttribute("aria-label", label);
}

/* ----------------------------- Dashboard ----------------------------- */

function renderDashboard() {
    if (!elements.totalApplicationsStat) return;

    const activeApplications = applications.filter((application) => !application.archived);
    const archivedApplications = applications.filter((application) => application.archived);

    const interviews = activeApplications.filter((application) => application.status === "interview").length;
    const offers = activeApplications.filter((application) => application.status === "offer").length;
    const rejected = activeApplications.filter((application) => application.status === "rejected").length;

    setDashboardStat(elements.totalApplicationsStat, applications.length);
    setDashboardStat(elements.activeApplicationsStat, activeApplications.length);
    setDashboardStat(elements.archivedApplicationsStat, archivedApplications.length);
    setDashboardStat(elements.interviewsStat, interviews);
    setDashboardStat(elements.offersStat, offers);
    setDashboardStat(elements.rejectedStat, rejected);

    renderDashboardChart(activeApplications);
    renderRecentApplications(activeApplications);
    renderFollowUps(activeApplications);
}

function renderDashboardChart(activeApplications) {
    if (!elements.dashboardChart) return;

    elements.dashboardChart.classList.remove("graph-slide");
    void elements.dashboardChart.offsetWidth;
    elements.dashboardChart.classList.add("graph-slide");

    elements.graphDots.forEach((dot) => {
        dot.classList.toggle("active", Number(dot.dataset.graphIndex) === currentGraphIndex);
    });

    if (currentGraphIndex === 0) renderStatusGraph(activeApplications);
    if (currentGraphIndex === 1) renderResponseRateGraph(activeApplications);
    if (currentGraphIndex === 2) renderThisWeekGraph();
}

function renderStatusGraph(activeApplications) {
    elements.dashboardGraphTitle.textContent = t("overallGraph", "Overall graph");
    elements.dashboardGraphText.textContent = t("overallGraphText", "Status overview for your active applications.");

    const chartData = ["notApplied", "applied", "interview", "offer", "rejected"].map((status) => ({
        label: getStatusLabel(status),
        value: activeApplications.filter((application) => application.status === status).length
    }));

    const maxValue = Math.max(...chartData.map((item) => item.value), 1);

    elements.dashboardChart.innerHTML = chartData.map((item) => {
        const width = (item.value / maxValue) * 100;

        return `
            <div class="chart-row">
                <span class="chart-label">${item.label}</span>

                <div class="chart-track">
                    <div class="chart-fill" style="width: ${width}%;"></div>
                </div>

                <span class="chart-value">${item.value}</span>
            </div>
        `;
    }).join("");
}

function renderResponseRateGraph(activeApplications) {
    elements.dashboardGraphTitle.textContent = t("responseRate", "Response rate");
    elements.dashboardGraphText.textContent = t("responseRateText", "How many active applications have received a response.");

    const responses = activeApplications.filter((application) => {
        return ["interview", "offer", "rejected"].includes(application.status);
    }).length;

    const responseRate = activeApplications.length === 0
        ? 0
        : Math.round((responses / activeApplications.length) * 100);

    elements.dashboardChart.innerHTML = `
        <div class="response-rate-graph">
            <div class="response-rate-circle" style="--response-percent: ${responseRate}%">
                <span>${responseRate}%</span>
            </div>

            <p>
                ${responses} / ${activeApplications.length}
                ${t("applicationsHaveResponses", "applications have received responses.")}
            </p>
        </div>
    `;
}

function renderThisWeekGraph() {
    elements.dashboardGraphTitle.textContent = t("thisWeek", "This week");
    elements.dashboardGraphText.textContent = t("thisWeekText", "Applications added during the current week.");

    const weekDays = getCurrentWeekDays();
    const maxValue = Math.max(...weekDays.map((day) => day.count), 1);

    elements.dashboardChart.innerHTML = `
        <div class="week-graph">
            ${weekDays.map((day) => {
                const height = (day.count / maxValue) * 100;

                return `
                    <div class="week-bar-item">
                        <div class="week-bar">
                            <div class="week-bar-fill" style="height: ${height}%;"></div>
                        </div>

                        <span class="week-bar-value">${day.count}</span>
                        <span class="week-bar-label">${day.label}</span>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function getCurrentWeekDays() {
    const startOfWeek = getStartOfWeek(new Date());
    const dayLabels = translations.weekDaysShort || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return dayLabels.map((label, index) => {
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + index);

        const count = applications.filter((application) => {
            const createdDate = parseDateString(application.createdAt || application.date);

            return (
                createdDate.getFullYear() === currentDay.getFullYear() &&
                createdDate.getMonth() === currentDay.getMonth() &&
                createdDate.getDate() === currentDay.getDate()
            );
        }).length;

        return { label, count };
    });
}

function renderRecentApplications(activeApplications) {
    if (!elements.recentApplicationsList) return;

    const recentApplications = [...activeApplications]
        .sort((a, b) => {
            const dateA = parseDateString(a.createdAt || a.date || 0);
            const dateB = parseDateString(b.createdAt || b.date || 0);
            return dateB - dateA;
        })
        .slice(0, 5);

    if (recentApplications.length === 0) {
        elements.recentApplicationsList.innerHTML = `
            <div class="dashboard-empty-state">
                <i class="fa-solid fa-folder-open"></i>
                <h4>${t("emptyApplicationsTitle", "No applications yet")}</h4>
                <p>${t("emptyApplicationsText", "Add your first job application to get started.")}</p>
            </div>
        `;
        return;
    }

    elements.recentApplicationsList.innerHTML = recentApplications.map((application) => {
        return `
            <div class="recent-application-item">
                <div class="recent-application-info">
                    <h4>${escapeHTML(application.company)}</h4>
                    <p>${escapeHTML(application.role)} • ${formatDateByPreference(application.date)}</p>
                </div>

                <span class="status-badge status-${application.status}">
                    ${getStatusLabel(application.status)}
                </span>
            </div>
        `;
    }).join("");
}

function getFollowUps(activeApplications) {
    return activeApplications
        .filter((application) => application.status === "applied" && getDaysSince(application.date) >= 7)
        .sort((a, b) => getDaysSince(b.date) - getDaysSince(a.date));
}

function renderFollowUps(activeApplications) {
    if (!elements.followUpsSummary || !elements.followUpsList) return;

    const followUps = getFollowUps(activeApplications);

    elements.followUpsSummary.textContent = `${followUps.length} ${
        followUps.length === 1
            ? t("followUpSingular", "application needs follow-up.")
            : t("followUpPlural", "applications need follow-up.")
    }`;

    if (followUps.length === 0) {
        elements.followUpsList.innerHTML = `
            <div class="no-followups">
                ${t("noFollowUps", "No follow-ups needed right now.")}
            </div>
        `;
        return;
    }

    elements.followUpsList.innerHTML = followUps.slice(0, 3).map((application) => {
        const days = getDaysSince(application.date);

        return `
            <div class="followup-item">
                <div class="followup-info">
                    <h4>${escapeHTML(application.company)}</h4>
                    <p>${escapeHTML(application.role)} • ${formatDateByPreference(application.date)}</p>
                </div>

                <span class="followup-days">
                    ${days} ${t("daysAgo", "days ago")}
                </span>
            </div>
        `;
    }).join("");
}

function switchDashboardGraph(index) {
    currentGraphIndex = index;
    renderDashboard();
    restartDashboardGraphInterval();
}

function restartDashboardGraphInterval() {
    clearInterval(dashboardGraphInterval);

    dashboardGraphInterval = setInterval(() => {
        currentGraphIndex = currentGraphIndex >= 2 ? 0 : currentGraphIndex + 1;
        renderDashboard();
    }, 5000);
}

function setupDashboard() {
    elements.graphDots.forEach((dot) => {
        dot.addEventListener("click", () => {
            switchDashboardGraph(Number(dot.dataset.graphIndex));
        });
    });
}

function animateNumber(element, targetValue, duration = 650) {
    if (!element) return;

    const startValue = Number(element.dataset.currentValue || element.textContent || 0);
    const endValue = Number(targetValue || 0);

    if (startValue === endValue) {
        element.textContent = endValue;
        return;
    }

    const startTime = performance.now();

    function tick(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        const currentValue = Math.round(startValue + (endValue - startValue) * easedProgress);

        element.textContent = currentValue;

        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            element.textContent = endValue;
            element.dataset.currentValue = endValue;
        }
    }

    requestAnimationFrame(tick);
}

function setDashboardStat(element, value) {
    animateNumber(element, value);
}

/* ----------------------------- Profile edit ----------------------------- */

function openProfileModal(type) {
    if (!elements.profileModalOverlay) return;

    elements.profileModalMessage.textContent = "";
    elements.profileModalMessage.classList.remove("success");

    elements.displayNameForm.classList.remove("active");
    elements.passwordForm.classList.remove("active");

    if (type === "displayName") {
        elements.profileModalTitle.textContent = t("editDisplayName", "Edit display name");
        elements.profileModalText.textContent = t("editDisplayNameText", "You can only change your display name once per year.");
        elements.newDisplayName.value = currentUser.name;
        elements.displayNameForm.classList.add("active");
    }

    if (type === "password") {
        elements.profileModalTitle.textContent = t("changePassword", "Change password");
        elements.profileModalText.textContent = t("changePasswordText", "Update your account password.");
        elements.passwordForm.reset();
        elements.passwordForm.classList.add("active");
    }

    elements.profileModalOverlay.classList.add("active");
}

function closeProfileModal() {
    if (elements.profileModalOverlay) {
        elements.profileModalOverlay.classList.remove("active");
    }
}

function showProfileMessage(message, type = "error") {
    elements.profileModalMessage.textContent = message;
    elements.profileModalMessage.classList.toggle("success", type === "success");
}

async function handleDisplayNameSubmit(event) {
    event.preventDefault();

    try {
        const result = await patchUser(`/api/users/${currentUser.id}/display-name`, {
            name: elements.newDisplayName.value.trim()
        });

        saveCurrentUser(result.user);
        showProfileMessage(t("displayNameUpdated", "Display name updated."), "success");

        setTimeout(closeProfileModal, 900);
    } catch (error) {
        showProfileMessage(error.message);
    }
}

async function handlePasswordSubmit(event) {
    event.preventDefault();

    try {
        await patchUser(`/api/users/${currentUser.id}/password`, {
            currentPassword: elements.currentPasswordInput.value,
            newPassword: elements.newPasswordInput.value
        });

        showProfileMessage(t("passwordUpdated", "Password updated."), "success");
        setTimeout(closeProfileModal, 900);
    } catch (error) {
        showProfileMessage(error.message);
    }
}


function setupProfileEdit() {
    if (elements.editDisplayNameBtn) {
        elements.editDisplayNameBtn.addEventListener("click", () => {
            openProfileModal("displayName");
        });
    }

    if (elements.changePasswordBtn) {
        elements.changePasswordBtn.addEventListener("click", () => {
            openProfileModal("password");
        });
    }

    if (elements.profileModalClose) {
        elements.profileModalClose.addEventListener("click", closeProfileModal);
    }

    if (elements.profileModalOverlay) {
        elements.profileModalOverlay.addEventListener("click", (event) => {
            if (event.target === elements.profileModalOverlay) {
                closeProfileModal();
            }
        });
    }

    if (elements.displayNameForm) {
        elements.displayNameForm.addEventListener("submit", handleDisplayNameSubmit);
    }

    if (elements.passwordForm) {
        elements.passwordForm.addEventListener("submit", handlePasswordSubmit);
    }

    if (elements.editProfileImgBtn && elements.profileImageInput) {
        elements.editProfileImgBtn.addEventListener("click", () => {
            elements.profileImageInput.click();
        });

        elements.profileImageInput.addEventListener("change", handleProfileImageUpload);
    }
}

async function handleProfileImageUpload() {
    const file = elements.profileImageInput.files[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
        showToast({
            type: "info",
            title: t("info", "Info"),
            message: translations.invalidImage || "Please choose a JPG, PNG or WEBP image."
        });
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        showToast({
            type: "info",
            title: t("info", "Info"),
            message: translations.imageTooLarge || "Image must be under 2 MB."
        });
        return;
    }

    const formData = new FormData();
    formData.append("profileImg", file);

    try {
        const response = await fetch(`/api/users/${currentUser.id}/profile-image`, {
            method: "PATCH",
            credentials: "include",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not update profile image.");
        }

        saveCurrentUser(result.user);
        elements.profileImageInput.value = "";

    } catch (error) {
        showToast({
            type: "error",
            title: t("error", "Error"),
            message: error.message
        });
    }
}

/* ----------------------------- Export / Delete / Confirm ----------------------------- */

function exportUserData() {
    const data = {
        user: currentUser,
        settings: {
            language: localStorage.getItem("language") || "sv",
            theme: localStorage.getItem("theme") || "light",
            dateFormat: localStorage.getItem("dateFormat") || "yyyy-mm-dd"
        },
        applications
    };

    const file = new Blob([JSON.stringify(data, null, 4)], {
        type: "application/json"
    });

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = "job-tracker-data.json";
    link.click();

    URL.revokeObjectURL(url);
}

function openConfirmModal(options) {
    if (!elements.confirmOverlay) return;

    elements.confirmTitle.textContent = options.title || "Are you sure?";
    elements.confirmMessage.textContent = options.message || "This action cannot be undone.";
    elements.confirmActionBtn.textContent = options.confirmText || "Confirm";
    elements.confirmActionBtn.className = "confirm-action-btn";

    if (options.type === "danger") {
        elements.confirmActionBtn.classList.add("danger");
    }

    confirmCallback = options.onConfirm;
    elements.confirmOverlay.classList.add("active");
}

function closeConfirmModal() {
    if (!elements.confirmOverlay) return;

    elements.confirmOverlay.classList.remove("active");
    confirmCallback = null;
}

function setupConfirmModal() {
    if (elements.confirmCancelBtn) {
        elements.confirmCancelBtn.addEventListener("click", closeConfirmModal);
    }

    if (elements.confirmOverlay) {
        elements.confirmOverlay.addEventListener("click", (event) => {
            if (event.target === elements.confirmOverlay) closeConfirmModal();
        });
    }

    if (elements.confirmActionBtn) {
        elements.confirmActionBtn.addEventListener("click", () => {
            if (confirmCallback) confirmCallback();
            closeConfirmModal();
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeConfirmModal();
            closeProfileModal();
        }
    });
}

function setupAccountActions() {
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener("click", confirmLogout);
    }

    if (elements.exportDataBtn) {
        elements.exportDataBtn.addEventListener("click", exportUserData);
    }

    if (elements.deleteAccountBtn) {
        elements.deleteAccountBtn.addEventListener("click", () => {
            openConfirmModal({
                title: t("deleteAccountTitle", "Delete account?"),
                message: t("deleteAccountConfirm", "Are you sure you want to delete your account? This action cannot be undone."),
                confirmText: t("deleteAccount", "Delete account"),
                type: "danger",
                onConfirm: () => {
                    console.log(t("deleteAccountDemo", "Demo only: account deletion will be connected to a backend later."));
                }
            });
        });
    }
}

/* Footer */
function setupMiniFooter() {
    if (!elements.miniFooter || !elements.miniFooterToggle) return;

    elements.miniFooterToggle.addEventListener("click", () => {
        elements.miniFooter.classList.toggle("active");
    });

    document.addEventListener("click", (event) => {
        if (!elements.miniFooter.contains(event.target)) {
            elements.miniFooter.classList.remove("active");
        }
    });
}

/* ----------------------------- Intro / Render / Init ----------------------------- */
async function apiRequest(url, options = {}) {
    const headers = {
        ...(options.headers || {})
    };

    if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        credentials: "include",
        ...options,
        headers
    });

    const rawResponse = await response.text();

    let result;

    try {
        result = rawResponse ? JSON.parse(rawResponse) : {};
    } catch (error) {
        console.error("Server returned non-JSON response:");
        console.error(rawResponse);
        throw new Error(`Server returned non-JSON. Status: ${response.status}`);
    }

    if (!response.ok) {
        throw new Error(result.message || "Something went wrong.");
    }

    return result;
}


async function loadApplications() {
    if (!currentUser || !currentUser.id) return;

    try {
        const result = await apiRequest(`/api/users/${currentUser.id}/applications`);

        applications = result.applications || [];
        renderAll();

    } catch (error) {
        console.error("Could not load applications:", error);
    }
}

async function createApplication(applicationData) {
    const result = await apiRequest(`/api/users/${currentUser.id}/applications`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(applicationData)
    });

    applications.unshift(result.application);
    renderAll();
}

async function patchApplication(id, updates) {
    const result = await apiRequest(`/api/users/${currentUser.id}/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates)
    });

    applications = applications.map((application) => {
        if (application.id === id) {
            return result.application;
        }

        return application;
    });

    renderAll();

    return result;
}

function setApplicationEditMode(isEditing) {
    if (!elements.applicationEditForm) return;

    elements.applicationEditForm.hidden = !isEditing;

    if (elements.applicationDetailEditBtn) {
        elements.applicationDetailEditBtn.disabled = isEditing;
    }
}

function fillApplicationEditForm(application) {
    if (!application) return;

    if (elements.editApplicationCompany) {
        elements.editApplicationCompany.value = application.company || "";
    }

    if (elements.editApplicationRole) {
        elements.editApplicationRole.value = application.role || "";
    }

    if (elements.editApplicationLocation) {
        elements.editApplicationLocation.value = application.location || "";
    }

    if (elements.editApplicationDate) {
        elements.editApplicationDate.value = application.date || "";
    }

    if (elements.editApplicationStatus) {
        elements.editApplicationStatus.value = application.status || "notApplied";
    }

    if (elements.editApplicationNotes) {
        elements.editApplicationNotes.value = application.notes || "";
    }
}

function openApplicationEditMode() {
    const applicationId = elements.applicationDetailOverlay?.dataset.applicationId;

    if (!applicationId) return;

    const application = getApplicationById(applicationId);

    if (!application) return;

    fillApplicationEditForm(application);
    setApplicationEditMode(true);
}

async function handleApplicationEditSubmit(event) {
    event.preventDefault();

    const applicationId = elements.applicationDetailOverlay?.dataset.applicationId;

    if (!applicationId) return;

    const updates = {
        company: elements.editApplicationCompany.value.trim(),
        role: elements.editApplicationRole.value.trim(),
        location: elements.editApplicationLocation.value.trim(),
        date: elements.editApplicationDate.value,
        status: elements.editApplicationStatus.value,
        notes: elements.editApplicationNotes.value.trim()
    };

    if (!updates.company || !updates.role || !updates.date || !updates.status) {
        showToast({
            type: "error",
            title: t("error", "Error"),
            message: t("applicationRequiredFields", "Company, role, date and status are required.")
        });

        return;
    }

    const submitButton = elements.applicationEditForm?.querySelector("button[type='submit']");
    const submitIcon = submitButton?.querySelector("i");
    const submitText = submitButton?.querySelector("span");

    try {
        if (submitButton) submitButton.disabled = true;
        if (submitIcon) submitIcon.className = "fa-solid fa-spinner fa-spin";
        if (submitText) submitText.textContent = t("saving", "Saving...");

        await patchApplication(applicationId, updates);

        setApplicationEditMode(false);
        openApplicationDetailModal(applicationId);

        showToast({
            type: "success",
            title: t("success", "Success"),
            message: t("applicationUpdated", "Application updated successfully.")
        });

    } catch (error) {
        showToast({
            type: "error",
            title: t("error", "Error"),
            message: error.message
        });

    } finally {
        if (submitButton) submitButton.disabled = false;
        if (submitIcon) submitIcon.className = "fa-solid fa-floppy-disk";
        if (submitText) submitText.textContent = t("saveChanges", "Save changes");
    }
}


async function removeApplication(applicationId) {
    await apiRequest(`/api/users/${currentUser.id}/applications/${applicationId}`, {
        method: "DELETE"
    });

    applications = applications.filter((application) => {
        return application.id !== applicationId;
    });

    renderAll();
}

async function savePublicProfile() {
    const skills = elements.profileSkillsInput.value
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

    try {
        const result = await apiRequest(`/api/users/${currentUser.id}/public-profile`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: elements.profileUsernameInput.value,
                title: elements.profileTitleInput.value,
                bio: elements.profileBioInput.value,
                skills,
                location: elements.profileLocationInput.value,
                githubUrl: elements.profileGithubInput.value,
                portfolioUrl: elements.profilePortfolioInput.value,
                linkedinUrl: elements.profileLinkedinInput.value,
                contactEmail: elements.profileContactEmailInput.value,
                openToWork: elements.profileOpenToWorkInput.checked,
                projects: publicProfileProjects,
                profileVisibility: elements.profileVisibilitySelect.value
            })
        });

        saveCurrentUser(result.user);
        showToast({
            type: "success",
            title: t("saved", "Saved"),
            message: translations.notifPublicProfileSavedTitle
        });

    } catch (error) {
        showToast({
            type: "error",
            title: t("error", "Error"),
            message: error.message
        });
    }
}

function startIntro() {
    const { introOverlay } = elements;

    if (!introOverlay) {
        document.body.classList.remove("intro-playing");
        document.body.classList.add("app-loaded");
        return;
    }

    setTimeout(() => {
        document.body.classList.remove("intro-playing");
        document.body.classList.add("app-loaded");
        introOverlay.classList.add("hide");
    }, 2300);

    setTimeout(() => {
        introOverlay.remove();
    }, 3100);
}

function renderAll() {
    renderApplications();
    renderDashboard();
}

function setupEventListeners() {
    setupMainTabs();
    setupSettingsTabs();
    setupApplications();
    setupApplicationDetailModal();
    setupDashboard();
    setupProfileEdit();
    setupPublicProfile();
    setupNotifications();
    setupConfirmModal();
    setupAccountActions();
    setupApplicationFormToggle();
    setupMiniFooter();

    elements.langSelects.forEach((select) => {
        select.addEventListener("change", () => loadLanguage(select.value));
    });

    if (elements.themeToggle) {
        elements.themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark");

            const isDark = document.body.classList.contains("dark");
            localStorage.setItem("theme", isDark ? "dark" : "light");

            updateThemeButton();
        });
    }

    if (elements.saveSettingsBtn) {
        elements.saveSettingsBtn.addEventListener("click", saveSettings);
    }

    if (elements.dateFormatSelect) {
        elements.dateFormatSelect.value = localStorage.getItem("dateFormat") || "yyyy-mm-dd";

        elements.dateFormatSelect.addEventListener("change", () => {
            localStorage.setItem("dateFormat", elements.dateFormatSelect.value);
            renderAll();
        });
    }
}

async function init() {
    setupEventListeners();

    startIntro();
    applySavedTheme();

    await loadLanguage(currentLanguage);
    setSettingsAutoSaveMode();

    const isLoggedIn = await loadCurrentUser();

    if (!isLoggedIn) return;

    await loadApplications();
    await loadNotifications();

    renderAll();
    restartDashboardGraphInterval();
}

init();