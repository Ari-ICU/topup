import { Request, Response } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import {
    processFriendFulfillment,
    SupplierFulfillmentPayload,
} from "../services/supplier.service.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { prisma } from "../lib/prisma.js";

// ============================================================================
//  Supplier Controller
//
//  Security: Every request from your friend must include one of:
//    • Header:  X-Supplier-Token: <your secret>
//    • OR HMAC: X-Supplier-Signature: HMAC-SHA256(secret, body)
//
//  Set in .env:
//    FRIEND_SUPPLIER_SECRET=some_long_random_secret_here
// ============================================================================

// Helper to get secret from DB or Env
const getSecret = async (): Promise<string> => {
    const setting = await prisma.systemSetting.findUnique({
        where: { key: "FRIEND_SUPPLIER_SECRET" }
    });
    return setting?.value || process.env.FRIEND_SUPPLIER_SECRET || "";
};

/**
 * Constant-time token comparison to prevent timing attacks
 */
const isValidToken = async (provided: string): Promise<boolean> => {
    const secret = await getSecret();
    if (!secret) return false;
    try {
        const a = Buffer.from(provided.trim());
        const b = Buffer.from(secret.trim());
        if (a.length !== b.length) return false;
        return timingSafeEqual(a, b);
    } catch {
        return false;
    }
};

/**
 * Verify HMAC-SHA256 signature (more secure — use this if your friend supports it)
 * Signature = HMAC-SHA256(SECRET, raw_body_string)
 */
const isValidHmac = async (signature: string, rawBody: string): Promise<boolean> => {
    const secret = await getSecret();
    if (!secret) return false;
    try {
        const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
        const a = Buffer.from(signature.trim().toLowerCase());
        const b = Buffer.from(expected.toLowerCase());
        if (a.length !== b.length) return false;
        return timingSafeEqual(a, b);
    } catch {
        return false;
    }
};

// ============================================================================
//  POST /api/supplier/fulfill
//
//  Your friend calls this URL when they have delivered diamonds to a player.
//
//  WHAT YOUR FRIEND NEEDS TO SEND YOU:
//  ─────────────────────────────────────────────────────────────────────────
//  Method:  POST
//  URL:     https://yourwebsite.com/api/supplier/fulfill
//  Headers:
//    Content-Type:       application/json
//    X-Supplier-Token:   <the secret token you give your friend>
//
//  Body (JSON):
//  {
//    "orderId":     "txn_abc123",      ← Your transaction ID (you give this)
//    "status":      "success",          ← "success" | "failed" | "pending"
//    "providerRef": "FRIEND-REF-001",  ← Your friend's reference number
//    "message":     "Delivered 100💎", ← Optional message
//    "diamonds":    100                 ← How many diamonds delivered
//  }
//  ─────────────────────────────────────────────────────────────────────────
// ============================================================================

export const handleSupplierFulfillment = async (req: Request, res: Response) => {
    // ── 1. Authenticate the request ──────────────────────────────────────────
    const token = req.headers["x-supplier-token"] as string | undefined;
    const hmacSig = req.headers["x-supplier-signature"] as string | undefined;
    const rawBody = JSON.stringify(req.body); // for HMAC verification

    let authenticated = false;

    if (hmacSig) {
        authenticated = await isValidHmac(hmacSig, rawBody);
    } else if (token) {
        authenticated = await isValidToken(token);
    }

    if (!authenticated) {
        console.warn(`[Supplier] 🚫 Unauthorized callback attempt from ${req.ip}`);
        return sendError(res, "Unauthorized: Invalid or missing supplier token", 401);
    }

    // ── 2. Validate the body ──────────────────────────────────────────────────
    const { orderId, status, providerRef, message, diamonds } = req.body as SupplierFulfillmentPayload;

    if (!orderId || typeof orderId !== "string") {
        return sendError(res, "Missing required field: orderId", 400);
    }

    if (!status || !["success", "failed", "pending"].includes(status)) {
        return sendError(res, "Invalid status. Must be: success | failed | pending", 400);
    }

    // ── 3. Process the fulfillment ────────────────────────────────────────────
    try {
        const result = await processFriendFulfillment({
            orderId,
            status,
            providerRef,
            message,
            diamonds,
        });

        return sendSuccess(res, result, result.message);
    } catch (error: any) {
        console.error("[Supplier] Error processing fulfillment:", error.message);

        if (error.message?.includes("not found")) {
            return sendError(res, error.message, 404);
        }

        return sendError(res, `Failed to process fulfillment: ${error.message}`, 500);
    }
};

// ============================================================================
//  GET /api/supplier/info
//
//  Returns connection info so your friend can verify they are connected.
//  Also requires the supplier token.
// ============================================================================

export const getSupplierInfo = async (req: Request, res: Response) => {
    const token = req.headers["x-supplier-token"] as string | undefined;

    const authenticated = token ? await isValidToken(token) : false;
    if (!token || !authenticated) {
        return sendError(res, "Unauthorized: Invalid or missing supplier token", 401);
    }

    return sendSuccess(res, {
        connected: true,
        shop: "TopUpPay",
        fulfillmentEndpoint: `${req.protocol}://${req.get("host")}/api/supplier/fulfill`,
        method: "POST",
        requiredHeaders: {
            "Content-Type": "application/json",
            "X-Supplier-Token": "<your secret token>",
        },
        requiredBody: {
            orderId: "string  — transaction ID from TopUpPay",
            status: '"success" | "failed" | "pending"',
            providerRef: "string  — your reference number (optional)",
            message: "string  — optional note",
            diamonds: "number  — diamonds delivered (optional)",
        },
        timestamp: new Date().toISOString(),
    }, "Supplier API connection verified ✅");
};
