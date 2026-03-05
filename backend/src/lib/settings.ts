import { prisma } from "./prisma.js";
import { rGet, rSet, rDel } from "./redis.js";

const SETTINGS_CACHE_KEY = "app:system_settings";
const SETTINGS_TTL = 5 * 60; // 5 minutes

/**
 * Settings Utility
 *
 * Fetches configuration values from Redis cache first, then the database
 * (Settings UI), then falls back to environment variables.
 *
 * Usage:
 *   const settings = await getSystemSettings();
 *   const val = settings.get("MOOGOLD_PARTNER_ID");
 *
 * Invalidation:
 *   Call invalidateSettingsCache() whenever settings are saved in the admin panel.
 */
export async function getSystemSettings() {
    // 1. Try Redis cache first
    const cached = await rGet(SETTINGS_CACHE_KEY);
    if (cached) {
        try {
            const parsed = JSON.parse(cached) as Record<string, string>;
            const settingsMap = new Map<string, string>(Object.entries(parsed));
            return buildSettingsAccessor(settingsMap);
        } catch {
            // bad cache entry — fall through to DB
        }
    }

    // 2. Load from DB
    const dbSettings = await prisma.systemSetting.findMany();
    const settingsMap = new Map<string, string>();
    dbSettings.forEach((s) => settingsMap.set(s.key, s.value));

    // 3. Write back to cache
    await rSet(SETTINGS_CACHE_KEY, JSON.stringify(Object.fromEntries(settingsMap)), SETTINGS_TTL);

    return buildSettingsAccessor(settingsMap);
}

function buildSettingsAccessor(map: Map<string, string>) {
    return {
        get: (key: string) => map.get(key) || process.env[key] || "",
        getAll: () => Object.fromEntries(map),
    };
}

/**
 * Call this after saving/updating SystemSettings in the admin panel
 * so the next request gets fresh values from the DB.
 */
export async function invalidateSettingsCache(): Promise<void> {
    await rDel(SETTINGS_CACHE_KEY);
    console.log("[Settings] 🗑️  Cache invalidated — next request will reload from DB.");
}
