import { prisma } from "../lib/prisma.js";
import { TransactionStatus } from "@prisma/client";
import { getActiveProviderBalance } from "./topup-provider.service.js";

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
