import { prisma } from "./src/lib/prisma.js";
import { invalidateSettingsCache } from "./src/lib/settings.js";

async function sync() {
  console.log("🚀 Starting System Settings Alignment...");

  const updates = [
    // Bakong Alignment (from .env values)
    { key: "BAKONG_ACCOUNT_ID", value: "thoeurnratha@aba" },
    { key: "BAKONG_MERCHANT_NAME", value: "DAI-GAME" },
    { key: "BAKONG_MERCHANT_CITY", value: "Phnom Penh" },
    
    // Telegram Integration (Keys only, values left empty for user to fill in Admin UI)
    { key: "TELEGRAM_BOT_TOKEN", value: "" },
    { key: "TELEGRAM_CHAT_ID", value: "" },
    
    // Feature Toggles
    { key: "ENABLE_TELEGRAM", value: "false" },
    { key: "MOOGOLD_MARGIN", value: "1.05" }
  ];

  for (const setting of updates) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value }
    });
    console.log(`✅ Synced: ${setting.key}`);
  }

  await invalidateSettingsCache();
  console.log("✨ All settings synced and cache invalidated.");
}

sync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
