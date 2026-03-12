import { describe, it, expect, vi, beforeEach } from "vitest";
import { maintenanceGuard } from "../../src/middleware/maintenance.middleware.js";
import { Request, Response } from "express";

describe("Maintenance Middleware", () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let nextFunction: any;

    beforeEach(() => {
        mockReq = {
            path: "/",
            headers: {}
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };
        nextFunction = vi.fn();
        process.env.MAINTENANCE_MODE = "false";
    });

    it("should call next() if maintenance mode is off", () => {
        maintenanceGuard(mockReq as Request, mockRes as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
    });

    it("should return 503 if maintenance mode is on", () => {
        process.env.MAINTENANCE_MODE = "true";
        maintenanceGuard(mockReq as Request, mockRes as Response, nextFunction);
        expect(mockRes.status).toHaveBeenCalledWith(503);
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should bypass maintenance for /health", () => {
        process.env.MAINTENANCE_MODE = "true";
        (mockReq as any).path = "/health";
        maintenanceGuard(mockReq as Request, mockRes as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
    });

    it("should bypass maintenance for admin paths", () => {
        process.env.MAINTENANCE_MODE = "true";
        (mockReq as any).path = "/api/admin/any";
        maintenanceGuard(mockReq as Request, mockRes as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
    });
});
