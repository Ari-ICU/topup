import { Request, Response } from "express";
import { executeSupplyOrder } from "../services/supply.service.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

/**
 * Direct MooGold / Supply Top-up Controller
 * 
 * Handles direct fulfillment requests, typically triggered from
 * the frontend API /api/topup proxy.
 */
export const directTopUp = async (req: Request, res: Response) => {
    const { productId, playerId, server, categoryId, transactionId } = req.body;

    // ─── 1. Input Validation ──────────────────────────────────────────
    if (!productId || (!playerId && !req.body.userId)) {
        return sendError(res, "Missing required fields: productId and playerId", 400);
    }

    const effectivePlayerId = (playerId || req.body.userId).toString();
    const effectiveProductId = productId.toString();
    const effectiveCategoryId = (categoryId || "50").toString();
    const effectiveServerId = (server || req.body.zoneId || "").toString();

    try {
        console.log(`[MooGold] 🚀 Triggering top-up for Player: ${effectivePlayerId}, Product: ${effectiveProductId} (Cat: ${effectiveCategoryId})`);
        
        const result = await executeSupplyOrder({
            productId: effectiveProductId,
            categoryId: effectiveCategoryId,
            playerId: effectivePlayerId,
            serverId: effectiveServerId,
            transactionId: transactionId?.toString() || `DIR-${Date.now()}`
        });

        if (result.success) {
            console.log(`[MooGold] ✅ Order placed: ${result.orderId}`);
            return sendSuccess(res, result, "Order placed successfully");
        } else {
            console.warn(`[MooGold] ⚠️ Provider rejection: ${result.message}`);
            return sendError(res, result.message || "Provider refused the order", 422);
        }
    } catch (error: any) {
        console.error("[MooGold] ❌ Fulfillment engine crash:", error.message);
        return sendError(res, "An internal error occurred while processing the top-up with MooGold.", 500);
    }
};
