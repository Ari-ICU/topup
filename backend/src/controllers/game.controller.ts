import { Request, Response } from "express";
import * as gameService from "../services/game.service.js";
import { verifyGameAccount } from "../services/verify.service.js";
import { getProviderStatus } from "../services/topup-provider.service.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

export const getAllGames = async (req: Request, res: Response) => {
    try {
        const games = await gameService.getAllActiveGames();
        return sendSuccess(res, games);
    } catch (error) {
        console.error("Error in getAllGames:", error);
        return sendError(res, "Failed to fetch games");
    }
};

export const getSystemStatus = async (req: Request, res: Response) => {
    try {
        const status = await getProviderStatus();
        return sendSuccess(res, {
            isReady: status.isReady,
            isTestMode: status.isTestMode,
            warning: status.warning,
            message: status.isReady
                ? "System operational"
                : (status.isTestMode
                    ? "Store is in test mode (simulating deliveries)"
                    : "The store is temporarily unable to process diamond deliveries. Please try again later or contact support.")
        });
    } catch (error) {
        return sendError(res, "Failed to fetch system status");
    }
};

export const getGameBySlug = async (req: Request, res: Response) => {
    const { slug } = req.params;
    try {
        const game = await gameService.getGameBySlugDetails(slug as string);
        return sendSuccess(res, game);
    } catch (error: any) {
        if (error.message === "Game not found") {
            return sendError(res, error.message, 404);
        }
        return sendError(res, "Failed to fetch game details");
    }
};

export const verifyAccount = async (req: Request, res: Response) => {
    const { slug } = req.params;
    const { userId, zoneId } = req.body;

    if (!userId || typeof userId !== "string" || userId.trim() === "") {
        return sendError(res, "Player ID is required", 400);
    }

    try {
        const result = await verifyGameAccount(slug, userId.trim(), zoneId?.trim());
        return sendSuccess(res, result);
    } catch (error) {
        console.error("Error in verifyAccount:", error);
        return sendError(res, "Verification failed");
    }
};
