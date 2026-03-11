import { prisma } from "../lib/prisma.js";
import { getProviderProductList, getProviderGamePackages } from "./supply.service.js";

/**
 * Automatically syncs Mobile Legends packages from MooGold to the local database.
 * This ensures prices and SKUs are always up to date without manual input.
 */
export const syncMooGoldPackages = async () => {
    console.log("[Sync] Starting MooGold product synchronization...");
    
    try {
        // 1. Fetch the main product list for Mobile Legends (Category 50)
        // This gives us the 'product_id' needed for detailed variation lookups.
        const productList = await getProviderProductList(50);
        
        // Find the specific 'Mobile Legends' product entry
        const mlbbProduct = productList.find((p: any) => 
            p.product_name?.toLowerCase().includes("mobile legends") ||
            p.post_title?.toLowerCase().includes("mobile legends")
        );

        if (!mlbbProduct) {
            throw new Error("Could not find Mobile Legends in MooGold product list.");
        }

        const supplyProductId = mlbbProduct.product_id || mlbbProduct.ID;

        // 2. Fetch detailed variations (the actual diamond packages)
        const details = await getProviderGamePackages(supplyProductId);
        const variations = details?.product_details?.[0]?.variations || details?.Variation || details?.product || [];

        console.log(`[Sync] Found ${variations.length} packages from provider.`);

        // 3. Find MLBB game in our database to get correct gameId
        const mlbbGame = await prisma.game.findUnique({
            where: { slug: "mobile-legends" }
        });

        if (!mlbbGame) {
            throw new Error("Could not find 'mobile-legends' game in local database. Please ensure it exists.");
        }

        // 4. Update or Create records in your local "Package" table
        // We look for existing packages by providerSku to safely upsert
        for (const variant of variations) {
            const sku = variant.variation_id.toString();
            
            // Clean up the name: remove provider specific IDs (#12345) and redundant prefixes
            const cleanName = (variant.variation_name || "")
                .replace(/\s*\(#\d+\)\s*$/, "") 
                .replace(/^mobile legends\s*[-–—]?\s*/i, "")
                .trim();

            const existing = await prisma.package.findFirst({
                where: { providerSku: sku }
            });

            const isWeeklyPass = cleanName.toLowerCase().includes("weekly") || cleanName.toLowerCase().includes("pass");
            const badgeText = isWeeklyPass ? "BEST VALUE" : null;

            if (existing) {
                await prisma.package.update({
                    where: { id: existing.id },
                    data: {
                        name: cleanName,
                        price: parseFloat(variant.variation_price),
                        isWeeklyPass,
                        badgeText,
                    }
                });
            } else {
                await prisma.package.create({
                    data: {
                        name: cleanName,
                        amount: parseInt(cleanName.replace(/\D/g, '')) || 0,
                        price: parseFloat(variant.variation_price),
                        providerSku: sku,
                        gameId: mlbbGame.id,
                        isWeeklyPass,
                        badgeText,
                    }
                });
            }
        }

        console.log("[Sync] Synchronization completed successfully.");
    } catch (error) {
        console.error("[Sync] Failed to sync with MooGold:", error);
    }
};
