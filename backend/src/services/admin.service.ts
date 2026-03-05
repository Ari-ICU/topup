import { prisma } from "../lib/prisma.js";
import {
    processTopUp,
    getActiveProviderBalance,
    getProviderWalletBalance,
    getLocalDiamondStock
} from "./topup-provider.service.js";
import { deductGlobalStock } from "./transaction.service.js";
import { invalidateGameCache } from "./game.service.js";
import { invalidateSettingsCache } from "../lib/settings.js";

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
    getOverview: async (period: string = '1Y') => {
        const activeGamesCount = await prisma.game.count({ where: { isActive: true } });

        const completedOrders = await prisma.transaction.count({
            where: { status: 'COMPLETED' }
        });

        const pendingOrders = await prisma.transaction.count({
            where: {
                status: { in: ['PENDING', 'PROCESSING'] }
            }
        });

        // Sum of completed transactions (Revenue from site)
        const result = await prisma.transaction.aggregate({
            where: { status: 'COMPLETED' },
            _sum: { totalAmount: true }
        });

        const siteRevenue = Number(result._sum.totalAmount) || 0;

        // Provider Wallet Balance (Own balance to buy diamonds)
        const providerWalletBalance = await getProviderWalletBalance();

        // Local Diamond Stock
        const diamondStock = await getLocalDiamondStock();

        // Transferred Revenue Tracking
        const globalStockRow = await prisma.globalStock.findUnique({ where: { id: "GLOBAL" } });
        const totalTransferredRevenue = Number(globalStockRow?.totalTransferredRevenue) || 0;

        // --- Analytics Chart Data ---
        let chartData: { month: string, topup: number, card: number }[] = [];
        const now = new Date();

        if (period === '7D' || period === '30D') {
            const days = period === '7D' ? 7 : 30;
            const startDate = new Date();
            startDate.setDate(now.getDate() - days + 1);
            startDate.setHours(0, 0, 0, 0);

            const transactions = await prisma.transaction.findMany({
                where: { createdAt: { gte: startDate } },
                select: { status: true, createdAt: true }
            });

            // Initialize days
            for (let i = 0; i < days; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                const label = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                chartData.push({ month: label, topup: 0, card: 0 });
            }

            // Group by day
            transactions.forEach(tx => {
                const txDate = tx.createdAt.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                const dataPoint = chartData.find(d => d.month === txDate);
                if (dataPoint) {
                    if (tx.status === 'COMPLETED') dataPoint.topup += 1;
                    else if (tx.status === 'FAILED' || tx.status === 'EXPIRED') dataPoint.card += 1;
                }
            });
        } else {
            // 6M or 1Y (Default to 1Y)
            const monthsToFetch = period === '6M' ? 6 : 12;
            const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];

            const startOfMonth = new Date(now.getFullYear(), now.getMonth() - monthsToFetch + 1, 1);

            const transactions = await prisma.transaction.findMany({
                where: { createdAt: { gte: startOfMonth } },
                select: { status: true, createdAt: true }
            });

            // Initialize months
            for (let i = 0; i < monthsToFetch; i++) {
                const date = new Date(now.getFullYear(), now.getMonth() - monthsToFetch + 1 + i, 1);
                chartData.push({ month: months[date.getMonth()], topup: 0, card: 0 });
            }

            // Group by month
            transactions.forEach(tx => {
                const monthName = months[tx.createdAt.getMonth()];
                const dataPoint = chartData.find(d => d.month === monthName);
                if (dataPoint) {
                    if (tx.status === 'COMPLETED') dataPoint.topup += 1;
                    else if (tx.status === 'FAILED' || tx.status === 'EXPIRED') dataPoint.card += 1;
                }
            });
        }

        // Get recent transactions
        const recentTransactions = await prisma.transaction.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                package: {
                    include: { game: { select: { name: true, iconUrl: true } } }
                }
            }
        });

        return {
            revenue: siteRevenue,
            totalTransferredRevenue,
            providerWalletBalance,
            globalStockDiamonds: diamondStock,
            completedOrders,
            pendingOrders,
            activeGames: activeGamesCount,
            cardOrders: 0,
            chartData,
            recentTransactions
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
        const game = await prisma.game.create({ data });
        await invalidateGameCache();
        return game;
    },

    updateGame: async (id: string, data: Partial<GameData>) => {
        const game = await prisma.game.update({ where: { id }, data });
        await invalidateGameCache();
        return game;
    },

    deleteGame: async (id: string) => {
        const game = await prisma.game.delete({ where: { id } });
        await invalidateGameCache();
        return game;
    },

    reorderGames: async (gameIds: string[]) => {
        const updates = gameIds.map((id, index) =>
            prisma.game.update({
                where: { id },
                data: { sortOrder: index }
            })
        );
        const result = await prisma.$transaction(updates);
        await invalidateGameCache();
        return result;
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
        const pkg = await prisma.package.create({
            data: packageData,
            include: {
                game: { select: { name: true, slug: true, iconUrl: true } }
            }
        });
        await invalidateGameCache();
        return pkg;
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
        const pkg = await prisma.package.update({
            where: { id },
            data: packageData,
            include: {
                game: { select: { name: true, slug: true, iconUrl: true } }
            }
        });
        await invalidateGameCache();
        return pkg;
    },

    reorderPackages: async (packageIds: string[]) => {
        const updates = packageIds.map((id, index) =>
            prisma.package.update({
                where: { id },
                data: { sortOrder: index }
            })
        );
        const result = await prisma.$transaction(updates);
        await invalidateGameCache();
        return result;
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

        const deleted = await prisma.package.delete({ where: { id } });
        await invalidateGameCache();
        return deleted;
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
        // Find existing transaction to get package and player info
        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                package: {
                    include: { game: true }
                }
            }
        });

        if (!transaction) throw new Error("Transaction not found");

        // If admin marks as COMPLETED, we initiate the top-up via Provider API
        if (status === "COMPLETED" && transaction.status !== "COMPLETED") {
            try {
                const playerInfo: any = transaction.playerInfo;
                const result = await processTopUp({
                    transactionId: transaction.id,
                    providerSku: transaction.package.providerSku,
                    playerId: playerInfo.playerId || playerInfo.userId || "",
                    zoneId: playerInfo.zoneId,
                    amount: transaction.package.amount,
                    gameSlug: transaction.package.game.slug,
                });

                // Save reference from provider
                const updatedTransaction = await prisma.transaction.update({
                    where: { id },
                    data: {
                        status,
                        providerRef: result.providerRef,
                    },
                });

                // Deduct real diamonds from global stock ONLY after confirmed delivery
                // Uses shared helper — handles unlimited (-1) correctly
                await deductGlobalStock(transaction.package.amount);

                console.log(`[Admin] ✅ Manually completed TxID ${id} via ${result.provider}. Stock deducted: ${transaction.package.amount}💎`);

                return updatedTransaction;
            } catch (err: any) {
                console.error("[Admin] TopUp Failed:", err.message);
                throw new Error("Failed to deliver diamonds via Provider API: " + err.message);
            }
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
        const result = await prisma.$transaction(
            settings.map((setting) =>
                prisma.systemSetting.upsert({
                    where: { key: setting.key },
                    update: { value: setting.value },
                    create: { key: setting.key, value: setting.value }
                })
            )
        );
        // Invalidate Redis cache so bakong/moogold settings are fresh immediately
        await invalidateSettingsCache();
        return result;
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
    },

    // --- API Keys ---
    getApiKeys: async () => {
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { in: ['API_PUBLIC_KEY', 'API_SECRET_KEY'] }
            }
        });

        const publicKey = settings.find(s => s.key === 'API_PUBLIC_KEY')?.value || "";
        const secretKey = settings.find(s => s.key === 'API_SECRET_KEY')?.value || "";

        // Mask secret key: only show first 4 and last 4
        const maskedSecret = secretKey.length > 10
            ? `${secretKey.substring(0, 7)}${'.'.repeat(20)}${secretKey.substring(secretKey.length - 7)}`
            : secretKey;

        return {
            publicKey,
            secretKey: maskedSecret
        };
    },

    generateApiKeys: async () => {
        const { randomBytes } = await import('node:crypto');
        const publicKey = `pk_${randomBytes(24).toString('hex')}`;
        const secretKey = `sk_${randomBytes(32).toString('hex')}`;

        await prisma.$transaction([
            prisma.systemSetting.upsert({
                where: { key: 'API_PUBLIC_KEY' },
                update: { value: publicKey },
                create: { key: 'API_PUBLIC_KEY', value: publicKey }
            }),
            prisma.systemSetting.upsert({
                where: { key: 'API_SECRET_KEY' },
                update: { value: secretKey },
                create: { key: 'API_SECRET_KEY', value: secretKey }
            })
        ]);

        return { publicKey, secretKey };
    }
};

