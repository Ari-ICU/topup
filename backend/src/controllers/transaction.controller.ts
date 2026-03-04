import { Request, Response } from "express";
import * as transactionService from "../services/transaction.service.js";
import * as bakongService from "../services/bakong.service.js";
import { processTopUp, getProviderStatus } from "../services/topup-provider.service.js";
import { deductGlobalStock } from "../services/transaction.service.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { prisma } from "../lib/prisma.js";

export const createTransaction = async (req: Request, res: Response) => {
    const { packageId, playerInfo, paymentMethod } = req.body;

    // ── Guard: block order creation if no real provider is ready ─────────────
    // We check this BEFORE creating any DB record so customers get a clear error
    // right away and no money changes hands for an unfulfillable order.
    const providerStatus = await getProviderStatus();
    if (!providerStatus.isReady) {
        console.error(`[Transaction] ❌ Order blocked — provider not ready: ${providerStatus.warning}`);
        return sendError(
            res,
            providerStatus.isTestMode
                ? "The store is currently in test mode and cannot accept real orders. Please contact the admin."
                : "The store is temporarily unable to process diamond deliveries. Please try again later or contact support.",
            503
        );
    }

    try {
        const transaction = await transactionService.createNewTransaction({
            packageId,
            playerInfo,
            paymentMethod,
        });

        // Generate KHQR for Bakong payments — fail loudly so the user gets a real error
        if (paymentMethod === "BAKONG") {
            const khqr = await bakongService.generateTransactionKHQR({
                amount: Number(transaction.totalAmount),
                transactionId: transaction.id,
            });

            // Update transaction with payment reference (MD5) for later verification/polling
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { paymentRef: khqr.md5 }
            });

            // Return transaction + payment QR data together
            return sendSuccess(res, { ...transaction, paymentRef: khqr.md5, paymentData: khqr }, "Transaction created successfully", 201);
        }

        return sendSuccess(res, transaction, "Transaction created successfully", 201);

    } catch (error: any) {
        if (error.message === "Package not found") {
            return sendError(res, error.message, 404);
        }
        if (error.message.includes("Global Stock Insufficient")) {
            return sendError(res, "Sorry, this package exceeds our current diamond stock availability. Please try a smaller package or try again later.", 400);
        }
        // Surface KHQR errors clearly (e.g. "KHQR generation failed: ...")
        if (error.message?.startsWith("KHQR") || error.message?.startsWith("BAKONG")) {
            return sendError(res, `Payment setup failed: ${error.message}`, 500);
        }
        console.error("Transaction Error:", error);
        return sendError(res, "Failed to create transaction");
    }
};



export const getTransactionStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const transaction = await transactionService.getTransactionById(id as string);
        return sendSuccess(res, transaction);
    } catch (error: any) {
        if (error.message === "Transaction not found") {
            return sendError(res, error.message, 404);
        }
        return sendError(res, "Failed to fetch transaction status");
    }
};

/**
 * POST /transactions/:id/confirm
 *
 * Manually confirm a transaction (called by Admin or via Webhook).
 */
export const confirmAndFulfillTransaction = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const result = await transactionService.fulfillTransaction(id);
        return sendSuccess(res, result, "Transaction fulfilled successfully!");
    } catch (error: any) {
        return sendError(res, error.message || "Fulfillment failed", 500);
    }
};

/**
 * POST /transactions/:id/check-payment
 * 
 * Called by the frontend to poll for payment status (especially for KHQR).
 * If payment is confirmed by the provider, it automatically triggers fulfillment.
 */
export const checkPaymentAndFulfill = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const transaction = await transactionService.getTransactionById(id);

        // 1. If already completed, just return success
        if (transaction.status === "COMPLETED") {
            return sendSuccess(res, { status: "COMPLETED", message: "Transaction already completed." });
        }

        // 2. Only check if it's PENDING and method is BAKONG
        if (transaction.status === "PENDING" && transaction.paymentMethod === "BAKONG") {
            const md5 = transaction.paymentRef;
            if (!md5) {
                return sendSuccess(res, { status: "PENDING", message: "Waiting for KHQR generation..." });
            }

            // 3. Check Bakong API
            const check = await bakongService.checkBakongTransactionStatus(md5);

            if (check.status === "SUCCESS") {
                console.log(`[AutoCheck] 💰 Payment detected for TxID ${id}. Triggering fulfillment...`);

                // 4. Trigger fulfillment automatically
                const result = await transactionService.fulfillTransaction(id);

                return sendSuccess(res, {
                    status: "COMPLETED",
                    provider: result.provider,
                    providerRef: result.providerRef,
                    message: "Payment received and diamonds delivered!"
                });
            }

            return sendSuccess(res, {
                status: "PENDING",
                message: check.message || "Still waiting for payment..."
            });
        }

        // For other methods or statuses, just return the current state
        return sendSuccess(res, { status: transaction.status, message: "Transaction status checked." });

    } catch (error: any) {
        console.error(`[AutoCheck] Error checking TxID ${id}:`, error.message);
        return sendError(res, "Failed to check payment status", 500);
    }
};
