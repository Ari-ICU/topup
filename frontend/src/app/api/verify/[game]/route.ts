import { NextRequest, NextResponse } from "next/server";

/**
 * /api/verify/[game]/route.ts — Verification Proxy
 *
 * Flow:
 *  1. Instant local format check (no network, returns immediately on bad format)
 *  2. Proxy to Express backend → backend calls api.isan.eu.org for real player name
 *  3. If backend is unreachable → fall back to format-ok (never blocks purchase)
 *
 * URL resolution:
 *  - BACKEND_API_URL  → Docker internal (http://backend:4000/api) — set in docker-compose
 *  - NEXT_PUBLIC_API_URL → fallback for local dev without Docker (http://localhost:4000/api)
 */

// BACKEND_API_URL is server-side only (not prefixed NEXT_PUBLIC_)
// It uses the Docker service name so containers can talk to each other
const BACKEND_URL =
    process.env.BACKEND_API_URL ??          // Docker: http://backend:4000/api
    process.env.NEXT_PUBLIC_API_URL ??      // Local dev fallback
    "http://localhost:4000/api";            // Hard fallback

// ─── Local format rules (fallback only — backend is the source of truth) ──────
const FORMAT_RULES: Record<string, {
    playerIdRegex: RegExp;
    zoneIdRequired: boolean;
    zoneIdRegex?: RegExp;
    hint: string;
}> = {
    "mobile-legends": {
        playerIdRegex: /^\d{6,12}$/,
        zoneIdRequired: true,
        zoneIdRegex: /^\d{1,6}$/,
        hint: "Player ID must be 6–12 digits. Zone ID must be 1–6 digits.",
    },
    "free-fire": {
        playerIdRegex: /^\d{5,12}$/,
        zoneIdRequired: false,
        hint: "Player ID must be 5–12 digits.",
    },
    "pubg-mobile": {
        playerIdRegex: /^\d{7,12}$/,
        zoneIdRequired: false,
        hint: "Player ID must be 7–12 digits.",
    },
    "genshin-impact": {
        playerIdRegex: /^\d{9}$/,
        zoneIdRequired: false,
        hint: "UID must be exactly 9 digits.",
    },
    "call-of-duty": {
        playerIdRegex: /^\d{10,20}$/,
        zoneIdRequired: false,
        hint: "Player ID must be 10–20 digits.",
    },
};

// ─── Local format-only validation (instant, no network required) ──────────────
function localFormatValidate(game: string, userId: string, zoneId?: string) {
    const rule = FORMAT_RULES[game];

    if (!rule) {
        // Unknown game slug — accept any reasonable length input
        return {
            verified: false,
            formatValid: userId.trim().length >= 5,
            reason: userId.trim().length >= 5
                ? "Player ID format looks valid."
                : "Player ID is too short. Please double-check.",
        };
    }

    if (!rule.playerIdRegex.test(userId.trim())) {
        return { verified: false, formatValid: false, reason: `Invalid Player ID. ${rule.hint}` };
    }

    if (rule.zoneIdRequired && !zoneId?.trim()) {
        return { verified: false, formatValid: false, reason: `Zone ID is required. ${rule.hint}` };
    }

    if (rule.zoneIdRegex && zoneId?.trim() && !rule.zoneIdRegex.test(zoneId.trim())) {
        return { verified: false, formatValid: false, reason: `Invalid Zone ID. ${rule.hint}` };
    }

    return { verified: false, formatValid: true };
}

// ─── Route handler ─────────────────────────────────────────────────────────────
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ game: string }> }
) {
    const paramsData = await params;
    const rawGame = paramsData.game;

    // Normalize slug: remove trailing dashes and handle common pluralization differences
    let game = rawGame.toLowerCase().trim().replace(/-+$/, "");
    if (game === "mobile-legend") game = "mobile-legends";
    if (game === "ff") game = "free-fire";
    if (game === "ml") game = "mobile-legends";
    if (game === "pubg") game = "pubg-mobile";
    if (game === "cod") game = "call-of-duty";
    if (game === "codm") game = "call-of-duty";

    const body = await req.json().catch(() => ({}));
    const userId: string = (body.userId ?? "").trim();
    const zoneId: string = (body.zoneId ?? "").trim();

    if (!userId) {
        return NextResponse.json({
            verified: false,
            formatValid: false,
            reason: "Player ID is required.",
        });
    }

    // ── Step 1: Instant format check ──────────────────────────────────────────
    const formatCheck = localFormatValidate(game, userId, zoneId);
    if (!formatCheck.formatValid) {
        // Bad format — no need to call the backend
        return NextResponse.json(formatCheck);
    }

    // ── Step 2: Proxy to Express backend (real player name lookup) ────────────
    try {
        const backendRes = await fetch(`${BACKEND_URL}/games/${game}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, zoneId }),
            signal: AbortSignal.timeout(8000), // 8s timeout
        });

        if (backendRes.ok) {
            const json = await backendRes.json();

            // Express backend wraps: { success: true, data: { verified, playerName, formatValid, reason } }
            const data = json?.data ?? json;

            if (data?.verified && data?.playerName) {
                // ✅ Full verification — real name confirmed from game server
                return NextResponse.json({ verified: true, playerName: data.playerName });
            }

            if (data?.formatValid === false) {
                // ❌ Backend confirmed the player ID doesn't exist
                return NextResponse.json({
                    verified: false,
                    formatValid: false,
                    reason: data?.reason ?? "Player not found. Please check your ID and Zone ID.",
                });
            }

            if (data?.formatValid === true) {
                // 🟡 Backend validated format but couldn't confirm name (no reseller key)
                return NextResponse.json({
                    verified: false,
                    formatValid: true,
                    reason: data?.reason,
                });
            }
        }

        console.warn(`[verify/${game}] Backend returned status ${backendRes.status}`);
    } catch (err) {
        // Network error or timeout — log silently, fall through to format-ok
        console.warn(
            `[verify/${game}] Backend unreachable, using format-ok fallback:`,
            err instanceof Error ? err.message : err
        );
    }

    // ── Step 3: Backend unavailable — don't block purchase ────────────────────
    return NextResponse.json({ verified: false, formatValid: true });
}
