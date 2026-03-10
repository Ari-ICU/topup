# Master Supply Integration Guide

This document provides a step-by-step roadmap to obtaining and configuring your **Master Supply** credentials for the platform. While our system is built with a universal supply engine, the current recommended primary provider is MooGold.

---

## 🚀 Phase 1: Contacting the Provider (Telegram)
API keys for the supply engine are issued manually via their B2B team.

**1. Search for:** `@Lizz6628` on Telegram (B2B Supply Liaison).  
**2. Send this Initial Message:**

> Hi Liz, I am setting up a professional gaming top-up platform via **TopUpPay** and require **API Access** for integration.
> 
> **Account & Business Details:**
> 🔹 **Registered Email:** [YOUR_EMAIL_HERE]
> 🔹 **Target Products:** Mobile Legends, Free Fire, PUBG Mobile
> 🔹 **Expected Volume:** $500 - $1,000+ monthly
> 
> Please enable the **API / Developer tab** in my dashboard so I can access my **Partner ID** and **Secret Key**. Thank you!

---

## 💡 Phase 2: Choosing the "Free" vs "Paid" Tiers
The provider Liaison will offer different membership tiers.

*   **Reseller Member:** Monthly fee required, provides discounted supply prices (higher profit).
*   **Standard API:** No fee, but prices are the same as the public website. **(Recommended for initial deployment and testing)**.

---

## 🔒 Phase 3: IP Whitelisting (CRITICAL)
The supply engine security blocks all requests unless the sender's IP is whitelisted.

**1. Find your Outbound IP (Local Testing):**  
Open your terminal and run:  
`curl ifconfig.me`

**2. Request Whitelisting:**

> Liz, I have my IP for development: **[PASTE_YOUR_IP_HERE]**. Can you whitelist this for the API?
> 
> Also, I will be deploying my production server later. Do you allow whitelisting **multiple IPs** simultaneously?

---

## 🛠 Phase 4: Implementation
Once you have the keys, update your master environment variables. These are kept private on the server and are never exposed to your customers or resellers.

**File Location:** `backend/.env`

Update these lines:
```env
# MASTER SUPPLY ENGINE
MOOGOLD_PARTNER_ID="your_received_partner_id"
MOOGOLD_SECRET_KEY="your_received_secret_key"
```

---

## ⚠️ Important Reminders
*   **Wallet Balance:** The API will return an error even with correct keys if your provider account balance is $0. You must maintain a balance to process automated orders.
*   **Production Deployment:** Once you move to production, we will need to whitelist the production server's outbound IP.

---
*Last Updated: March 10, 2026*
