import { prisma } from "../lib/prisma.js";

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

export type ProviderName = "FriendSupplier" | "None";

export interface ProviderStatus {
    activeProvider: ProviderName;
    isTestMode: boolean;
    isReady: boolean;          // true only when a REAL provider is configured
    missingFields: string[];   // Which .env keys are missing
    warning: string | null;    // Human-readable warning for admin UI
}

export const getProviderStatus = async (): Promise<ProviderStatus> => {
    // Fetch settings from DB to supplement / override .env
    const dbSettings = await prisma.systemSetting.findMany();
    const settings: Record<string, string> = {};
    dbSettings.forEach(s => settings[s.key] = s.value);

    // Helper to get from Env OR DB
    const getVal = (key: string) => process.env[key] || settings[key] || "";

    // Friend Supplier — requires at minimum a shared secret
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
        missingFields: ["FRIEND_SUPPLIER_SECRET"],
        warning: "🚫 Friend Supplier is not configured. Please set FRIEND_SUPPLIER_SECRET in the Settings page.",
    };
};

/**
 * Fetches the live balance from whichever source is active.
 * Friend Supplier API (if configured with URL+Key) or falls back to local GlobalStock DB.
 */
export const getActiveProviderBalance = async (): Promise<number> => {
    const dbSettings = await prisma.systemSetting.findMany();
    const settings: Record<string, string> = {};
    dbSettings.forEach(s => settings[s.key] = s.value);
    const getVal = (key: string) => process.env[key] || settings[key] || "";

    // Friend Supplier with API URL — fetch live balance
    if (getVal("FRIEND_SUPPLIER_API_URL") && getVal("FRIEND_SUPPLIER_API_KEY")) {
        try {
            const { getSupplierBalance } = await import("./supplier.service.js");
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
// Main dispatcher — uses Friend Supplier only
// ============================================================================

export const processTopUp = async (request: TopUpRequest): Promise<TopUpResult> => {
    console.log(`[TopUp] Initiating top-up for TxID: ${request.transactionId}, SKU: ${request.providerSku}`);

    // Fetch live settings
    const dbSettings = await prisma.systemSetting.findMany();
    const settings: Record<string, string> = {};
    dbSettings.forEach(s => settings[s.key] = s.value);
    const getVal = (key: string) => process.env[key] || settings[key] || "";

    // 🤝 Friend Supplier (with API endpoint)
    const friendUrl = getVal("FRIEND_SUPPLIER_API_URL");
    const friendKey = getVal("FRIEND_SUPPLIER_API_KEY");
    if (friendUrl && friendKey) {
        const { supplierPlaceOrder } = await import("./supplier.service.js");
        const result = await supplierPlaceOrder({
            transactionId: request.transactionId,
            playerId: request.playerId,
            zoneId: request.zoneId,
            diamonds: 0,
            game: "mobile-legends",
        });
        return {
            success: result.success,
            providerRef: result.supplierRef,
            message: result.message,
            provider: "FriendSupplier",
        };
    }

    // 🤝 Friend Supplier — callback / manual mode (secret set but no outbound API)
    // Order is logged and admin confirms delivery manually via the admin dashboard.
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
        "NO_PROVIDER: Friend Supplier is not configured. " +
        "Please add FRIEND_SUPPLIER_SECRET in the Settings page."
    );
};
