import { Router } from "express";
import { getApprovedReviews, createReview } from "../controllers/review.controller.js";

const router = Router();

// Public routes
router.get("/", getApprovedReviews);
router.post("/", createReview);

export default router;
