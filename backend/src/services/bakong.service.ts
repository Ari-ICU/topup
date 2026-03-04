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

export const generateTransactionKHQR = ({
    amount,
    transactionId,
    currency = "USD",
}: GenerateKHQRProps) => {
    const merchantId = process.env.BAKONG_ACCOUNT_ID || "";
    const merchantName = process.env.BAKONG_MERCHANT_NAME || "Merchant";
    const merchantCity = process.env.BAKONG_MERCHANT_CITY || "Phnom Penh";
    const acquiringBank = process.env.BAKONG_ACQUIRING_BANK || "ABA Bank";

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

export const checkBakongTransactionStatus = async (md5: string) => {
    // TODO: Call the Bakong Open API to check payment status by md5
    // Docs: https://api-bakong.nbc.gov.kh/
    return {
        status: "PENDING",
        message: "Waiting for payment",
    };
};
