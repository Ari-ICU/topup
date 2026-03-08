import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { RedisStore } from "rate-limit-redis";
import { redis, isRedisAvailable } from "../lib/redis.js";

const isProd = process.env.NODE_ENV === "production";

// ─── Rate Limit Handler — Automatically bans the IP ───────────────────────────
const rateLimitHandler = (message: string) => (req: any, res: any) => {
    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
        ?? req.socket.remoteAddress
        ?? "unknown";

    console.warn(`[Security] 🛡️ Rate limit triggered: ${clientIp}.`);

    res.status(429).json({
        success: false,
        message: message,
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

// ─── 4. Supplier (friend) limiter ─────────────────────────────────────────────
export const supplierLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 30 : 200,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: store("supplier"),
    skip: skipAudit,
    handler: rateLimitHandler("Too many supplier callbacks. IP temporarily restricted."),
});

// ─── 5. Heavy action limiter (confirm/fulfill) ───────────────────────────────
export const heavyActionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 5 : 50,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: store("heavy"),
    skip: skipAudit,
    handler: rateLimitHandler("Too many fulfillment attempts. IP temporarily restricted."),
});

// ─── 6. Slow-Down Middleware ──────────────────────────────────────────────────
export const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: isProd ? 50 : 500,
    delayMs: (used, req) => (skipAudit(req) ? 0 : 200),
    maxDelayMs: 5000,
});
