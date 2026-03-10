import crypto from "crypto";
import axios from "axios";
import { getSystemSettings } from "../lib/settings.js";

// Fetch Master Supply Product Catalog
export const getProviderProductList = async (): Promise<any[]> => {
    const settings = await getSystemSettings();
    const partnerId = settings.get("MOOGOLD_PARTNER_ID");
    const secretKey = settings.get("MOOGOLD_SECRET_KEY");

    if (!partnerId || !secretKey) {
        throw new Error("Supply credentials not found.");
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
        console.log("[Supply] Product list data:", JSON.stringify(data));

        if (response.status >= 200 && response.status < 300) {
            if (data && (Array.isArray(data) || data.data)) {
                return Array.isArray(data) ? data : (data.data || []);
            }
        }

        if (response.status === 403 || (typeof data === 'string' && data.includes("Cloudflare"))) {
            throw new Error("Access denied by Provider Firewall.");
        }

        throw new Error(data?.message || `Supply provider error: ${response.status}`);

    } catch (error: any) {
        console.error("[Supply] Sync failed:", error.message);
        throw new Error(error.response?.data?.message || error.message);
    }
};

// Fetch packages for a specific game ID from supply
export const getProviderGamePackages = async (supplyProductId: string | number): Promise<any> => {
    const settings = await getSystemSettings();
    const partnerId = settings.get("MOOGOLD_PARTNER_ID");
    const secretKey = settings.get("MOOGOLD_SECRET_KEY");

    if (!partnerId || !secretKey) {
        throw new Error("Supply credentials not found.");
    }

    try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const payloadObj = {
            path: "product/product_detail",
            product_id: supplyProductId
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

        throw new Error(response.data?.message || `Supply provider error: ${response.status}`);
    } catch (error: any) {
        console.error(`[Supply] Fetching packages for ${supplyProductId} failed:`, error.message);
        throw new Error(error.response?.data?.message || error.message);
    }
};

export const executeSupplyOrder = async (orderData: {
    productId: string;
    categoryId: string;
    playerId: string;
    serverId?: string;
    transactionId: string;
}): Promise<{ success: boolean; orderId: string; message: string }> => {
    const settings = await getSystemSettings();
    const partnerId = settings.get("MOOGOLD_PARTNER_ID");
    const secretKey = settings.get("MOOGOLD_SECRET_KEY");

    if (!partnerId || !secretKey) throw new Error("Supply credentials missing.");

    try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const path = "order/create_order";

        const payloadObj = {
            path,
            data: {
                "category": orderData.categoryId?.toString() || "50",
                "product-id": orderData.productId?.toString(),
                "quantity": "1",
                // Mobile Legends
                "User ID": orderData.playerId,
                "Zone ID": orderData.serverId || "",
                // Free Fire & others
                "Player ID": orderData.playerId,
                // PUBG & others
                "Character ID": orderData.playerId,
                // Server labels
                "Server": orderData.serverId || "",
                "Server ID": orderData.serverId || "",
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

        console.error(`[Supply] ❌ Order failed with status ${response.status}:`, JSON.stringify(data));

        return {
            success: false,
            orderId: data.order_id?.toString() || "",
            message: data.message || data.err_message || data.err_msg || `Supply Error ${data.err_code || response.status}: Please check your balance or SKU settings.`
        };

    } catch (error: any) {
        console.error("[Supply] Order failed:", error.message);
        return {
            success: false,
            orderId: "",
            message: error.message || "Connection failed"
        };
    }
};

// Fetch Master Supply Balance
export const getSupplyBalance = async (): Promise<number> => {
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
                console.warn("[Supply] Balance 403: Account not authorized for API yet.");
            }
        }
        return 0;
    } catch (error: any) {
        console.error("[Supply] Balance request failed:", error.message);
        return 0;
    }
};
