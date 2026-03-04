import { prisma } from "../src/lib/prisma.js";

async function testUpdate() {
    try {
        // Find the package we created (or any package)
        const pkg = await prisma.package.findFirst();
        if (!pkg) return console.log("No package to update");

        console.log("Current SortOrder:", pkg.sortOrder);

        const updated = await prisma.package.update({
            where: { id: pkg.id },
            data: { sortOrder: 99 }
        });

        console.log("Updated SortOrder:", updated.sortOrder);

        // Revert
        await prisma.package.update({
            where: { id: pkg.id },
            data: { sortOrder: pkg.sortOrder }
        });

    } catch (err: any) {
        console.error("Error:", err.message);
    } finally {
        await prisma.$disconnect();
    }
}

testUpdate();
