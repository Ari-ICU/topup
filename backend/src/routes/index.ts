import { Router } from "express";
import gameRoutes from "./game.routes.js";
import transactionRoutes from "./transaction.routes.js";
import adminRoutes from "./admin.routes.js";
import supplierRoutes from "./supplier.routes.js";
import uploadRoutes from "./upload.routes.js";
import promotionRoutes from "./promotion.routes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ status: "ok" }));
router.use("/games", gameRoutes);
router.use("/promotions", promotionRoutes);
router.use("/transactions", transactionRoutes);
router.use("/admin", adminRoutes);
router.use("/admin/upload", uploadRoutes); // admin-only upload route, maybe attach rate limit or auth later

// Friend supplier API — your friend calls these endpoints to deliver diamonds
router.use("/supplier", supplierRoutes);

export default router;
