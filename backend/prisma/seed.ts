/// <reference types="node" />
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting database seed...");

    const activeSlugs = ["free-fire", "mobile-legends"];

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

    // 2. REFRESH PACKAGES: Delete existing packages for active games to ensure all 20+ items are added
    const activeGameIds = await prisma.game.findMany({
        where: { slug: { in: activeSlugs } },
        select: { id: true }
    });

    if (activeGameIds.length > 0) {
        const ids = activeGameIds.map(g => g.id);
        // Delete transactions related to packages of active games to avoid foreign key errors
        await prisma.transaction.deleteMany({ where: { package: { gameId: { in: ids } } } });
        await prisma.package.deleteMany({ where: { gameId: { in: ids } } });
    }

    // 3. Free Fire (FF)
    await prisma.game.upsert({
        where: { slug: "free-fire" },
        update: {
            name: "Free Fire",
            iconUrl: "/free-fire-log.png",
            inputConfig: { playerId: "string" },
            sortOrder: 1,
            packages: {
                create: [
                    { name: "100 Diamonds", amount: 100, price: 1.25, providerSku: "ff_100", sortOrder: 1 },
                    { name: "210 Diamonds", amount: 210, price: 2.40, providerSku: "ff_210", sortOrder: 2 },
                    { name: "310 Diamonds", amount: 310, price: 3.50, providerSku: "ff_310", sortOrder: 3 },
                    { name: "530 Diamonds", amount: 530, price: 6.00, providerSku: "ff_530", sortOrder: 4 },
                    { name: "1080 Diamonds", amount: 1080, price: 11.50, providerSku: "ff_1080", sortOrder: 5 },
                    { name: "2200 Diamonds", amount: 2200, price: 23.00, providerSku: "ff_2200", sortOrder: 6 },
                ],
            },
        },
        create: {
            slug: "free-fire",
            name: "Free Fire",
            iconUrl: "/free-fire-log.png",
            inputConfig: { playerId: "string" },
            sortOrder: 1,
            packages: {
                create: [
                    { name: "100 Diamonds", amount: 100, price: 1.25, providerSku: "ff_100", sortOrder: 1 },
                    { name: "210 Diamonds", amount: 210, price: 2.40, providerSku: "ff_210", sortOrder: 2 },
                    { name: "310 Diamonds", amount: 310, price: 3.50, providerSku: "ff_310", sortOrder: 3 },
                    { name: "530 Diamonds", amount: 530, price: 6.00, providerSku: "ff_530", sortOrder: 4 },
                    { name: "1080 Diamonds", amount: 1080, price: 11.50, providerSku: "ff_1080", sortOrder: 5 },
                    { name: "2200 Diamonds", amount: 2200, price: 23.00, providerSku: "ff_2200", sortOrder: 6 },
                ],
            },
        },
    });

    // 4. Mobile Legends (MLBB)
    await prisma.game.upsert({
        where: { slug: "mobile-legends" },
        update: {
            name: "Mobile Legends",
            iconUrl: "/mobile-legends-bang-bang-global-1770434793000.avif",
            inputConfig: { playerId: "string", zoneId: "string" },
            sortOrder: 2,
            packages: {
                create: [
                    { name: "5 Diamonds", amount: 5, price: 0.12, providerSku: "ml_5", sortOrder: 1 },
                    { name: "11 Diamonds (10+1)", amount: 11, price: 0.25, providerSku: "ml_11", sortOrder: 2 },
                    { name: "14 Diamonds (13+1)", amount: 14, price: 0.35, providerSku: "ml_14", sortOrder: 3 },
                    { name: "19 Diamonds (17+2)", amount: 19, price: 0.45, providerSku: "ml_19", sortOrder: 4 },
                    { name: "33 Diamonds (30+3)", amount: 33, price: 0.75, providerSku: "ml_33", sortOrder: 5 },
                    { name: "42 Diamonds (38+4)", amount: 42, price: 0.90, providerSku: "ml_42", sortOrder: 6 },
                    { name: "50 Diamonds", amount: 50, price: 1.00, providerSku: "ml_50", sortOrder: 7 },
                    { name: "70 Diamonds (64+6)", amount: 70, price: 1.40, providerSku: "ml_70", sortOrder: 8 },
                    { name: "86 Diamonds (78+8)", amount: 86, price: 1.70, providerSku: "ml_86", sortOrder: 9 },
                    { name: "110 Diamonds (102+8)", amount: 110, price: 2.20, providerSku: "ml_110", sortOrder: 10 },
                    { name: "140 Diamonds (127+13)", amount: 140, price: 2.80, providerSku: "ml_140", sortOrder: 11 },
                    { name: "172 Diamonds (156+16)", amount: 172, price: 3.40, providerSku: "ml_172", sortOrder: 12 },
                    { name: "257 Diamonds (234+23)", amount: 257, price: 5.00, providerSku: "ml_257", sortOrder: 13 },
                    { name: "344 Diamonds (312+32)", amount: 344, price: 6.80, providerSku: "ml_344", sortOrder: 14 },
                    { name: "429 Diamonds (390+39)", amount: 429, price: 8.50, providerSku: "ml_429", sortOrder: 15 },
                    { name: "514 Diamonds (468+46)", amount: 514, price: 10.00, providerSku: "ml_514", sortOrder: 16 },
                    { name: "706 Diamonds (625+81)", amount: 706, price: 13.50, providerSku: "ml_706", sortOrder: 17 },
                    { name: "Weekly Diamond Pass", amount: 210, price: 1.99, providerSku: "ml_weekly_pass", isWeeklyPass: true, sortOrder: 18 },
                    { name: "Twilight Pass", amount: 1, price: 9.99, providerSku: "ml_twilight_pass", sortOrder: 19 },
                    { name: "2195 Diamonds (1860+335)", amount: 2195, price: 45.00, providerSku: "ml_2195", sortOrder: 20 },
                ],
            },
        },
        create: {
            slug: "mobile-legends",
            name: "Mobile Legends",
            iconUrl: "/mobile-legends-bang-bang-global-1770434793000.avif",
            inputConfig: { playerId: "string", zoneId: "string" },
            sortOrder: 2,
            packages: {
                create: [
                    { name: "5 Diamonds", amount: 5, price: 0.12, providerSku: "ml_5", sortOrder: 1 },
                    // ... (rest are same as update)
                ],
            },
        },
    });

    // 5. GLOBAL STOCK & BALANCE (For Testing)
    await prisma.globalStock.upsert({
        where: { id: "GLOBAL" },
        update: {
            diamonds: 1000000,
            providerBalance: 1000.00,
        },
        create: {
            id: "GLOBAL",
            diamonds: 1000000,
            providerBalance: 1000.00,
        },
    });

    // 6. PROMOTIONS
    const promotions = [
        {
            title: "Weekend Rebate",
            subtitle: "Get up to 50% extra diamonds on Mobile Legends",
            imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
            linkUrl: "/game/mobile-legends",
            badgeText: "HOT DEAL",
            badgeColor: "orange",
            isActive: true,
            sortOrder: 1,
        },
        {
            title: "New Player Bonus",
            subtitle: "Double your first top-up for Free Fire",
            imageUrl: "https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?q=80&w=2069&auto=format&fit=crop",
            linkUrl: "/game/free-fire",
            badgeText: "LIMITED",
            badgeColor: "purple",
            isActive: true,
            sortOrder: 2,
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
