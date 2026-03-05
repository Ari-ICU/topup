import { prisma } from "../lib/prisma.js";
import { TransactionStatus } from "@prisma/client";
import { getActiveProviderBalance, processTopUp } from "./topup-provider.service.js";

// ============================================================================
//  Stock deduction helper — used by BOTH the transaction confirm endpoint
//  AND the admin "mark COMPLETED" action to keep everything in sync.
//
//  Rules:
//    • globalStock.diamonds === -1  → Unlimited, skip deduction
//    • globalStock.diamonds >= pkg.amount → Deduct and proceed
//    • globalStock.diamonds <  pkg.amount → Throw (insufficient stock)
// ============================================================================

export const deductGlobalStock = async (diamondAmount: number): Promise<void> => {
    // Attempt to sync with provider after deduction. We fetch live balance first;
    // if the provider reports a finite number we use it as the source of truth.
    const providerStock = await getActiveProviderBalance();

    // When providerStock is a finite number, we can update our local table to keep
    // it in sync. We subtract the amount we just delivered so that the next check
    // reflects the remaining balance.
    if (providerStock !== -1) {
        const newCount = Math.max(0, providerStock - diamondAmount);
        const updated = await prisma.globalStock.upsert({
            where: { id: "GLOBAL" },
            update: { diamonds: newCount },
            create: { id: "GLOBAL", diamonds: newCount }
        });
        console.log(`[Stock] Synced local stock to provider (${providerStock}→${newCount}).`);
        if (updated.diamonds < 0) {
            throw new Error(`Global Stock Insufficient during deduction: provider reported ${providerStock}`);
        }
        return;
    }

    // Fallback to local stock if provider is unlimited or unreachable.
    const stock = await prisma.globalStock.upsert({
        where: { id: "GLOBAL" },
        update: {},
        create: { id: "GLOBAL", diamonds: -1 }
    });

    // Unlimited mode ("-1") means we don't track locally.
    if (stock.diamonds === -1) {
        console.log(`[Stock] Unlimited mode, skipping local deduction for ${diamondAmount} diamonds.`);
        return;
    }

    if (stock.diamonds < diamondAmount) {
        throw new Error(`Global Stock Insufficient during deduction: have ${stock.diamonds}, need ${diamondAmount}`);
    }

    const updated = await prisma.globalStock.update({
        where: { id: "GLOBAL" },
        data: { diamonds: stock.diamonds - diamondAmount }
    });

    console.log(`[Stock] Deducted ${diamondAmount} diamonds, remaining ${updated.diamonds}`);
};

// ============================================================================
//  Create a new transaction
//  — Checks global stock BEFORE creating the record so no payment is requested
//    for something we can't fulfill.
// ============================================================================

export const createNewTransaction = async (data: {
    packageId: string;
    playerInfo: any;
    paymentMethod: string;
}) => {
    const pkg = await prisma.package.findUnique({
        where: { id: data.packageId },
        include: { game: true },
    });

    if (!pkg) {
        throw new Error("Package not found");
    }

    // ── Guard: check supplier balance if possible ────────────────────────────
    // We perform a live check against the active provider and our local table,
    // preventing orders when there isn't enough stock available. This avoids
    // charging customers for orders we cannot fulfill.
    const providerStock = await getActiveProviderBalance();
    if (providerStock !== -1 && providerStock < pkg.amount) {
        throw new Error(`Global Stock Insufficient: provider only has ${providerStock} diamonds`);
    }

    const localStock = await prisma.globalStock.findUnique({ where: { id: "GLOBAL" } });
    if (localStock && localStock.diamonds !== -1 && localStock.diamonds < pkg.amount) {
        throw new Error(`Global Stock Insufficient: only ${localStock.diamonds} diamonds left locally`);
    }

    // create transaction record
    return await prisma.transaction.create({
        data: {
            packageId: data.packageId,
            playerInfo: data.playerInfo,
            paymentMethod: data.paymentMethod,
            totalAmount: pkg.price,
            status: TransactionStatus.PENDING,
        },
    });
};

// ============================================================================
//  Get transaction by ID
// ============================================================================

export const getTransactionById = async (id: string) => {
    const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
            package: {
                include: { game: true },
            },
        },
    });

    if (!transaction) {
        throw new Error("Transaction not found");
    }

    return transaction;
};

// ============================================================================
//  Fulfill a transaction (Deliver Diamonds)
//  — Called after payment is verified (manual confirm, webhook, or polling).
//  — Orchestrates: processTopUp -> update status -> deduct stock.
// ============================================================================

export const fulfillTransaction = async (id: string): Promise<{
    success: boolean;
    provider: string;
    providerRef: string;
    message: string;
}> => {
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
        throw new Error("Transaction not found");
    }

    // Already done? Skip.
    if (transaction.status === TransactionStatus.COMPLETED) {
        return {
            success: true,
            provider: "SYSTEM",
            providerRef: transaction.providerRef || "",
            message: "Transaction already completed previously"
        };
    }

    if (transaction.status === TransactionStatus.FAILED) {
        throw new Error("Cannot fulfill a failed transaction");
    }

    // 3. Mark as PROCESSING to prevent race conditions
    await prisma.transaction.update({
        where: { id },
        data: { status: TransactionStatus.PROCESSING },
    });

    try {
        // 4. Extract player info
        const playerInfo = transaction.playerInfo as { userId?: string; zoneId?: string;[key: string]: any };
        const playerId = playerInfo?.userId || playerInfo?.playerId || "";
        const zoneId = playerInfo?.zoneId;

        // providerSku must be set on the Package record in admin panel
        const providerSku = (transaction.package as any)?.providerSku as string | undefined;
        if (!providerSku) {
            await prisma.transaction.update({ where: { id }, data: { status: TransactionStatus.FAILED } });
            throw new Error("Package is missing a Provider SKU. Please configure it in the admin panel.");
        }

        // 5. Call the top-up provider (MooGold by default)
        const result = await processTopUp({
            transactionId: transaction.id,
            providerSku,
            playerId,
            zoneId,
            amount: (transaction.package as any)?.amount as number,
            gameSlug: (transaction.package as any)?.game?.slug as string,
        });

        if (!result.success) {
            throw new Error(result.message || "Provider failed to process the order.");
        }

        // 6. Mark as COMPLETED with provider reference
        await prisma.transaction.update({
            where: { id },
            data: {
                status: TransactionStatus.COMPLETED,
                providerRef: result.providerRef,
            },
        });

        // 7. Deduct real diamonds from global stock ONLY after confirmed delivery
        const deliveredAmount = (transaction.package as any)?.amount as number;
        await deductGlobalStock(deliveredAmount);

        console.log(`[Fulfillment] ✅ TxID ${id} completed via ${result.provider}. Ref: ${result.providerRef}`);

        return {
            success: true,
            provider: result.provider,
            providerRef: result.providerRef,
            message: result.message || "Diamonds delivered successfully!"
        };

    } catch (error: any) {
        console.error(`[Fulfillment] ❌ TxID ${id} failed:`, error.message);

        // Mark transaction as FAILED so admin can retry later
        await prisma.transaction.update({
            where: { id },
            data: { status: TransactionStatus.FAILED },
        }).catch(() => { });

        throw error;
    }
};
