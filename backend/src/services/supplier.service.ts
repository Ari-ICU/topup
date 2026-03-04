import { prisma } from "../lib/prisma.js";

// ============================================================================
//  Friend Supplier Service
//  This handles the case where YOUR FRIEND (diamond supplier) calls YOUR
//  website to say: "I have delivered diamonds for Order #XYZ"
//
//  Two modes your friend can use:
//
//  MODE A — Friend PUSHES a delivery confirmation (webhook / callback)
//    → Your friend calls:  POST /api/supplier/fulfill
//    → Your friend sends:  { orderId, status, providerRef, message }
//
//  MODE B — Your website REQUESTS diamonds from your friend (order placement)
//    → Your backend calls: supplierPlaceOrder(...)
//    → Your friend's API receives the order and delivers diamonds
// ============================================================================

export interface SupplierFulfillmentPayload {
    orderId: string;         // Your internal transaction ID (txn_xxxxx)
    status: "success" | "failed" | "pending";
    providerRef?: string;    // Your friend's reference/order number
    message?: string;        // Optional message from your friend
    diamonds?: number;       // How many diamonds were delivered
}

export interface SupplierOrderPayload {
    transactionId: string;
    playerId: string;
    zoneId?: string;
    diamonds: number;        // How many diamonds to deliver
    game: string;            // e.g. "mobile-legends", "free-fire"
}

export interface SupplierOrderResult {
    success: boolean;
    supplierRef: string;     // Your friend's reference number
    message: string;
}

// ============================================================================
//  MODE A: Accept a delivery confirmation FROM your friend (webhook)
// ============================================================================

export const processFriendFulfillment = async (
    payload: SupplierFulfillmentPayload
): Promise<{ success: boolean; message: string }> => {

    const { orderId, status, providerRef, message: friendMessage, diamonds } = payload;

    console.log(`\n┌─────────────────────────────────────────────────────`);
    console.log(`│ 📦 FRIEND SUPPLIER CALLBACK RECEIVED`);
    console.log(`│ Order ID:    ${orderId}`);
    console.log(`│ Status:      ${status}`);
    console.log(`│ Ref:         ${providerRef ?? "N/A"}`);
    console.log(`│ Diamonds:    ${diamonds ?? "N/A"}`);
    console.log(`│ Message:     ${friendMessage ?? "N/A"}`);
    console.log(`└─────────────────────────────────────────────────────\n`);

    // 1. Find the transaction
    const transaction = await prisma.transaction.findUnique({
        where: { id: orderId },
        include: { package: { include: { game: true } } },
    });

    if (!transaction) {
        console.error(`[Supplier] ❌ Transaction ${orderId} not found`);
        throw new Error(`Transaction ${orderId} not found`);
    }

    // 2. Prevent double-fulfillment
    if (transaction.status === "COMPLETED") {
        console.warn(`[Supplier] ⚠️  Transaction ${orderId} already completed — ignoring duplicate callback`);
        return { success: true, message: "Order already completed — no action taken" };
    }

    // 3. Process based on status
    if (status === "success") {
        // Mark transaction as COMPLETED
        await prisma.transaction.update({
            where: { id: orderId },
            data: {
                status: "COMPLETED",
                providerRef: providerRef ?? `FRIEND-${Date.now()}`,
            },
        });

        console.log(`[Supplier] ✅ TxID ${orderId} marked COMPLETED. Ref: ${providerRef}`);
        return {
            success: true,
            message: `Diamonds delivered successfully! Ref: ${providerRef ?? "N/A"}`,
        };
    }

    if (status === "failed") {
        // Mark transaction as FAILED
        await prisma.transaction.update({
            where: { id: orderId },
            data: { status: "FAILED" },
        });

        console.error(`[Supplier] ❌ TxID ${orderId} marked FAILED. Reason: ${friendMessage}`);
        return {
            success: false,
            message: friendMessage ?? "Delivery failed — please contact your supplier",
        };
    }

    // pending — just log, no status change yet
    console.log(`[Supplier] ⏳ TxID ${orderId} is PENDING delivery from supplier`);
    return {
        success: true,
        message: "Order is pending delivery. Awaiting confirmation.",
    };
};

// ============================================================================
//  MODE B: YOUR website sends an order TO your friend's system
//  Use this if your friend has their own API and you want to auto-send orders
// ============================================================================

export const supplierPlaceOrder = async (
    payload: SupplierOrderPayload
): Promise<SupplierOrderResult> => {

    const friendApiUrl = process.env.FRIEND_SUPPLIER_API_URL;
    const friendApiKey = process.env.FRIEND_SUPPLIER_API_KEY;

    if (!friendApiUrl || !friendApiKey) {
        console.warn("[Supplier] ⚠️  FRIEND_SUPPLIER_API_URL or FRIEND_SUPPLIER_API_KEY not set in .env — using manual mode");
        // In manual mode, just log — your friend will call you back via webhook
        console.log(`[Supplier] 📋 Manual order created for TxID: ${payload.transactionId}`);
        return {
            success: true,
            supplierRef: `MANUAL-${payload.transactionId}`,
            message: "Order sent to friend manually. Awaiting their delivery callback.",
        };
    }

    console.log(`[Supplier] 📤 Sending order to friend's API: ${friendApiUrl}`);
    console.log(`[Supplier] → Game: ${payload.game}, Diamonds: ${payload.diamonds}, Player: ${payload.playerId}`);

    try {
        const response = await fetch(friendApiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": friendApiKey,
                "Authorization": `Bearer ${friendApiKey}`,
            },
            body: JSON.stringify({
                order_id: payload.transactionId,
                game: payload.game,
                player_id: payload.playerId,
                zone_id: payload.zoneId,
                diamonds: payload.diamonds,
                callback_url: process.env.FRIEND_SUPPLIER_CALLBACK_URL ?? "",
            }),
        });

        const data: any = await response.json();

        if (!response.ok) {
            throw new Error(data.message ?? `Friend API error: HTTP ${response.status}`);
        }

        return {
            success: true,
            supplierRef: data.ref ?? data.order_id ?? data.reference ?? `FRIEND-${Date.now()}`,
            message: data.message ?? "Order placed with your friend successfully",
        };
    } catch (error: any) {
        console.error("[Supplier] ❌ Failed to send order to friend:", error.message);
        throw error;
    }
};

// ============================================================================
//  MODE C: Retrieve Live Balance from Friend Supplier
// ============================================================================
export const getSupplierBalance = async (): Promise<number> => {
    const friendApiUrl = process.env.FRIEND_SUPPLIER_API_URL;
    const friendApiKey = process.env.FRIEND_SUPPLIER_API_KEY;

    if (!friendApiUrl || !friendApiKey) {
        return -1; // -1 represents unknown / manual mode
    }

    try {
        // We assume your friend's API exposes a /profile or /balance endpoint.
        const baseUrl = friendApiUrl.split('/api/')[0]; // Attempt to extract base URL
        const response = await fetch(`${baseUrl}/api/profile`, {
            method: "GET",
            headers: {
                "X-Api-Key": friendApiKey,
                "Authorization": `Bearer ${friendApiKey}`,
            },
        });

        if (!response.ok) {
            return -1;
        }

        const data: any = await response.json();
        // Fallback checks for common balance keys
        return data.balance ?? data.diamonds ?? data.data?.balance ?? -1;
    } catch (error) {
        console.error("[Supplier] ⚠️ Failed to fetch live balance:", error);
        return -1;
    }
};
