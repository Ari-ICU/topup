import { telegramService } from "./src/services/telegram.service.js";

async function test() {
    console.log("🧪 Sending test Telegram notification...");
    
    // We'll try to send a sample order notification
    const sampleOrder = {
        id: "TEST-CMD-" + Math.floor(Math.random() * 10000),
        package: {
            name: "100 Diamonds (Test)",
            game: { name: "Mobile Legends" }
        },
        totalAmount: 0.99,
        paymentMethod: "Bakong KHQR",
        playerInfo: { userId: "12345678", zoneId: "1234" },
        status: "TESTING"
    };

    await telegramService.sendOrderNotification(sampleOrder);
    
    console.log("🏁 Test execution finished. Check terminal output for warnings or success.");
}

test().catch(console.error);
