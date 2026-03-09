import { prisma } from "../lib/prisma.js";
import { getSystemSettings } from "../lib/settings.js";
import { getMooGoldBalance, moogoldPlaceOrder } from "./moogold.service.js";
import { getSupplierBalance, supplierPlaceOrder } from "./supplier.service.js";

// Top-Up Provider Service
// Manages diamond delivery via MooGold, Friend Supplier (API/Manual), or local stock.

export interface TopUpRequest {
    transactionId: string;
    providerSku: string;
    categoryId?: string; // Add optional categoryId for MooGold
    playerId: string;
    zoneId?: string;
    amount: number;
    gameSlug: string;
}

export interface TopUpResult {
    success: boolean;
    providerRef: string;
    message: string;
    provider: string;
}

export type ProviderName = "MooGold" | "FriendSupplier" | "None";

export interface ProviderStatus {
    activeProvider: ProviderName;
    isTestMode: boolean;
    isReady: boolean;
    missingFields: string[];
    warning: string | null;
}

export const getProviderStatus = async (): Promise<ProviderStatus> => {
    const settings = await getSystemSettings();
    const getVal = (key: string) => settings.get(key);

    // 1. Check MooGold
    const mooPartner = getVal("MOOGOLD_PARTNER_ID");
    const mooKey = getVal("MOOGOLD_SECRET_KEY");
    if (mooPartner && mooKey) {
        return {
            activeProvider: "MooGold",
            isTestMode: false,
            isReady: true,
            missingFields: [],
            warning: null,
        };
    }

    // 2. Check Friend Supplier API
    const supplierUrl = getVal("FRIEND_SUPPLIER_API_URL");
    const supplierKey = getVal("FRIEND_SUPPLIER_API_KEY");
    if (supplierUrl && supplierKey) {
        return {
            activeProvider: "FriendSupplier",
            isTestMode: false,
            isReady: true,
            missingFields: [],
            warning: null,
        };
    }

    // 3. Fallback to Local Wallet
    return {
        activeProvider: "FriendSupplier",
        isTestMode: false,
        isReady: true,
        missingFields: [],
        warning: "ℹ️ Operating in Manual Mode (Local Wallet).",
    };
};

// Fetches balance from active provider
export const getProviderWalletBalance = async (): Promise<number> => {
    const settings = await getSystemSettings();
    const getVal = (key: string) => settings.get(key);

    if (getVal("MOOGOLD_PARTNER_ID") && getVal("MOOGOLD_SECRET_KEY")) {
        try {
            return await getMooGoldBalance();
        } catch {
            return 0;
        }
    }

    if (getVal("FRIEND_SUPPLIER_API_URL") && getVal("FRIEND_SUPPLIER_API_KEY")) {
        try {
            const balance = await getSupplierBalance();
            return balance === -1 ? 0 : balance;
        } catch {
            return 0;
        }
    }

    const stock = await prisma.globalStock.findUnique({ where: { id: "GLOBAL" } });
    return Number(stock?.providerBalance) || 0;
};

// Fetches manual diamond stock from local DB
export const getLocalDiamondStock = async (): Promise<number> => {
    const localStock = await prisma.globalStock.findUnique({ where: { id: "GLOBAL" } });
    return localStock?.diamonds ?? 0;
};

// Fetches live balance (Legacy support)
export const getActiveProviderBalance = async (): Promise<number> => {
    const wallet = await getProviderWalletBalance();
    if (wallet > 0) return wallet;
    return await getLocalDiamondStock();
};

// --- Main dispatcher ---
export const processTopUp = async (request: TopUpRequest): Promise<TopUpResult> => {
    console.log(`[TopUp] Initiating: TxID ${request.transactionId}, SKU ${request.providerSku}`);

    const settings = await getSystemSettings();
    const getVal = (key: string) => settings.get(key);

    // 1. MooGold Fulfillment
    const mooPartner = getVal("MOOGOLD_PARTNER_ID");
    const mooKey = getVal("MOOGOLD_SECRET_KEY");
    if (mooPartner && mooKey && request.providerSku) {
        const result = await moogoldPlaceOrder({
            productId: request.providerSku,
            categoryId: request.categoryId || "50", // Fallback to 50 if missing (often works for direct top up, but not all games)
            playerId: request.playerId,
            serverId: request.zoneId,
            transactionId: request.transactionId
        });

        return {
            success: result.success,
            providerRef: result.orderId || null as any,
            message: result.message,
            provider: "MooGold"
        };
    }

    // 2. Friend Supplier API
    const friendUrl = getVal("FRIEND_SUPPLIER_API_URL");
    const friendKey = getVal("FRIEND_SUPPLIER_API_KEY");
    if (friendUrl && friendKey) {
        const result = await supplierPlaceOrder({
            transactionId: request.transactionId,
            playerId: request.playerId,
            zoneId: request.zoneId,
            diamonds: request.amount,
            game: request.gameSlug,
        });
        return {
            success: result.success,
            providerRef: result.supplierRef || null as any,
            message: result.message,
            provider: "FriendSupplier",
        };
    }

    // 3. Friend Supplier Manual/Callback mode
    const friendSecret = getVal("FRIEND_SUPPLIER_SECRET");
    if (friendSecret) {
        console.log(`[FriendSupplier] Manual mode — TxID ${request.transactionId} queued.`);
        return {
            success: true,
            providerRef: `FRIEND-MANUAL-${request.transactionId}`,
            message: "Order queued for diamond delivery via Friend Supplier.",
            provider: "FriendSupplier",
        };
    }

    const status = await getProviderStatus();
    console.error(`[TopUp] ❌ BLOCKED: No provider configured. ${status.warning}`);
    throw new Error("NO_PROVIDER: Please add credentials in Settings.");
};
