import { Router } from "express";
import * as gameController from "../controllers/game.controller.js";

const router = Router();

router.get("/", gameController.getAllGames);
router.get("/status", gameController.getSystemStatus); // Added public status check
router.get("/:slug", gameController.getGameBySlug);
router.post("/:slug/verify", gameController.verifyAccount);

export default router;
