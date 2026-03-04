# TopUpPay Developer Guide

## Overview
This guide explains the codebase structure and how to make changes to the TopUpPay platform.

---

## Frontend Architecture

### File Structure
```
frontend/src/
├── app/
│   ├── layout.tsx              # Root layout wrapper
│   ├── page.tsx                # Homepage
│   ├── not-found.tsx           # Custom 404 Page Not Found
│   ├── globals.css             # Global Tailwind v4 styles
│   ├── admin/
│   │   ├── layout.tsx          # Admin panel layout
│   │   ├── page.tsx            # Dashboard overview
│   │   ├── games/page.tsx      # Games CRUD (with Drag&Drop sorting)
│   │   ├── packages/page.tsx   # Packages CRUD
│   │   ├── transactions/       # Transactions & Provider statuses
│   │   ├── reviews/            # Reviews Approval
│   │   └── settings/           # SystemSettings (Bakong/Providers)
│   ├── api/
│   │   └── verify/             # Next.js Account Verification Proxy fallback
│   └── topup/
│       └── [gameId]/page.tsx   # Premium topup flow + Validation
├── components/
│   └── game/                   # Reusable UI (GameGrid, Reviews, etc.)
└── lib/
    ├── api.ts                  # Central API client handler
    └── fallback-data.ts        # Fallbacks for offline API reliance
```

### Key Components

#### API Handler (`lib/api.ts`)
All API calls utilize type-safe responses and error handling using the `NEXT_PUBLIC_API_URL` environment variable.

#### Verification Proxy
Used to bypass CORS/Network issues by fetching game player name verification dynamically before submitting an order. Located in `api/verify/[game]/route.ts`.

#### Fallback Data (`lib/fallback-data.ts`)
Ensures critical UI doesn't break if the API initially fails to sync. Included inside the custom `useGame` hook.

---

## Backend Architecture

### File Structure
```
backend/src/
├── app.ts                      # Express configuration (ESM via tsx)
├── server.ts                   # Entry point
├── routes/
│   ├── index.ts
│   ├── game.routes.ts          # Public game mapping
│   ├── admin.routes.ts
│   ├── review.routes.ts        # Customer reviews
│   └── transaction.routes.ts
├── controllers/
├── services/
│   ├── provider.service.ts     # Integrations (MooGold, Digiflazz)
│   ├── bakong.service.ts       # KHQR generation
│   ├── review.service.ts       # Feedback CRUD
│   └── stock.service.ts        # GlobalStock counting
├── lib/
│   └── prisma.ts               # Prisma ORM instantiation
└── utils/
```

### Database (Prisma)
Location: `backend/prisma/schema.prisma`

**New Main Models**:
- `SystemSetting`: Controls Provider keys, Test mode toggles, and Bakong credentials dynamically.
- `Review`: Rating system linked to games, featuring an `isApproved` flag.
- `GlobalStock`: Counter for diamond balances to prevent overselling.
- `Transaction`: Tracks `providerRef` and `status` updates closely.

*To update DB:*
```bash
npx prisma migrate dev --name <migration>
npx prisma generate
```

### Real Diamond / Stock Handling

1. **Top-Up Providers**: MooGold (Priority 1), Digiflazz, Smile.One. Handled in `provider.service.ts`.
2. **Balance Checking**: `getActiveProviderBalance()` polls live data.
3. **MooGold Test Mode**: Simulated testing responses (Success, Failure, Insufficient Balance) managed via `SystemSetting`.

---

## Deployment (Production Mode)

Ensure configurations are migrated from test mode to production:
1. Turn off MooGold test mode in 'Settings'.
2. Provide actual `BAKONG_ACCOUNT_ID`.
3. Start utilizing real keys in `SystemSetting` table.
4. Utilize `docker-compose.prod.yml` (if available) or ensure HTTPS and standard production variables (`NODE_ENV=production`).

For issues, use `docker compose logs backend` or view Chrome DevTools network tab.

**Happy Coding! 🚀**
