import { Request } from "express";

/**
 * Extracts the real client IP address from a request,
 * giving priority to Cloudflare-specific headers.
 */
export const getRealIp = (req: Request): string => {
    // 1. Cloudflare's specific header
    const cfIp = req.headers["cf-connecting-ip"] as string;
    if (cfIp) return cfIp;

    // 2. Standard X-Forwarded-For (can be a comma-separated list)
    const forwardedFor = req.headers["x-forwarded-for"] as string;
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    // 3. Fallback to remote address
    return req.socket.remoteAddress || "unknown";
};
