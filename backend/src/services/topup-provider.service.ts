import { prisma } from "../lib/prisma.js";
import { getSystemSettings } from "../lib/settings.js";
import { getSupplyBalance, executeSupplyOrder } from "./supply.service.js";

// Top-Up Provider Service
// Manages diamond delivery via MooGold or local stock.

export interface TopUpRequest {
    transactionId: string;
    providerSku: string;
    categoryId?: string; // Optional supply category
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

export type ProviderName = "SupplyEngine" | "None";

export interface ProviderStatus {
    activeProvider: ProviderName;
    isTestMode: boolean;
    isReady: boolean;
    missingFields: string[];
    warning: string | null;
    showResellerCta: boolean;
}

export const getProviderStatus = async (): Promise<ProviderStatus> => {
    const settings = await getSystemSettings();
    const getVal = (key: string) => settings.get(key);

    // 1. Check MooGold
    const mooActive = getVal("ENABLE_MOOGOLD") === "true";
    const mooPartner = getVal("MOOGOLD_PARTNER_ID");
    const mooKey = getVal("MOOGOLD_SECRET_KEY");
    if (mooActive && mooPartner && mooKey) {
        return {
            activeProvider: "SupplyEngine",
            isTestMode: false,
            isReady: true,
            missingFields: [],
            warning: null,
            showResellerCta: getVal("SHOW_RESELLER_CTA") !== "false", // Default to true if not set
        };
    }

    // 2. Fallback to Local Wallet
    return {
        activeProvider: "None",
        isTestMode: false,
        isReady: true,
        missingFields: [],
        warning: "ℹ️ Operating in Manual Mode (Local Wallet).",
        showResellerCta: getVal("SHOW_RESELLER_CTA") !== "false",
    };
};

// Fetches balance from active provider
export const getProviderWalletBalance = async (): Promise<number> => {
    const settings = await getSystemSettings();
    const getVal = (key: string) => settings.get(key);

    const mooActive = getVal("ENABLE_MOOGOLD") === "true";
    if (mooActive && getVal("MOOGOLD_PARTNER_ID") && getVal("MOOGOLD_SECRET_KEY")) {
        try {
            const liveBalance = await getSupplyBalance() as any;
            if (liveBalance !== null && liveBalance !== undefined) return liveBalance;
            
            // If live balance is null (error), fallback to DB
            console.warn("[ProviderService] Live balance check failed (null), falling back to cache.");
            const stock = await prisma.globalStock.findUnique({ where: { id: "GLOBAL" } });
            return Number(stock?.providerBalance) || 0;
        } catch (err) {
            console.error("[ProviderService] Live balance check threw, falling back to cache.");
            const stock = await prisma.globalStock.findUnique({ where: { id: "GLOBAL" } });
            return Number(stock?.providerBalance) || 0;
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
    const mooActive = getVal("ENABLE_MOOGOLD") === "true";
    const mooPartner = getVal("MOOGOLD_PARTNER_ID");
    const mooKey = getVal("MOOGOLD_SECRET_KEY");
    if (mooActive && mooPartner && mooKey && request.providerSku) {
        const result = await executeSupplyOrder({
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
            provider: "SupplyEngine"
        };
    }

    // 2. Local Wallet/Manual Mode
    return {
        success: true,
        providerRef: `MANUAL-${request.transactionId}`,
        message: "Order placed. Awaiting manual fulfillment from local stock.",
        provider: "None",
    };
};
