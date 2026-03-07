import { Request, Response } from "express";
import * as transactionService from "../services/transaction.service.js";
import * as bakongService from "../services/bakong.service.js";
import { processTopUp, getProviderStatus } from "../services/topup-provider.service.js";
import { deductGlobalStock } from "../services/transaction.service.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { prisma } from "../lib/prisma.js";

export const createTransaction = async (req: Request, res: Response) => {
    const { packageId, playerInfo, paymentMethod } = req.body;

    // Guard: Check provider readiness before creating transaction
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

        // Generate KHQR for Bakong payments
        if (paymentMethod === "BAKONG") {
            const khqr = await bakongService.generateTransactionKHQR({
                amount: Number(transaction.totalAmount),
                transactionId: transaction.id,
            });

            // Save MD5 hash for payment verification
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { paymentRef: khqr.md5 },
            });

            // Return transaction and QR data
            return sendSuccess(res, { ...transaction, paymentData: khqr }, "Transaction created successfully", 201);
        }

        return sendSuccess(res, transaction, "Transaction created successfully", 201);

    } catch (error: any) {
        if (error.message === "Package not found") {
            return sendError(res, error.message, 404);
        }
        if (error.message.includes("Global Stock Insufficient")) {
            return sendError(res, "Sorry, this package exceeds our current diamond stock availability. Please try a smaller package or try again later.", 400);
        }
        // Handle KHQR/Bakong errors
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

// Confirm and fulfill transaction after payment verification
export const confirmAndFulfillTransaction = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const result = await transactionService.fulfillTransaction(id);
        return sendSuccess(res, result, "Transaction fulfilled successfully!");
    } catch (error: any) {
        return sendError(res, error.message || "Fulfillment failed", 500);
    }
};

// Poll for payment status and trigger fulfillment if confirmed
export const checkPaymentAndFulfill = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const transaction = await transactionService.getTransactionById(id);

        // Check if already completed
        if (transaction.status === "COMPLETED") {
            return sendSuccess(res, { status: "COMPLETED", message: "Transaction already completed." });
        }

        // Only check Bakong pending transactions
        if (transaction.status === "PENDING" && transaction.paymentMethod === "BAKONG") {
            const md5 = transaction.paymentRef;
            if (!md5) {
                return sendSuccess(res, { status: "PENDING", message: "Waiting for KHQR generation..." });
            }

            // Check Bakong API status
            const check = await bakongService.checkBakongTransactionStatus(md5);

            if (check.status === "SUCCESS") {
                console.log(`[AutoCheck] 💰 Payment detected for TxID ${id}. Triggering fulfillment...`);

                // Trigger automatic fulfillment
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

        // Return current status for other methods
        return sendSuccess(res, { status: transaction.status, message: "Transaction status checked." });

    } catch (error: any) {
        console.error(`[AutoCheck] Error checking TxID ${id}:`, error.message);
        return sendError(res, "Failed to check payment status", 500);
    }
};

// Webhook for Bakong payment notifications
export const handleBakongWebhook = async (req: Request, res: Response) => {
    // Extract payload data
    const payload = req.body;

    // Extract MD5 and external ID
    const md5 = payload.md5 || payload.data?.md5;
    const externalId = payload.externalId || payload.data?.externalId || payload.billNumber || payload.data?.billNumber;

    console.log(`[Bakong Callback] 📥 Hook received. MD5: ${md5}, ID: ${externalId}`);

    if (!md5 && !externalId) {
        console.warn("[Bakong Callback] ⚠️ Received empty or invalid payload:", JSON.stringify(payload));
        return sendError(res, "Invalid payload. md5 or externalId required.", 400);
    }

    try {
        // Find transaction by MD5 or ID
        const transaction = await prisma.transaction.findFirst({
            where: {
                OR: [
                    { paymentRef: md5 },
                    { id: externalId }
                ]
            }
        });

        if (!transaction) {
            console.warn(`[Bakong Callback] ⚠️ No transaction found matching md5: ${md5} or id: ${externalId}`);
            // Acknowledge webhook even if no transaction found
            return sendSuccess(res, { message: "Webhook received but no matching transaction found." });
        }

        // Acknowledge if already completed
        if (transaction.status === "COMPLETED") {
            return sendSuccess(res, { message: "Transaction already completed." });
        }

        // Handle cases where transaction was previously failed
        if (transaction.status === "FAILED") {
            console.warn(`[Bakong Callback] ⚠️ Payment received for FAILED transaction ${transaction.id}. Attempting to fulfill anyway.`);
        }

        console.log(`[Bakong Callback] 💰 Payment confirmed for TxID ${transaction.id}. Triggering fulfillment...`);

        // Trigger fulfillment
        const result = await transactionService.fulfillTransaction(transaction.id);

        return sendSuccess(res, result, "Payment confirmed and diamonds delivered via callback!");

    } catch (error: any) {
        console.error(`[Bakong Callback] ❌ Fulfillment failed for payload:`, JSON.stringify(payload));
        console.error(`[Bakong Callback] Error Detail:`, error.message);

        // Return error status for retry
        return sendError(res, "Callback processing failed", 500);
    }
};
