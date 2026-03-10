# 🎮 TopUpPay — Gaming Top-Up Platform

> A full-stack, production-ready gaming top-up platform supporting multiple game titles, payment via **Bakong KHQR** (Cambodia's national QR payment), and direct Reseller API integration for partners.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Project Structure](#-project-structure)
4. [Database Schema](#-database-schema)
5. [API Endpoints](#-api-endpoints)
6. [Prerequisites](#-prerequisites)
7. [Getting Started — Development](#-getting-started--development-workflow)
8. [Environment Variables](#-environment-variables)
9. [Running with Docker](#-running-with-docker-compose)
10. [Production Deployment](#-production-deployment)
11. [Admin Panel Guide](#-admin-panel-guide)
12. [Payment Integration](#-payment-integration-bakong-khqr)
13. [Top-Up Provider Integration](#-top-up-provider-integration)
14. [Troubleshooting](#-troubleshooting)

---

## 🌟 Project Overview

**TopUpPay** is a digital commerce web platform that enables players to top up in-game currencies (e.g., Mobile Legends diamonds, Free Fire diamonds, etc.) through a modern, mobile-first storefront. Payments are processed natively via Cambodia's **Bakong KHQR** system, scannable by all major Cambodian banking apps (ABA, Acleda, Wing, Pi Pay, TrueMoney, MetFone, etc.).

### Key Features

| Feature | Description |
|---|---|
| 🕹️ Game catalogue | Dynamically managed games & packages via admin panel |
| 💳 KHQR payments | Dynamic QR generation via `bakong-khqr`, polled in real-time |
| 🔗 ABA Deep Link | One-tap "Open in ABA App" button for direct mobile payment |
| 📦 Master Supply | Unified supply engine with global coverage and automated fallback |
| 👤 Account verification | Verifies player ID/server before checkout (ML, FF, etc.) |
| 🛡️ Admin panel | Full management of games, packages, transactions, settings |
| 🔑 Reseller API | Allow others to resell your services via master API keys |
| 📊 Dashboard | Revenue stats, recent transactions, stock overview |

---

## 🛠 Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 20 (ESM) |
| Framework | Express 4 |
| Language | TypeScript 5 |
| ORM | Prisma 6 |
| Database | PostgreSQL 17 |
| Auth | JWT (`jsonwebtoken`) |
| QR Payments | `bakong-khqr` (official NBC library) |
| HTTP Client | Axios |
| Security | Helmet, CORS, `express-rate-limit`, `express-slow-down` |
| File Uploads | Multer |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| QR Display | `react-qr-code` |
| Drag & Drop | `@hello-pangea/dnd` |

### Infrastructure
| Component | Technology |
|---|---|
| Reverse Proxy | Nginx (with SSL termination) |
| Containerization | Docker + Docker Compose |
| Dev Database UI | Prisma Studio |

---

## 📁 Project Structure

```
top-up/
├── backend/                      # Express API server
│   ├── src/
│   │   ├── app.ts                # Express app setup, middleware, routes
│   │   ├── server.ts             # HTTP server entry point
│   │   ├── controllers/          # Route handlers (thin layer)
│   │   │   ├── admin.controller.ts
│   │   │   ├── game.controller.ts
│   │   │   ├── transaction.controller.ts
│   │   ├── services/             # Business logic (thick layer)
│   │   │   ├── admin.service.ts        # Admin CRUD, settings
│   │   │   ├── bakong.service.ts       # KHQR generation & status polling
│   │   │   ├── game.service.ts         # Game catalogue queries
│   │   │   ├── supply.service.ts       # Core supply integration logic
│   │   │   ├── topup-provider.service.ts # Master orchestration & fallback
│   │   │   ├── transaction.service.ts  # Transaction lifecycle management
│   │   │   └── verify.service.ts       # Player account verification
│   │   ├── routes/               # Route definitions
│   │   │   ├── index.ts          # Route aggregator
│   │   │   ├── admin.routes.ts
│   │   │   ├── game.routes.ts
│   │   │   ├── transaction.routes.ts
│   │   │   └── upload.routes.ts
│   │   ├── middleware/           # Auth, error handling, rate limiting
│   │   ├── lib/                  # Prisma client, system settings cache
│   │   ├── types/                # TypeScript type definitions
│   │   └── utils/                # Shared utility functions
│   ├── prisma/
│   │   ├── schema.prisma         # Database models
│   │   ├── seed.ts               # Initial data seeder
│   │   └── migrations/           # Auto-generated migration files
│   ├── public/uploads/           # Uploaded game icons & banners
│   ├── Dockerfile                # Dev container
│   ├── Dockerfile.prod           # Production multi-stage build
│   └── package.json
│
├── frontend/                     # Next.js app (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Storefront / game listing
│   │   │   ├── topup/            # Top-up checkout flow
│   │   │   └── admin/            # Admin panel (protected)
│   │   │       ├── page.tsx      # Dashboard
│   │   │       ├── login/        # Admin login
│   │   │       ├── games/        # Game management
│   │   │       ├── packages/     # Package management
│   │   │       ├── transactions/ # Transaction management
│   │   │       └── settings/     # Site settings (KHQR, providers)
│   │   ├── components/           # Shared UI components
│   │   ├── context/              # React context (auth, cart, etc.)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # API client helpers
│   │   └── types/                # Shared TypeScript types
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   └── package.json
│
├── nginx/
│   └── nginx.conf                # Reverse proxy config with SSL
├── docker-compose.yml            # Development stack
├── docker-compose.prod.yml       # Production stack (Nginx + SSL)
├── env.production.example        # Production env template
└── render.yaml                   # Render.com deployment config
```

---

## 🗄 Database Schema

```
User ──< Transaction >── Package >── Game
                                │
SystemSetting                   GlobalStock
```

| Model | Purpose |
|---|---|
| `User` | Optional linked user (email, name) |
| `Game` | Game catalogue (slug, icon, banner, input config) |
| `Package` | Top-up packages (price, amount, provider SKU) |
| `Transaction` | Purchase record (status, payment method, player info, refs) |
| `GlobalStock` | Shared diamond inventory counter |
| `SystemSetting` | Key-value store for admin-managed settings |

### TransactionStatus Enum
```
PENDING → PROCESSING → COMPLETED
                     ↘ FAILED
                     ↘ EXPIRED
```

---

## 📡 API Endpoints

### Public Endpoints (no auth required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/games` | List all active games |
| `GET` | `/api/games/:slug` | Get game with packages |
| `POST` | `/api/transactions` | Create a new transaction + KHQR |
| `GET` | `/api/transactions/:id` | Get transaction status |
| `GET` | `/api/transactions/:id/khqr-status` | Poll KHQR payment status |
| `POST` | `/api/verify-account` | Verify player ID before purchase |
| `GET` | `/health` | Backend health check |

### Admin Endpoints (JWT required)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/admin/login` | Admin login → JWT |
| `GET` | `/api/admin/dashboard` | Dashboard stats |
| `GET/POST/PATCH/DELETE` | `/api/admin/games` | Game CRUD |
| `GET/POST/PATCH/DELETE` | `/api/admin/packages` | Package CRUD |
| `GET/PATCH` | `/api/admin/transactions` | Transaction list & update |
| `GET/POST` | `/api/admin/settings` | System settings |
| `GET/POST` | `/api/admin/api-keys` | Reseller API management |
| `POST` | `/api/reseller/order` | Place order (Reseller only) |
| `POST` | `/api/upload/image` | Upload game icon/banner |

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v20+ — [nodejs.org](https://nodejs.org)
- **npm** v10+
- **PostgreSQL** v15+ (or use Docker)
- **Docker & Docker Compose** — [docs.docker.com](https://docs.docker.com/get-docker/) *(optional but recommended)*
- **Git**

Verify your setup:
```bash
node --version    # v20.x.x
npm --version     # 10.x.x
psql --version    # 15.x or 17.x
docker --version  # 24.x or higher
```

---

## 🚀 Getting Started — Development Workflow

Follow these steps **in order** to get the full stack running locally.

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/top-up.git
cd top-up
```

---

### Step 2 — Start the Database

**Option A — Using Docker (recommended):**
```bash
docker compose up db -d
```
This starts PostgreSQL on port `5050`.

**Option B — Local PostgreSQL:**

Create the database manually:
```sql
CREATE DATABASE topup_db;
```
Then update `DATABASE_URL` in `backend/.env` to match your local credentials.

---

### Step 3 — Configure Backend Environment

```bash
cd backend
cp .env .env.local   # or create backend/.env manually
```

Edit `backend/.env` with your values:

```env
PORT=4000
DATABASE_URL="postgresql://postgres:password@localhost:5050/topup_db?schema=public"
NODE_ENV=development

# Admin credentials
ADMIN_PASSWORD=admin123

# Comma-separated list of allowed frontend origins
ALLOWED_ORIGINS=https://YOUR_DOMAIN.com,https://www.YOUR_DOMAIN.com

# ─── Frontend ─────────────────────────────────────────────────
# This must be the PUBLIC URL of your backend API (via Nginx)
NEXT_PUBLIC_API_URL=https://YOUR_DOMAIN.com/api

# ─── Bakong KHQR (PRODUCTION — get from NBC Cambodia) ─────────
# Apply at: https://bakong.nbc.org.kh/
BAKONG_ACCOUNT_ID=yourname@aba
BAKONG_MERCHANT_NAME=TopUpPay Co., Ltd.
BAKONG_MERCHANT_CITY=Phnom Penh
BAKONG_ACQUIRING_BANK=ABA Bank

# ─── MooGold (Primary top-up provider) ───────────────────────
# Get from: https://moogold.com → Dashboard → API Settings
MOOGOLD_PARTNER_ID=your_partner_id
MOOGOLD_SECRET_KEY=your_secret_key

# MOOGOLD_SECRET_KEY=your_secret_key

# ─── Optional: Monitoring & Alerting ──────────────────────────
# SENTRY_DSN=https://xxx@sentry.io/xxx
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxxn123
JWT_SECRET=your_random_secret_here
```

> ⚠️ **Never commit `.env` to git.** It is already listed in `.gitignore`.

---

### Step 4 — Install Backend Dependencies

```bash
cd backend
npm install
```

---

### Step 5 — Run Database Migrations

```bash
# From backend/
npx prisma migrate dev --name init
```

This applies all migrations in `prisma/migrations/` and generates the Prisma client.

---

### Step 6 — Seed Initial Data *(optional)*

```bash
npx prisma db seed
```

This populates sample games and packages so the storefront isn't empty.

---

### Step 7 — Start the Backend Server

```bash
npm run dev
```

The backend starts at **http://localhost:4000**.

Verify it's running:
```bash
curl http://localhost:4000/health
# → {"status":"ok","timestamp":"..."}
```

---

### Step 8 — Configure Frontend Environment

Open a **new terminal**:

```bash
cd frontend
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

### Step 9 — Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

### Step 10 — Start the Frontend Dev Server

```bash
npm run dev
```

The frontend starts at **http://localhost:3000**.

---

### Step 11 — Open the Application

| URL | Purpose |
|---|---|
| http://localhost:3000 | Customer storefront |
| http://localhost:3000/admin | Admin panel |
| http://localhost:4000/health | Backend health check |

**Default admin credentials:**
- Password: `admin123` *(change this in backend `.env` before production!)*

---

### Step 12 — Open Prisma Studio *(optional)*

To visually inspect and edit your database:

```bash
cd backend
npx prisma studio
```

Opens at **http://localhost:5555**

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ | Server port (default: `4000`) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NODE_ENV` | ✅ | `development` or `production` |
| `ADMIN_PASSWORD` | ✅ | Admin panel password |
| `JWT_SECRET` | ✅ | Secret for JWT signing (min 32 chars) |
| `BAKONG_ACCOUNT_ID` | ✅ | Bakong account (`name@bankcode`) |
| `BAKONG_MERCHANT_NAME` | ✅ | Displayed on KHQR receipt |
| `BAKONG_MERCHANT_CITY` | ✅ | Displayed on KHQR receipt |
| `BAKONG_API_TOKEN` | ⬜ | For Bakong Open API token polling |
| `MOOGOLD_PARTNER_ID` | ⬜ | MooGold reseller ID |
| `MOOGOLD_API_KEY` | ⬜ | MooGold API key |
| `MOOGOLD_TEST_MODE` | ⬜ | `true` to simulate orders locally |
| `ALLOWED_ORIGINS` | ⬜ | Comma-separated CORS origins (production) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Public backend URL (browser-side) |
| `BACKEND_API_URL` | ⬜ | Internal Docker URL (server-side rendering) |

---

## 🐳 Running with Docker Compose

The development Docker Compose file starts all three services together:

```bash
# From project root:
docker compose up --build
```

| Service | Container Port | Host Port |
|---|---|---|
| PostgreSQL | 5432 | 5050 |
| Backend | 4000 | 4000 |
| Frontend | 3000 | 3000 |

**Run only specific services:**
```bash
docker compose up db backend -d   # headless backend + db
docker compose up frontend         # frontend in foreground
```

**View logs:**
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

**Stop everything:**
```bash
docker compose down
```

**Reset the database (⚠️ destructive):**
```bash
docker compose down -v   # removes postgres_data volume
```

---

## 🏭 Production Deployment

### Step 1 — Prepare Environment File

```bash
cp env.production.example .env.production
```

Fill in all required values in `.env.production`:

```env
DB_USER=topuppay
DB_PASSWORD=YOUR_STRONG_32_CHAR_PASSWORD
DB_NAME=topuppay_prod
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
BAKONG_ACCOUNT_ID=yourname@aba
ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD
JWT_SECRET=YOUR_64_CHAR_RANDOM_STRING
```

---

### Step 2 — Configure Nginx SSL

Place your SSL certificates in `nginx/ssl/`:
```
nginx/ssl/fullchain.pem
nginx/ssl/privkey.pem
```

> Recommended: Use **Certbot** (Let's Encrypt) for free SSL certificates.
> ```bash
> certbot certonly --standalone -d yourdomain.com
> ```

---

### Step 3 — Build & Start Production Stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d
```

The production stack starts:
- `db` — PostgreSQL (internal only, no host port exposed)
- `backend` — Express API (production build, internal only)
- `frontend` — Next.js (production build, internal only)
- `nginx` — Reverse proxy on ports **80** and **443**

---

### Step 4 — Run Production Migrations

```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

---

### Step 5 — Verify the Deployment

```bash
curl https://yourdomain.com/api/health
curl https://yourdomain.com/api/games
```

---

### Step 6 — Monitor Logs

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx
```

---

## 🛡 Admin Panel Guide

Navigate to `/admin` in your browser. Login with the `ADMIN_PASSWORD` set in your `.env`.

### Dashboard
- Revenue summary (today, week, month)
- Transaction count & status breakdown
- Recent operations feed
- Global stock level

### Games Management (`/admin/games`)
1. Click **"Add Game"**
2. Enter game name, slug (e.g., `mobile-legends`), upload icon & banner
3. Configure player input fields (player ID, server/zone, etc.)
4. Toggle active/inactive status

### Packages Management (`/admin/packages`)
1. Select a game
2. Click **"Add Package"**
3. Set name, diamond amount, price (USD), provider SKU
4. Drag & drop to reorder display priority

### Transactions (`/admin/transactions`)
- View all transactions with filters (status, date, payment method)
- Manually mark a transaction as **COMPLETED** (for manual bank transfers)
- View player info (player ID, server, player name)

### Settings (`/admin/settings`)
Configure via admin UI (stored in `SystemSetting` table):
- `BAKONG_ACCOUNT_ID` — your Bakong QR account
- `BAKONG_MERCHANT_NAME` / `BAKONG_MERCHANT_CITY`
- Provider API keys

---

## 💳 Payment Integration (Bakong KHQR)

### How It Works

```
Customer chooses package
        ↓
Backend generates dynamic KHQR (with amount + 30-min expiry)
        ↓
Frontend displays QR code in modal
        ↓
Customer scans with ABA / Acleda / Wing / etc.
        ↓
Frontend polls GET /api/transactions/:id/khqr-status every 3s
        ↓
Backend checks MD5 hash via Bakong Open API
        ↓
Payment confirmed → top-up delivered → status = COMPLETED
```

### Bakong Account ID Format

```
yourname@aba       → ABA Bank
yourname@aclb      → Acleda Bank  
yourname@wing      → Wing Bank
yourname@devb      → Sandbox only (do NOT use in production)
```

### Getting a Production Bakong Account

1. Register at [bakong.nbc.org.kh](https://bakong.nbc.org.kh)
2. Apply for a Bakong merchant/individual account
3. Set your `BAKONG_ACCOUNT_ID` in Admin → Settings or backend `.env`

### Optional: Bakong Open API Token

For reliable payment status polling in production:
1. Visit [api-bakong.nbc.gov.kh](https://api-bakong.nbc.gov.kh)
2. Register and get your Bearer token
3. Set `BAKONG_API_TOKEN` in your environment

---

## 📦 Top-Up Provider Integration

1. MooGold (primary)
        ↓  (if MooGold not configured)
2. Local Wallet / Manual Mode
        ↓  (if nothing configured)
❌ Error: No provider configured
```

---

### 1. MooGold (Primary Provider)

---

## 🔧 Troubleshooting

### Backend won't start

**Port already in use:**
```bash
lsof -i :4000
kill -9 <PID>
```

**Prisma client not generated:**
```bash
cd backend && npx prisma generate
```

**Database connection refused:**
- Ensure PostgreSQL is running: `docker compose up db -d`
- Check `DATABASE_URL` port — Docker uses `5050:5432`, so use `5050` in host URLs

---

### Frontend "Failed to fetch" errors

- Ensure backend is running on port 4000
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local` is correct
- In Docker, use `BACKEND_API_URL=http://backend:4000/api` for server-side Next.js calls

---

### Prisma migration issues

**Reset dev database (⚠️ deletes all data):**
```bash
cd backend
npx prisma migrate reset
```

**Apply production migrations (no data loss):**
```bash
npx prisma migrate deploy
```

---

### KHQR not working

- Ensure `BAKONG_ACCOUNT_ID` follows the `name@bankcode` format with no spaces
- Use `@devb` suffix only for sandbox testing — real banks ignore it
- Check for KHQR errors in backend logs: `[Bakong] ✅` or `[Bakong] Status check failed:`

---

### MooGold returns errors

- Enable test mode: `MOOGOLD_TEST_MODE=true`
- Verify `MOOGOLD_PARTNER_ID` and `MOOGOLD_API_KEY` are correct
- Check backend logs for `[MooGold]` prefixed messages

---

## 📄 License

This project is proprietary. All rights reserved © 2025 TopUpPay.

---

## 👤 Author

Built with ❤️ by **Thoeurn Ratha**  
Cambodia 🇰🇭
