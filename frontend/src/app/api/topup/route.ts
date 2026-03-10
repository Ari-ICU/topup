import { NextRequest, NextResponse } from "next/server";

/**
 * /api/topup - Diamond Delivery Proxy
 *
 * This route:
 * 1. Receives productId, playerId, and server from the frontend.
 * 2. Proxies the request to the Express backend (/api/supply/topup).
 * 3. The backend maintains actual MooGold credentials and signature logic.
 */

// Use internal Docker URL if available, otherwise fallback to public
const BACKEND_URL =
    process.env.BACKEND_API_URL ??          // Docker: http://backend:4000/api
    process.env.NEXT_PUBLIC_API_URL ??      // Local dev fallback
    "http://localhost:4000/api";            // Default fallback

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { productId, playerId, server, categoryId } = body;

        // ─── 1. Validation ───────────────────────────────────────────────────
        if (!productId || !playerId) {
            return NextResponse.json(
                { success: false, message: "Missing required fields: productId and playerId." },
                { status: 400 }
            );
        }

        // ─── 2. Proxy to Backend ───────────────────────────────────────
        // Note: The backend already has MooGold logic implemented in its supply service.
        const response = await fetch(`${BACKEND_URL}/supply/topup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Pass an admin/internal key if your backend requires it
                "X-Audit-Key": process.env.INTERNAL_API_KEY || "fallback_key"
            },
            body: JSON.stringify({
                productId,
                playerId,
                server,
                categoryId
            }),
            signal: AbortSignal.timeout(15000) // 15s timeout
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json({
                success: false,
                message: data.message || "Failed to process top-up via backend.",
                error: data
            }, { status: response.status });
        }

        return NextResponse.json({
            success: true,
            orderId: data.data?.orderId,
            message: data.message || "Order processed successfully."
        });

    } catch (error: any) {
        console.error("[Topup Route] Proxy Error:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "Connection to backend failed."
        }, { status: 500 });
    }
}
