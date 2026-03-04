/**
 * verify-flow.test.ts
 * 
 * Quick manual test to confirm the verify service works end-to-end.
 * Run with: npx ts-node --esm src/scripts/verify-flow.test.ts
 */

import { verifyGameAccount } from "../services/verify.service.js";

const TEST_CASES = [
    // Format errors — should fail immediately (no network)
    { game: "mobile-legends", userId: "abc", zoneId: "", expect: "formatValid:false", label: "ML: non-numeric ID" },
    { game: "mobile-legends", userId: "12345", zoneId: "", expect: "formatValid:false", label: "ML: ID too short" },
    { game: "mobile-legends", userId: "12345678", zoneId: "", expect: "formatValid:false", label: "ML: missing zone" },
    { game: "free-fire", userId: "123", zoneId: "", expect: "formatValid:false", label: "FF: ID too short" },

    // Format OK — should try live lookup (may return format-ok if network fails)
    { game: "mobile-legends", userId: "12345678", zoneId: "1234", expect: "formatValid:true|verified:true", label: "ML: valid format" },
    { game: "free-fire", userId: "123456789", zoneId: "", expect: "formatValid:true|verified:true", label: "FF: valid format" },
    { game: "pubg-mobile", userId: "1234567", zoneId: "", expect: "formatValid:true", label: "PUBG: valid format (no live lookup)" },
];

async function run() {
    console.log("\n🧪 Verify Service — End-to-End Test\n" + "=".repeat(50));

    for (const tc of TEST_CASES) {
        process.stdout.write(`  ${tc.label.padEnd(40)}`);

        try {
            const result = await verifyGameAccount(tc.game, tc.userId, tc.zoneId);
            const passed = tc.expect.split("|").some((e) => {
                const [key, val] = e.split(":") as [string, string];
                return String(result[key as keyof typeof result]) === val;
            });

            const status = passed ? "✅ PASS" : "❌ FAIL";
            console.log(`${status}  →  verified=${result.verified} formatValid=${result.formatValid} name=${result.playerName ?? "—"}`);
        } catch (err) {
            console.log(`💥 ERROR  →  ${err instanceof Error ? err.message : err}`);
        }
    }

    console.log("\n" + "=".repeat(50));
}

run();
