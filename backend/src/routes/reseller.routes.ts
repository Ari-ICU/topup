import { Router } from "express";
import * as resellerController from "../controllers/reseller.controller.js";
import { resellerAuth } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * Reseller Endpoint: Place a new top-up order.
 * Middleware: resellerAuth (checks pk/sk pairs).
 */
router.post("/order", resellerAuth, resellerController.placeResellerOrder);

export default router;
