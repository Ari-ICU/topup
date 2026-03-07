import { Request, Response, NextFunction } from "express";

// ============================================================================
//  Security Middleware
//
//  Covers:
//    1. IP Blocklist          — instantly block known bad IPs
//    2. Suspicious User-Agent — block bots, scanners, curl abuse
//    3. Input Sanitization    — strip null bytes, XSS attempts from body/query
//    4. Request ID            — tag every request with a unique ID for tracing
//    5. Payload Size Guard    — extra check on unusually large payloads
// ============================================================================

// ─── 1. IP Blocklist (Static & Dynamic) ───────────────────────────────
const BLOCKED_IPS = new Set<string>(
    (process.env.BLOCKED_IPS ?? "").split(",").map((ip) => ip.trim()).filter(Boolean)
);

// Stores dynamic bans: Map<IP_Address, Expiration_Timestamp>
const DYNAMIC_BANNED_IPS = new Map<string, number>();

/**
 * Manually or automatically ban an IP for a certain number of minutes.
 * Default is 1440 minutes (24 hours).
 */
export const banIP = (ip: string, durationMinutes: number = 24 * 60) => {
    const expiresAt = Date.now() + durationMinutes * 60 * 1000;
    DYNAMIC_BANNED_IPS.set(ip, expiresAt);
    console.warn(`[Security] 🔴 IP BANNED: ${ip} for ${durationMinutes} minutes.`);
};

export const ipBlocklist = (req: Request, res: Response, next: NextFunction) => {
    // 🛡️ Preflight requests MUST NEVER be blocked by the IP blocklist
    if (req.method === "OPTIONS") return next();

    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
        ?? req.socket.remoteAddress
        ?? "unknown";

    // Check Static Blocklist
    if (BLOCKED_IPS.has(clientIp)) {
        return res.status(403).json({ success: false, message: "Access denied." });
    }

    // Check Dynamic Blocklist
    const banExpiry = DYNAMIC_BANNED_IPS.get(clientIp);
    if (banExpiry) {
        if (Date.now() < banExpiry) {
            return res.status(403).json({ success: false, message: "Your IP is temporarily banned due to suspicious activity." });
        } else {
            // Ban expired
            DYNAMIC_BANNED_IPS.delete(clientIp);
        }
    }

    return next();
};

// ─── 2. Suspicious User-Agent Detection ──────────────────────────────────────
//   Block known scanner tools and suspicious patterns.
//   Legitimate users always have a real browser or app User-Agent.
const BLOCKED_UA_PATTERNS = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /zgrab/i,
    /nessus/i,
    /burpsuite/i,
    /dirbuster/i,
    /gobuster/i,
    /hydra/i,
    /w3af/i,
    /acunetix/i,
    /python-requests\/[01]\./i,  // Old Python requests bots
];

export const blockSuspiciousAgents = (req: Request, res: Response, next: NextFunction) => {
    if (req.method === "OPTIONS") return next();

    const ua = req.headers["user-agent"] ?? "";

    const isSuspicious = BLOCKED_UA_PATTERNS.some((pattern) => pattern.test(ua));

    if (isSuspicious) {
        console.warn(`[Security] 🤖 Suspicious User-Agent blocked: "${ua}" from ${req.ip}`);
        return res.status(403).json({ success: false, message: "Access denied." });
    }

    return next();
};

// ─── 3. Input Sanitization ───────────────────────────────────────────────────
//   Strip dangerous content from request bodies and query strings.
//   This is NOT a replacement for proper parameterized queries (Prisma handles
//   that), but adds a defensive layer against XSS and injection attempts.

const sanitizeValue = (value: unknown): unknown => {
    if (typeof value === "string") {
        return (
            value
                .replace(/\0/g, "")              // Null bytes — crash some parsers
                .replace(/<script\b[^>]*>/gi, "") // Script tags
                .replace(/<\/script>/gi, "")
                .replace(/javascript:/gi, "")     // JS pseudo-protocol
                .replace(/on\w+=/gi, "")          // Inline event handlers (onclick= etc.)
                .trim()
        );
    }

    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }

    if (value !== null && typeof value === "object") {
        const result: Record<string, unknown> = {};
        for (const key of Object.keys(value as Record<string, unknown>)) {
            result[key] = sanitizeValue((value as Record<string, unknown>)[key]);
        }
        return result;
    }

    return value;
};

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === "object") {
        req.body = sanitizeValue(req.body);
    }
    if (req.query && typeof req.query === "object") {
        // query params are strings only — sanitize each
        for (const key of Object.keys(req.query)) {
            if (typeof req.query[key] === "string") {
                req.query[key] = sanitizeValue(req.query[key]) as string;
            }
        }
    }
    return next();
};

// ─── 4. Request ID Middleware ─────────────────────────────────────────────────
//   Tags every request with a unique ID (X-Request-ID header).
//   This makes it easy to trace issues in logs — every log line can include
//   the same request ID so you can follow one user's full journey.

export const requestId = (req: Request, res: Response, next: NextFunction) => {
    const id =
        (req.headers["x-request-id"] as string) ??   // Re-use if client sent one
        `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    req.headers["x-request-id"] = id;
    res.setHeader("X-Request-ID", id);
    return next();
};

// ─── 5. Large Payload Guard ───────────────────────────────────────────────────
//   Extra safety net: reject bodies over 50kb even if Express lets them through.
//   This catches multi-layered nested JSON objects designed to slow down JSON.parse.

export const largePayloadGuard = (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers["content-length"] ?? "0", 10);

    // 📂 Allow larger payloads for uploads (5MB)
    const isUpload = req.path.includes("/admin/upload");
    const MAX_BYTES = isUpload ? 5 * 1024 * 1024 : 50 * 1024;

    if (contentLength > MAX_BYTES) {
        console.warn(`[Security] 🛑 Oversized payload rejected: ${contentLength} bytes from ${req.ip} (Path: ${req.path})`);
        return res.status(413).json({
            success: false,
            message: isUpload ? "Image too large (max 5MB)" : "Request payload too large.",
        });
    }

    return next();
};

// ─── 6. Security Event Logger ─────────────────────────────────────────────────
//   Logs key fields from every request for audit trail.
//   In production, pipe this to a log aggregator (e.g., Logtail, Datadog).

export const securityLogger = (req: Request, _res: Response, next: NextFunction) => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
        ?? req.socket.remoteAddress
        ?? "unknown";

    const requestIdHeader = req.headers["x-request-id"] ?? "no-id";

    // Only log non-GET (state-changing requests) in detail
    if (req.method !== "GET" && req.method !== "OPTIONS") {
        console.log(
            `[Audit] ${req.method} ${req.path} | IP: ${ip} | ID: ${requestIdHeader} | UA: ${(req.headers["user-agent"] ?? "").slice(0, 60)}`
        );
    }

    return next();
};
