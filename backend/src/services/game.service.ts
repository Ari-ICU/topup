import { prisma } from "../lib/prisma.js";
import { rGet, rSet, rFlushPattern } from "../lib/redis.js";

const GAMES_LIST_KEY = "app:games:active";
const GAME_DETAIL_KEY = (slug: string) => `app:games:detail:${slug}`;
const GAMES_TTL = 5 * 60; // 5 minutes

export const getAllActiveGames = async () => {
    // 1. Try cache
    const cached = await rGet(GAMES_LIST_KEY);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch {
            /* fall through */
        }
    }

    // 2. DB query
    const games = await prisma.game.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
            _count: {
                select: { packages: true },
            },
        },
    });

    // 3. Cache result
    await rSet(GAMES_LIST_KEY, JSON.stringify(games), GAMES_TTL);

    return games;
};

export const getGameBySlugDetails = async (slug: string) => {
    const cacheKey = GAME_DETAIL_KEY(slug);

    // 1. Try cache
    const cached = await rGet(cacheKey);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch {
            /* fall through */
        }
    }

    // 2. DB query
    const [game, globalStock] = await Promise.all([
        prisma.game.findUnique({
            where: { slug },
            include: {
                packages: {
                    orderBy: [
                        { sortOrder: "asc" },
                        { price: "asc" },
                    ],
                },
            },
        }),
        prisma.globalStock.findUnique({ where: { id: "GLOBAL" } }),
    ]);

    if (!game) {
        throw new Error("Game not found");
    }

    // -1 means unlimited; 0 or missing means out of stock
    const globalStockDiamonds = globalStock?.diamonds ?? 0;

    const result = { ...game, globalStockDiamonds };

    // 3. Cache result
    await rSet(cacheKey, JSON.stringify(result), GAMES_TTL);

    return result;
};

/**
 * Invalidate all game-related caches.
 * Call this after any create/update/delete/reorder on games or packages.
 */
export async function invalidateGameCache(): Promise<void> {
    await rFlushPattern("app:games:*");
    console.log("[Cache] 🗑️  Game cache invalidated.");
}
