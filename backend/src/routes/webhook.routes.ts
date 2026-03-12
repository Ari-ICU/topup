import { Router } from "express";
import { telegramService } from "../services/telegram.service.js";

const router = Router();

/**
 * Handle incoming webhooks from Telegram
 */
router.post("/telegram", async (req, res) => {
    const update = req.body;

    // Log the update for debugging
    console.log("[Telegram Webhook] 📩 Received update:", JSON.stringify(update));

    if (update.message) {
        const { chat, text } = update.message;

        // Basic "echo" or command handler
        if (text === "/start") {
            await telegramService.sendMessage(`Hello! Your Chat ID is: <code>${chat.id}</code>. Use this in your .env file!`);
        } else if (text === "/id") {
            await telegramService.sendMessage(`Your Chat ID: <code>${chat.id}</code>`);
        }
    }

    // Always respond with 200 to Telegram
    res.status(200).send("OK");
});

export default router;
