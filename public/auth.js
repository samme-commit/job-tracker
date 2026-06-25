const authTabs = document.querySelectorAll(".auth-tab");
const authForms = document.querySelectorAll(".auth-form");
const authMessage = document.getElementById("authMessage");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const registerName = document.getElementById("registerName");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");

const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const passwordToggleButtons = document.querySelectorAll("[data-toggle-password]");
const passwordStrengthText = document.getElementById("passwordStrengthText");
const passwordStrengthDot = document.getElementById("passwordStrengthDot");

const forgotPasswordModal = document.getElementById("forgotPasswordModal");
const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const forgotPasswordEmail = document.getElementById("forgotPasswordEmail");
const forgotPasswordMessage = document.getElementById("forgotPasswordMessage");
const forgotPasswordCloseBtn = document.getElementById("forgotPasswordCloseBtn");
const forgotPasswordCancelBtn = document.getElementById("forgotPasswordCancelBtn");

const githubAuthBtn = document.getElementById("githubAuthBtn");
const comingSoonAuthButtons = document.querySelectorAll("[data-coming-soon]");

// Demo Website
const demoLoginBtn = document.getElementById("demoLoginBtn");

function setupDemoLoginButton() {
    if (!demoLoginBtn) return;

    demoLoginBtn.addEventListener("click", async () => {
        try {
            clearAuthMessage();

            demoLoginBtn.disabled = true;
            demoLoginBtn.classList.add("loading");

            const icon = demoLoginBtn.querySelector("i");
            const text = demoLoginBtn.querySelector("span");

            if (icon) icon.className = "fa-solid fa-spinner fa-spin";
            if (text) text.textContent = "Loading demo...";

            const response = await fetch("/api/auth/demo", {
                method: "POST",
                credentials: "include"
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Could not start demo.");
            }

            showAuthSuccess("Demo account loaded.");
            window.location.replace("/");
        } catch (error) {
            showAuthError(error.message);
        } finally {
            demoLoginBtn.disabled = false;
            demoLoginBtn.classList.remove("loading");

            const icon = demoLoginBtn.querySelector("i");
            const text = demoLoginBtn.querySelector("span");

            if (icon) icon.className = "fa-solid fa-wand-magic-sparkles";
            if (text) text.textContent = "Try demo account";
        }
    });
}

// Demo Website

async function redirectIfAuthenticated() {
    try {
        const response = await fetch("/api/auth/me", {
            credentials: "include"
        });

        if (response.ok) {
            window.location.replace("/");
        }
    } catch (error) {
        console.error("Auth check failed:", error);
    }
}

function setupSocialAuthButtons() {
    if (githubAuthBtn) {
        githubAuthBtn.addEventListener("click", (event) => {
            event.preventDefault();

            clearAuthMessage();

            const text = githubAuthBtn.querySelector("[data-social-auth-text]");
            const arrow = githubAuthBtn.querySelector(".social-auth-arrow");

            githubAuthBtn.classList.add("loading");

            if (text) {
                text.textContent = "Redirecting to GitHub...";
            }

            if (arrow) {
                arrow.className = "fa-solid fa-spinner fa-spin social-auth-arrow";
            }

            setTimeout(() => {
                window.location.href = githubAuthBtn.href;
            }, 250);
        });
    }

    comingSoonAuthButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const provider = button.dataset.comingSoon || "This provider";

            showAuthError(`${provider} login is coming soon.`);
        });
    });
}

function setActiveAuthTab(tabName) {
    authTabs.forEach((tab) => {
        const isActive = tab.dataset.authTab === tabName;

        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
    });

    authForms.forEach((form) => {
        const isActive = form.id === `${tabName}Form`;

        form.classList.toggle("active", isActive);
        form.hidden = !isActive;
    });

    clearAuthMessage();

    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabName);
    window.history.replaceState({}, "", url);
}

function setupAuthTabs() {
    authTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            setActiveAuthTab(tab.dataset.authTab);
        });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const requestedTab = urlParams.get("tab");

    if (requestedTab === "register") {
        setActiveAuthTab("register");
    } else {
        setActiveAuthTab("login");
    }
}

function showAuthError(message) {
    authMessage.classList.remove("success");
    authMessage.textContent = message || "Something went wrong.";
}

function showAuthSuccess(message) {
    authMessage.classList.add("success");
    authMessage.textContent = message || "Success.";
}

function clearAuthMessage() {
    authMessage.classList.remove("success");
    authMessage.textContent = "";
}

async function authRequest(url, data) {
    const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const rawResponse = await response.text();

    let result = {};

    try {
        result = rawResponse ? JSON.parse(rawResponse) : {};
    } catch (error) {
        throw new Error("Server returned an invalid response.");
    }

    if (!response.ok) {
        throw new Error(result.message || "Something went wrong.");
    }

    return result;
}

function setFormLoading(form, isLoading) {
    const button = form.querySelector(".auth-submit-btn");
    const buttonText = button.querySelector("span");
    const buttonIcon = button.querySelector("i");

    if (!button || !buttonText || !buttonIcon) return;

    if (isLoading) {
        button.dataset.originalText = buttonText.textContent;
        button.dataset.originalIcon = buttonIcon.className;

        button.disabled = true;
        buttonText.textContent = "Please wait...";
        buttonIcon.className = "fa-solid fa-spinner fa-spin";
    } else {
        button.disabled = false;
        buttonText.textContent = button.dataset.originalText || buttonText.textContent;
        buttonIcon.className = button.dataset.originalIcon || buttonIcon.className;
    }
}

function setupPasswordToggles() {
    passwordToggleButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const inputId = button.dataset.togglePassword;
            const input = document.getElementById(inputId);
            const icon = button.querySelector("i");

            if (!input || !icon) return;

            const shouldShowPassword = input.type === "password";

            input.type = shouldShowPassword ? "text" : "password";

            icon.className = shouldShowPassword
                ? "fa-regular fa-eye-slash"
                : "fa-regular fa-eye";

            button.setAttribute(
                "aria-label",
                shouldShowPassword ? "Hide password" : "Show password"
            );
        });
    });
}

function updatePasswordStrength() {
    if (!registerPassword || !passwordStrengthText || !passwordStrengthDot) return;

    const password = registerPassword.value;
    const hint = passwordStrengthText.closest(".password-hint");

    if (!hint) return;

    hint.classList.remove("weak", "okay", "strong");

    if (!password) {
        passwordStrengthText.textContent = "Use at least 6 characters.";
        return;
    }

    let score = 0;

    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) {
        hint.classList.add("weak");
        passwordStrengthText.textContent = "Weak password.";
        return;
    }

    if (score <= 3) {
        hint.classList.add("okay");
        passwordStrengthText.textContent = "Okay password.";
        return;
    }

    hint.classList.add("strong");
    passwordStrengthText.textContent = "Strong password.";
}

function validateLoginForm() {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
        throw new Error("Email and password are required.");
    }

    return {
        email,
        password
    };
}

function validateRegisterForm() {
    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value;

    if (!name || !email || !password) {
        throw new Error("Name, email and password are required.");
    }

    if (name.length < 2) {
        throw new Error("Display name must be at least 2 characters.");
    }

    if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
    }

    return {
        name,
        email,
        password
    };
}

function setupLoginForm() {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
            clearAuthMessage();
            setFormLoading(loginForm, true);

            const data = validateLoginForm();

            await authRequest("/api/auth/login", data);

            showAuthSuccess("Logged in successfully.");
            window.location.replace("/");
        } catch (error) {
            showAuthError(error.message);
        } finally {
            setFormLoading(loginForm, false);
        }
    });
}

function setupRegisterForm() {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
            clearAuthMessage();
            setFormLoading(registerForm, true);

            const data = validateRegisterForm();

            await authRequest("/api/auth/register", data);

            showAuthSuccess("Account created successfully.");
            window.location.replace("/");
        } catch (error) {
            showAuthError(error.message);
        } finally {
            setFormLoading(registerForm, false);
        }
    });
}

function openForgotPasswordModal() {
    if (!forgotPasswordModal) return;

    forgotPasswordModal.classList.add("active");
    forgotPasswordModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    clearForgotPasswordMessage();

    const emailFromLogin = loginEmail?.value.trim();

    if (emailFromLogin && forgotPasswordEmail) {
        forgotPasswordEmail.value = emailFromLogin;
    }

    setTimeout(() => {
        forgotPasswordEmail?.focus();
    }, 120);
}

function closeForgotPasswordModal() {
    if (!forgotPasswordModal) return;

    forgotPasswordModal.classList.remove("active");
    forgotPasswordModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    clearForgotPasswordMessage();

    if (forgotPasswordForm) {
        forgotPasswordForm.reset();
    }
}

function showForgotPasswordError(message) {
    if (!forgotPasswordMessage) return;

    forgotPasswordMessage.classList.remove("success");
    forgotPasswordMessage.textContent = message || "Something went wrong.";
}

function showForgotPasswordSuccess(message) {
    if (!forgotPasswordMessage) return;

    forgotPasswordMessage.classList.add("success");
    forgotPasswordMessage.textContent = message || "Success.";
}

function clearForgotPasswordMessage() {
    if (!forgotPasswordMessage) return;

    forgotPasswordMessage.classList.remove("success");
    forgotPasswordMessage.textContent = "";
}

function setupForgotPasswordLink() {
    if (!forgotPasswordLink) return;

    forgotPasswordLink.addEventListener("click", (event) => {
        event.preventDefault();
        openForgotPasswordModal();
    });
}

function setupForgotPasswordModal() {
    if (!forgotPasswordModal) return;

    forgotPasswordCloseBtn?.addEventListener("click", closeForgotPasswordModal);
    forgotPasswordCancelBtn?.addEventListener("click", closeForgotPasswordModal);

    forgotPasswordModal.addEventListener("click", (event) => {
        if (event.target === forgotPasswordModal) {
            closeForgotPasswordModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && forgotPasswordModal.classList.contains("active")) {
            closeForgotPasswordModal();
        }
    });

    forgotPasswordForm?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = forgotPasswordEmail.value.trim();

        if (!email) {
            showForgotPasswordError("Email address is required.");
            return;
        }

        try {
            setFormLoading(forgotPasswordForm, true);
            clearForgotPasswordMessage();

            /*
                Later, when backend reset exists, this can become:

                await authRequest("/api/auth/forgot-password", {
                    email
                });
            */

            await new Promise((resolve) => setTimeout(resolve, 700));

            showForgotPasswordSuccess(
                "Password reset is not available yet, but the reset flow UI is ready."
            );
        } catch (error) {
            showForgotPasswordError(error.message);
        } finally {
            setFormLoading(forgotPasswordForm, false);
        }
    });
}

function showOAuthMessageFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    const message = urlParams.get("message");

    const errorMessages = {
        github: "GitHub login was cancelled or failed. Please try again.",
        github_login_failed: "GitHub login was cancelled or failed. Please try again.",
        oauth_failed: "Social login failed. Please try again."
    };

    if (error) {
        showAuthError(errorMessages[error] || decodeURIComponent(error));
        return;
    }

    if (message) {
        showAuthSuccess(decodeURIComponent(message));
    }
}

function setupInputPolish() {
    const inputs = document.querySelectorAll(".input-shell input");

    inputs.forEach((input) => {
        input.addEventListener("input", () => {
            if (authMessage.textContent) {
                clearAuthMessage();
            }
        });
    });

    if (registerPassword) {
        registerPassword.addEventListener("input", updatePasswordStrength);
    }
}

function initAuthPage() {
    redirectIfAuthenticated();
    setupAuthTabs();
    setupPasswordToggles();
    setupLoginForm();
    setupRegisterForm();
    setupDemoLoginButton();
    setupForgotPasswordLink();
    setupForgotPasswordModal();
    setupSocialAuthButtons();
    setupInputPolish();
    showOAuthMessageFromUrl();
    updatePasswordStrength();
}

initAuthPage();