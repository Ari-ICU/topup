/**
 * bakong.service.ts
 *
 * Generates Bakong KHQR codes using the official bakong-khqr npm library.
 *
 * Key notes (learned from library source):
 *  - `generateMerchant()` takes a `MerchantInfo` instance (positional constructor), NOT a plain object.
 *  - Dynamic KHQR (with amount) REQUIRES `expirationTimestamp` as a 13-digit ms timestamp string.
 *  - Currency must be the numeric code: 840 = USD, 116 = KHR (from khqrData.currency).
 *  - bakong-khqr is CommonJS — imported via createRequire to avoid ESM/CJS conflicts.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { BakongKHQR, MerchantInfo, khqrData } = require("bakong-khqr") as any;

const QR_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface GenerateKHQRProps {
    amount: number;
    transactionId: string;
    currency?: "USD" | "KHR";
}

import { getSystemSettings } from "../lib/settings.js";

export const generateTransactionKHQR = async ({
    amount,
    transactionId,
    currency = "USD",
}: GenerateKHQRProps) => {
    const settings = await getSystemSettings();
    const merchantId = settings.get("BAKONG_ACCOUNT_ID");
    const merchantName = settings.get("BAKONG_MERCHANT_NAME") || "Merchant";
    const merchantCity = settings.get("BAKONG_MERCHANT_CITY") || "Phnom Penh";
    const acquiringBank = settings.get("BAKONG_ACQUIRING_BANK") || "ABA Bank";

    if (!merchantId) {
        throw new Error("BAKONG_ACCOUNT_ID is not configured in environment variables.");
    }

    const currencyCode = currency === "KHR" ? khqrData.currency.khr : khqrData.currency.usd;
    const expirationTimestamp = String(Date.now() + QR_EXPIRY_MS); // 13-digit ms timestamp (required for dynamic QR)

    const merchantInfo = new MerchantInfo(
        merchantId,       // bakongAccountID  (e.g. "thoeurnratha@devb")
        merchantName,     // merchantName     (e.g. "TopUpPay Sandbox")
        merchantCity,     // merchantCity     (e.g. "Phnom Penh")
        transactionId.substring(0, 25), // merchantID — use txn ID as reference
        acquiringBank,    // acquiringBank    (e.g. "ABA Bank")
        {
            currency: currencyCode,
            amount,
            billNumber: transactionId.substring(0, 25),
            storeLabel: "TopUpPay",
            terminalLabel: "Online",
            expirationTimestamp,          // ← required for dynamic KHQR with amount
        }
    );

    const khqr = new BakongKHQR();
    const response = khqr.generateMerchant(merchantInfo);

    if (response.status.code !== 0) {
        throw new Error(
            `KHQR generation failed [code ${response.status.errorCode}]: ${response.status.message}`
        );
    }

    return {
        qrCode: response.data.qr as string,
        md5: response.data.md5 as string,
    };
};

/**
 * checkBakongTransactionStatus
 * 
 * Verifies if a dynamic KHQR payment has been completed by checking its MD5 hash
 * against the Bakong Open API.
 */
export const checkBakongTransactionStatus = async (md5: string): Promise<{
    status: "SUCCESS" | "PENDING" | "FAILED";
    message: string;
    raw?: any;
}> => {
    if (!md5) {
        return { status: "FAILED", message: "MD5 hash is required" };
    }

    try {
        // Note: Production usually requires a Bearer token or certificate.
        // For sandbox/public checks, sometimes it's open or uses basic auth with merchant credentials.
        // We'll use axios to call the Bakong endpoint.
        const axios = (await import("axios")).default;

        const response = await axios.post("https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5", {
            md5: md5
        }, {
            timeout: 5000,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                // "Authorization": `Bearer ${process.env.BAKONG_API_TOKEN}` // Uncomment if needed
            }
        });

        const data = response.data;

        // Bakong API response codes: 0 = SUCCESS, 1 = PENDING, etc.
        // Note: Status codes can vary by API version. 
        // Typically: data.responseCode === "0" or data.status.code === 0

        if (data?.responseCode === "0" || data?.status?.code === 0) {
            return {
                status: "SUCCESS",
                message: "Payment received successfully",
                raw: data
            };
        }

        if (data?.responseCode === "1" || data?.status?.code === 1) {
            return {
                status: "PENDING",
                message: "Waiting for payment...",
            };
        }

        return {
            status: "PENDING", // Default to pending if not explicitly failed
            message: data?.status?.message || "Payment not yet detected",
        };

    } catch (error: any) {
        console.error("[Bakong] Status check failed:", error.message);
        // We return PENDING on network errors so the frontend keeps trying
        return {
            status: "PENDING",
            message: "Unable to reach Bakong API. Still waiting..."
        };
    }
};
