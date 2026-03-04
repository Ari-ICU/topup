/**
 * verify.service.ts
 *
 * Game account verification service.
 *
 * Priority order:
 *  1. Live lookup via api.isan.eu.org (free public API for MLBB & Free Fire)
 *  2. Provider API (Digiflazz, UniPin, etc.) if credentials are configured
 *  3. Local format validation as final fallback — never blocks a purchase
 */

export interface VerifyResult {
    verified: boolean;
    playerName?: string;
    reason?: string;
    /** True when format is valid but the name couldn't be fetched live */
    formatValid?: boolean;
}

// ─── Player ID format rules ──────────────────────────────────────────────────
const GAME_FORMAT_RULES: Record<string, {
    playerIdRegex: RegExp;
    zoneIdRegex?: RegExp;
    zoneIdRequired?: boolean;
    hint: string;
}> = {
    "mobile-legends": {
        playerIdRegex: /^\d{6,12}$/,
        zoneIdRegex: /^\d{1,6}$/,
        zoneIdRequired: true,
        hint: "Player ID must be 6–12 digits. Zone ID must be 1–6 digits.",
    },
    "free-fire": {
        playerIdRegex: /^\d{5,12}$/,
        hint: "Free Fire Player ID must be 5–12 digits.",
    },
    "pubg-mobile": {
        playerIdRegex: /^\d{7,12}$/,
        hint: "PUBG Mobile Player ID must be 7–12 digits.",
    },
    "genshin-impact": {
        playerIdRegex: /^\d{9}$/,
        hint: "Genshin Impact UID must be exactly 9 digits.",
    },
    "call-of-duty": {
        playerIdRegex: /^\d{10,20}$/,
        hint: "CoD Mobile Player ID must be 10–20 digits.",
    },
};

// ─── 1. Live lookup via public API (free, no key required) ───────────────────
async function liveVerify(
    gameSlug: string,
    userId: string,
    zoneId?: string
): Promise<VerifyResult | null> {
    let apiUrl = "";

    if (gameSlug === "mobile-legends") {
        apiUrl = `https://api.isan.eu.org/nickname/ml?id=${userId}&server=${zoneId ?? ""}`;
    } else if (gameSlug === "free-fire") {
        apiUrl = `https://api.isan.eu.org/nickname/ff?id=${userId}`;
    } else {
        // No public lookup available for this game
        return null;
    }

    try {
        const res = await fetch(apiUrl, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(6000),
        });

        if (!res.ok) return null;

        const json = await res.json();

        if (json?.success === true && json?.name) {
            return { verified: true, playerName: json.name };
        }

        if (json?.success === false) {
            // API responded but player was not found
            return { verified: false, formatValid: false };
        }
    } catch (err) {
        console.warn(`[verify.service] liveVerify failed for ${gameSlug}:`, err instanceof Error ? err.message : err);
    }

    return null; // unreachable / timeout → caller will fall through
}

// ─── 2. Provider API lookup (Digiflazz, UniPin, etc.) ───────────────────────
async function providerVerify(
    gameSlug: string,
    userId: string,
    zoneId?: string
): Promise<VerifyResult | null> {
    const providerUrl = process.env.TOPUP_PROVIDER_URL;
    const providerKey = process.env.TOPUP_PROVIDER_KEY;

    // Skip if credentials are not set or are still at example values
    if (!providerUrl || !providerKey || providerUrl.includes("example")) {
        return null;
    }

    try {
        const res = await fetch(`${providerUrl}/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${providerKey}`,
            },
            body: JSON.stringify({ gameSlug, userId, zoneId }),
            signal: AbortSignal.timeout(6000),
        });

        if (!res.ok) return null;

        const json = await res.json();

        if (json?.playerName) return { verified: true, playerName: json.playerName };
        if (json?.error) return { verified: false, formatValid: false, reason: json.error };
    } catch (err) {
        console.warn(`[verify.service] providerVerify failed:`, err instanceof Error ? err.message : err);
    }

    return null;
}

// ─── 3. Local format-only validation (instant, no network) ───────────────────
function formatValidate(gameSlug: string, userId: string, zoneId?: string): VerifyResult {
    const rule = GAME_FORMAT_RULES[gameSlug];

    if (!rule) {
        return {
            verified: false,
            formatValid: userId.trim().length > 0,
            reason: userId.trim().length > 0
                ? "We couldn't verify this account automatically. Please confirm your Player ID in-game."
                : "Player ID is required.",
        };
    }

    if (!rule.playerIdRegex.test(userId.trim())) {
        return { verified: false, formatValid: false, reason: `Invalid Player ID format. ${rule.hint}` };
    }

    if (rule.zoneIdRequired && !zoneId?.trim()) {
        return { verified: false, formatValid: false, reason: `Zone ID is required. ${rule.hint}` };
    }

    if (rule.zoneIdRegex && zoneId?.trim() && !rule.zoneIdRegex.test(zoneId.trim())) {
        return { verified: false, formatValid: false, reason: `Invalid Zone ID format. ${rule.hint}` };
    }

    return {
        verified: false,
        formatValid: true,
        reason: "Player ID format looks correct.",
    };
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function verifyGameAccount(
    gameSlug: string,
    userId: string,
    zoneId?: string
): Promise<VerifyResult> {
    // Normalize slug: remove trailing dashes and handle common pluralization differences
    let slug = gameSlug.toLowerCase().trim().replace(/-+$/, "");

    // Map common aliases to standard keys used in GAME_FORMAT_RULES and liveVerify
    if (slug === "mobile-legend") slug = "mobile-legends";
    if (slug === "ff") slug = "free-fire";
    if (slug === "ml") slug = "mobile-legends";
    if (slug === "pubg") slug = "pubg-mobile";
    if (slug === "cod") slug = "call-of-duty";
    if (slug === "codm") slug = "call-of-duty";

    // Priority 1: live lookup (free, ML + FF)
    const live = await liveVerify(slug, userId, zoneId);
    if (live !== null) return live;

    // Priority 2: provider API (Digiflazz etc.)
    const provider = await providerVerify(slug, userId, zoneId);
    if (provider !== null) return provider;

    // Priority 3: format validation only
    return formatValidate(slug, userId, zoneId);
}
