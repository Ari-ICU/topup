import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

describe("API Integration Tests", () => {
    it("GET /health should return 200 and system details", async () => {
        const res = await request(app).get("/health");
        
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
        expect(res.body).toHaveProperty("uptime");
        expect(res.body).toHaveProperty("cloudflare");
    });

    it("GET /health should detect Cloudflare if headers are present", async () => {
        const res = await request(app)
            .get("/health")
            .set("cf-ray", "123456789")
            .set("cf-ipcountry", "KH");
        
        expect(res.status).toBe(200);
        expect(res.body.cloudflare).toBe("active");
        expect(res.body.visitor_country).toBe("KH");
    });

    it("GET /non-existent-route should return 404", async () => {
        const res = await request(app).get("/api/invalid-random-route");
        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Route not found");
    });
});
