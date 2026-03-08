import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { adminService } from "../services/admin.service.js";
import { getProviderStatus } from "../services/topup-provider.service.js";
import { fulfillTransaction } from "../services/transaction.service.js";
import { getMooGoldProductList } from "../services/moogold.service.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev-only-123";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Admin login
export const adminLogin = async (req: Request, res: Response) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required" });
        }

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ success: false, message: "Invalid admin password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { role: "admin", timestamp: Date.now() },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            message: "Successfully authenticated",
            token
        });
    } catch (error: any) {
        console.error(`[AdminLogin] Error:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOverview = async (req: Request, res: Response) => {
    try {
        const period = req.query.period as string || '1Y';
        const data = await adminService.getOverview(period);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getGames = async (req: Request, res: Response) => {
    try {
        const data = await adminService.getAllGames();
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createGame = async (req: Request, res: Response) => {
    try {
        const data = await adminService.createGame(req.body);
        res.status(201).json({ success: true, data });
    } catch (error: any) {
        console.error(`[CreateGame] Error:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateGame = async (req: Request, res: Response) => {
    try {
        const data = await adminService.updateGame(req.params.id, req.body);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteGame = async (req: Request, res: Response) => {
    try {
        const data = await adminService.deleteGame(req.params.id);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const reorderGames = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        await adminService.reorderGames(ids);
        res.json({ success: true, message: "Order updated successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPackages = async (req: Request, res: Response) => {
    try {
        const data = await adminService.getAllPackages();
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createPackage = async (req: Request, res: Response) => {
    try {
        const data = await adminService.createPackage(req.body);
        res.status(201).json({ success: true, data });
    } catch (error: any) {
        console.error(`[CreatePackage] Error creating package with data:`, req.body);
        console.error(`[CreatePackage] Detail:`, error);

        // Handle foreign key errors
        if (error.code === 'P2003' && error.meta?.constraint?.includes('gameId')) {
            return res.status(400).json({
                success: false,
                message: "Deployment error: The specified Game Sector node does not exist in the repository."
            });
        }

        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePackage = async (req: Request, res: Response) => {
    try {
        const data = await adminService.updatePackage(req.params.id, req.body);
        res.json({ success: true, data });
    } catch (error: any) {
        console.error(`[UpdatePackage] Error updating package ${req.params.id} with data:`, req.body);
        console.error(`[UpdatePackage] Detail:`, error);

        if (error.code === 'P2003' && error.meta?.constraint?.includes('gameId')) {
            return res.status(400).json({
                success: false,
                message: "Game not found."
            });
        }

        res.status(500).json({ success: false, message: error.message });
    }
};

export const reorderPackages = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ success: false, message: "Package IDs array is required" });
        }
        await adminService.reorderPackages(ids);
        res.json({ success: true, message: "Packages reordered successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deletePackage = async (req: Request, res: Response) => {
    try {
        const data = await adminService.deletePackage(req.params.id);
        res.json({ success: true, data });
    } catch (error: any) {
        if (error.message === "Package not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message?.startsWith("Cannot delete this package")) {
            return res.status(409).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const data = await adminService.getAllTransactions();
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTransactionStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const data = await adminService.updateTransactionStatus(req.params.id, status);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSettings = async (req: Request, res: Response) => {
    try {
        const data = await adminService.getSettings();
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const data = await adminService.updateSettings(req.body.settings);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateGlobalStock = async (req: Request, res: Response) => {
    try {
        const { diamonds } = req.body;
        const data = await adminService.updateGlobalStock(diamonds);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const syncProviderStock = async (_req: Request, res: Response) => {
    try {
        const count = await adminService.syncProviderStock();
        res.json({ success: true, data: count, message: "Local stock synced with provider" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const transferRevenue = async (req: Request, res: Response) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }
        const data = await adminService.transferRevenue(amount);
        res.json({ success: true, data, message: "Revenue transferred successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get provider status
export const getProviderStatusEndpoint = async (_req: Request, res: Response) => {
    try {
        const status = await getProviderStatus();
        res.json({ success: true, data: status });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getApiKeys = async (req: Request, res: Response) => {
    try {
        const data = await adminService.getApiKeys();
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const generateApiKeys = async (req: Request, res: Response) => {
    try {
        const data = await adminService.generateApiKeys();
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Promotions
export const getPromotions = async (req: Request, res: Response) => {
    try {
        const data = await adminService.getAllPromotions();
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createPromotion = async (req: Request, res: Response) => {
    try {
        const data = await adminService.createPromotion(req.body);
        res.status(201).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePromotion = async (req: Request, res: Response) => {
    try {
        const data = await adminService.updatePromotion(req.params.id, req.body);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deletePromotion = async (req: Request, res: Response) => {
    try {
        await adminService.deletePromotion(req.params.id);
        res.json({ success: true, message: "Promotion deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const reorderPromotions = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        await adminService.reorderPromotions(ids);
        res.json({ success: true, message: "Promotions reordered successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getActivePromotionsPublic = async (req: Request, res: Response) => {
    try {
        const data = await adminService.getActivePromotions();
        res.json({ success: true, data });
    } catch (error: any) {
        console.error("[Promotions API] Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
export const triggerBackup = async (_req: Request, res: Response) => {
    try {
        await adminService.backupData();
        res.json({ success: true, message: "Backup created successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const restoreData = async (req: Request, res: Response) => {
    try {
        const result = await adminService.restoreData();
        res.json({ success: true, data: result, message: "Data restored from backup" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin-only: Force-fulfill a transaction
export const manuallyFulfillTransaction = async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`[Admin] 👮 Manual fulfillment triggered by admin for TxID ${id}`);

    try {
        const result = await fulfillTransaction(id);
        return sendSuccess(res, result, "Transaction fulfilled manually by admin.");
    } catch (error: any) {
        console.error(`[Admin] ❌ Manual fulfillment failed for TxID ${id}:`, error.message);
        return sendError(res, error.message || "Manual fulfillment failed", 500);
    }
};

export const getMooGoldProducts = async (req: Request, res: Response) => {
    try {
        if (req.query.gameId) {
            const packages = await adminService.getMooGoldPackagesByGame(req.query.gameId as string);
            return res.json({ success: true, data: packages });
        }
        const products = await getMooGoldProductList();
        res.json({ success: true, data: products });
    } catch (error: any) {
        console.error(`[getMooGoldProducts] Error:`, error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const bulkSyncMooGoldProducts = async (req: Request, res: Response) => {
    try {
        const { gameId, categoryId } = req.body;
        if (!gameId) return res.status(400).json({ success: false, message: "gameId is required" });

        const result = await adminService.bulkSyncMooGoldProducts(gameId, categoryId);
        res.json({
            success: true,
            data: result,
            message: `Successfully synced ${result.total} packages (${result.createdCount} new, ${result.updatedCount} updated).`
        });
    } catch (error: any) {
        console.error(`[bulkSyncMooGoldProducts] Error:`, error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
