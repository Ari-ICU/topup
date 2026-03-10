import crypto from "crypto";
import axios, { AxiosRequestConfig } from "axios";
import { getSystemSettings } from "../lib/settings.js";

const MOOGOLD_API_BASE = "https://moogold.com/wp-json/v1/api";

/**
 * MooGold API Helper: Generates authentication headers and signature.
 */
const getMooGoldAuth = async (path: string, payload: any) => {
    const settings = await getSystemSettings();
    const partnerId = settings.get("MOOGOLD_PARTNER_ID");
    const secretKey = settings.get("MOOGOLD_SECRET_KEY");

    if (!partnerId || !secretKey) {
        throw new Error("MooGold credentials not found in system settings.");
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payloadStr = JSON.stringify(payload);
    const signatureString = payloadStr + timestamp + path;

    const authSignature = crypto.createHmac("sha256", secretKey).update(signatureString).digest("hex");
    const authHeader = "Basic " + Buffer.from(`${partnerId}:${secretKey}`).toString("base64");

    return {
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": authHeader,
            "auth": authSignature,
            "timestamp": timestamp,
            "User-Agent": "MooGold-Node-Integration"
        }
    };
};

/**
 * Executes a POST request to MooGold API with automatic signing.
 */
const mooGoldPost = async (path: string, payload: any, timeout = 10000) => {
    const auth = await getMooGoldAuth(path, payload);
    
    return axios.post(`${MOOGOLD_API_BASE}/${path}`, payload, {
        headers: auth.headers,
        timeout,
        validateStatus: () => true
    });
};

/**
 * Fetch Master Supply Product Catalog
 */
export const getProviderProductList = async (categoryId = 50): Promise<any[]> => {
    try {
        const path = "product/list_product";
        const payload = { path, category_id: categoryId };
        
        const response = await mooGoldPost(path, payload);
        const data = response.data;

        if (response.status >= 200 && response.status < 300) {
            return Array.isArray(data) ? data : (data.data || []);
        }

        if (response.status === 403 || (typeof data === 'string' && data.includes("Cloudflare"))) {
            throw new Error("Access denied by Provider Firewall (Cloudflare).");
        }

        throw new Error(data?.message || `Provider error: ${response.status}`);
    } catch (error: any) {
        console.error("[MooGold] Sync Product List failed:", error.message);
        throw error;
    }
};

/**
 * Fetch packages for a specific game ID from supply
 */
export const getProviderGamePackages = async (supplyProductId: string | number): Promise<any> => {
    try {
        const path = "product/product_detail";
        const payload = { path, product_id: supplyProductId };
        
        const response = await mooGoldPost(path, payload);
        const data = response.data;

        if (response.status >= 200 && response.status < 300) {
            return data;
        }

        if (response.status === 403 || (typeof data === 'string' && data.includes("Cloudflare"))) {
            throw new Error("Access denied by Provider Firewall.");
        }

        throw new Error(data?.message || `Provider error: ${response.status}`);
    } catch (error: any) {
        console.error(`[MooGold] Fetching packages for ${supplyProductId} failed:`, error.message);
        throw error;
    }
};

/**
 * Execute a top-up order via MooGold
 */
export const executeSupplyOrder = async (orderData: {
    productId: string;
    categoryId: string;
    playerId: string;
    serverId?: string;
    transactionId: string;
}): Promise<{ success: boolean; orderId: string; message: string }> => {
    try {
        const path = "order/create_order";
        const payload = {
            path,
            data: {
                "category": orderData.categoryId?.toString() || "50",
                "product-id": orderData.productId?.toString(),
                "quantity": "1",
                "User ID": orderData.playerId,
                "Zone ID": orderData.serverId || "",
                "Player ID": orderData.playerId,
                "Character ID": orderData.playerId,
                "Server": orderData.serverId || "",
                "Server ID": orderData.serverId || "",
            }
        };

        const response = await mooGoldPost(path, payload, 15000);
        const data = response.data;

        if (response.status === 200 && data.status === "success") {
            return {
                success: true,
                orderId: data.order_id?.toString() || orderData.transactionId,
                message: data.message || "Order placed successfully"
            };
        }

        console.error(`[MooGold] ❌ Order failed (${response.status}):`, JSON.stringify(data));

        return {
            success: false,
            orderId: data.order_id?.toString() || "",
            message: data.message || data.err_message || `Supply Error ${data.err_code || response.status}`
        };

    } catch (error: any) {
        console.error("[MooGold] Order execution failed:", error.message);
        return {
            success: false,
            orderId: "",
            message: error.message || "Connection to provider failed"
        };
    }
};

/**
 * Fetch Master Supply Balance
 */
export const getSupplyBalance = async (): Promise<number | null> => {
    try {
        const path = "user/balance";
        const payload = { path };
        
        const response = await mooGoldPost(path, payload);
        const data = response.data;

        if (response.status === 200) {
            if (data?.balance !== undefined) return parseFloat(data.balance);
            if (data?.err_code === "403") return null;
        }

        return null;
    } catch (error: any) {
        console.error("[MooGold] Balance check failed:", error.message);
        return null;
    }
};

/**
 * Verify Player Account via Master Supply
 */
export const verifySupplyAccount = async (data: {
    productId: string | number;
    playerId: string;
    zoneId?: string;
}): Promise<{ verified: boolean | null; playerName?: string }> => {
    try {
        const path = "product/verify_product";
        const payload = {
            path,
            product_id: data.productId.toString(),
            "User ID": data.playerId,
            "Zone ID": data.zoneId || "",
            "Player ID": data.playerId,
            "Character ID": data.playerId,
        };

        const response = await mooGoldPost(path, payload);
        const resData = response.data;

        if (response.status === 200) {
            if (resData?.status === "success") {
                return { verified: true, playerName: resData?.nickname || resData?.username };
            }
            if (resData?.status === "error") {
                return { verified: false };
            }
        }

        return { verified: null };
    } catch (error: any) {
        console.error("[MooGold] Verification failed:", error.message);
        return { verified: null };
    }
};
