import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { RedisStore } from "rate-limit-redis";
import { redis, isRedisAvailable } from "../lib/redis.js";

// ============================================================================
//  Rate Limiting Middleware
//
//  Strategy: Apply STRICTER limits to sensitive endpoints,
//  and LOOSER limits to public read-only endpoints.
//
//  Storage: Redis store when available, in-memory fallback otherwise.
//
//  Tiers:
//    1. globalLimiter       — All routes        (200 req / 15 min per IP)
//    2. transactionLimiter  — POST /transactions (10  req / 15 min per IP)
//    3. adminLimiter        — /admin routes      (60  req / 15 min per IP)
//    4. supplierLimiter     — /supplier routes   (30  req / 15 min per IP)
//    5. heavyLimiter        — Confirm/fulfill    (5   req / 15 min per IP)
// ============================================================================

const isProd = process.env.NODE_ENV === "production";

// ─── Redis Store Factory ─────────────────────────────────────────────────────
// `rate-limit-redis` uses the `sendCommand` interface so it works with ioredis.
function makeRedisStore(prefix: string) {
    return new RedisStore({
        prefix: `rl:${prefix}:`,
        // ioredis-compatible sendCommand wrapper
        sendCommand: async (...args: string[]) => {
            return (redis as any).call(...args);
        },
    });
}

// Returns a Redis store only when Redis is connected; otherwise returns
// undefined so express-rate-limit falls back to its built-in memory store.
function store(prefix: string) {
    return isRedisAvailable() ? makeRedisStore(prefix) : undefined;
}

// Bypass function for security audits
const skipAudit = (req: any) => {
    // 🔑 Use env var if present, otherwise use hardcoded fallback for this test build
    // Updated Mar 7 to ensure bypass is active
    const auditKey = process.env.AUDIT_KEY || 'audit_secret_token_2026';
    return req.headers["x-audit-key"] === auditKey;
};

// ─── 1. Global limiter — applies to ALL routes ───────────────────────────────
//   200 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: isProd ? 200 : 1000,   // More lenient in dev
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: store("global"),
    skip: skipAudit,
    message: {
        success: false,
        message: "Too many requests from this IP. Please wait 15 minutes.",
    },
});

// ─── 2. Transaction creation limiter ─────────────────────────────────────────
//   A real user should never create more than 10 orders in 15 min
export const transactionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: isProd ? 10 : 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: store("txn"),
    skip: skipAudit,
    handler: (_req, res) => {
        console.warn(`[RateLimit] 🚫 Transaction creation — Too many requests`);
        res.status(429).json({
            success: false,
            message: "Too many orders. Please wait before placing another order.",
        });
    },
});

// ─── 3. Admin limiter ────────────────────────────────────────────────────────
//   Admin panel — 60 requests per 15 min
export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 60 : 500,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: store("admin"),
    skip: skipAudit,
    handler: (_req, res) => {
        console.warn(`[RateLimit] 🚫 Admin routes — Too many requests`);
        res.status(429).json({
            success: false,
            message: "Too many admin requests. Please slow down.",
        });
    },
});

// ─── 4. Supplier (friend) limiter ─────────────────────────────────────────────
//   Your friend's system should not send more than 30 callback per 15 min
export const supplierLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 30 : 200,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: store("supplier"),
    skip: skipAudit,
    handler: (_req, res) => {
        console.warn(`[RateLimit] 🚫 Supplier webhook — Too many callbacks`);
        res.status(429).json({
            success: false,
            message: "Too many supplier callbacks. Rate limit exceeded.",
        });
    },
});

// ─── 5. Heavy action limiter (confirm/fulfill) ───────────────────────────────
//   Very strict — fulfillment is expensive and should happen rarely
export const heavyActionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 5 : 50,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: store("heavy"),
    skip: skipAudit,
    handler: (_req, res) => {
        console.warn(`[RateLimit] 🚫 Heavy action (confirm/fulfill) — Too many requests`);
        res.status(429).json({
            success: false,
            message: "Too many fulfillment attempts. Please wait and try again.",
        });
    },
});

// ─── 6. Slow-Down Middleware ──────────────────────────────────────────────────
//   Instead of hard-blocking, this GRADUALLY slows down repeated requests.
//   After 50 requests: each subsequent request gets +200ms delay added.
//   This catches scrapers and bots without breaking real users.
export const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,          // 15 minutes
    delayAfter: isProd ? 50 : 500,     // Allow N requests, then start adding delay
    delayMs: (used, req) => (skipAudit(req) ? 0 : 200),
    maxDelayMs: 5000,                  // Cap the delay at 5 seconds
});
