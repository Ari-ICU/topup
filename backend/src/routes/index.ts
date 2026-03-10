import { Router } from "express";
import gameRoutes from "./game.routes.js";
import transactionRoutes from "./transaction.routes.js";
import adminRoutes from "./admin.routes.js";

import uploadRoutes from "./upload.routes.js";
import promotionRoutes from "./promotion.routes.js";
import resellerRoutes from "./reseller.routes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ status: "ok" }));
router.use("/games", gameRoutes);
router.use("/promotions", promotionRoutes);
router.use("/transactions", transactionRoutes);
router.use("/admin", adminRoutes);
router.use("/admin/upload", uploadRoutes); // admin-only upload route, maybe attach rate limit or auth later
router.use("/reseller", resellerRoutes);

export default router;
