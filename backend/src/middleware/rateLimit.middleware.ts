import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

// ============================================================================
//  Rate Limiting Middleware
//
//  Strategy: Apply STRICTER limits to sensitive endpoints,
//  and LOOSER limits to public read-only endpoints.
//
//  Tiers:
//    1. globalLimiter       — All routes        (200 req / 15 min per IP)
//    2. transactionLimiter  — POST /transactions (10  req / 15 min per IP)
//    3. adminLimiter        — /admin routes      (60  req / 15 min per IP)
//    4. supplierLimiter     — /supplier routes   (30  req / 15 min per IP)
//    5. heavyLimiter        — Confirm/fulfill    (5   req / 15 min per IP)
// ============================================================================

const isProd = process.env.NODE_ENV === "production";

// ─── Helper: standard rate limit error handler ───────────────────────────────
const rateLimitHandler = (endpoint: string) =>
    rateLimit({
        standardHeaders: "draft-7",  // Return rate limit info in `RateLimit-*` headers
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        handler: (_req, res) => {
            console.warn(`[RateLimit] 🚫 ${endpoint} — Too many requests from IP`);
            res.status(429).json({
                success: false,
                message: "Too many requests. Please slow down and try again later.",
                retryAfter: "Please wait before sending more requests.",
            });
        },
    });

// ─── 1. Global limiter — applies to ALL routes ───────────────────────────────
//   200 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: isProd ? 200 : 1000,   // More lenient in dev
    standardHeaders: "draft-7",
    legacyHeaders: false,
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
    delayMs: () => 200,                // Add 200ms per request above the limit
    maxDelayMs: 5000,                  // Cap the delay at 5 seconds
});
