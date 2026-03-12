import axios from "axios";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Service to handle Telegram notifications
 */
export const telegramService = {
    /**
     * Send a raw text message
     */
    sendMessage: async (text: string) => {
        if (!BOT_TOKEN || !CHAT_ID) {
            console.warn("[Telegram] ⚠️ Token or Chat ID not configured. Skipping notification.");
            return;
        }

        try {
            await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                chat_id: CHAT_ID,
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
            <i>TopUpPay System</i>
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
