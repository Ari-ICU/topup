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
import { getMooGoldProductList, getMooGoldGamePackages } from "./moogold.service.js";

import fs from "node:fs/promises";
import path from "node:path";

interface GameData {
    slug: string;
    name: string;
    iconUrl: string;
    bannerUrl?: string;
    inputConfig: any;
    isActive?: boolean;
}

export const adminService = {
    // --- Data Safety ---
    backupData: async () => {
        try {
            console.log("[Backup] 🔄 Starting full data backup...");
            const games = await prisma.game.findMany({ include: { packages: true } });
            const settings = await prisma.systemSetting.findMany();
            const globalStock = await prisma.globalStock.findUnique({ where: { id: "GLOBAL" } });
            const users = await prisma.user.findMany();
            const promotions = await prisma.promotion.findMany();
            const allTransactions = await prisma.transaction.findMany();

            const backup = {
                timestamp: new Date().toISOString(),
                games,
                settings,
                globalStock,
                users,
                promotions,
                transactions: allTransactions
            };

            const backupDir = path.join(process.cwd(), 'backups');
            await fs.mkdir(backupDir, { recursive: true });

            const filePath = path.join(backupDir, 'db_backup.json');
            await fs.writeFile(filePath, JSON.stringify(backup, null, 2));

            console.log(`[Backup] 📁 Full data backup created at ${filePath} (${allTransactions.length} transactions)`);
        } catch (err) {
            console.error("[Backup] ❌ Failed to create full backup:", err);
        }
    },

    restoreData: async () => {
        try {
            const filePath = path.join(process.cwd(), 'backups', 'db_backup.json');
            const data = await fs.readFile(filePath, 'utf-8');
            const backup = JSON.parse(data);

            const { games, settings, globalStock, users, promotions, transactions } = backup;

            console.log(`[Restore] 🔄 Starting restoration from backup dated: ${backup.timestamp}...`);

            // Use a transaction for safety
            await prisma.$transaction(async (tx) => {
                // 1. Restore Settings
                if (settings) {
                    for (const setting of settings) {
                        await tx.systemSetting.upsert({
                            where: { key: setting.key },
                            create: setting,
                            update: setting
                        });
                    }
                }

                // 2. Restore Global Stock
                if (globalStock) {
                    await tx.globalStock.upsert({
                        where: { id: "GLOBAL" },
                        create: globalStock,
                        update: globalStock
                    });
                }

                // 3. Restore Promotions
                if (promotions) {
                    for (const promo of promotions) {
                        await tx.promotion.upsert({
                            where: { id: promo.id },
                            create: promo,
                            update: promo
                        });
                    }
                }

                // 4. Restore Users
                if (users) {
                    for (const user of users) {
                        await tx.user.upsert({
                            where: { id: user.id },
                            create: user,
                            update: user
                        });
                    }
                }

                // 5. Restore Games & Packages
                if (games) {
                    for (const game of games) {
                        const { packages, ...gameData } = game;
                        await tx.game.upsert({
                            where: { id: gameData.id },
                            create: gameData,
                            update: gameData
                        });

                        for (const pkg of packages) {
                            await tx.package.upsert({
                                where: { id: pkg.id },
                                create: pkg,
                                update: pkg
                            });
                        }
                    }
                }

                // 6. Restore Transactions
                if (transactions) {
                    console.log(`[Restore] 📈 Restoring ${transactions.length} transactions...`);
                    for (const txItem of transactions) {
                        // Ensure optional dates are converted back from JSON strings if necessary
                        // Prisma usually handles date strings in create/upsert if format is ISO
                        await tx.transaction.upsert({
                            where: { id: txItem.id },
                            create: txItem,
                            update: txItem
                        });
                    }
                }
            }, {
                timeout: 30000 // Increase timeout for large backups
            });

            console.log("[Restore] ✅ Full restoration completed successfully!");
            await invalidateGameCache();
            await invalidateSettingsCache();

            return {
                timestamp: backup.timestamp,
                gamesCount: games?.length || 0,
                transactionsCount: transactions?.length || 0,
                usersCount: users?.length || 0
            };
        } catch (err) {
            console.error("[Restore] ❌ Restoration failed:", err);
            throw err;
        }
    },
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

        const result = await prisma.transaction.aggregate({
            where: { status: 'COMPLETED' },
            _sum: { totalAmount: true }
        });

        const siteRevenue = Number(result._sum.totalAmount) || 0;
        const providerWalletBalance = await getProviderWalletBalance();
        const diamondStock = await getLocalDiamondStock();

        // Transferred Revenue Tracking
        const globalStockRow = await prisma.globalStock.findUnique({ where: { id: "GLOBAL" } });
        const totalTransferredRevenue = Number(globalStockRow?.totalTransferredRevenue) || 0;

        // Chart Data
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
            where: {
                NOT: {
                    providerSku: { startsWith: 'ARCHIVED_' }
                }
            },
            include: {
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
        badgeText?: string;
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
        badgeText?: string;
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
        const pkg = await prisma.package.findUnique({ where: { id } });
        if (!pkg) throw new Error("Package not found");

        const txCount = await prisma.transaction.count({ where: { packageId: id } });
        if (txCount > 0) {
            // "Soft delete" by hiding it and scrambling the SKU since Prisma doesn't have isActive
            const deleted = await prisma.package.update({
                where: { id },
                data: {
                    name: `(Archived) ${pkg.name}`,
                    providerSku: `ARCHIVED_${Date.now()}_${pkg.providerSku}`,
                    sortOrder: 9999 // push to bottom
                }
            });
            await invalidateGameCache();
            return deleted;
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
        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                package: {
                    include: { game: true }
                }
            }
        });

        if (!transaction) throw new Error("Transaction not found");

        // Manually complete via Provider API
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

                const updatedTransaction = await prisma.transaction.update({
                    where: { id },
                    data: {
                        status,
                        providerRef: result.providerRef,
                    },
                });

                await deductGlobalStock(transaction.package.amount);
                console.log(`[Admin] ✅ Completed TxID ${id} via ${result.provider}. Stock: -${transaction.package.amount}`);

                // Trigger emergency backup
                await adminService.backupData();

                return updatedTransaction;
            } catch (err: any) {
                console.error("[Admin] TopUp Failed:", err.message);
                throw new Error("Failed to deliver diamonds: " + err.message);
            }
        }

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
        // Invalidate Redis cache
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

        await adminService.backupData();
        return updated.diamonds;
    },

    // --- Transfer Revenue ---
    transferRevenue: async (amount: number) => {
        const globalStockRow = await prisma.globalStock.findUnique({ where: { id: "GLOBAL" } });
        const currentTotal = Number(globalStockRow?.totalTransferredRevenue) || 0;
        const currentProviderBalance = Number(globalStockRow?.providerBalance) || 0;

        const updated = await prisma.globalStock.upsert({
            where: { id: "GLOBAL" },
            update: {
                totalTransferredRevenue: currentTotal + amount,
                providerBalance: currentProviderBalance + amount
            },
            create: {
                id: "GLOBAL",
                diamonds: -1,
                totalTransferredRevenue: amount,
                providerBalance: amount
            }
        });

        return updated;
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

        // Mask secret key
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
    },

    // --- Promotions ---
    getAllPromotions: async () => {
        return prisma.promotion.findMany({
            orderBy: { sortOrder: 'asc' }
        });
    },

    getActivePromotions: async () => {
        return prisma.promotion.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
        });
    },

    createPromotion: async (data: {
        title: string;
        subtitle?: string;
        badgeText?: string;
        badgeColor?: string;
        imageUrl: string;
        linkUrl?: string;
        isActive?: boolean;
        sortOrder?: number;
    }) => {
        const promo = await prisma.promotion.create({ data });
        return promo;
    },

    updatePromotion: async (id: string, data: Partial<{
        title: string;
        subtitle: string;
        badgeText: string;
        badgeColor: string;
        imageUrl: string;
        linkUrl: string;
        isActive: boolean;
        sortOrder: number;
    }>) => {
        const promo = await prisma.promotion.update({
            where: { id },
            data
        });
        return promo;
    },

    deletePromotion: async (id: string) => {
        return prisma.promotion.delete({
            where: { id }
        });
    },

    reorderPromotions: async (ids: string[]) => {
        const updates = ids.map((id, index) =>
            prisma.promotion.update({
                where: { id },
                data: { sortOrder: index }
            })
        );
        return prisma.$transaction(updates);
    },

    // --- MooGold Automation ---
    getMooGoldPackagesByGame: async (gameId: string) => {
        const game = await prisma.game.findUnique({ where: { id: gameId } });
        if (!game) throw new Error("Game not found");

        const products = await getMooGoldProductList();
        if (!products || products.length === 0) throw new Error("No products found from MooGold.");

        const relevantGame = products.find((p: any) =>
            p.post_title?.toLowerCase().includes(game.name.toLowerCase()) ||
            p.post_title?.toLowerCase().includes(game.slug.toLowerCase().replace(/-/g, ' '))
        );

        if (!relevantGame) {
            throw new Error(`No MooGold game found matching "${game.name}".`);
        }

        const packageList = await getMooGoldGamePackages(relevantGame.ID);
        return packageList.Variation || packageList.product || [];
    },

    bulkSyncMooGoldProducts: async (gameId: string, mooGoldCategoryId: string = "50") => {
        const game = await prisma.game.findUnique({ where: { id: gameId } });
        if (!game) throw new Error("Game not found");

        // Fetch margin setting
        const marginSetting = await prisma.systemSetting.findUnique({ where: { key: "MOOGOLD_MARGIN" } });
        const margin = parseFloat(marginSetting?.value || "1.1"); // Default 10% profit

        const products = await getMooGoldProductList();
        if (!products || products.length === 0) throw new Error("No products found from MooGold.");
        // MooGold products list returns games, not packages directly.
        // E.g., { ID: '15145', post_title: 'Mobile Legends' }
        const relevantGame = products.find((p: any) =>
            p.post_title?.toLowerCase().includes(game.name.toLowerCase()) ||
            p.post_title?.toLowerCase().includes(game.slug.toLowerCase().replace(/-/g, ' '))
        );

        if (!relevantGame) {
            throw new Error(`No MooGold game found matching "${game.name}".`);
        }

        console.log(`[Sync] Found MooGold Game: ${relevantGame.post_title} (ID: ${relevantGame.ID})`);

        // Now fetch the actual packages for this game ID
        const packageList = await getMooGoldGamePackages(relevantGame.ID);
        const itemsToProcess = packageList.Variation || packageList.product || [];

        if (itemsToProcess.length === 0) {
            throw new Error(`No packages found for game "${relevantGame.post_title}".`);
        }

        console.log(`[Sync] Found ${itemsToProcess.length} potential packages for ${game.name}.`);

        let createdCount = 0;
        let updatedCount = 0;

        for (const item of itemsToProcess) {
            const productId = item.variation_id?.toString();
            if (!productId) continue;

            // Extract numeric amount from name (e.g., "Mobile Legends - 86 Diamonds" -> 86)
            const amountMatch = item.variation_name?.match(/(\d+(?:,\d+)?)\s*(?:Diamonds|Gems|Coins|UC)/i);
            const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, ''), 10) : 0;

            const rawPrice = parseFloat(item.variation_price) || 0;
            const price = parseFloat((rawPrice * margin).toFixed(2));
            const name = item.variation_name?.replace(/^[^A-Z0-9]*[-–—]?\s*/i, '').replace(/ \(#\d+\)$/, '').trim() || `Package ${productId}`;

            // Upsert the package
            await prisma.package.upsert({
                where: {
                    id: (await prisma.package.findFirst({ where: { gameId, providerSku: productId } }))?.id || "NEW"
                },
                create: {
                    gameId,
                    name,
                    amount,
                    price,
                    providerSku: productId,
                    isWeeklyPass: name.toLowerCase().includes("pass") || name.toLowerCase().includes("weekly"),
                    sortOrder: amount || 0,
                },
                update: {
                    price,
                    name, // Optionally update name to ensure it is clean
                }
            });

            if ((await prisma.package.findFirst({ where: { gameId, providerSku: productId } }))) {
                updatedCount++;
            } else {
                createdCount++;
            }
        }

        await invalidateGameCache();
        return { createdCount, updatedCount, total: itemsToProcess.length };
    }
};

