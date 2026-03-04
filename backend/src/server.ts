import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === "production";

app.listen(PORT, () => {
    console.log(`🚀 Server ready in ${isProd ? "PRODUCTION" : "DEVELOPMENT"} mode`);
    if (!isProd) {
        console.log(`📡 Local dev URL: http://localhost:${PORT}`);
    } else {
        console.log(`📡 Listening on port ${PORT}`);
    }
});
