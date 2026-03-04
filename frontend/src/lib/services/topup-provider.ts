/**
 * Service to handle third-party top-up provider integrations (e.g., Smile One, UniPin)
 * This logic should be executed on the server-side (Next.js API Routes)
 */

interface TopupRequest {
    gameId: string;
    targetId: string;
    zoneId?: string;
    packageSku: string;
    orderId: string;
}

interface ProviderResponse {
    success: boolean;
    transactionId?: string;
    errorMessage?: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export async function processExternalTopup(data: TopupRequest): Promise<ProviderResponse> {
    const PROVIDER_API_URL = process.env.TOPUP_PROVIDER_URL;
    const API_KEY = process.env.TOPUP_PROVIDER_KEY;
    const SECRET = process.env.TOPUP_PROVIDER_SECRET;

    try {
        // 1. Prepare Payload according to provider spec
        // Example: Sign the request for security
        const timestamp = Date.now();
        const sign = createSignature(data.orderId, timestamp, SECRET!);

        const payload = {
            api_key: API_KEY,
            order_id: data.orderId,
            game_code: data.gameId,
            player_id: data.targetId,
            zone_id: data.zoneId,
            product_id: data.packageSku,
            timestamp,
            sign
        };

        // 2. Make the API call
        const response = await fetch(`${PROVIDER_API_URL}/order/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        // 3. Handle Provider Response
        if (result.code === 200) {
            return {
                success: true,
                transactionId: result.data.provider_txn_id,
                status: 'COMPLETED' // Or PENDING if the provider works asynchronously
            };
        }

        return {
            success: false,
            errorMessage: result.message || "Provider Error",
            status: 'FAILED'
        };

    } catch (error) {
        console.error("Top-up Provider Error:", error);
        return {
            success: false,
            errorMessage: "Internal Connection Error",
            status: 'FAILED'
        };
    }
}

/**
 * Security: Helper to create a secure signature for API requests
 */
function createSignature(orderId: string, timestamp: number, secret: string) {
    // Logic varies by provider (usually HMAC-SHA256 or MD5)
    // return crypto.createHmac('sha256', secret).update(`${orderId}${timestamp}`).digest('hex');
    return "generated-signature-hash";
}
