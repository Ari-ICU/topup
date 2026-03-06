import { Router } from "express";
import { getActivePromotionsPublic } from "../controllers/admin.controller.js";

const router = Router();

router.get("/", getActivePromotionsPublic);

export default router;
