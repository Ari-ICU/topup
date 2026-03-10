import { Router } from "express";
import * as supplyController from "../controllers/supply.controller.js";

const router = Router();

/**
 * Supply Routes: Direct interactions with MooGold / Providers
 * 
 * Used for custom top-up flows.
 */
router.post("/topup", supplyController.directTopUp);

export default router;
