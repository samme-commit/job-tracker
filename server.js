require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs/promises");
const fsSync = require("fs");
const { randomUUID } = require("crypto");
const multer = require("multer");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const { rateLimit } = require("express-rate-limit");
const { z } = require("zod");
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;

const app = express();
const PORT = process.env.PORT || 3000;

const DEMO_MODE = process.env.DEMO_MODE === "true";
const DEMO_EMAIL = (process.env.DEMO_EMAIL || "demo@jobtracker.dev").toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "demo123";
const DEMO_USER_ID = "demo-user-v1";

/* ----------------------------- Production helpers ----------------------------- */

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

if (!process.env.SESSION_SECRET) {
    console.warn("WARNING: SESSION_SECRET is missing. Add a strong SESSION_SECRET to your .env file.");
}

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET || !process.env.GITHUB_CALLBACK_URL) {
    console.warn("WARNING: GitHub OAuth env variables are missing or incomplete.");
}

/* ----------------------------- Paths / folders ----------------------------- */

const dataDir = path.join(__dirname, "data");
const usersPath = path.join(dataDir, "users.json");
const applicationsPath = path.join(dataDir, "applications.json");
const notificationsPath = path.join(dataDir, "notifications.json");
const sessionsPath = path.join(dataDir, "sessions");

const uploadsDir = path.join(__dirname, "public", "uploads");
const profileImagesDir = path.join(uploadsDir, "profile-images");

function ensureDir(dirPath) {
    if (!fsSync.existsSync(dirPath)) {
        fsSync.mkdirSync(dirPath, { recursive: true });
    }
}

function ensureJsonFile(filePath) {
    if (!fsSync.existsSync(filePath)) {
        fsSync.writeFileSync(filePath, "[]", "utf8");
    }
}

ensureDir(dataDir);
ensureDir(sessionsPath);
ensureDir(profileImagesDir);

ensureJsonFile(usersPath);
ensureJsonFile(applicationsPath);
ensureJsonFile(notificationsPath);

/* ----------------------------- Schemas ----------------------------- */

const registerSchema = z.object({
    name: z.string().trim().min(2).max(50),
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(6).max(100)
});

const loginSchema = z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(1).max(100)
});

const displayNameSchema = z.object({
    name: z.string().trim().min(2).max(50)
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1).max(100),
    newPassword: z.string().min(6).max(100)
});

const usernameSchema = z.preprocess((value) => {
    if (typeof value !== "string") return value;

    const cleaned = value.trim().toLowerCase();
    return cleaned === "" ? null : cleaned;
}, z.string().regex(/^[a-z0-9_-]{3,20}$/).nullable().optional().default(null));

const optionalText = (maxLength) => {
    return z.string().trim().max(maxLength).optional().default("");
};

const updateText = (maxLength) => {
    return z.string().trim().max(maxLength).optional();
};

const optionalUrl = z.string().trim().max(300).optional().default("");

const optionalContactEmail = z
    .string()
    .trim()
    .max(120)
    .optional()
    .default("")
    .refine((value) => {
        return value === "" || z.string().email().safeParse(value).success;
    }, {
        message: "Invalid contact email."
    });

const profileProjectSchema = z.object({
    name: optionalText(60),
    description: optionalText(180),
    techStack: z.array(z.string().trim().max(30)).max(8).optional().default([]),
    githubUrl: optionalUrl,
    demoUrl: optionalUrl
});

const publicProfileSchema = z.object({
    username: usernameSchema,
    title: optionalText(80),
    bio: optionalText(280),
    skills: z.array(z.string().trim().max(30)).max(12).optional().default([]),
    githubUrl: optionalUrl,
    portfolioUrl: optionalUrl,
    linkedinUrl: optionalUrl,
    contactEmail: optionalContactEmail,
    location: optionalText(80),
    openToWork: z.boolean().optional().default(true),
    projects: z.array(profileProjectSchema).max(4).optional().default([]),
    profileVisibility: z.enum(["private", "public"]).default("private")
});

const applicationStatusSchema = z.enum([
    "notApplied",
    "applied",
    "interview",
    "offer",
    "rejected"
]);

const createApplicationSchema = z.object({
    company: z.string().trim().min(1).max(80),
    role: z.string().trim().min(1).max(80),
    location: optionalText(80),
    date: z.string().trim().min(1).max(40),
    status: applicationStatusSchema,
    notes: optionalText(1000)
});

const updateApplicationSchema = z.object({
    company: z.string().trim().min(1).max(80).optional(),
    role: z.string().trim().min(1).max(80).optional(),
    location: updateText(80),
    date: z.string().trim().min(1).max(40).optional(),
    status: applicationStatusSchema.optional(),
    notes: updateText(1000),
    archived: z.boolean().optional(),
    archivedAt: z.string().nullable().optional()
}).strict();

/* ----------------------------- Middleware ----------------------------- */

app.use(helmet({
    // Disabled for now because the frontend uses external CDNs like FontAwesome.
    // Later, replace this with a real CSP allowlist.
    contentSecurityPolicy: false
}));

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
}));

app.use(express.json({ limit: "1mb" }));

app.use(session({
    store: new FileStore({
        path: sessionsPath,
        retries: 0
    }),
    secret: process.env.SESSION_SECRET || "dev-secret-change-this-later",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

app.use(passport.initialize());

app.use("/uploads", express.static(uploadsDir));
app.use(express.static(path.join(__dirname, "public")));

/* ----------------------------- Rate limits ----------------------------- */

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many auth attempts. Please try again in 15 minutes."
    }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 8,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
        message: "Too many failed login attempts. Please try again in 15 minutes."
    }
});

const passwordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many password attempts. Please try again in 15 minutes."
    }
});

/* ----------------------------- Uploads ----------------------------- */

const profileImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profileImagesDir);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const filename = `${req.params.id}-${Date.now()}${extension}`;

        cb(null, filename);
    }
});

const profileImageUpload = multer({
    storage: profileImageStorage,

    limits: {
        fileSize: 2 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Only JPG, PNG and WEBP images are allowed."));
        }

        cb(null, true);
    }
});

/* ----------------------------- Utilities ----------------------------- */

const asyncHandler = (handler) => {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
};

async function readJSON(filePath) {
    try {
        const data = await fs.readFile(filePath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        if (error.code === "ENOENT") {
            return [];
        }

        console.error(`Could not read JSON file: ${filePath}`, error);
        return [];
    }
}

async function writeJSON(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 4));
}

// Demo Website

function getDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
}

async function seedDemoAccount() {
    if (!DEMO_MODE) return null;

    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    const users = await readJSON(usersPath);
    const existingDemoIndex = users.findIndex((user) => {
        return user.email?.toLowerCase() === DEMO_EMAIL || user.id === DEMO_USER_ID;
    });

    const existingDemoUser = existingDemoIndex !== -1 ? users[existingDemoIndex] : null;

    const demoUser = {
        ...(existingDemoUser || {}),
        id: DEMO_USER_ID,
        name: "Demo User",
        email: DEMO_EMAIL,
        passwordHash,
        profileImg: null,
        username: "demo-user",
        title: "Frontend Developer",
        bio: "This is a demo profile for Job Tracker. Explore applications, dashboard stats, notifications and public profile features.",
        skills: ["JavaScript", "Node.js", "Express", "React", "CSS", "GitHub"],
        githubUrl: "https://github.com/samme-commit",
        portfolioUrl: "https://samme-commit-portfolio.vercel.app/",
        linkedinUrl: "",
        contactEmail: DEMO_EMAIL,
        location: "Sweden",
        openToWork: true,
        projects: [
            {
                name: "PulsePay",
                description: "A Stripe-inspired checkout demo with polished payment UI and animated flows.",
                techStack: ["React", "TypeScript", "CSS"],
                githubUrl: "https://github.com/samme-commit",
                demoUrl: ""
            },
            {
                name: "Job Tracker",
                description: "A full-stack job application tracker with authentication, dashboard and profiles.",
                techStack: ["Node.js", "Express", "JavaScript"],
                githubUrl: "https://github.com/samme-commit/job-tracker",
                demoUrl: ""
            }
        ],
        profileVisibility: "public",
        providers: {},
        lastNameChangeAt: null,
        createdAt: existingDemoUser?.createdAt || now
    };

    if (existingDemoIndex !== -1) {
        users[existingDemoIndex] = demoUser;
    } else {
        users.push(demoUser);
    }

    await writeJSON(usersPath, users);

    const demoApplications = [
        {
            id: "demo-app-1",
            userId: DEMO_USER_ID,
            company: "Spotify",
            role: "Frontend Developer Intern",
            location: "Stockholm, Sweden",
            date: getDaysAgo(2),
            status: "interview",
            notes: "First interview booked. Prepare React, accessibility and portfolio walkthrough.",
            archived: false,
            archivedAt: null,
            createdAt: now,
            updatedAt: now
        },
        {
            id: "demo-app-2",
            userId: DEMO_USER_ID,
            company: "Klarna",
            role: "Junior Web Developer",
            location: "Remote",
            date: getDaysAgo(5),
            status: "applied",
            notes: "Applied with portfolio, PulsePay and Job Tracker highlighted.",
            archived: false,
            archivedAt: null,
            createdAt: now,
            updatedAt: now
        },
        {
            id: "demo-app-3",
            userId: DEMO_USER_ID,
            company: "Northvolt",
            role: "Frontend Engineer",
            location: "Skellefteå, Sweden",
            date: getDaysAgo(9),
            status: "notApplied",
            notes: "Need to adjust CV and write a shorter cover letter.",
            archived: false,
            archivedAt: null,
            createdAt: now,
            updatedAt: now
        },
        {
            id: "demo-app-4",
            userId: DEMO_USER_ID,
            company: "GitHub",
            role: "Fullstack Intern",
            location: "Remote",
            date: getDaysAgo(14),
            status: "offer",
            notes: "Demo offer example used for dashboard statistics.",
            archived: false,
            archivedAt: null,
            createdAt: now,
            updatedAt: now
        },
        {
            id: "demo-app-5",
            userId: DEMO_USER_ID,
            company: "Vercel",
            role: "Frontend Developer",
            location: "Remote",
            date: getDaysAgo(20),
            status: "rejected",
            notes: "Rejected after screening. Keep as example history item.",
            archived: false,
            archivedAt: null,
            createdAt: now,
            updatedAt: now
        },
        {
            id: "demo-app-6",
            userId: DEMO_USER_ID,
            company: "Linear",
            role: "Product UI Developer",
            location: "Remote",
            date: getDaysAgo(28),
            status: "applied",
            notes: "Strong fit because of polished SaaS-style frontend projects.",
            archived: true,
            archivedAt: now,
            createdAt: now,
            updatedAt: now
        }
    ];

    const applications = await readJSON(applicationsPath);
    const applicationsWithoutDemo = applications.filter((application) => {
        return application.userId !== DEMO_USER_ID;
    });

    await writeJSON(applicationsPath, [...demoApplications, ...applicationsWithoutDemo]);

    const demoNotifications = [
        {
            id: "demo-notification-1",
            userId: DEMO_USER_ID,
            type: "application",
            title: "Interview reminder",
            message: "Spotify interview is coming up. Review your portfolio and React projects.",
            meta: {},
            read: false,
            createdAt: now
        },
        {
            id: "demo-notification-2",
            userId: DEMO_USER_ID,
            type: "system",
            title: "Welcome to Job Tracker",
            message: "This demo account includes preloaded applications, stats and profile data.",
            meta: {},
            read: false,
            createdAt: now
        },
        {
            id: "demo-notification-3",
            userId: DEMO_USER_ID,
            type: "profile_update",
            title: "Public profile ready",
            message: "The demo public profile is visible and ready to preview.",
            meta: {},
            read: true,
            createdAt: now
        }
    ];

    const notifications = await readJSON(notificationsPath);
    const notificationsWithoutDemo = notifications.filter((notification) => {
        return notification.userId !== DEMO_USER_ID;
    });

    await writeJSON(notificationsPath, [...demoNotifications, ...notificationsWithoutDemo]);

    return demoUser;
}

// Demo Website

function validateBody(schema, req, res, message = "Invalid input.") {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
        return {
            ok: false,
            response: res.status(400).json({ message })
        };
    }

    return {
        ok: true,
        data: parsed.data
    };
}

function saveSessionAndRespond(req, res, statusCode, payload) {
    req.session.save((error) => {
        if (error) {
            console.error(error);
            return res.status(500).json({
                message: "Could not save session."
            });
        }

        res.status(statusCode).json(payload);
    });
}

async function createNotification(userId, data) {
    const notifications = await readJSON(notificationsPath);

    const newNotification = {
        id: randomUUID(),
        userId,
        type: data.type || "system",

        titleKey: data.titleKey || null,
        messageKey: data.messageKey || null,

        title: data.title || "Notification",
        message: data.message || "",

        meta: data.meta || {},
        read: false,
        createdAt: new Date().toISOString()
    };

    notifications.unshift(newNotification);

    await writeJSON(notificationsPath, notifications);

    return newNotification;
}

async function deleteLocalProfileImage(imagePath) {
    if (!imagePath || typeof imagePath !== "string") return;

    const prefix = "/uploads/profile-images/";

    if (!imagePath.startsWith(prefix)) return;

    const filename = path.basename(imagePath);
    const filePath = path.join(profileImagesDir, filename);

    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("Could not delete old profile image:", error);
        }
    }
}

/* ----------------------------- Auth helpers ----------------------------- */

function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            message: "Not authenticated."
        });
    }

    next();
}

function requireOwnUser(req, res, next) {
    const userId = req.params.id || req.params.userId;

    if (userId !== req.session.userId) {
        return res.status(403).json({
            message: "You are not allowed to access this resource."
        });
    }

    next();
}

function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImg: user.profileImg || null,

        username: user.username || null,
        title: user.title || "",
        bio: user.bio || "",
        skills: user.skills || [],
        githubUrl: user.githubUrl || "",
        portfolioUrl: user.portfolioUrl || "",
        linkedinUrl: user.linkedinUrl || "",
        contactEmail: user.contactEmail || "",
        location: user.location || "",
        openToWork: user.openToWork ?? true,
        projects: user.projects || [],
        profileVisibility: user.profileVisibility || "private",

        providers: user.providers || {},

        lastNameChangeAt: user.lastNameChangeAt || null,
        createdAt: user.createdAt
    };
}

/* ----------------------------- GitHub OAuth ----------------------------- */

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const users = await readJSON(usersPath);

        const githubId = profile.id;
        const githubUsername = profile.username || profile.displayName || "github-user";
        const displayName = profile.displayName || githubUsername;

        const email = profile.emails && profile.emails[0]
            ? profile.emails[0].value.toLowerCase()
            : `${githubUsername}@github.local`.toLowerCase();

        let user = users.find((existingUser) => {
            return existingUser.providers?.github?.id === githubId;
        });

        if (!user) {
            user = users.find((existingUser) => {
                return existingUser.email?.toLowerCase() === email;
            });

            if (user) {
                user.providers = {
                    ...(user.providers || {}),
                    github: {
                        id: githubId,
                        username: githubUsername
                    }
                };
            }
        }

        if (!user) {
            user = {
                id: randomUUID(),
                name: displayName,
                email,
                passwordHash: null,
                profileImg: profile.photos && profile.photos[0]
                    ? profile.photos[0].value
                    : null,

                username: null,
                title: "",
                bio: "",
                skills: [],
                githubUrl: `https://github.com/${githubUsername}`,
                portfolioUrl: "",
                linkedinUrl: "",
                contactEmail: "",
                location: "",
                openToWork: true,
                projects: [],
                profileVisibility: "private",

                providers: {
                    github: {
                        id: githubId,
                        username: githubUsername
                    }
                },

                lastNameChangeAt: null,
                createdAt: new Date().toISOString()
            };

            users.push(user);
        }

        await writeJSON(usersPath, users);

        return done(null, publicUser(user));

    } catch (error) {
        return done(error, null);
    }
}));

/* ----------------------------- Health ----------------------------- */

app.get("/api/health", (req, res) => {
    res.json({
        message: "Server is running"
    });
});

/* ----------------------------- Auth routes ----------------------------- */

app.post("/api/auth/register", authLimiter, asyncHandler(async (req, res) => {
    const validation = validateBody(registerSchema, req, res, "Invalid input.");

    if (!validation.ok) return validation.response;

    const { name, email, password } = validation.data;

    const users = await readJSON(usersPath);

    const existingUser = users.find((user) => {
        return user.email.toLowerCase() === email;
    });

    if (existingUser) {
        return res.status(409).json({
            message: "An account with this email already exists."
        });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = {
        id: randomUUID(),
        name,
        email,
        passwordHash,
        profileImg: null,

        username: null,
        title: "",
        bio: "",
        skills: [],
        githubUrl: "",
        portfolioUrl: "",
        linkedinUrl: "",
        contactEmail: "",
        location: "",
        openToWork: true,
        projects: [],
        profileVisibility: "private",

        providers: {},

        lastNameChangeAt: null,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeJSON(usersPath, users);

    req.session.userId = newUser.id;

    return saveSessionAndRespond(req, res, 201, {
        message: "Account created successfully.",
        user: publicUser(newUser)
    });
}));

app.post("/api/auth/login", loginLimiter, asyncHandler(async (req, res) => {
    const validation = validateBody(loginSchema, req, res, "Invalid email or password.");

    if (!validation.ok) return validation.response;

    const { email, password } = validation.data;

    const users = await readJSON(usersPath);

    const user = users.find((existingUser) => {
        return existingUser.email.toLowerCase() === email;
    });

    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password."
        });
    }

    if (!user.passwordHash) {
        return res.status(400).json({
            message: "This account uses social login and does not have a password yet."
        });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
        return res.status(401).json({
            message: "Invalid email or password."
        });
    }

    req.session.userId = user.id;

    return saveSessionAndRespond(req, res, 200, {
        message: "Logged in successfully.",
        user: publicUser(user)
    });
}));


// Demo Website
app.post("/api/auth/demo", authLimiter, asyncHandler(async (req, res) => {
    if (!DEMO_MODE) {
        return res.status(404).json({ message: "Demo mode is not enabled." });
    }

    const demoUser = await seedDemoAccount();

    req.session.userId = demoUser.id;

    return saveSessionAndRespond(req, res, 200, {
        message: "Logged in to demo account.",
        user: publicUser(demoUser)
    });
}));
// Demo Website


app.get("/api/auth/me", requireAuth, asyncHandler(async (req, res) => {
    const users = await readJSON(usersPath);

    const user = users.find((existingUser) => {
        return existingUser.id === req.session.userId;
    });

    if (!user) {
        return res.status(404).json({
            message: "User not found."
        });
    }

    res.json({
        user: publicUser(user)
    });
}));

app.post("/api/auth/logout", requireAuth, (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                message: "Could not log out."
            });
        }

        res.clearCookie("connect.sid", {
            path: "/"
        });

        res.json({
            message: "Logged out successfully."
        });
    });
});

app.get("/api/auth/github", authLimiter, passport.authenticate("github", {
    scope: ["user:email"]
}));

app.get("/api/auth/github/callback", passport.authenticate("github", {
    session: false,
    failureRedirect: "/auth.html?error=github_login_failed"
}), (req, res) => {
    req.session.userId = req.user.id;

    req.session.save((error) => {
        if (error) {
            console.error(error);
            return res.redirect("/auth.html?error=github_login_failed");
        }

        res.redirect("/");
    });
});

/* ----------------------------- User routes ----------------------------- */

app.get("/api/users/:id", requireAuth, requireOwnUser, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const users = await readJSON(usersPath);
    const user = users.find((existingUser) => {
        return existingUser.id === id;
    });

    if (!user) {
        return res.status(404).json({
            message: "User not found."
        });
    }

    res.json({
        user: publicUser(user)
    });
}));

app.patch("/api/users/:id/display-name", requireAuth, requireOwnUser, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const validation = validateBody(displayNameSchema, req, res, "Display name must be 2-50 characters.");

    if (!validation.ok) return validation.response;

    const { name } = validation.data;

    const users = await readJSON(usersPath);
    const userIndex = users.findIndex((user) => {
        return user.id === id;
    });

    if (userIndex === -1) {
        return res.status(404).json({
            message: "User not found."
        });
    }

    const user = users[userIndex];

    if (user.lastNameChangeAt) {
        const lastChange = new Date(user.lastNameChangeAt);
        const nextAllowedChange = new Date(lastChange);

        nextAllowedChange.setFullYear(nextAllowedChange.getFullYear() + 1);

        if (new Date() < nextAllowedChange) {
            return res.status(403).json({
                message: "You can only change your display name once per year.",
                nextAllowedChange
            });
        }
    }

    users[userIndex] = {
        ...user,
        name,
        lastNameChangeAt: new Date().toISOString()
    };

    await writeJSON(usersPath, users);

    res.json({
        message: "Display name updated successfully.",
        user: publicUser(users[userIndex])
    });
}));

app.patch("/api/users/:id/password", passwordLimiter, requireAuth, requireOwnUser, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const validation = validateBody(
        changePasswordSchema,
        req,
        res,
        "Current password and a valid new password are required."
    );

    if (!validation.ok) return validation.response;

    const { currentPassword, newPassword } = validation.data;

    const users = await readJSON(usersPath);
    const userIndex = users.findIndex((user) => {
        return user.id === id;
    });

    if (userIndex === -1) {
        return res.status(404).json({
            message: "User not found."
        });
    }

    const user = users[userIndex];

    if (!user.passwordHash) {
        return res.status(400).json({
            message: "This account uses social login and does not have a password yet."
        });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!passwordMatches) {
        return res.status(401).json({
            message: "Current password is incorrect."
        });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    users[userIndex] = {
        ...user,
        passwordHash: newPasswordHash
    };

    await writeJSON(usersPath, users);

    res.json({
        message: "Password updated successfully."
    });
}));

app.patch(
    "/api/users/:id/profile-image",
    requireAuth,
    requireOwnUser,
    profileImageUpload.single("profileImg"),
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                message: "No image uploaded."
            });
        }

        const users = await readJSON(usersPath);
        const userIndex = users.findIndex((user) => {
            return user.id === id;
        });

        if (userIndex === -1) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const oldImagePath = users[userIndex].profileImg || null;
        const newImagePath = `/uploads/profile-images/${req.file.filename}`;

        users[userIndex] = {
            ...users[userIndex],
            profileImg: newImagePath
        };

        await writeJSON(usersPath, users);
        await deleteLocalProfileImage(oldImagePath);

        await createNotification(users[userIndex].id, {
            type: "profile_update",
            titleKey: "notifProfilePhotoChangedTitle",
            messageKey: "notifProfilePhotoChangedMessage",
            meta: {
                username: users[userIndex].username,
                profileImg: users[userIndex].profileImg
            }
        });

        res.json({
            message: "Profile image updated successfully.",
            user: publicUser(users[userIndex])
        });
    })
);

app.patch("/api/users/:id/public-profile", requireAuth, requireOwnUser, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const validation = validateBody(publicProfileSchema, req, res, "Invalid public profile input.");

    if (!validation.ok) return validation.response;

    const profileData = validation.data;

    const users = await readJSON(usersPath);
    const userIndex = users.findIndex((user) => {
        return user.id === id;
    });

    if (userIndex === -1) {
        return res.status(404).json({
            message: "User not found."
        });
    }

    const usernameTaken = users.some((user) => {
        return user.id !== id && user.username === profileData.username;
    });

    if (usernameTaken) {
        return res.status(409).json({
            message: "This username is already taken."
        });
    }

    const cleanedSkills = profileData.skills
        .map((skill) => skill.trim())
        .filter(Boolean)
        .slice(0, 12);

    const cleanedProjects = profileData.projects
        .map((project) => {
            return {
                name: project.name.trim(),
                description: project.description.trim(),
                techStack: project.techStack
                    .map((tech) => tech.trim())
                    .filter(Boolean)
                    .slice(0, 8),
                githubUrl: project.githubUrl.trim(),
                demoUrl: project.demoUrl.trim()
            };
        })
        .filter((project) => project.name)
        .slice(0, 4);

    users[userIndex] = {
        ...users[userIndex],
        username: profileData.username,
        title: profileData.title,
        bio: profileData.bio,
        skills: cleanedSkills,
        githubUrl: profileData.githubUrl,
        portfolioUrl: profileData.portfolioUrl,
        linkedinUrl: profileData.linkedinUrl,
        contactEmail: profileData.contactEmail,
        location: profileData.location,
        openToWork: profileData.openToWork,
        projects: cleanedProjects,
        profileVisibility: profileData.profileVisibility
    };

    await writeJSON(usersPath, users);

    res.json({
        message: "Public profile updated successfully.",
        user: publicUser(users[userIndex])
    });
}));

/* ----------------------------- Application routes ----------------------------- */

app.get("/api/users/:userId/applications", requireAuth, requireOwnUser, asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const applications = await readJSON(applicationsPath);

    const userApplications = applications.filter((application) => {
        return application.userId === userId;
    });

    res.json({
        applications: userApplications
    });
}));

app.post("/api/users/:userId/applications", requireAuth, requireOwnUser, asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const validation = validateBody(createApplicationSchema, req, res, "Company, role, date and status are required.");

    if (!validation.ok) return validation.response;

    const { company, role, location, date, status, notes } = validation.data;

    const applications = await readJSON(applicationsPath);

    const newApplication = {
        id: randomUUID(),
        userId,
        company,
        role,
        location,
        date,
        status,
        notes,
        archived: false,
        archivedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    applications.unshift(newApplication);
    await writeJSON(applicationsPath, applications);

    res.status(201).json({
        message: "Application created successfully.",
        application: newApplication
    });
}));

app.patch("/api/users/:userId/applications/:applicationId", requireAuth, requireOwnUser, asyncHandler(async (req, res) => {
    const { userId, applicationId } = req.params;

    const validation = validateBody(updateApplicationSchema, req, res, "Invalid application update.");

    if (!validation.ok) return validation.response;

    const updates = Object.fromEntries(
        Object.entries(validation.data).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            message: "No valid application updates provided."
        });
    }

    const applications = await readJSON(applicationsPath);

    const applicationIndex = applications.findIndex((application) => {
        return application.id === applicationId && application.userId === userId;
    });

    if (applicationIndex === -1) {
        return res.status(404).json({
            message: "Application not found."
        });
    }

    applications[applicationIndex] = {
        ...applications[applicationIndex],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    await writeJSON(applicationsPath, applications);

    res.json({
        message: "Application updated successfully.",
        application: applications[applicationIndex]
    });
}));

app.delete("/api/users/:userId/applications/:applicationId", requireAuth, requireOwnUser, asyncHandler(async (req, res) => {
    const { userId, applicationId } = req.params;

    const applications = await readJSON(applicationsPath);

    const applicationExists = applications.some((application) => {
        return application.id === applicationId && application.userId === userId;
    });

    if (!applicationExists) {
        return res.status(404).json({
            message: "Application not found."
        });
    }

    const updatedApplications = applications.filter((application) => {
        return !(application.id === applicationId && application.userId === userId);
    });

    await writeJSON(applicationsPath, updatedApplications);

    res.json({
        message: "Application deleted successfully."
    });
}));

/* ----------------------------- Public profile routes ----------------------------- */

app.get("/api/public/users/:username", asyncHandler(async (req, res) => {
    const { username } = req.params;

    const users = await readJSON(usersPath);

    const user = users.find((existingUser) => {
        return existingUser.username === username.toLowerCase();
    });

    if (!user) {
        return res.status(404).json({
            message: "Profile not found."
        });
    }

    if (user.profileVisibility !== "public") {
        return res.status(403).json({
            message: "This profile is private."
        });
    }

    createNotification(user.id, {
        type: "profile_view",
        titleKey: "notifProfileViewedTitle",
        messageKey: "notifProfileViewedMessage",
        meta: {
            username: user.username
        }
    }).catch((error) => {
        console.error("Could not create profile view notification:", error);
    });

    res.json({
        profile: {
            name: user.name,
            username: user.username,
            profileImg: user.profileImg || null,

            title: user.title || "",
            bio: user.bio || "",
            skills: user.skills || [],
            githubUrl: user.githubUrl || "",
            portfolioUrl: user.portfolioUrl || "",
            linkedinUrl: user.linkedinUrl || "",
            contactEmail: user.contactEmail || "",
            location: user.location || "",
            openToWork: user.openToWork ?? true,
            projects: user.projects || []
        }
    });
}));

app.get("/u/:username", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "profile.html"));
});

/* ----------------------------- Notification routes ----------------------------- */

app.get("/api/users/:userId/notifications", requireAuth, requireOwnUser, asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const notifications = await readJSON(notificationsPath);

    const userNotifications = notifications
        .filter((notification) => notification.userId === userId)
        .slice(0, 50);

    res.json({
        notifications: userNotifications
    });
}));

app.patch("/api/users/:userId/notifications/:notificationId/read", requireAuth, requireOwnUser, asyncHandler(async (req, res) => {
    const { userId, notificationId } = req.params;

    const notifications = await readJSON(notificationsPath);

    const notificationIndex = notifications.findIndex((notification) => {
        return notification.id === notificationId && notification.userId === userId;
    });

    if (notificationIndex === -1) {
        return res.status(404).json({
            message: "Notification not found."
        });
    }

    notifications[notificationIndex].read = true;

    await writeJSON(notificationsPath, notifications);

    res.json({
        message: "Notification marked as read.",
        notification: notifications[notificationIndex]
    });
}));

app.patch("/api/users/:userId/notifications/read-all", requireAuth, requireOwnUser, asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const notifications = await readJSON(notificationsPath);

    const updatedNotifications = notifications.map((notification) => {
        if (notification.userId === userId) {
            return {
                ...notification,
                read: true
            };
        }

        return notification;
    });

    await writeJSON(notificationsPath, updatedNotifications);

    res.json({
        message: "All notifications marked as read."
    });
}));

app.delete("/api/users/:userId/notifications/:notificationId", requireAuth, requireOwnUser, asyncHandler(async (req, res) => {
    const { userId, notificationId } = req.params;

    const notifications = await readJSON(notificationsPath);

    const notificationExists = notifications.some((notification) => {
        return notification.id === notificationId && notification.userId === userId;
    });

    if (!notificationExists) {
        return res.status(404).json({
            message: "Notification not found."
        });
    }

    const updatedNotifications = notifications.filter((notification) => {
        return !(notification.id === notificationId && notification.userId === userId);
    });

    await writeJSON(notificationsPath, updatedNotifications);

    res.json({
        message: "Notification deleted."
    });
}));

/* ----------------------------- 404 / Error handling ----------------------------- */

app.use("/api", (req, res) => {
    res.status(404).json({
        message: `API route not found: ${req.method} ${req.originalUrl}`
    });
});

app.use((error, req, res, next) => {
    console.error(error);

    if (error instanceof multer.MulterError) {
        return res.status(400).json({
            message: error.message
        });
    }

    if (error.message === "Only JPG, PNG and WEBP images are allowed.") {
        return res.status(400).json({
            message: error.message
        });
    }

    if (error instanceof SyntaxError && "body" in error) {
        return res.status(400).json({
            message: "Invalid JSON body."
        });
    }

    res.status(500).json({
        message: "Something went wrong."
    });
});

/* ----------------------------- Start server ----------------------------- */

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
