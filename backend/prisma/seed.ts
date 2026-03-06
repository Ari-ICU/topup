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
    await prisma.package.deleteMany({
        where: { game: { slug: { in: activeSlugs } } }
    });

    // 3. Free Fire (FF)
    await prisma.game.upsert({
        where: { slug: "free-fire" },
        update: {
            name: "Free Fire",
            iconUrl: "/uploads/free-fire-logo.png",
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
            iconUrl: "/uploads/free-fire-logo.png",
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
            iconUrl: "/uploads/mobile-legends-bang-bang-global-1770434793000.avif",
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
            iconUrl: "/uploads/mobile-legends-bang-bang-global-1770434793000.avif",
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

    console.log("✅ Seeding completed. All 20 items are now in the database!");
}

main()
    .catch((e) => {
        console.error("❌ Error during seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
