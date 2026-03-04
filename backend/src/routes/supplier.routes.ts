import { Router } from "express";
import {
    handleSupplierFulfillment,
    getSupplierInfo,
} from "../controllers/supplier.controller.js";
import { supplierLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

// Apply rate limit to all supplier routes
router.use(supplierLimiter);

/**
 * GET /api/supplier/info
 * Your friend uses this to test if they are connected correctly.
 * They need to send:  X-Supplier-Token: <secret>
 */
router.get("/info", getSupplierInfo);

/**
 * POST /api/supplier/fulfill
 * Your friend calls this when they have delivered diamonds to a player.
 * They need to send:  X-Supplier-Token: <secret>
 * Body: { orderId, status, providerRef?, message?, diamonds? }
 */
router.post("/fulfill", handleSupplierFulfillment);

export default router;
