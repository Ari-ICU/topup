import { prisma } from "./prisma.js";

/**
 * Settings Utility
 * 
 * Fetches configuration values from the database (Settings UI) first,
 * then falls back to environment variables.
 * 
 * Usage:
 * const settings = await getSystemSettings();
 * const val = settings.get("MOOGOLD_PARTNER_ID");
 */
export async function getSystemSettings() {
    const dbSettings = await prisma.systemSetting.findMany();
    const settingsMap = new Map<string, string>();

    dbSettings.forEach(s => settingsMap.set(s.key, s.value));

    return {
        get: (key: string) => settingsMap.get(key) || process.env[key] || "",
        getAll: () => Object.fromEntries(settingsMap)
    };
}
