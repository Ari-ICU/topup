# 🤖 Telegram Bot Setup Guide

Follow these steps to enable real-time order notifications on your Telegram app.

---

### 1. Create your Bot
1. Search for **@BotFather** on Telegram.
2. Send `/newbot` and follow the instructions.
3. **Copy the HTTP API Token** (e.g., `123456789:ABCDefgh...`).

### 2. Configure via Admin Dashboard (Easiest)
1. Log in to your Website Admin Panel.
2. Go to **Settings** -> **Telegram Bot**.
3. Paste your **Bot API Token** there.
4. Get your **Chat ID** (see below) and paste it into the **Target Chat ID** field.
5. Click **Commit Changes**.

### 3. Get your Chat ID
1. Search for your new bot on Telegram and click **Start**.
2. Visit your website's webhook check at:
   `https://yourdomain.com/api/webhooks/telegram` (Note: You must be live).
3. Alternatively, use **@userinfobot** to get your personal ID.
4. Paste this into your `.env.production` as `TELEGRAM_CHAT_ID`.

### 3. Register the Webhook
Telegram needs to know where to send messages. Run this command in your browser or terminal:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://yourdomain.com/api/webhooks/telegram"
```

---

### 🚀 Automation Features Added:
- **Order Alerts**: You will get a message instantly every time a transaction is completed.
- **System Alerts**: Critical errors will be sent to your phone.
- **ID Check**: Texting `/id` to your bot will reply with your Chat ID.

### 🧪 Testing
You can manually test it by calling:
```bash
# Example test message
curl -X POST http://localhost:4000/api/webhooks/telegram \
  -H "Content-Type: application/json" \
  -d '{"message": {"text": "/start", "chat": {"id": 12345}}}'
```
