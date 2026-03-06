import { Router } from "express";
import {
    adminLogin,
    getOverview,
    getGames,
    createGame,
    updateGame,
    deleteGame,
    reorderGames,
    getPackages,
    createPackage,
    updatePackage,
    reorderPackages,
    deletePackage,
    getTransactions,
    updateTransactionStatus,
    getSettings,
    updateSettings,
    updateGlobalStock,
    syncProviderStock,
    getProviderStatusEndpoint,
    getApiKeys,
    generateApiKeys,
    transferRevenue,
} from "../controllers/admin.controller.js";
import { adminLimiter } from "../middleware/rateLimit.middleware.js";
import { adminAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Rate limit for admin routes
router.use(adminLimiter);

// Login (Public)
router.post("/login", adminLogin);

// Protected routes (Requires Auth)
router.use(adminAuth);

// Analytics
router.get("/overview", getOverview);

// Products and Games
router.get("/games", getGames);
router.post("/games", createGame);
router.put("/games/:id", updateGame);
router.delete("/games/:id", deleteGame);
router.post("/games/reorder", reorderGames);

router.get("/packages", getPackages);
router.post("/packages", createPackage);
router.put("/packages/:id", updatePackage);
router.post("/packages/reorder", reorderPackages);
router.delete("/packages/:id", deletePackage);

// Transactions
router.get("/transactions", getTransactions);
router.put("/transactions/:id/status", updateTransactionStatus);

// Configuration
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.post("/global-stock", updateGlobalStock);
router.post("/global-stock/sync", syncProviderStock);

// System status and transfers
router.get("/provider-status", getProviderStatusEndpoint);
router.post("/wallet/transfer", transferRevenue);

// Security
router.get("/api-keys", getApiKeys);
router.post("/api-keys/generate", generateApiKeys);

export default router;
