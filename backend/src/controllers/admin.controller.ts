import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { adminService } from "../services/admin.service.js";
import { getProviderStatus } from "../services/topup-provider.service.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev-only-123";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

/**
 * Handles admin login by exchanging a password for a JWT.
 * No database required for the user; authenticates via static .env password.
 */
export const adminLogin = async (req: Request, res: Response) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required" });
        }

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ success: false, message: "Invalid admin password" });
        }

        // Sign token (valid for 7 days)
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

        // Handle Prisma Foreign Key constraint violation specifically (P2003)
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

        // Handle Prisma Foreign Key constraint violation specifically (P2003)
        if (error.code === 'P2003' && error.meta?.constraint?.includes('gameId')) {
            return res.status(400).json({
                success: false,
                message: "Deployment error: The specified Game Sector node does not exist in the repository."
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

/**
 * GET /api/admin/provider-status
 * Returns the current diamond provider configuration status.
 * Used by the admin dashboard to show warnings when no real provider is set up.
 */
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
export const transferToWallet = async (req: Request, res: Response) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }
        const data = await adminService.transferRevenueToWallet(amount);
        res.json({ success: true, data, message: "Funds transferred to provider wallet" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMooGoldProducts = async (req: Request, res: Response) => {
    try {
        const data = await adminService.getMooGoldProducts();
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
