import { prisma } from "../lib/prisma.js";
import {
    processTopUp,
    getActiveProviderBalance,
    getProviderWalletBalance,
    getLocalDiamondStock
} from "./topup-provider.service.js";
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

        return {
            revenue: siteRevenue,
            providerWalletBalance,
            globalStockDiamonds: diamondStock,
            completedOrders,
            pendingOrders,
            activeGames: activeGamesCount,
            cardOrders: 0, // Placeholder
            chartData: [],
            recentTransactions: []
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

