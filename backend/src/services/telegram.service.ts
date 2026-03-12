import axios from "axios";
import { getSystemSettings } from "../lib/settings.js";

/**
 * Service to handle Telegram notifications
 */
export const telegramService = {
    /**
     * Get config from DB or Env
     */
    getConfig: async () => {
        const settings = await getSystemSettings();
        return {
            token: settings.get("TELEGRAM_BOT_TOKEN"),
            chatId: settings.get("TELEGRAM_CHAT_ID"),
        };
    },

    /**
     * Send a raw text message
     */
    sendMessage: async (text: string) => {
        const { token, chatId } = await telegramService.getConfig();

        if (!token || !chatId) {
            console.warn("[Telegram] ⚠️ Token or Chat ID not configured. Skipping notification.");
            return;
        }

        try {
            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
                chat_id: chatId,
                text,
                parse_mode: "HTML",
            });
        } catch (error: any) {
            console.error("[Telegram] ❌ Failed to send message:", error.response?.data || error.message);
        }
    },

    /**
     * Send a formatted order notification
     */
    sendOrderNotification: async (order: any) => {
        const text = `
            <b>🚀 NEW ORDER RECEIVED</b>
            ━━━━━━━━━━━━━━━━━━
            <b>Order ID:</b> <code>${order.id}</code>
            <b>Game:</b> ${order.package?.game?.name || "Unknown"}
            <b>Package:</b> ${order.package?.name || "Unknown"}
            <b>Amount:</b> $${order.totalAmount}
            <b>Payment:</b> ${order.paymentMethod}
            <b>Player Info:</b> <code>${JSON.stringify(order.playerInfo)}</code>
            <b>Status:</b> ${order.status}
            ━━━━━━━━━━━━━━━━━━
            <i>DAI-GAME System</i>
        `.trim();

        await telegramService.sendMessage(text);
    },

    /**
     * Send a system alert
     */
    sendAlert: async (title: string, message: string) => {
        const text = `
            <b>⚠️ SYSTEM ALERT: ${title}</b>
            ━━━━━━━━━━━━━━━━━━
            ${message}
            ━━━━━━━━━━━━━━━━━━
        `.trim();
        await telegramService.sendMessage(text);
    }
};
