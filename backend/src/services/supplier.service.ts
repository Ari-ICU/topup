import { prisma } from "../lib/prisma.js";
import { getSystemSettings } from "../lib/settings.js";

// Friend Supplier Service
// Handles delivery confirmations (push) or automated order placement (request).

export interface SupplierFulfillmentPayload {
    orderId: string;
    status: "success" | "failed" | "pending";
    providerRef?: string;
    message?: string;
    diamonds?: number;
}

export interface SupplierOrderPayload {
    transactionId: string;
    playerId: string;
    zoneId?: string;
    diamonds: number;
    game: string;
}

export interface SupplierOrderResult {
    success: boolean;
    supplierRef: string;
    message: string;
}

// Accept a delivery confirmation (Webhook)
export const processFriendFulfillment = async (
    payload: SupplierFulfillmentPayload
): Promise<{ success: boolean; message: string }> => {
    const { orderId, status, providerRef, message: friendMessage, diamonds } = payload;

    console.log(`[Supplier] Callback: Tx ${orderId}, Status: ${status}, Ref: ${providerRef}`);

    const transaction = await prisma.transaction.findUnique({
        where: { id: orderId },
        include: { package: { include: { game: true } } },
    });

    if (!transaction) throw new Error(`Transaction ${orderId} not found`);

    if (transaction.status === "COMPLETED") {
        return { success: true, message: "Order already completed" };
    }

    if (status === "success") {
        await prisma.transaction.update({
            where: { id: orderId },
            data: {
                status: "COMPLETED",
                providerRef: providerRef || `FRIEND-${Date.now()}`,
            },
        });

        console.log(`[Supplier] ✅ TxID ${orderId} COMPLETED.`);
        return {
            success: true,
            message: `Delivered: ${providerRef || "N/A"}`,
        };
    }

    if (status === "failed") {
        await prisma.transaction.update({
            where: { id: orderId },
            data: { status: "FAILED" },
        });

        console.error(`[Supplier] ❌ TxID ${orderId} FAILED. Reason: ${friendMessage}`);
        return {
            success: false,
            message: friendMessage || "Delivery failed",
        };
    }

    return {
        success: true,
        message: "Order is pending delivery.",
    };
};

// Send an order to the supplier API
export const supplierPlaceOrder = async (
    payload: SupplierOrderPayload
): Promise<SupplierOrderResult> => {
    const settings = await getSystemSettings();
    const friendApiUrl = settings.get("FRIEND_SUPPLIER_API_URL");
    const friendApiKey = settings.get("FRIEND_SUPPLIER_API_KEY");

    // Fallback to manual mode if no API configured
    if (!friendApiUrl || !friendApiKey) {
        console.log(`[Supplier] Manual order: ${payload.transactionId}`);
        return {
            success: true,
            supplierRef: `MANUAL-${payload.transactionId}`,
            message: "Awaiting delivery callback.",
        };
    }

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
                callback_url: process.env.FRIEND_SUPPLIER_CALLBACK_URL || "",
            }),
        });

        const data: any = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `API error: ${response.status}`);
        }

        return {
            success: true,
            supplierRef: data.ref || data.order_id || `FRIEND-${Date.now()}`,
            message: data.message || "Order placed",
        };
    } catch (error: any) {
        console.error("[Supplier] ❌ Order failed:", error.message);
        throw error;
    }
};

// Retrieve Live Balance from Supplier
export const getSupplierBalance = async (): Promise<number> => {
    const settings = await getSystemSettings();
    const friendApiUrl = settings.get("FRIEND_SUPPLIER_API_URL");
    const friendApiKey = settings.get("FRIEND_SUPPLIER_API_KEY");

    if (!friendApiUrl || !friendApiKey) return -1;

    try {
        const baseUrl = friendApiUrl.split('/api/')[0];
        const response = await fetch(`${baseUrl}/api/profile`, {
            method: "GET",
            headers: {
                "X-Api-Key": friendApiKey,
                "Authorization": `Bearer ${friendApiKey}`,
            },
        });

        if (!response.ok) return -1;
        const data: any = await response.json();
        return data.balance ?? data.diamonds ?? data.data?.balance ?? -1;
    } catch { return -1; }
};
