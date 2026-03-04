import { prisma } from "../lib/prisma.js";
import { processTopUp, getActiveProviderBalance } from "./topup-provider.service.js";
import { deductGlobalStock } from "./transaction.service.js";

interface GameData {
    slug: string;
    name: string;
    iconUrl: string;
    bannerUrl?: string;
    inputConfig: any;
    isActive?: boolean;
}

export const adminService = {
    // --- Analytics ---
    getOverview: async () => {
        const totalTransactions = await prisma.transaction.count();
        const activeGamesCount = await prisma.game.count({ where: { isActive: true } });
        const pendingReviewsCount = await prisma.review.count({ where: { isApproved: false } });

        // Sum of completed transactions
        const result = await prisma.transaction.aggregate({
            where: { status: 'COMPLETED' },
            _sum: { totalAmount: true }
        });

        // Recent successful operations
        const recentTransactions = await prisma.transaction.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                package: {
                    select: { name: true, game: { select: { name: true } } }
                }
            }
        });

        // 7-day revenue performance (simplified)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyRevenue = await prisma.transaction.groupBy({
            by: ['createdAt'],
            where: {
                status: 'COMPLETED',
                createdAt: { gte: sevenDaysAgo }
            },
            _sum: { totalAmount: true }
        });

        // 🟢 Retrieve REAL balance from ANY active provider (MooGold, Digi, Friend, or Local)
        const globalStockDiamonds = await getActiveProviderBalance();

        const totalRevenue = Number(result._sum.totalAmount) || 0;
        const completedCount = await prisma.transaction.count({ where: { status: 'COMPLETED' } });

        // Metrics
        const conversionRate = totalTransactions > 0 ? (completedCount / totalTransactions * 100).toFixed(2) : "0.00";
        const avgTicketSize = completedCount > 0 ? (totalRevenue / completedCount).toFixed(2) : "0.00";

        // Count unique players by playerId/userId in playerInfo JSON
        const uniquePlayers = await prisma.transaction.groupBy({
            by: ['playerInfo'],
            where: { status: 'COMPLETED' }
        });

        // Aggregate into unique daily buckets for the chart
        const aggregated = new Map<string, number>();
        dailyRevenue.forEach(d => {
            const dateStr = d.createdAt.toISOString().split('T')[0];
            aggregated.set(dateStr, (aggregated.get(dateStr) || 0) + (Number(d._sum.totalAmount) || 0));
        });

        const sortedChartData = Array.from(aggregated.entries())
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            revenue: totalRevenue,
            transactions: totalTransactions,
            activeGames: activeGamesCount,
            globalStockDiamonds,
            pendingReviews: pendingReviewsCount,
            recentTransactions,
            chartData: sortedChartData,
            metrics: {
                conversionRate: `${conversionRate}%`,
                avgTicketSize: `$${avgTicketSize}`,
                customerLTV: uniquePlayers.length > 0 ? `$${(totalRevenue / uniquePlayers.length).toFixed(2)}` : "$0.00"
            }
        };
    },

    // --- Games ---
    getAllGames: async () => {
        return prisma.game.findMany({
            orderBy: [
                { sortOrder: 'asc' },
                { createdAt: 'desc' }
            ],
            include: {
                _count: {
                    select: { packages: true }
                }
            }
        });
    },

    createGame: async (data: GameData) => {
        return prisma.game.create({
            data
        });
    },

    updateGame: async (id: string, data: Partial<GameData>) => {
        return prisma.game.update({
            where: { id },
            data
        });
    },

    deleteGame: async (id: string) => {
        return prisma.game.delete({
            where: { id }
        });
    },

    reorderGames: async (gameIds: string[]) => {
        const updates = gameIds.map((id, index) =>
            prisma.game.update({
                where: { id },
                data: { sortOrder: index }
            })
        );
        return prisma.$transaction(updates);
    },

    // --- Packages ---
    getAllPackages: async () => {
        return prisma.package.findMany({
            include: {
                // include the game's iconUrl so frontend can render the official logo
                game: { select: { name: true, slug: true, iconUrl: true } }
            },
            orderBy: [
                { sortOrder: 'asc' },
                { gameId: 'asc' }
            ]
        });
    },

    createPackage: async (data: {
        gameId: string;
        name: string;
        amount: number;
        price: number;
        points: number;
        providerCode: string;
        providerSku: string;
        description?: string;
        isWeeklyPass: boolean;
        sortOrder: number;
    }) => {
        const { providerCode, ...packageData } = data;
        return prisma.package.create({
            data: packageData,
            include: {
                game: { select: { name: true, slug: true, iconUrl: true } }
            }
        });
    },

    updatePackage: async (id: string, data: {
        gameId?: string;
        name?: string;
        amount?: number;
        price?: number;
        points?: number;
        providerCode?: string;
        providerSku?: string;
        description?: string;
        isWeeklyPass?: boolean;
        sortOrder?: number;
    }) => {
        const { providerCode, ...packageData } = data;
        return prisma.package.update({
            where: { id },
            data: packageData,
            include: {
                game: { select: { name: true, slug: true, iconUrl: true } }
            }
        });
    },

    reorderPackages: async (packageIds: string[]) => {
        const updates = packageIds.map((id, index) =>
            prisma.package.update({
                where: { id },
                data: { sortOrder: index }
            })
        );
        return prisma.$transaction(updates);
    },

    deletePackage: async (id: string) => {
        // Check if package exists first
        const pkg = await prisma.package.findUnique({ where: { id } });
        if (!pkg) {
            throw new Error("Package not found");
        }

        // Check if any transactions reference this package
        const txCount = await prisma.transaction.count({ where: { packageId: id } });
        if (txCount > 0) {
            throw new Error(
                `Cannot delete this package — it has ${txCount} linked transaction(s). ` +
                `You can deactivate it instead by editing the package.`
            );
        }

        return prisma.package.delete({ where: { id } });
    },

    // --- Transactions ---
    getAllTransactions: async () => {
        return prisma.transaction.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                package: {
                    include: {
                        game: { select: { name: true } }
                    }
                },
                user: { select: { name: true, email: true } }
            }
        });
    },

    updateTransactionStatus: async (id: string, status: any) => {
        // If admin marks as COMPLETED, we use the central fulfillment logic
        if (status === "COMPLETED") {
            const { fulfillTransaction } = await import("./transaction.service.js");
            const result = await fulfillTransaction(id);
            return prisma.transaction.findUnique({ where: { id } });
        }

        // Just a normal status update (e.g., to FAILED or PROCESSING)
        return prisma.transaction.update({
            where: { id },
            data: { status }
        });
    },

    // --- Settings ---
    getSettings: async () => {
        return prisma.systemSetting.findMany();
    },

    updateSettings: async (settings: { key: string; value: string }[]) => {
        return prisma.$transaction(
            settings.map((setting) =>
                prisma.systemSetting.upsert({
                    where: { key: setting.key },
                    update: { value: setting.value },
                    create: { key: setting.key, value: setting.value }
                })
            )
        );
    },

    // --- Global Stock ---
    updateGlobalStock: async (diamonds: number) => {
        return prisma.globalStock.upsert({
            where: { id: "GLOBAL" },
            update: { diamonds },
            create: { id: "GLOBAL", diamonds }
        });
    },

    // Synchronize local global stock with whatever the active provider reports.
    // Useful for the admin dashboard when you want an accurate readout without
    // manually editing the "Global Stock" field.
    syncProviderStock: async () => {
        const balance = await getActiveProviderBalance();
        if (balance === -1) {
            // unlimited, just ensure the local record reflects that
            await prisma.globalStock.upsert({
                where: { id: "GLOBAL" },
                update: { diamonds: -1 },
                create: { id: "GLOBAL", diamonds: -1 }
            });
            return -1;
        }
        const updated = await prisma.globalStock.upsert({
            where: { id: "GLOBAL" },
            update: { diamonds: balance },
            create: { id: "GLOBAL", diamonds: balance }
        });
        return updated.diamonds;
    }
};

