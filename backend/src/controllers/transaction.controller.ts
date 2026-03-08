import { Request, Response } from "express";
import * as transactionService from "../services/transaction.service.js";
import * as bakongService from "../services/bakong.service.js";
import { processTopUp, getProviderStatus } from "../services/topup-provider.service.js";
import { deductGlobalStock } from "../services/transaction.service.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { prisma } from "../lib/prisma.js";

export const createTransaction = async (req: Request, res: Response) => {
    const { packageId, playerInfo, paymentMethod } = req.body;

    // 🛡️ Input Validation
    if (!packageId || typeof packageId !== 'string' || !playerInfo || !paymentMethod) {
        return sendError(res, "Missing or invalid required fields (packageId must be a string, playerInfo, or paymentMethod)", 400);
    }

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

        if (transaction.status === "COMPLETED") {
            return sendSuccess(res, { status: "COMPLETED", message: "Transaction already completed." });
        }

        if (transaction.status === "PENDING" && transaction.paymentMethod === "BAKONG") {
            const md5 = transaction.paymentRef;
            if (!md5) {
                return sendSuccess(res, { status: "PENDING", message: "Waiting for KHQR generation..." });
            }

            // 🛡️ SECURITY: Double-check with Bakong API (Source of Truth)
            const check = await bakongService.checkBakongTransactionStatus(md5);

            if (check.status === "SUCCESS") {
                console.log(`[Security] 💰 Payment VERIFIED via API for TxID ${id}. Fulfilling...`);
                const result = await transactionService.fulfillTransaction(id);

                return sendSuccess(res, {
                    status: "COMPLETED",
                    provider: result.provider,
                    providerRef: result.providerRef,
                    message: "Payment verified and diamonds delivered!"
                });
            }

            return sendSuccess(res, {
                status: "PENDING",
                message: check.message || "Still waiting for payment..."
            });
        }

        return sendSuccess(res, { status: transaction.status, message: "Transaction status checked." });

    } catch (error: any) {
        console.error(`[Security] ❌ Error verifying TxID ${id}:`, error.message);
        return sendError(res, "Failed to verify payment status", 500);
    }
};

// Webhook for Bakong payment notifications
export const handleBakongWebhook = async (req: Request, res: Response) => {
    const payload = req.body;
    const md5 = payload.md5 || payload.data?.md5;
    const externalId = payload.externalId || payload.data?.externalId || payload.billNumber || payload.data?.billNumber;

    console.log(`[Bakong Hook] 📥 Received. MD5: ${md5}, ID: ${externalId}`);

    if (!md5 && !externalId) {
        return sendError(res, "Invalid payload. md5 or externalId required.", 400);
    }

    try {
        // Find transaction
        const transaction = await prisma.transaction.findFirst({
            where: { OR: [{ paymentRef: md5 }, { id: externalId }] }
        });

        if (!transaction) {
            console.warn(`[Bakong Hook] ⚠️ No transaction found for MD5: ${md5}`);
            return sendSuccess(res, { message: "Ignored (no match)" });
        }

        if (transaction.status === "COMPLETED") {
            return sendSuccess(res, { message: "Already completed" });
        }

        // 🛡️ SECURITY: DO NOT trust the webhook payload alone.
        // Webhooks can be spoofed. ALWAYS verify the status against the official Bakong API
        // using the MD5 which is our unique identifier for this KHQR.
        const verifyMd5 = transaction.paymentRef || md5;
        if (!verifyMd5) return sendError(res, "Cannot verify without MD5", 400);

        console.log(`[Bakong Hook] 🔍 Verifying TxID ${transaction.id} against Bakong API...`);
        const check = await bakongService.checkBakongTransactionStatus(verifyMd5);

        if (check.status === "SUCCESS") {
            console.log(`[Bakong Hook] ✅ Payment CONFIRMED by API for TxID ${transaction.id}. Fulfilling...`);
            const result = await transactionService.fulfillTransaction(transaction.id);
            return sendSuccess(res, result, "Verified and fulfilled via webhook!");
        } else {
            console.warn(`[Bakong Hook] ❌ API says payment is NOT Success (${check.status}) for TxID ${transaction.id}.`);
            return sendSuccess(res, { message: "Webhook received but payment not yet confirmed by API" });
        }

    } catch (error: any) {
        console.error(`[Bakong Hook] ❌ Error:`, error.message);
        return sendError(res, "Callback processing failed", 500);
    }
};

