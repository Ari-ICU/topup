import { Router } from "express";
import gameRoutes from "./game.routes.js";
import transactionRoutes from "./transaction.routes.js";
import adminRoutes from "./admin.routes.js";

import uploadRoutes from "./upload.routes.js";
import promotionRoutes from "./promotion.routes.js";
import resellerRoutes from "./reseller.routes.js";
import supplyRoutes from "./supply.routes.js";
import webhookRoutes from "./webhook.routes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ status: "ok" }));
router.use("/webhooks", webhookRoutes);
router.use("/games", gameRoutes);
router.use("/promotions", promotionRoutes);
router.use("/transactions", transactionRoutes);
router.use("/admin", adminRoutes);
router.use("/admin/upload", uploadRoutes);
router.use("/reseller", resellerRoutes);
router.use("/supply", supplyRoutes);

export default router;
