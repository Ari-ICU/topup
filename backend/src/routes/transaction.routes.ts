import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { transactionLimiter, heavyActionLimiter, pollingLimiter } from "../middleware/rateLimit.middleware.js";
import { validate, CreateTransactionSchema } from "../middleware/validation.middleware.js";

const router = Router();

// Strict limit: a real user should not create more than 10 orders in 15 min
router.post("/", transactionLimiter, validate({ body: CreateTransactionSchema }), transactionController.createTransaction);
router.get("/:id", transactionController.getTransactionStatus);

// 🛡️ SECURITY: DEPRECATED/REMOVED public confirm route. 
// Fulfillment must happen via:
// 1. handleBakongWebhook (verified via Bakong API)
// 2. checkPaymentAndFulfill (verified via Bakong API)
// 3. Admin Panel (Manually by trusted admin)
// router.post("/:id/confirm", heavyActionLimiter, transactionController.confirmAndFulfillTransaction);


// Polling endpoint for automated payment verification (Safe: checks API)
router.post("/:id/check-payment", pollingLimiter, transactionController.checkPaymentAndFulfill);

// Webhook for Bakong (Push notification) - Safe: handler now verifies with API
router.post("/bakong-callback", transactionController.handleBakongWebhook);

export default router;
