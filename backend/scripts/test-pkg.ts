import { prisma } from "../src/lib/prisma.js";

async function testCreate() {
    try {
        const pkg = await prisma.package.create({
            data: {
                name: "Test Package",
                gameId: "cmm8sgarp0004ql4g4crwux5y", // Using the ID from the log
                amount: 100,
                price: 1.0,
                providerSku: "test_sku",
                description: "Test description",
                isWeeklyPass: false,
            }
        });
        console.log("Success:", pkg);
        // Clean up
        await prisma.package.delete({ where: { id: pkg.id } });
    } catch (err: any) {
        console.error("Error:", err.message);
    } finally {
        await prisma.$disconnect();
    }
}

testCreate();
