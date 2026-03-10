import { Request, Response } from "express";
import * as transactionService from "../services/transaction.service.js";

/**
 * Endpoint for external resellers to place orders.
 * Path: POST /api/v1/reseller/order
 */
export const placeResellerOrder = async (req: Request, res: Response) => {
    try {
        const { packageId, playerInfo } = req.body;
        const reseller = (req as any).reseller;

        if (!packageId || !playerInfo || !playerInfo.playerId) {
            return res.status(400).json({
                success: false,
                message: "Missing packageId or playerInfo.playerId",
            });
        }

        const { prisma } = await import("../lib/prisma.js");

        // 🛡️ 1. Account Validation First
        const pkg = await prisma.package.findUnique({
            where: { id: packageId },
            include: { game: true }
        });

        if (!pkg) {
            return res.status(404).json({ success: false, message: "Package ID not found" });
        }

        // Run Verification
        const { verifyGameAccount } = await import("../services/verify.service.js");
        const verification = await verifyGameAccount(
            pkg.game.slug,
            playerInfo.playerId,
            playerInfo.zoneId,
            pkg.providerSku // Provide SKU for provider-side verification
        );

        // If lookup confirmed the account is fake (verified false + formatValid false)
        if (verification.verified === false && verification.formatValid === false) {
            return res.status(422).json({
                success: false,
                message: `Account Verification Failed: ${verification.reason || "The provided ID does not exist for this game."}`,
                data: { playerInfo }
            });
        }

        // 🆔 2. Real accounting: Find the reseller record to get their internal userId
        let internalUserId: string | null = null;
        if (reseller && reseller.type === 'individual') {
            const r = await prisma.reseller.findUnique({ where: { id: reseller.id } });
            internalUserId = r?.userId || null;
        }

        // 📝 3. Create the transaction record linked to the reseller's system userId
        const transaction = await transactionService.createNewTransaction({
            packageId,
            playerInfo,
            paymentMethod: "RESELLER_API",
            userId: internalUserId // Tagging the transaction with the reseller's unique ID
        });

        // 🚀 4. Attempt immediate fulfillment
        try {
            const fulfillment = await transactionService.fulfillTransaction(transaction.id);
            
            return res.status(200).json({
                success: true,
                message: fulfillment.message || "Order placed and fulfilled successfully",
                data: {
                    orderId: transaction.id,
                    status: "COMPLETED",
                    reference: fulfillment.providerRef,
                    reseller: reseller?.email || 'Master',
                    playerName: verification.playerName || null
                }
            });
        } catch (fulfillmentError: any) {
            // Fulfillment failed but transaction record exists
            return res.status(422).json({
                success: false,
                message: `Fulfillment failed: ${fulfillmentError.message}`,
                data: {
                    orderId: transaction.id,
                    status: "FAILED"
                }
            });
        }

    } catch (error: any) {
        console.error("[ResellerController] Order error:", error);
        res.status(500).json({
            success: false,
            message: `Internal server error: ${error.message}`,
        });
    }
};
