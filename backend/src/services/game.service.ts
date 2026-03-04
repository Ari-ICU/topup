import { prisma } from "../lib/prisma.js";

export const getAllActiveGames = async () => {
    return await prisma.game.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
            _count: {
                select: { packages: true },
            },
        },
    });
};

export const getGameBySlugDetails = async (slug: string) => {
    const game = await prisma.game.findUnique({
        where: { slug },
        include: {
            packages: {
                orderBy: [
                    { sortOrder: 'asc' },
                    { price: "asc" }
                ],
            },
        },
    });

    if (!game) {
        throw new Error("Game not found");
    }

    return game;
};
