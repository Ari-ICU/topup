import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { RedisStore } from "rate-limit-redis";
import { redis, isRedisAvailable } from "../lib/redis.js";
import { getRealIp } from "../utils/ip.util.js";

const isProd = process.env.NODE_ENV === "production";

// ─── Rate Limit Handler — Automatically bans the IP ───────────────────────────
const rateLimitHandler = (message: string) => (req: any, res: any) => {
    const clientIp = getRealIp(req);
    console.warn(`[Security] 🛡️ Rate limit triggered: ${clientIp}.`);

    res.status(404).json({
        success: false,
        message: "Route not found",
    });
};

// ─── Redis Store Factory ─────────────────────────────────────────────────────
function makeRedisStore(prefix: string) {
    return new RedisStore({
        prefix: `rl:${prefix}:`,
        sendCommand: async (...args: string[]) => {
            return (redis as any).call(...args);
        },
    });
}

function store(prefix: string) {
    return isRedisAvailable() ? makeRedisStore(prefix) : undefined;
}

// Bypass function for security audits
const skipAudit = (req: any) => {
    // 🛡️ Essential: Preflight requests MUST NEVER be rate-limited or blocked
    if (req.method === "OPTIONS") return true;

    // 🔑 Use env var if present. NEVER use hardcoded fallbacks in production.
    const auditKey = process.env.AUDIT_KEY;
    if (!auditKey) return false;
    return req.headers["x-audit-key"] === auditKey;
};

// ─── 1. Global limiter — applies to ALL routes ───────────────────────────────
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 300 : 1000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: store("global"),
    skip: skipAudit,
    handler: rateLimitHandler("Too many requests. Your IP has been temporarily restricted."),
});

// ─── 2. Transaction creation limiter ─────────────────────────────────────────
export const transactionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 10 : 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: store("txn"),
    skip: skipAudit,
    handler: rateLimitHandler("Too many orders. Please wait before placing another order."),
});

// ─── 3. Admin limiter ────────────────────────────────────────────────────────
export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 60 : 500,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: store("admin"),
    skip: skipAudit,
    handler: rateLimitHandler("Too many admin attempts. IP temporarily restricted."),
});
// ─── 4. Verification limiter (account check) ──────────────────────────────────
export const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 15 : 100, // Strict: 15 checks per 15 minutes is plenty for human users
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: store("verify"),
    skip: skipAudit,
    handler: rateLimitHandler("Too many account checks. Please wait 15 minutes."),
});


// ─── 5. Heavy action limiter (confirm/fulfill) ───────────────────────────────
export const heavyActionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 10 : 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: store("heavy"),
    skip: skipAudit,
    handler: rateLimitHandler("Too many fulfillment attempts. IP temporarily restricted."),
});

// ─── 6. Polling limiter (check-payment) ───────────────────────────────────────
export const pollingLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minute window
    max: isProd ? 100 : 500, // Allow 100 requests in 5 mins (plenty for 4s polling)
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: store("polling"),
    skip: skipAudit,
    handler: rateLimitHandler("Please wait a moment while we verify your payment."),
});

// ─── 7. Slow-Down Middleware ──────────────────────────────────────────────────
export const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: isProd ? 50 : 500,
    delayMs: (used, req) => (skipAudit(req) ? 0 : 200),
    maxDelayMs: 5000,
});
