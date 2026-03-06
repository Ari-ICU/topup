/// <reference types="node" />
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database with comprehensive game packages...");

    // 1. Free Fire (FF)
    await prisma.game.upsert({
        where: { slug: "free-fire" },
        update: {},
        create: {
            slug: "free-fire",
            name: "Free Fire",
            iconUrl: "/free-fire.png",
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

    // 2. Mobile Legends (MLBB) - Updated to 20 packages
    await prisma.game.upsert({
        where: { slug: "mobile-legends" },
        update: {},
        create: {
            slug: "mobile-legends",
            name: "Mobile Legends",
            iconUrl: "/mobile-legends.png",
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
    });

    // 3. PUBG Mobile (UC)
    await prisma.game.upsert({
        where: { slug: "pubg-mobile" },
        update: {},
        create: {
            slug: "pubg-mobile",
            name: "PUBG Mobile",
            iconUrl: "/pubg-mobile.png",
            inputConfig: { playerId: "string" },
            sortOrder: 3,
            packages: {
                create: [
                    { name: "60 UC", amount: 60, price: 0.99, providerSku: "pubg_60", sortOrder: 1 },
                    { name: "325 UC (300+25)", amount: 325, price: 4.99, providerSku: "pubg_325", sortOrder: 2 },
                    { name: "660 UC (600+60)", amount: 660, price: 9.99, providerSku: "pubg_660", sortOrder: 3 },
                    { name: "1800 UC (1500+300)", amount: 1800, price: 24.99, providerSku: "pubg_1800", sortOrder: 4 },
                    { name: "3850 UC (3000+850)", amount: 3850, price: 49.99, providerSku: "pubg_3850", sortOrder: 5 },
                    { name: "8100 UC (6000+2100)", amount: 8100, price: 99.99, providerSku: "pubg_8100", sortOrder: 6 },
                ],
            },
        },
    });

    // 4. Genshin Impact (Genesis Crystals)
    await prisma.game.upsert({
        where: { slug: "genshin-impact" },
        update: {},
        create: {
            slug: "genshin-impact",
            name: "Genshin Impact",
            iconUrl: "/genshin-impact.png",
            inputConfig: { playerId: "string", server: "string" },
            sortOrder: 4,
            packages: {
                create: [
                    { name: "60 Genesis Crystals", amount: 60, price: 0.99, providerSku: "gi_60", sortOrder: 1 },
                    { name: "330 Genesis Crystals", amount: 330, price: 4.99, providerSku: "gi_330", sortOrder: 2 },
                    { name: "1090 Genesis Crystals", amount: 1090, price: 14.99, providerSku: "gi_1090", sortOrder: 3 },
                    { name: "Blessing of the Welkin Moon", amount: 300, price: 4.99, providerSku: "gi_welkin", isWeeklyPass: true, sortOrder: 4 },
                ],
            },
        },
    });

    console.log("Seeding completed successfully!");
}

main()
    .catch((e) => {
        console.error("Error during seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
