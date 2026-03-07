import express, { Response } from "express";
import path from "path";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import router from "./routes/index.js";
import { globalLimiter, speedLimiter } from "./middleware/rateLimit.middleware.js";
import { isRedisAvailable } from "./lib/redis.js";
import {
    ipBlocklist,
    blockSuspiciousAgents,
    sanitizeInput,
    requestId,
    largePayloadGuard,
    securityLogger,
} from "./middleware/security.middleware.js";

// App configuration
const app = express();
const isProd = process.env.NODE_ENV === "production";

// Trust Proxy for Nginx/Cloudflare
app.set("trust proxy", 1);

// Middleware
app.use(requestId); // Request ID must be first

// Security Headers (Helmet)
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
            : false,
        hsts: isProd
            ? { maxAge: 31536000, includeSubDomains: true, preload: true }
            : false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
        frameguard: false,
        noSniff: true,
        xssFilter: true,
        hidePoweredBy: true,
    })
);

app.use(ipBlocklist);
app.use(blockSuspiciousAgents);

// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000,https://topup-sable.vercel.app")
    .split(",")
    .map((o) => o.trim());

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);

            const isAllowed = allowedOrigins.includes(origin) ||
                origin.endsWith(".vercel.app"); // Allow all Vercel previews for convenience

            if (isAllowed) {
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

// Rate Limiting
app.use(globalLimiter);
app.use(speedLimiter);

// Payload handling and Sanitization
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(largePayloadGuard);
app.use(sanitizeInput);

// Logging
app.use(morgan(isProd ? "combined" : "dev"));
app.use(securityLogger);

// Static files and API Routes
(express.static as any).mime.define({ 'image/avif': ['avif'] });

app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads"), {
    setHeaders: (res: Response) => {
        res.set("Access-Control-Allow-Origin", "*");
    }
}));
app.use("/api", router);

// Health Check
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        redis: isRedisAvailable() ? "connected" : "unavailable",
    });
});

// 404 Handler
app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // Specifically handle CORS errors with 403
    if (err.message?.includes("CORS: origin") && err.message?.includes("not allowed")) {
        console.warn(`[Security] 🚫 CORS violation blocked: ${err.message}`);
        return res.status(403).json({
            success: false,
            message: "Cross-Origin request blocked by security policy.",
        });
    }

    console.error(`[ERROR] ${err.message}`);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        success: false,
        message: isProd ? "An unexpected error occurred" : err.message,
    });
});

export default app;
