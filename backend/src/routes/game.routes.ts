import { Router } from "express";
import * as gameController from "../controllers/game.controller.js";

import { verifyLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.get("/", gameController.getAllGames);
router.get("/status", gameController.getSystemStatus); // Added public status check
router.get("/:slug", gameController.getGameBySlug);
router.post("/:slug/verify", verifyLimiter, gameController.verifyAccount);

export default router;
