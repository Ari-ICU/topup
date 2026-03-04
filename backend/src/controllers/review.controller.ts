import { Request, Response } from "express";
import * as reviewService from "../services/review.service.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// Public
export const getApprovedReviews = async (req: Request, res: Response) => {
    try {
        const reviews = await reviewService.getApprovedReviews();
        return sendSuccess(res, reviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return sendError(res, "Failed to fetch reviews");
    }
};

export const createReview = async (req: Request, res: Response) => {
    try {
        const { name, gameName, rating, comment } = req.body;

        if (!name || !gameName || !rating || !comment) {
            return sendError(res, "All fields are required", 400);
        }

        const review = await reviewService.createReview({ name, gameName, rating: parseInt(rating), comment });
        return sendSuccess(res, review, "Review created successfully");
    } catch (error) {
        console.error("Error creating review:", error);
        return sendError(res, "Failed to create review");
    }
};

// Admin
export const getAllReviews = async (req: Request, res: Response) => {
    try {
        const reviews = await reviewService.getAllReviews();
        return sendSuccess(res, reviews);
    } catch (error) {
        return sendError(res, "Failed to fetch all reviews");
    }
};

export const approveReview = async (req: Request, res: Response) => {
    try {
        const { isApproved } = req.body;
        const review = await reviewService.approveReview(req.params.id, isApproved);
        return sendSuccess(res, review);
    } catch (error) {
        return sendError(res, "Failed to approve review");
    }
};

export const deleteReview = async (req: Request, res: Response) => {
    try {
        await reviewService.deleteReview(req.params.id);
        return sendSuccess(res, { deleted: true });
    } catch (error) {
        return sendError(res, "Failed to delete review");
    }
};
