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
            // Return transaction + payment QR data together
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
 * Called after payment is verified (e.g., Bakong webhook or manual admin confirm).
 * This endpoint:
 *   1. Marks the transaction as PROCESSING
 *   2. Calls MooGold (or fallback provider) to deliver the diamonds
 *   3. Marks the transaction as COMPLETED with the provider reference
 */
export const confirmAndFulfillTransaction = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // 1. Load transaction with package info
        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                package: {
                    include: { game: true },
                },
            },
        });

        if (!transaction) {
            return sendError(res, "Transaction not found", 404);
        }

        if (transaction.status === "COMPLETED") {
            return sendError(res, "Transaction has already been fulfilled", 400);
        }

        if (transaction.status === "FAILED") {
            return sendError(res, "Cannot fulfill a failed transaction", 400);
        }

        // 2. Mark as PROCESSING
        await prisma.transaction.update({
            where: { id },
            data: { status: "PROCESSING" },
        });

        // 3. Extract player info
        const playerInfo = transaction.playerInfo as { userId?: string; zoneId?: string;[key: string]: any };
        const playerId = playerInfo?.userId || playerInfo?.playerId || "";
        const zoneId = playerInfo?.zoneId;

        // providerSku must be set on the Package record in admin panel
        const providerSku = (transaction.package as any)?.providerSku as string | undefined;
        if (!providerSku) {
            await prisma.transaction.update({ where: { id }, data: { status: "FAILED" } });
            return sendError(res, "Package is missing a Provider SKU. Please configure it in the admin panel.", 422);
        }

        // 4. Call the top-up provider (MooGold by default)
        const result = await processTopUp({
            transactionId: transaction.id,
            providerSku,
            playerId,
            zoneId,
        });

        // 5. Mark as COMPLETED with provider reference
        const completed = await prisma.transaction.update({
            where: { id },
            data: {
                status: "COMPLETED",
                providerRef: result.providerRef,
            },
        });

        // 6. Deduct real diamonds from global stock ONLY after confirmed delivery
        //    -1 = unlimited, skip; otherwise deduct the package's diamond amount
        const deliveredAmount = (transaction.package as any)?.amount as number;
        await deductGlobalStock(deliveredAmount);

        console.log(`[Fulfillment] ✅ TxID ${id} completed via ${result.provider}. Ref: ${result.providerRef}. Stock deducted: ${deliveredAmount}💎`);

        return sendSuccess(res, {
            ...completed,
            provider: result.provider,
            providerRef: result.providerRef,
            message: result.message,
        }, "Diamonds delivered successfully!");

    } catch (error: any) {
        console.error(`[Fulfillment] ❌ TxID ${id} failed:`, error.message);

        // Mark transaction as FAILED so admin can retry
        await prisma.transaction.update({
            where: { id },
            data: { status: "FAILED" },
        }).catch(() => { });

        return sendError(res, `Fulfillment failed: ${error.message}`, 500);
    }
};
