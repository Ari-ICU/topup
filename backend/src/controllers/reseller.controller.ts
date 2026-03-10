import { Request, Response } from "express";
import * as transactionService from "../services/transaction.service.js";

/**
 * Endpoint for external resellers to place orders.
 * Path: POST /api/v1/reseller/order
 */
export const placeResellerOrder = async (req: Request, res: Response) => {
    try {
        const { packageId, playerInfo } = req.body;

        if (!packageId || !playerInfo) {
            return res.status(400).json({
                success: false,
                message: "Missing packageId or playerInfo",
            });
        }

        // 1. Create the transaction record
        const transaction = await transactionService.createNewTransaction({
            packageId,
            playerInfo,
            paymentMethod: "RESELLER_API",
        });

        // 2. Attempt immediate fulfillment
        try {
            const fulfillment = await transactionService.fulfillTransaction(transaction.id);
            
            return res.status(200).json({
                success: true,
                message: "Order placed and fulfilled successfully",
                data: {
                    orderId: transaction.id,
                    status: "COMPLETED",
                    reference: fulfillment.providerRef,
                }
            });
        } catch (fulfillmentError: any) {
            // Fulfillment failed but transaction record exists (marked as FAILED by fulfillTransaction)
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
