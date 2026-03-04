import crypto from "crypto";
import axios from "axios";
import { prisma } from "../lib/prisma.js";

/**
 * Fetch MooGold Product Catalog (extracting pids/providerSkus)
 */
export const getMooGoldProductList = async (): Promise<any[]> => {
    const { getSystemSettings } = await import("../lib/settings.js");
    const settings = await getSystemSettings();

    const partnerId = settings.get("MOOGOLD_PARTNER_ID");
    const secretKey = settings.get("MOOGOLD_SECRET_KEY");

    if (!partnerId || !secretKey) {
        throw new Error("MooGold credentials (MOOGOLD_PARTNER_ID / MOOGOLD_SECRET_KEY) not found in settings.");
    }

    try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const path = "v1/api/product/list_product";
        const payloadObj = {
            path: path,
            category: "50" // 50 = Direct-top up
        };
        const payload = JSON.stringify(payloadObj);

        // MooGold Auth Signature: HMAC SHA256 of Payload + Timestamp + Path using Secret Key
        const signatureString = payload + timestamp + path;
        const authSignature = crypto.createHmac("sha256", secretKey).update(signatureString).digest("hex");

        // MooGold Basic Auth: Base64 of PartnerId:SecretKey
        const authHeader = "Basic " + Buffer.from(`${partnerId}:${secretKey}`).toString("base64");

        const response = await axios.post("https://moogold.com/wp-json/v1/api/product/list_product", payloadObj, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": authHeader,
                "auth_signature": authSignature,
                "timestamp": timestamp,
                // Add a standard User-Agent to help bypass simple WAF checks
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            timeout: 10000,
            validateStatus: () => true // Handle errors manually to capture body content
        });

        const data = response.data;

        if (response.status >= 200 && response.status < 300) {
            if (data && (Array.isArray(data) || data.data)) {
                return Array.isArray(data) ? data : (data.data || []);
            }
        }

        // Handle specific error cases (e.g., Cloudflare 403)
        if (response.status === 403 || (typeof data === 'string' && data.includes("Cloudflare"))) {
            throw new Error("Access denied by Provider Firewall. Please ensure your credentials are valid and account is active.");
        }

        const errorMessage = data?.message || `MooGold API error (Status: ${response.status})`;
        throw new Error(errorMessage);

    } catch (error: any) {
        console.error("[MooGold] Sync failed:", error.message);
        // Clean error message for the frontend
        const cleanMessage = error.response?.data?.message || error.message;
        throw new Error(cleanMessage || "MooGold sync failed. Please check credentials or API status.");
    }
};

/**
 * Place an order with MooGold
 */
export const moogoldPlaceOrder = async (orderData: {
    productId: string;
    playerId: string;
    serverId?: string;
    transactionId: string;
}): Promise<{ success: boolean; orderId: string; message: string }> => {
    const { getSystemSettings } = await import("../lib/settings.js");
    const settings = await getSystemSettings();

    const partnerId = settings.get("MOOGOLD_PARTNER_ID");
    const secretKey = settings.get("MOOGOLD_SECRET_KEY");

    if (!partnerId || !secretKey) {
        throw new Error("MooGold credentials missing.");
    }

    try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const path = "v1/api/order/create_order";

        // MooGold payload structure for orders
        const payloadObj = {
            path: path,
            data: {
                product_id: orderData.productId,
                quantity: 1,
                player_id: orderData.playerId,
                server_id: orderData.serverId || "",
                // Note: Some games use zone_id, some server_id. 
                // We'll pass both safely if needed or map them.
            }
        };
        const payload = JSON.stringify(payloadObj);

        const signatureString = payload + timestamp + path;
        const authSignature = crypto.createHmac("sha256", secretKey).update(signatureString).digest("hex");
        const authHeader = "Basic " + Buffer.from(`${partnerId}:${secretKey}`).toString("base64");

        const response = await axios.post("https://moogold.com/wp-json/v1/api/order/create_order", payloadObj, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": authHeader,
                "auth_signature": authSignature,
                "timestamp": timestamp,
                "User-Agent": "Mozilla/5.0"
            },
            timeout: 15000,
            validateStatus: () => true
        });

        const data = response.data;

        if (response.status === 200 && data.status === "success") {
            return {
                success: true,
                orderId: data.order_id?.toString() || orderData.transactionId,
                message: data.message || "Order placed successfully"
            };
        }

        return {
            success: false,
            orderId: data.order_id?.toString() || "",
            message: data.message || `MooGold error: ${response.status}`
        };

    } catch (error: any) {
        console.error("[MooGold] Order failed:", error.message);
        return {
            success: false,
            orderId: "",
            message: error.message || "MooGold API connection failed"
        };
    }
};

/**
 * Fetch Reseller Balance from MooGold
 */
export const getMooGoldBalance = async (): Promise<number> => {
    const { getSystemSettings } = await import("../lib/settings.js");
    const settings = await getSystemSettings();

    const partnerId = settings.get("MOOGOLD_PARTNER_ID");
    const secretKey = settings.get("MOOGOLD_SECRET_KEY");

    if (!partnerId || !secretKey) return 0;

    try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const path = "v1/api/user/balance";
        const payloadObj = { path: path };
        const payload = JSON.stringify(payloadObj);

        const signatureString = payload + timestamp + path;
        const authSignature = crypto.createHmac("sha256", secretKey).update(signatureString).digest("hex");
        const authHeader = "Basic " + Buffer.from(`${partnerId}:${secretKey}`).toString("base64");

        const response = await axios.post("https://moogold.com/wp-json/v1/api/user/balance", payloadObj, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": authHeader,
                "auth_signature": authSignature,
                "timestamp": timestamp,
                "User-Agent": "Mozilla/5.0"
            },
            timeout: 10000,
            validateStatus: () => true
        });

        if (response.status === 200 && response.data?.balance) {
            return parseFloat(response.data.balance);
        }
        return 0;
    } catch {
        return 0;
    }
};
