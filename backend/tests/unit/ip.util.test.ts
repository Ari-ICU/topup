import { describe, it, expect } from "vitest";
import { getRealIp } from "../../src/utils/ip.util.js";
import { Request } from "express";

describe("IP Utility", () => {
    it("should prioritize cf-connecting-ip header", () => {
        const mockReq = {
            headers: {
                "cf-connecting-ip": "1.1.1.1",
                "x-forwarded-for": "2.2.2.2, 3.3.3.3"
            },
            socket: { remoteAddress: "4.4.4.4" }
        } as unknown as Request;

        expect(getRealIp(mockReq)).toBe("1.1.1.1");
    });

    it("should fallback to x-forwarded-for if cf-connecting-ip is missing", () => {
        const mockReq = {
            headers: {
                "x-forwarded-for": "2.2.2.2, 3.3.3.3"
            },
            socket: { remoteAddress: "4.4.4.4" }
        } as unknown as Request;

        expect(getRealIp(mockReq)).toBe("2.2.2.2");
    });

    it("should fallback to socket address if no headers are present", () => {
        const mockReq = {
            headers: {},
            socket: { remoteAddress: "4.4.4.4" }
        } as unknown as Request;

        expect(getRealIp(mockReq)).toBe("4.4.4.4");
    });

    it("should return unknown if everything is missing", () => {
        const mockReq = {
            headers: {},
            socket: {}
        } as unknown as Request;

        expect(getRealIp(mockReq)).toBe("unknown");
    });
});
