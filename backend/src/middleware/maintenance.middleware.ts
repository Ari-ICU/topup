import { Request, Response, NextFunction } from "express";

/**
 * Middleware to check if the application is in maintenance mode.
 * Toggle this via the MAINTENANCE_MODE environment variable.
 */
export const maintenanceGuard = (req: Request, res: Response, next: NextFunction) => {
    const isMaintenance = process.env.MAINTENANCE_MODE === "true";
    
    // Allow /health and /admin to bypass maintenance so you can fix things
    const isBypassPath = req.path === "/health" || req.path.startsWith("/api/admin");
    const isAdminToken = req.headers["authorization"]?.startsWith("Bearer ");

    if (isMaintenance && !isBypassPath && !isAdminToken) {
        return res.status(503).json({
            success: false,
            message: "Our systems are currently undergoing scheduled maintenance. We'll be back shortly to process your top-ups!",
            retryAfter: 3600 // Suggest retry after 1 hour
        });
    }

    next();
};
