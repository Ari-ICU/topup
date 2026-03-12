import { prisma } from "../lib/prisma.js";
import { TransactionStatus } from "@prisma/client";
import { getActiveProviderBalance, processTopUp } from "./topup-provider.service.js";

// Stock deduction helper
export const deductGlobalStock = async (diamondAmount: number): Promise<void> => {
    await prisma.$transaction(async (tx) => {
        const stock = await tx.globalStock.upsert({
            where: { id: "GLOBAL" },
            update: {},
            create: { id: "GLOBAL", diamonds: -1 }
        });

        // skip if in unlimited mode (-1)
        if (stock.diamonds === -1) {
            console.log(`[Stock] Unlimited mode, skipping deduction for ${diamondAmount} diamonds.`);
            return;
        }

        if (stock.diamonds < diamondAmount) {
            throw new Error(`Global Stock Insufficient: have ${stock.diamonds}, need ${diamondAmount}`);
        }

        const updated = await tx.globalStock.update({
            where: { id: "GLOBAL" },
            data: { diamonds: stock.diamonds - diamondAmount }
        });

        console.log(`[Stock] Deducted ${diamondAmount} diamonds, remaining ${updated.diamonds}`);
    });
};

// Create a new transaction
export const createNewTransaction = async (data: {
    packageId: string;
    playerInfo: any;
    paymentMethod: string;
    userId?: string | null;
}) => {
    // 🛡️ Fail early if packageId is missing or wrong type
    if (!data.packageId || typeof data.packageId !== 'string') {
        throw new Error("Missing or invalid required field: packageId");
    }

    const pkg = await prisma.package.findUnique({
        where: { id: data.packageId },
        include: { game: true },
    });

    if (!pkg) {
        throw new Error(`Package not found: ${data.packageId}`);
    }
    const localStock = await prisma.globalStock.findUnique({ where: { id: "GLOBAL" } });
    if (localStock && localStock.diamonds !== -1 && localStock.diamonds < pkg.amount) {
        throw new Error(`Global Stock Insufficient: only ${localStock.diamonds} left`);
    }

    return await prisma.transaction.create({
        data: {
            packageId: data.packageId,
            playerInfo: data.playerInfo,
            paymentMethod: data.paymentMethod,
            userId: data.userId || null,
            totalAmount: pkg.price,
            status: TransactionStatus.PENDING,
        },
    });
};

// Get transaction by ID
export const getTransactionById = async (id: string) => {
    const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
            package: {
                include: { game: true },
            },
        },
    });

    if (!transaction) throw new Error("Transaction not found");
    return transaction;
};

// Deliver Diamonds (Fulfillment)
export const fulfillTransaction = async (id: string): Promise<{
    success: boolean;
    provider: string;
    providerRef: string;
    message: string;
}> => {
    const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
            package: {
                include: { game: true },
            },
        },
    });

    if (!transaction) throw new Error("Transaction not found");

    if (transaction.status === TransactionStatus.COMPLETED) {
        return {
            success: true,
            provider: "SYSTEM",
            providerRef: transaction.providerRef || "",
            message: "Transaction already completed"
        };
    }

    if (transaction.status === TransactionStatus.FAILED) {
        throw new Error("Cannot fulfill a failed transaction");
    }

    // Set to PROCESSING to prevent races
    await prisma.transaction.update({
        where: { id },
        data: { status: TransactionStatus.PROCESSING },
    });

    try {
        const playerInfo = transaction.playerInfo as { userId?: string; zoneId?: string;[key: string]: any };
        const playerId = playerInfo?.userId || playerInfo?.playerId || "";
        const zoneId = playerInfo?.zoneId;

        const providerSku = (transaction.package as any)?.providerSku as string | undefined;
        if (!providerSku) {
            await prisma.transaction.update({ where: { id }, data: { status: TransactionStatus.FAILED } });
            throw new Error("Package is missing a Provider SKU.");
        }

        // Call provider API
        const inputConfig: any = (transaction.package as any)?.game?.inputConfig || {};
        const categoryId = inputConfig.supplyCategory || inputConfig.moogoldCategory || "50"; // Generic supply category

        const result = await processTopUp({
            transactionId: transaction.id,
            providerSku,
            categoryId,
            playerId,
            zoneId,
            amount: (transaction.package as any)?.amount as number,
            gameSlug: (transaction.package as any)?.game?.slug as string,
        });

        if (!result.success) {
            throw new Error(result.message || "Provider failed.");
        }

        await prisma.transaction.update({
            where: { id },
            data: {
                status: TransactionStatus.COMPLETED,
                providerRef: result.providerRef,
            },
        });

        // Deduct diamond balance
        const deliveredAmount = (transaction.package as any)?.amount as number;
        await deductGlobalStock(deliveredAmount);

        // Emergency backup after success
        const { adminService } = await import("./admin.service.js");
        await adminService.backupData();

        console.log(`[Fulfillment] ✅ TxID ${id} completed via ${result.provider}.`);

        return {
            success: true,
            provider: result.provider,
            providerRef: result.providerRef,
            message: result.message || "Diamonds delivered!"
        };

    } catch (error: any) {
        console.error(`[Fulfillment] ❌ TxID ${id} failed:`, error.message);

        await prisma.transaction.update({
            where: { id },
            data: { status: TransactionStatus.FAILED },
        }).catch(() => { });

        throw error;
    }
};
