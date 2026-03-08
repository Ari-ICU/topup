import crypto from "crypto";
import axios from "axios";
import { getSystemSettings } from "../lib/settings.js";

// Fetch MooGold Product Catalog
export const getMooGoldProductList = async (): Promise<any[]> => {
    const settings = await getSystemSettings();
    const partnerId = settings.get("MOOGOLD_PARTNER_ID");
    const secretKey = settings.get("MOOGOLD_SECRET_KEY");

    if (!partnerId || !secretKey) {
        throw new Error("MooGold credentials not found.");
    }

    try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const payloadObj = {
            path: "product/list_product",
            category_id: 50
        };
        const payloadStr = JSON.stringify(payloadObj);
        const signatureString = payloadStr + timestamp + "product/list_product";

        const authSignature = crypto.createHmac("sha256", secretKey).update(signatureString).digest("hex");
        const authHeader = "Basic " + Buffer.from(`${partnerId}:${secretKey}`).toString("base64");

        const response = await axios.post("https://moogold.com/wp-json/v1/api/product/list_product", payloadObj, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": authHeader,
                "auth": authSignature,
                "timestamp": timestamp,
                "User-Agent": "MooGold-Node-Integration"
            },
            timeout: 10000,
            validateStatus: () => true
        });

        const data = response.data;
        console.log("[MooGold] Product list data:", JSON.stringify(data));

        if (response.status >= 200 && response.status < 300) {
            if (data && (Array.isArray(data) || data.data)) {
                return Array.isArray(data) ? data : (data.data || []);
            }
        }

        if (response.status === 403 || (typeof data === 'string' && data.includes("Cloudflare"))) {
            throw new Error("Access denied by Provider Firewall.");
        }

        throw new Error(data?.message || `MooGold error: ${response.status}`);

    } catch (error: any) {
        console.error("[MooGold] Sync failed:", error.message);
        throw new Error(error.response?.data?.message || error.message);
    }
};

// Fetch packages for a specific game ID
export const getMooGoldGamePackages = async (mooGoldGameId: string | number): Promise<any> => {
    const settings = await getSystemSettings();
    const partnerId = settings.get("MOOGOLD_PARTNER_ID");
    const secretKey = settings.get("MOOGOLD_SECRET_KEY");

    if (!partnerId || !secretKey) {
        throw new Error("MooGold credentials not found.");
    }

    try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const payloadObj = {
            path: "product/product_detail",
            product_id: mooGoldGameId
        };
        const payloadStr = JSON.stringify(payloadObj);
        const signatureString = payloadStr + timestamp + "product/product_detail";

        const authSignature = crypto.createHmac("sha256", secretKey).update(signatureString).digest("hex");
        const authHeader = "Basic " + Buffer.from(`${partnerId}:${secretKey}`).toString("base64");

        const response = await axios.post("https://moogold.com/wp-json/v1/api/product/product_detail", payloadObj, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": authHeader,
                "auth": authSignature,
                "timestamp": timestamp,
                "User-Agent": "MooGold-Node-Integration"
            },
            timeout: 10000,
            validateStatus: () => true
        });

        if (response.status >= 200 && response.status < 300) {
            return response.data;
        }

        throw new Error(response.data?.message || `MooGold error: ${response.status}`);
    } catch (error: any) {
        console.error(`[MooGold] Fetching packages for ${mooGoldGameId} failed:`, error.message);
        throw new Error(error.response?.data?.message || error.message);
    }
};

// Place an order with MooGold
export const moogoldPlaceOrder = async (orderData: {
    productId: string;
    playerId: string;
    serverId?: string;
    transactionId: string;
}): Promise<{ success: boolean; orderId: string; message: string }> => {
    const settings = await getSystemSettings();
    const partnerId = settings.get("MOOGOLD_PARTNER_ID");
    const secretKey = settings.get("MOOGOLD_SECRET_KEY");

    if (!partnerId || !secretKey) throw new Error("MooGold credentials missing.");

    try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const path = "order/create_order";

        const payloadObj = {
            path,
            data: {
                product_id: orderData.productId,
                quantity: 1,
                player_id: orderData.playerId,
                server_id: orderData.serverId || "",
            }
        };

        // Format signature payload using JSON.stringify to exactly match axios serialization
        const payloadStr = JSON.stringify(payloadObj);
        const signatureString = payloadStr + timestamp + path;

        const authSignature = crypto.createHmac("sha256", secretKey).update(signatureString).digest("hex");
        const authHeader = "Basic " + Buffer.from(`${partnerId}:${secretKey}`).toString("base64");

        const response = await axios.post("https://moogold.com/wp-json/v1/api/order/create_order", payloadObj, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": authHeader,
                "auth": authSignature,
                "timestamp": timestamp,
                "User-Agent": "MooGold-Node-Integration"
            },
            timeout: 15000,
            validateStatus: () => true
        });

        const data = response.data;

        if (response.status === 200 && data.status === "success") {
            return {
                success: true,
                orderId: data.order_id?.toString() || orderData.transactionId,
                message: data.message || "Order placed"
            };
        }

        return {
            success: false,
            orderId: data.order_id?.toString() || "",
            message: data.message || `Error: ${response.status}`
        };

    } catch (error: any) {
        console.error("[MooGold] Order failed:", error.message);
        return {
            success: false,
            orderId: "",
            message: error.message || "Connection failed"
        };
    }
};

// Fetch Reseller Balance
export const getMooGoldBalance = async (): Promise<number> => {
    const settings = await getSystemSettings();
    const partnerId = settings.get("MOOGOLD_PARTNER_ID");
    const secretKey = settings.get("MOOGOLD_SECRET_KEY");

    if (!partnerId || !secretKey) return 0;

    try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const path = "user/balance";
        const payloadObj = { path };

        // Match MooGold format exactly:
        const payloadStr = JSON.stringify(payloadObj);
        const signatureString = payloadStr + timestamp + path;

        const authSignature = crypto.createHmac("sha256", secretKey).update(signatureString).digest("hex");
        const authHeader = "Basic " + Buffer.from(`${partnerId}:${secretKey}`).toString("base64");

        const response = await axios.post("https://moogold.com/wp-json/v1/api/user/balance", payloadObj, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": authHeader,
                "auth": authSignature,
                "timestamp": timestamp,
                "User-Agent": "MooGold-Node-Integration"
            },
            timeout: 10000,
            validateStatus: () => true
        });

        if (response.status === 200) {
            if (response.data?.balance) {
                return parseFloat(response.data.balance);
            }
            if (response.data?.err_code === "403") {
                console.warn("[MooGold] Balance 403: Account not authorized for API yet.");
            }
        }
        return 0;
    } catch (error: any) {
        console.error("[MooGold] Balance request failed:", error.message);
        return 0;
    }
};
