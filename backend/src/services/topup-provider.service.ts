import { prisma } from "../lib/prisma.js";
import { getSystemSettings } from "../lib/settings.js";
import { getMooGoldBalance, moogoldPlaceOrder } from "./moogold.service.js";
import { getSupplierBalance, supplierPlaceOrder } from "./supplier.service.js";

/**
 * Top-Up Provider Service
 * Only uses:
 *   1. Friend Supplier — primary diamond delivery (manual / API callback)
 *   2. Local DB Stock  — fallback balance source (manual admin top-up)
 */

// ============================================================================
// Shared Types
// ============================================================================

export interface TopUpRequest {
    transactionId: string; // Your internal transaction ID
    providerSku: string;   // The provider-specific product/SKU ID
    playerId: string;      // Game user ID
    zoneId?: string;       // Optional: server/zone ID (required for MLBB etc.)
    amount: number;        // Diamond amount to deliver
    gameSlug: string;      // e.g. "mobile-legends"
}

export interface TopUpResult {
    success: boolean;
    providerRef: string;   // Provider-side order/reference ID
    message: string;
    provider: string;      // Which provider fulfilled the order
}

// ============================================================================
// Provider Status — used by admin dashboard to show warnings
// ============================================================================

export type ProviderName = "MooGold" | "FriendSupplier" | "None";

export interface ProviderStatus {
    activeProvider: ProviderName;
    isTestMode: boolean;
    isReady: boolean;          // true only when a REAL provider is configured
    missingFields: string[];   // Which .env keys are missing
    warning: string | null;    // Human-readable warning for admin UI
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

    // 2. Check Friend Supplier
    const friendSecret = getVal("FRIEND_SUPPLIER_SECRET");
    if (friendSecret) {
        return {
            activeProvider: "FriendSupplier",
            isTestMode: false,
            isReady: true,
            missingFields: [],
            warning: null,
        };
    }

    // Nothing configured
    return {
        activeProvider: "None",
        isTestMode: false,
        isReady: false,
        missingFields: ["MOOGOLD_PARTNER_ID", "FRIEND_SUPPLIER_SECRET"],
        warning: "🚫 No top-up provider is configured. Please set MooGold or Friend Supplier in settings.",
    };
};

/**
 * Fetches the live balance from whichever source is active.
 */
export const getActiveProviderBalance = async (): Promise<number> => {
    const settings = await getSystemSettings();
    const getVal = (key: string) => settings.get(key);

    // MooGold Balance
    if (getVal("MOOGOLD_PARTNER_ID") && getVal("MOOGOLD_SECRET_KEY")) {
        try {
            return await getMooGoldBalance();
        } catch {
            // fall through
        }
    }

    // Friend Supplier with API URL — fetch live balance
    if (getVal("FRIEND_SUPPLIER_API_URL") && getVal("FRIEND_SUPPLIER_API_KEY")) {
        try {
            return await getSupplierBalance();
        } catch {
            // fall through to local DB
        }
    }

    // Fallback: manual stock from local GlobalStock table
    const localStock = await prisma.globalStock.findUnique({ where: { id: "GLOBAL" } });
    return localStock?.diamonds ?? 0;
};

// ============================================================================
// Main dispatcher
// ============================================================================

export const processTopUp = async (request: TopUpRequest): Promise<TopUpResult> => {
    console.log(`[TopUp] Initiating top-up for TxID: ${request.transactionId}, SKU: ${request.providerSku}`);

    // Fetch live settings
    const settings = await getSystemSettings();
    const getVal = (key: string) => settings.get(key);

    // 1. MooGold Fulfillment (Primary)
    const mooPartner = getVal("MOOGOLD_PARTNER_ID");
    const mooKey = getVal("MOOGOLD_SECRET_KEY");
    if (mooPartner && mooKey && request.providerSku) {
        const result = await moogoldPlaceOrder({
            productId: request.providerSku,
            playerId: request.playerId,
            serverId: request.zoneId,
            transactionId: request.transactionId
        });

        if (result.success) {
            return {
                success: true,
                providerRef: result.orderId,
                message: result.message,
                provider: "MooGold"
            };
        }
        // If MooGold fails but it was supposed to be the provider, we return failure
        return {
            success: false,
            providerRef: result.orderId || "",
            message: result.message,
            provider: "MooGold"
        };
    }

    // 2. 🤝 Friend Supplier (with API endpoint)
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
            providerRef: result.supplierRef,
            message: result.message,
            provider: "FriendSupplier",
        };
    }

    // 3. 🤝 Friend Supplier — callback / manual mode
    const friendSecret = getVal("FRIEND_SUPPLIER_SECRET");
    if (friendSecret) {
        console.log(`[FriendSupplier] Manual/Callback mode — TxID ${request.transactionId} queued for friend delivery.`);
        return {
            success: true,
            providerRef: `FRIEND-MANUAL-${request.transactionId}`,
            message: "Order queued for diamond delivery via Friend Supplier. Admin will confirm when delivered.",
            provider: "FriendSupplier",
        };
    }

    // No provider configured
    const status = await getProviderStatus();
    console.error(`[TopUp] ❌ BLOCKED: No provider configured. ${status.warning}`);
    throw new Error(
        "NO_PROVIDER: No top-up provider is configured. " +
        "Please add credentials in the Settings page."
    );
};
