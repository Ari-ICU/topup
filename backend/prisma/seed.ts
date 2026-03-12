/// <reference types="node" />
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting database seed...");

    const activeSlugs = ["mobile-legends"];

    // 1. CLEANUP: Games that are NOT in our active list
    const gamesToRemove = await prisma.game.findMany({
        where: { slug: { notIn: activeSlugs } },
        select: { id: true }
    });

    if (gamesToRemove.length > 0) {
        const ids = gamesToRemove.map(g => g.id);
        await prisma.transaction.deleteMany({ where: { package: { gameId: { in: ids } } } });
        await prisma.package.deleteMany({ where: { gameId: { in: ids } } });
        await prisma.game.deleteMany({ where: { id: { in: ids } } });
    }

    // 2. REFRESH PACKAGES: Delete existing packages for active games...
    for (const slug of activeSlugs) {
        await prisma.game.upsert({
            where: { slug },
            update: {
                name: "Mobile Legends",
                iconUrl: "https://example.com/ml-icon.png",
                bannerUrl: "https://example.com/ml-banner.png",
                inputConfig: {
                    fields: [
                        { name: "userId", label: "User ID", type: "text", placeholder: "12345678" },
                        { name: "zoneId", label: "Zone ID", type: "text", placeholder: "1234" }
                    ]
                }
            },
            create: {
                slug,
                name: "Mobile Legends",
                iconUrl: "https://example.com/ml-icon.png",
                bannerUrl: "https://example.com/ml-banner.png",
                inputConfig: {
                    fields: [
                        { name: "userId", label: "User ID", type: "text", placeholder: "12345678" },
                        { name: "zoneId", label: "Zone ID", type: "text", placeholder: "1234" }
                    ]
                }
            }
        });
    }

    const activeGameIds = await prisma.game.findMany({
        where: { slug: { in: activeSlugs } },
        select: { id: true }
    });

    if (activeGameIds.length > 0) {
        const ids = activeGameIds.map(g => g.id);
        await prisma.transaction.deleteMany({ where: { package: { gameId: { in: ids } } } });
        await prisma.package.deleteMany({ where: { gameId: { in: ids } } });
        
        // Add some test packages
        for (const gameId of ids) {
            await prisma.package.create({
                data: {
                    gameId,
                    name: "86 Diamonds",
                    amount: 86,
                    price: 2.00,
                    providerSku: "ml-86",
                    sortOrder: 1
                }
            });
        }
    }


    // 5. GLOBAL STOCK & BALANCE (Initial State)
    await prisma.globalStock.upsert({
        where: { id: "GLOBAL" },
        update: {
            diamonds: -1, // -1 = Unlimited Stock (Real app relies on provider balance)
            providerBalance: 0.00,
        },
        create: {
            id: "GLOBAL",
            diamonds: -1,
            providerBalance: 0.00,
        },
    });

    // 6. PROMOTIONS
    const promotions = [
        {
            title: "MLBB Weekend Rebate",
            subtitle: "Get up to 50% extra diamonds on Mobile Legends",
            imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
            linkUrl: "/game/mobile-legends",
            badgeText: "HOT DEAL",
            badgeColor: "orange",
            isActive: true,
            sortOrder: 1,
        }
    ];

    console.log("Seeding Promotions...");
    for (const promo of promotions) {
        // Find existing promo by title to roughly simulate upsert
        const existing = await prisma.promotion.findFirst({
            where: { title: promo.title }
        });
        if (!existing) {
            await prisma.promotion.create({ data: promo });
        }
    }

    console.log("✅ Seeding completed. All 20 items, test stock, and promotions are now in the database!");
}

main()
    .catch((e) => {
        console.error("❌ Error during seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
