import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { transactionLimiter, heavyActionLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

// Strict limit: a real user should not create more than 10 orders in 15 min
router.post("/", transactionLimiter, transactionController.createTransaction);
router.get("/:id", transactionController.getTransactionStatus);

// Very strict: fulfillment is expensive — max 5 confirm attempts per 15 min
router.post("/:id/confirm", heavyActionLimiter, transactionController.confirmAndFulfillTransaction);

export default router;
