import { prisma } from "../src/lib/prisma.js";

async function fixSortOrder() {
    try {
        console.log("Setting all packages and games to sortOrder: 999...");
        await prisma.package.updateMany({ data: { sortOrder: 999 } });
        await prisma.game.updateMany({ data: { sortOrder: 999 } });
        console.log("Done!");
    } catch (err: any) {
        console.error("Error:", err.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixSortOrder();
