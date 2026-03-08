# MooGold API Integration Guide

This document provides a step-by-step roadmap to obtaining and configuring your MooGold API credentials for the top-up platform.

---

## 🚀 Phase 1: Contacting Support (Telegram)
MooGold API keys are issued manually via their B2B team.

**1. Search for:** `@Lizz6628` on Telegram.  
**2. Send this Initial Message:**

> Hi Liz, reaching out via Telegram as suggested on the website chat. I am a developer setting up a professional gaming top-up platform and require **API Access** for integration.
> 
> **Account & Business Details:**
> 🔹 **MooGold Email:** [YOUR_EMAIL_HERE]
> 🔹 **Target Products:** Mobile Legends, Free Fire, PUBG Mobile
> 🔹 **Expected Volume:** $500 - $1,000+ monthly
> 
> Please enable the **API / Developer tab** in my dashboard so I can access my **Partner ID** and **Secret Key**. Thank you!

---

## 💡 Phase 2: Choosing the "Free" vs "Paid" Key
Liz will offer a **Reseller Membership**.

*   **Reseller Member:** Monthly fee required, provides discounted prices (higher profit).
*   **Free API:** No fee, but prices are the same as the public website. **(Recommended for development and testing)**.

**Message to send when she asks:**

> Yes, that is perfectly fine! I just want to finish the development and testing of my website first. Please provide the **free API key and Partner ID** for my account.  
> **My MooGold Email:** [YOUR_EMAIL_HERE]

---

## 🔒 Phase 3: IP Whitelisting (CRITICAL)
MooGold security blocks all requests unless the sender's IP is whitelisted.

**1. Find your Mac's IP (Local Testing):**  
Open your terminal and run:  
`curl ifconfig.me`

**2. Send this to Liz:**

> Liz, I have my IP for development: **[PASTE_YOUR_IP_HERE]**. Can you whitelist this one?
> 
> Also, I will be deploying my server to Hugging Face later. Do you allow whitelisting **multiple IPs**, or should I just update you when the server moves?

---

## 🛠 Phase 4: Implementation
Once you have the keys, update your environment variables.

**File Location:** `/Users/thoeurnratha/Documents/web-development/top-up/backend/.env`

Update these lines:
```env
# MOOGOLD (Primary)
MOOGOLD_PARTNER_ID="your_received_partner_id"
MOOGOLD_API_KEY="your_received_secret_key"
```

---

## ⚠️ Important Reminders
*   **Wallet Balance:** The API will return an error even with correct keys if your MooGold account balance is $0. You must top-up your MooGold wallet to process orders.
*   **Production Deployment:** Once you move to Hugging Face, we will need to find the server's outbound IP and add it to the whitelist.

---
*Created on: March 08, 2026*
