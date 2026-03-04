import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

    // Create Games
    const freeFire = await prisma.game.upsert({
        where: { slug: "free-fire" },
        update: {},
        create: {
            slug: "free-fire",
            name: "Free Fire",
            iconUrl: "/free-fire.png",
            inputConfig: { playerId: "string", zoneId: "string" },
            packages: {
                create: [
                    { name: "100 Diamonds", amount: 100, price: 1.25, providerSku: "ff_100" },
                    { name: "310 Diamonds", amount: 310, price: 3.50, providerSku: "ff_310" },
                    { name: "620 Diamonds", amount: 620, price: 6.80, providerSku: "ff_620" },
                ],
            },
        },
    });

    const mlbb = await prisma.game.upsert({
        where: { slug: "mobile-legends" },
        update: {},
        create: {
            slug: "mobile-legends",
            name: "Mobile Legends",
            iconUrl: "/mobile-legends.png",
            inputConfig: { playerId: "string", zoneId: "string" },
            packages: {
                create: [
                    { name: "50 Diamonds", amount: 50, price: 1.00, providerSku: "ml_50" },
                    { name: "250 Diamonds", amount: 250, price: 4.80, providerSku: "ml_250" },
                ],
            },
        },
    });

    console.log("Seeding completed!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
