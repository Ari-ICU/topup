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
    transferToWallet,
    getMooGoldProducts,
} from "../controllers/admin.controller.js";
import { adminLimiter } from "../middleware/rateLimit.middleware.js";
import { adminAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Apply strict rate limit to ALL admin routes
router.use(adminLimiter);

// 🔐 Authentication route (Public)
router.post("/login", adminLogin);

// 🛡️ Protected routes (Requires valid JWT)
router.use(adminAuth);

// Dashboard Overview
router.get("/overview", getOverview);

// Games Management
router.get("/games", getGames);
router.post("/games", createGame);
router.put("/games/:id", updateGame);
router.delete("/games/:id", deleteGame);
router.post("/games/reorder", reorderGames);

// Packages Management
router.get("/packages", getPackages);
router.post("/packages", createPackage);
router.put("/packages/:id", updatePackage);
router.post("/packages/reorder", reorderPackages);
router.delete("/packages/:id", deletePackage);

// Transactions Management
router.get("/transactions", getTransactions);
router.put("/transactions/:id/status", updateTransactionStatus);

// MooGold Products Sync
router.get("/moogold/products", getMooGoldProducts);

// Settings
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.post("/global-stock", updateGlobalStock);

// API Keys
router.get("/api-keys", getApiKeys);
router.post("/api-keys/generate", generateApiKeys);


// Provider Status — for admin dashboard health warning
router.get("/provider-status", getProviderStatusEndpoint);

// Sync local stock with provider (populates globalStock table)
router.post("/global-stock/sync", syncProviderStock);

// Wallet
router.post("/wallet/transfer", transferToWallet);

export default router;
