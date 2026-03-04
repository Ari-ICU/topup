import express, { Response } from "express";
import path from "path";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import router from "./routes/index.js";
import { globalLimiter, speedLimiter } from "./middleware/rateLimit.middleware.js";
import {
    ipBlocklist,
    blockSuspiciousAgents,
    sanitizeInput,
    requestId,
    largePayloadGuard,
    securityLogger,
} from "./middleware/security.middleware.js";

const app = express();
const isProd = process.env.NODE_ENV === "production";

// ─── 1. Request ID (must be first — tags all subsequent logs) ─────────────────
app.use(requestId);

// ─── 2. Helmet — 15+ security headers in one line ────────────────────────────
//   Replaces our manual header block AND adds many more protections:
//   Content Security Policy, DNS Prefetch Control, X-Download-Options, etc.
app.use(
    helmet({
        contentSecurityPolicy: isProd
            ? {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'", "https:", "data:"],
                    objectSrc: ["'none'"],
                    upgradeInsecureRequests: [],
                },
            }
            : false, // Disable CSP in dev so browser tools work freely
        hsts: isProd
            ? { maxAge: 31536000, includeSubDomains: true, preload: true }
            : false,
        crossOriginResourcePolicy: { policy: "cross-origin" }, // 🖼️ Allow images to be loaded from other origins (port 3000)
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
        frameguard: { action: "deny" },
        noSniff: true,
        xssFilter: true,
        hidePoweredBy: true,
    })
);

// ─── 3. IP Blocklist — deny known bad actors before anything else ─────────────
app.use(ipBlocklist);

// ─── 4. Suspicious User-Agent blocker ────────────────────────────────────────
app.use(blockSuspiciousAgents);

// ─── 5. CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.warn(`[CORS] 🚫 Blocked origin: ${origin}`);
                callback(new Error(`CORS: origin ${origin} not allowed`));
            }
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Supplier-Token", "X-Supplier-Signature", "X-Request-ID"],
        credentials: true,
    })
);

// ─── 6. Global Rate Limiter + Slow-Down ───────────────────────────────────────
//   Apply to ALL routes. Per-route limiters (stricter) are applied in routes/.
app.use(globalLimiter);
app.use(speedLimiter);

// ─── 7. Request Parsing ───────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── 8. Extra payload size check ──────────────────────────────────────────────
app.use(largePayloadGuard);

// ─── 9. Input Sanitization ────────────────────────────────────────────────────
//   Runs AFTER parsing so req.body is populated
app.use(sanitizeInput);

// ─── 10. Logging ──────────────────────────────────────────────────────────────
app.use(morgan(isProd ? "combined" : "dev"));
app.use(securityLogger);

// ─── 11. API Routes ───────────────────────────────────────────────────────────
// Manual MIME type fix for .avif
(express.static as any).mime.define({ 'image/avif': ['avif'] });

app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads"), {
    setHeaders: (res: Response) => {
        res.set("Access-Control-Allow-Origin", "*"); // Ensure CORS for static files
    }
}));
app.use("/api", router);

// ─── 12. Health Check ─────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
    });
});

// ─── 13. 404 ──────────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// ─── 14. Global Error Handler ─────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(`[ERROR] ${err.message}`);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        success: false,
        message: isProd ? "An unexpected error occurred" : err.message,
    });
});

export default app;
