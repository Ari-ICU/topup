# 📂 TopUpPay — API Reference

Official API documentation for the TopUpPay platform.

---

## 🚀 Base URL
- **Production**: `https://yourdomain.com/api`
- **Development**: `http://localhost:4000/api`

---

## 🔒 Authentication

### 🔑 Admin Access
Administrative endpoints require a JWT token:
`Authorization: Bearer <token>`

### 🔑 Get Your Reseller Keys
Reseller API access is granted manually by the administrator. To get your Master Keys:
1. Contact the Admin via Telegram at **@your_telegram**
2. Provide your project details/URL.
3. Once approved, the Admin will generate and provide you with a unique **Public Key** and **Secret Key**.

### 🔑 Reseller Authentication
Reseller endpoints require master API keys in the request headers:
- `X-API-Key`: Your public key (`pk_...`)
- `X-API-Secret`: Your secret key (`sk_...`)

---

## 🕹️ Game Inventory

### 1. List Games
`GET /games`

Returns a list of all active games and their metadata.

### 2. Get Game Details
`GET /games/:slug`

Returns specific game details and **all available packages**.

### 3. Verify Account
`POST /games/:slug/verify`

Validates a player's ID before allowing checkout.

**Payload:**
```json
{
  "playerId": "12345678",
  "zoneId": "2001"
}
```

---

## 💳 Checkout & Transactions

### 1. Create Transaction
`POST /transactions`

Initialize a top-up request. Generates a Bakong KHQR.

**Payload:**
```json
{
  "packageId": "clm...",
  "playerInfo": { "playerId": "123..." },
  "paymentMethod": "BAKONG"
}
```

### 2. Check KHQR Status
`GET /transactions/:id/khqr-status`

Poll this endpoint every 3-5 seconds to detect when the customer has scanned and paid.

---

## 💼 Reseller API (v1)

### 1. Place Direct Order
`POST /reseller/order`

Places and fulfills an order immediately using your admin balance.

**Headers:**
- `X-API-Key: pk_...`
- `X-API-Secret: sk_...`

**Payload:**
```json
{
  "packageId": "pkg_id",
  "playerInfo": {
    "playerId": "12345678",
    "zoneId": "2001"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orderId": "tx_abc123",
    "status": "COMPLETED",
    "reference": "TOPUP-123456"
  }
}
```

---

## ⚠️ Error Reference

| Code | Meaning | Description |
|---|---|---|
| 400 | Bad Request | Missing required fields or invalid format |
| 401 | Unauthorized | Missing or invalid API keys / JWT |
| 404 | Not Found | Resource (game, package, order) does not exist |
| 422 | Unprocessable | Logic error (e.g., Insufficient stock) |
| 500 | Server Error | Internal backend failure |

---

Built with ❤️ by **TopUpPay Core Team**
