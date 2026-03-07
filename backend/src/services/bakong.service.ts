// Generates Bakong KHQR codes using the bakong-khqr library

import { createRequire } from "module";
import axios from "axios";
import { getSystemSettings } from "../lib/settings.js";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { BakongKHQR, IndividualInfo, MerchantInfo, khqrData } = require("bakong-khqr") as any;

const QR_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface GenerateKHQRProps {
    amount: number;
    transactionId: string;
    currency?: "USD" | "KHR";
}

export const generateTransactionKHQR = async ({
    amount,
    transactionId,
    currency = "USD",
}: GenerateKHQRProps) => {
    const settings = await getSystemSettings();
    const bakongAccountId = settings.get("BAKONG_ACCOUNT_ID");
    const merchantName = settings.get("BAKONG_MERCHANT_NAME") || "Merchant";
    const merchantCity = settings.get("BAKONG_MERCHANT_CITY") || "Phnom Penh";

    if (!bakongAccountId) {
        throw new Error(
            "BAKONG_ACCOUNT_ID is not configured. Go to Admin → Settings and set your Bakong account ID " +
            "(format: yourname@aba, yourname@aclb, etc.)"
        );
    }

    // Validate Bakong account ID format
    if (!bakongAccountId.includes("@") || bakongAccountId.includes(" ")) {
        throw new Error(
            `BAKONG_ACCOUNT_ID format is invalid: "${bakongAccountId}". ` +
            "It must be in the format: yourname@aba (e.g. thoeurnratha@aba)"
        );
    }

    const currencyCode = currency === "KHR" ? khqrData.currency.khr : khqrData.currency.usd;
    const expirationTimestamp = String(Date.now() + QR_EXPIRY_MS); // 13-digit ms timestamp (required for dynamic QR)

    // Use IndividualInfo for cross-bank compatibility
    const individualInfo = new IndividualInfo(
        bakongAccountId,  // bakongAccountID (e.g. "thoeurnratha@aba")
        merchantName,     // merchantName    (e.g. "TopUpPay")
        merchantCity,     // merchantCity    (e.g. "Phnom Penh")
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
    const response = khqr.generateIndividual(individualInfo);

    if (!response || response.status?.code !== 0) {
        const code = response?.status?.errorCode ?? "unknown";
        const msg = response?.status?.message ?? "Unknown error";
        throw new Error(`KHQR generation failed [code ${code}]: ${msg}`);
    }

    console.log(`[Bakong] ✅ KHQR generated for TxID ${transactionId}, amount: ${amount} ${currency}`);

    return {
        qrCode: response.data.qr as string,
        md5: response.data.md5 as string,
    };
};

// Verify dynamic KHQR payment status via Bakong API
export const checkBakongTransactionStatus = async (md5: string): Promise<{
    status: "SUCCESS" | "PENDING" | "FAILED";
    message: string;
    raw?: any;
}> => {
    if (!md5) {
        return { status: "FAILED", message: "MD5 hash is required" };
    }

    try {
        const settings = await getSystemSettings();
        const apiToken = settings.get("BAKONG_API_TOKEN") || process.env.BAKONG_API_TOKEN;

        const headers: Record<string, string> = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        };

        if (apiToken) {
            headers["Authorization"] = `Bearer ${apiToken}`;
        }

        const response = await axios.post(
            "https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5",
            { md5 },
            { timeout: 8000, headers }
        );

        const data = response.data;

        // Response code "0" indicates payment success
        if (data?.responseCode === "0" || data?.status?.code === 0) {
            return {
                status: "SUCCESS",
                message: "Payment received successfully",
                raw: data,
            };
        }

        // Handle pending response
        return {
            status: "PENDING",
            message: data?.responseMessage || data?.status?.message || "Waiting for payment...",
        };

    } catch (error: any) {
        // 404 status means transaction is still pending
        if (error?.response?.status === 404) {
            return { status: "PENDING", message: "Waiting for payment..." };
        }
        console.error("[Bakong] Status check failed:", error.message);
        // Return PENDING on network error for continued polling
        return {
            status: "PENDING",
            message: "Unable to reach Bakong API. Still waiting...",
        };
    }
};

