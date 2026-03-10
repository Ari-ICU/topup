import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { rGet, rSet } from "../lib/redis.js";

const isProd = process.env.NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev-only-123";

if (isProd && !process.env.JWT_SECRET) {
    console.warn("⚠️ WARNING: JWT_SECRET is not set in production. Admin tokens are not secure!");
}

/**
 * Blocklist key format: auth:blocklist:<jti>
 * Set with TTL = remaining seconds until token expires.
 */
export async function blockToken(token: string): Promise<void> {
    try {
        const decoded = jwt.decode(token) as { jti?: string; exp?: number } | null;
        if (!decoded) return;

        const jti = decoded.jti || token.slice(-16); // fallback identifier
        const exp = decoded.exp ?? 0;
        const ttl = Math.max(exp - Math.floor(Date.now() / 1000), 1);

        await rSet(`auth:blocklist:${jti}`, "1", ttl);
        console.log(`[Auth] 🔒 Token ${jti} added to blocklist (ttl: ${ttl}s)`);
    } catch {
        // silently ignore block failures
    }
}

/**
 * Middleware to verify JWT token for Admin routes.
 * Expects "Authorization: Bearer <token>"
 *
 * Additionally checks Redis blocklist so logged-out tokens are rejected
 * immediately rather than waiting for their natural expiry.
 */
export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(404).json({
            success: false,
            message: "Route not found",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { jti?: string; exp?: number };

        // Check Redis blocklist
        const jti = (decoded as any).jti || token.slice(-16);
        const blocked = await rGet(`auth:blocklist:${jti}`);
        if (blocked) {
            return res.status(404).json({
                success: false,
                message: "Route not found",
            });
        }

        (req as any).admin = decoded;
        next();
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: "Route not found",
        });
    }
};

/**
 * Middleware to verify Reseller API Keys.
 * Expects "X-API-Key" and "X-API-Secret" headers
 */
export const resellerAuth = async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = (req.headers["x-api-key"] || req.headers["X-API-KEY"]) as string;
    const apiSecret = (req.headers["x-api-secret"] || req.headers["X-API-SECRET"]) as string;

    if (!apiKey || !apiSecret) {
        return res.status(401).json({
            success: false,
            message: "Authentication failed: Missing API credentials",
        });
    }

    try {
        const { adminService } = await import("../services/admin.service.js");
        const { prisma } = await import("../lib/prisma.js");

        // 1. Check against master keys (restored earlier)
        const masterKeys = await adminService.getApiKeys();
        if (apiKey === masterKeys.publicKey && apiSecret === (masterKeys as any).fullSecretKey) {
            (req as any).reseller = { type: 'master', id: 'master' };
            return next();
        }

        // 2. Check against individual resellers in database
        const reseller = await prisma.reseller.findFirst({
            where: {
                partnerId: apiKey,
                secretKey: apiSecret,
                isActive: true
            }
        });

        if (reseller) {
            (req as any).reseller = { type: 'individual', id: reseller.id, email: reseller.email };
            return next();
        }

        return res.status(401).json({
            success: false,
            message: "Authentication failed: Invalid API credentials",
        });
    } catch (error) {
        console.error("[Auth] Reseller auth error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during authentication",
        });
    }
};
