import "dotenv/config";
console.log("-----------------------------------------");
console.log("🔥 SERVER BOOTING UP...");
console.log("-----------------------------------------");

import app from "./app.js";

const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === "production";

console.log(`[Server] Trying to listen on port ${PORT}...`);

const server = app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server ready in ${isProd ? "PRODUCTION" : "DEVELOPMENT"} mode`);
    console.log(`📡 Listening on: 0.0.0.0:${PORT}`);
});

// ─── Global Error Handling ───────────────────────────────────
process.on("unhandledRejection", (reason, promise) => {
    console.error("[Fatal] 🛑 Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("[Fatal] 🛑 Uncaught Exception:", error);
    // Graceful exit after logging
    process.exit(1);
});

// ─── Graceful Shutdown ───────────────────────────────────────
const shutdown = () => {
    console.log("🛑 Received shutdown signal. Closing server...");
    server.close(() => {
        console.log("✅ Server closed. Database connections remain available for cleanup.");
        process.exit(0);
    });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
