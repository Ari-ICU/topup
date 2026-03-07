import "dotenv/config";
console.log("-----------------------------------------");
console.log("🔥 SERVER BOOTING UP...");
console.log("-----------------------------------------");

import app from "./app.js";

const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === "production";

console.log(`[Server] Trying to listen on port ${PORT}...`);

app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server ready in ${isProd ? "PRODUCTION" : "DEVELOPMENT"} mode`);
    console.log(`📡 Listening on: 0.0.0.0:${PORT}`);
});
