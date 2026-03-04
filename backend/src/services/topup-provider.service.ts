import { createHash } from "crypto";
import { prisma } from "../lib/prisma.js";

/**
 * Top-Up Provider Service
 * Priority order:
 *   1. MooGold  — primary (Cambodia-friendly, SE Asia focused)
 *   2. Digiflazz — fallback (Indonesia / SEA aggregator)
 *   3. Smile.One — fallback (global reseller)
 *   4. Mock     — development only
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

export type ProviderName = "FriendSupplier" | "MooGold" | "Digiflazz" | "SmileOne" | "TestMode" | "None";

export interface ProviderStatus {
    activeProvider: ProviderName;
    isTestMode: boolean;
    isReady: boolean;          // true only when a REAL provider is configured
    missingFields: string[];   // Which .env keys are missing
    warning: string | null;    // Human-readable warning for admin UI
}

export const getProviderStatus = async (): Promise<ProviderStatus> => {
    // 1. Fetch settings from DB to supplement / override .env
    const dbSettings = await prisma.systemSetting.findMany();
    const settings: Record<string, string> = {};
    dbSettings.forEach(s => settings[s.key] = s.value);

    // Helper to get from Env OR DB
    const getVal = (key: string) => process.env[key] || settings[key] || "";

    // Test mode active?
    if (getVal("MOOGOLD_TEST_MODE") === "true") {
        return {
            activeProvider: "TestMode",
            isTestMode: true,
            isReady: false,
            missingFields: [],
            warning: "⚠ TEST MODE is ON — no real diamonds will be delivered. Turn off MOOGOLD_TEST_MODE in settings to go live.",
        };
    }

    // Friend Supplier
    if (getVal("FRIEND_SUPPLIER_API_URL") && getVal("FRIEND_SUPPLIER_API_KEY")) {
        return { activeProvider: "FriendSupplier", isTestMode: false, isReady: true, missingFields: [], warning: null };
    }

    // MooGold
    if (getVal("MOOGOLD_PARTNER_ID") && getVal("MOOGOLD_API_KEY")) {
        return { activeProvider: "MooGold", isTestMode: false, isReady: true, missingFields: [], warning: null };
    }

    // Digiflazz
    if (getVal("DIGIFLAZZ_USERNAME") && getVal("DIGIFLAZZ_API_KEY")) {
        return { activeProvider: "Digiflazz", isTestMode: false, isReady: true, missingFields: [], warning: null };
    }

    // Smile.One
    if (getVal("SMILE_ONE_UID") && getVal("SMILE_ONE_EMAIL") && getVal("SMILE_ONE_API_KEY")) {
        return { activeProvider: "SmileOne", isTestMode: false, isReady: true, missingFields: [], warning: null };
    }

    // Nothing configured
    const missing: string[] = [];
    if (!getVal("MOOGOLD_PARTNER_ID")) missing.push("MOOGOLD_PARTNER_ID");
    if (!getVal("MOOGOLD_API_KEY")) missing.push("MOOGOLD_API_KEY");

    return {
        activeProvider: "None",
        isTestMode: false,
        isReady: false,
        missingFields: missing,
        warning: "🚫 No real diamond provider is configured. Orders CANNOT be fulfilled. Please set up MooGold or another provider in the Settings page.",
    };
};

/**
 * NEW: Fetches the live balance from whichever provider is currently active.
 * Used by the Admin Dashboard to show REAL STOCK from suppliers.
 */
export const getActiveProviderBalance = async (): Promise<number> => {
    const dbSettings = await prisma.systemSetting.findMany();
    const settings: Record<string, string> = {};
    dbSettings.forEach(s => settings[s.key] = s.value);
    const getVal = (key: string) => process.env[key] || settings[key] || "";

    // 1. Friend Supplier
    if (getVal("FRIEND_SUPPLIER_API_URL") && getVal("FRIEND_SUPPLIER_API_KEY")) {
        const { getSupplierBalance } = await import("./supplier.service.js");
        return await getSupplierBalance();
    }

    // 2. MooGold
    const mgId = getVal("MOOGOLD_PARTNER_ID");
    const mgKey = getVal("MOOGOLD_API_KEY");
    if (mgId && mgKey) {
        return await getMooGoldBalance(mgId, mgKey);
    }

    // 3. Digiflazz
    const dfUser = getVal("DIGIFLAZZ_USERNAME");
    const dfKey = getVal("DIGIFLAZZ_API_KEY");
    if (dfUser && dfKey) {
        return await getDigiflazzBalance(dfUser, dfKey);
    }

    // Fallback: Manual stock from local DB table
    const localStock = await prisma.globalStock.findUnique({ where: { id: "GLOBAL" } });
    return localStock?.diamonds ?? 0;
};

// ============================================================================
// Main dispatcher — picks the right provider automatically
// ============================================================================

export const processTopUp = async (request: TopUpRequest): Promise<TopUpResult> => {
    console.log(`[TopUp] Initiating top-up for TxID: ${request.transactionId}, SKU: ${request.providerSku}`);

    // Fetch live settings
    const dbSettings = await prisma.systemSetting.findMany();
    const settings: Record<string, string> = {};
    dbSettings.forEach(s => settings[s.key] = s.value);
    const getVal = (key: string) => process.env[key] || settings[key] || "";

    // ✅ TEST MODE
    if (getVal("MOOGOLD_TEST_MODE") === "true") {
        return await mooGoldTestMode(request, getVal("MOOGOLD_TEST_OUTCOME") || "success");
    }

    // 0. 🤝 Friend Supplier
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

    // 1. MooGold
    const mgId = getVal("MOOGOLD_PARTNER_ID");
    const mgKey = getVal("MOOGOLD_API_KEY");
    if (mgId && mgKey) {
        return await mooGoldTopUp(request, mgId, mgKey);
    }

    // 2. Digiflazz
    const dfUser = getVal("DIGIFLAZZ_USERNAME");
    const dfKey = getVal("DIGIFLAZZ_API_KEY");
    if (dfUser && dfKey) {
        return await digiflazzTopUp(request, dfUser, dfKey);
    }

    // 3. Smile.One
    const s1Uid = getVal("SMILE_ONE_UID");
    const s1Email = getVal("SMILE_ONE_EMAIL");
    const s1Key = getVal("SMILE_ONE_API_KEY");
    if (s1Uid && s1Email && s1Key) {
        return await smileOneTopUp(request, s1Uid, s1Email, s1Key);
    }

    const status = await getProviderStatus();
    console.error(`[TopUp] ❌ BLOCKED: No real provider configured. Status: ${status.activeProvider}. ${status.warning}`);
    throw new Error(
        "NO_PROVIDER: No real diamond provider is configured. " +
        "Please set up MooGold or another provider in the Settings page."
    );
};

// ============================================================================
// 🧪 MOOGOLD TEST MODE — Realistic simulator (no real money, no real API)
// ============================================================================
// Controlled by MOOGOLD_TEST_MODE=true in your .env
// Simulates the full lifecycle: delay → success / failure / insufficient_balance
//
// Control which outcome to test using MOOGOLD_TEST_OUTCOME:
//   "success"             → Order delivered ✅ (default)
//   "failure"             → Provider rejects order ❌
//   "insufficient_balance"→ Your reseller account has no credit 💸
// ============================================================================

const mooGoldTestMode = async (req: TopUpRequest, outcome: string = "success"): Promise<TopUpResult> => {
    const delay = 1500;

    console.log(`\n┌─────────────────────────────────────────────────`);
    console.log(`│ 🧪 MOOGOLD TEST MODE ACTIVE`);
    console.log(`│ TxID:     ${req.transactionId}`);
    console.log(`│ SKU:      ${req.providerSku}`);
    console.log(`│ Player:   ${req.playerId}${req.zoneId ? ` (Zone: ${req.zoneId})` : ""}`);
    console.log(`│ Outcome:  ${outcome.toUpperCase()}`);
    console.log(`│ Delay:    ${delay}ms (simulated network)`);
    console.log(`└─────────────────────────────────────────────────\n`);

    // Simulate realistic network delay
    await new Promise((resolve) => setTimeout(resolve, delay));

    const fakeOrderId = `TEST-MG-${Date.now()}`;

    switch (outcome) {
        case "failure":
            throw new Error(
                "[MooGold TEST] Order rejected by provider: invalid product_id or player not found."
            );

        case "insufficient_balance":
            throw new Error(
                "[MooGold TEST] Insufficient reseller balance. Please top up your MooGold account."
            );

        case "success":
        default:
            return {
                success: true,
                providerRef: fakeOrderId,
                message: `[TEST] ${req.providerSku} delivered to player ${req.playerId}. Order ID: ${fakeOrderId}`,
                provider: "MooGold (Test Mode)",
            };
    }
};

// ============================================================================
// 1. MOOGOLD  (https://moogold.com)
// ============================================================================
// Docs: https://moogold.com/reseller-api/
// Auth: HMAC-SHA256 signature using partner_id + api_key + timestamp
// Products: Search MooGold catalogue for the numeric product_id
//
// For MLBB:  product_id differs by region. Common IDs:
//   - 100 Diamonds  → find in your MooGold dashboard under "Products"
//
// Player fields for MLBB:  { "User ID": "123456", "Zone ID": "(1234)" }
// Player fields for FF:    { "Player ID": "123456" }
// ============================================================================

const mooGoldTopUp = async (req: TopUpRequest, partnerId: string, apiKey: string): Promise<TopUpResult> => {
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Signature: base64( HMAC-SHA256(timestamp, api_key) ) — standard MooGold spec
    const { createHmac } = await import("crypto");
    const signature = createHmac("sha256", apiKey)
        .update(timestamp)
        .digest("base64");

    // Build player-info fields for the game
    // For MLBB the fields are "User ID" and "Zone ID"
    const playerFields: Record<string, string> = {
        "User ID": req.playerId,
    };
    if (req.zoneId) {
        playerFields["Zone ID"] = req.zoneId;
    }

    const payload = {
        product_id: req.providerSku,   // Numeric MooGold product ID (set in your admin)
        quantity: 1,
        partner_order_id: req.transactionId,
        fields: playerFields,
    };

    console.log(`[MooGold] Sending order for product ${req.providerSku} → player ${req.playerId}`);

    try {
        const response = await fetch("https://moogold.com/wp-json/v1/api/order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "partner_id": partnerId,
                "timestamp": timestamp,
                "signature": signature,
            },
            body: JSON.stringify(payload),
        });

        const data: any = await response.json();

        if (!response.ok || data.status === "error" || data.error) {
            const errMsg = data.message || data.error || `HTTP ${response.status}`;
            throw new Error(`MooGold Error: ${errMsg}`);
        }

        return {
            success: true,
            providerRef: String(data.order_id || data.data?.order_id || req.transactionId),
            message: data.message || "Diamonds delivered successfully via MooGold",
            provider: "MooGold",
        };
    } catch (error: any) {
        console.error("[MooGold] Error:", error.message);
        throw error;
    }
};

// ============================================================================
// Helper: Query MooGold order status
// ============================================================================
export const getMooGoldOrderStatus = async (mooGoldOrderId: string) => {
    const partnerId = process.env.MOOGOLD_PARTNER_ID!;
    const apiKey = process.env.MOOGOLD_API_KEY!;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const { createHmac } = await import("crypto");
    const signature = createHmac("sha256", apiKey)
        .update(timestamp)
        .digest("base64");

    const response = await fetch(`https://moogold.com/wp-json/v1/api/order/${mooGoldOrderId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "partner_id": partnerId,
            "timestamp": timestamp,
            "signature": signature,
        },
    });

    const data: any = await response.json();
    return data;
};

// ============================================================================
// 1.1 MOOGOLD Balance Fetch
// ============================================================================
const getMooGoldBalance = async (partnerId: string, apiKey: string): Promise<number> => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const { createHmac } = await import("crypto");
    const signature = createHmac("sha256", apiKey).update(timestamp).digest("base64");

    try {
        const response = await fetch("https://moogold.com/wp-json/v1/api/user/balance", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "partner_id": partnerId,
                "timestamp": timestamp,
                "signature": signature,
            },
            body: JSON.stringify({}),
        });
        const data: any = await response.json();
        return parseFloat(data.balance || data.data?.balance || "0");
    } catch (err) {
        return -1;
    }
};

// ============================================================================
// 2. DIGIFLAZZ  (https://digiflazz.com)
// ============================================================================
// Auth: MD5( username + apiKey + ref_id )
// ============================================================================

const digiflazzTopUp = async (req: TopUpRequest, username: string, apiKey: string): Promise<TopUpResult> => {
    // respect the same test mode as MooGold
    const dbSettings = await prisma.systemSetting.findMany();
    const settings: Record<string, string> = {};
    dbSettings.forEach(s => settings[s.key] = s.value);
    const getVal = (key: string) => process.env[key] || settings[key] || "";

    const isTesting = getVal("MOOGOLD_TEST_MODE") === "true";

    const sign = createHash("md5")
        .update(username + apiKey + req.transactionId)
        .digest("hex");

    const customerNo = req.zoneId
        ? `${req.playerId}${req.zoneId}`
        : req.playerId;

    console.log(`[Digiflazz] Sending SKU ${req.providerSku} → ${customerNo}`);

    try {
        const response = await fetch("https://api.digiflazz.com/v1/transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                buyer_sku_code: req.providerSku,
                customer_no: customerNo,
                ref_id: req.transactionId,
                sign,
                testing: isTesting,
            }),
        });

        const data: any = await response.json();

        if (data.data?.rc && !["00", "03"].includes(data.data.rc)) {
            throw new Error(`Digiflazz Error (${data.data.rc}): ${data.data.message}`);
        }

        return {
            success: true,
            providerRef: data.data?.sn || data.data?.ref_id || "PENDING",
            message: data.data?.message || "Transaction processed by Digiflazz",
            provider: "Digiflazz",
        };
    } catch (error: any) {
        console.error("[Digiflazz] API Error:", error.message);
        throw error;
    }
};

// ============================================================================
// 2.1 DIGIFLAZZ Balance Fetch
// ============================================================================
const getDigiflazzBalance = async (username: string, apiKey: string): Promise<number> => {
    const sign = createHash("md5").update(username + apiKey + "depo").digest("hex");
    try {
        const response = await fetch("https://api.digiflazz.com/v1/cek-saldo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, key: apiKey, sign, cmd: "deposit" }),
        });
        const data: any = await response.json();
        return data.data?.deposit || -1;
    } catch (err) {
        return -1;
    }
};

// ============================================================================
// 3. SMILE.ONE  (https://www.smile.one)
// ============================================================================
// Auth: MD5( uid + email + productid + userid + zoneid + time + apiKey )
// ============================================================================

const smileOneTopUp = async (req: TopUpRequest, uid: string, email: string, apiKey: string): Promise<TopUpResult> => {
    const time = Math.floor(Date.now() / 1000).toString();

    const signString = `${uid}${email}${req.providerSku}${req.playerId}${req.zoneId || ""}${time}${apiKey}`;
    const sign = createHash("md5").update(signString).digest("hex");

    console.log(`[Smile.One] Sending ${req.providerSku} → ${req.playerId}(${req.zoneId || "NoZone"})`);

    const formData = new URLSearchParams();
    formData.append("uid", uid);
    formData.append("email", email);
    formData.append("productid", req.providerSku);
    formData.append("userid", req.playerId);
    if (req.zoneId) formData.append("zoneid", req.zoneId);
    formData.append("time", time);
    formData.append("sign", sign);

    try {
        const response = await fetch("https://www.smile.one/merchant/pay/placeorder", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
        });

        const data: any = await response.json();

        if (data.status !== 200) {
            throw new Error(`Smile.One Error: ${data.message || "Unknown provider error"}`);
        }

        return {
            success: true,
            providerRef: data.orderid || `SMILE-${req.transactionId}`,
            message: "Successfully delivered virtual goods via Smile.One",
            provider: "Smile.One",
        };
    } catch (error: any) {
        console.error("[Smile.One] API Connection Failed:", error.message);
        throw error;
    }
};

// ============================================================================
// 4. MOCK PROVIDER  (development & testing)
// ============================================================================

const mockTopUp = async (req: TopUpRequest): Promise<TopUpResult> => {
    console.log(`[MockProvider] Simulating delivery of ${req.providerSku} → ${req.playerId}(${req.zoneId ?? "N/A"})`);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
        success: true,
        providerRef: "MOCK-" + Math.floor(Math.random() * 10_000_000),
        message: "Virtual goods delivered successfully (Mock/Dev mode)",
        provider: "MockProvider",
    };
};
