# TopUpPay - Quick Start Guide 🚀

## What's Been Done

Your platform is **fully integrated** with robust frontend APIs, provider connections (MooGold, Digiflazz), and advanced UI features (Drag-and-Drop, Glowing Themes).

### ✅ Completed
- Dynamic Backend (`SystemSetting`) for live toggle of Test Modes and Real Payments
- Fallback data preventing interface freezing
- Account Verification using player ID APIs (`api.isan.eu.org` with fallback heuristics)
- Admin reviews, dashboard tracking, dragging interfaces, and global stocks
- Docker Compose setup handling full production workflows

---

## Starting the Application

### 🐳 Easiest Way - Docker Compose

```bash
cd /Users/thoeurnratha/Documents/web-development/top-up
docker compose up -d
```

Access Points:
- **Frontend**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **Backend API**: http://localhost:4000/api

---

## Testing New Features

### 1. Test Next.js Validation Proxy
- Try buying credits for `mobile-legends` with an invalid ID format. The frontend will hit the backend proxy and alert you of formatting or validation errors properly.

### 2. Test Provider "Mock/Test" Mode
- In Admin Settings, ensure MooGold Test Mode is enabled.
- Purchase a package. The transaction status will cleanly process using a mock API result without requesting real funds.

### 3. Review Drag-and-Drop
- Go to `http://localhost:3000/admin/games` or packages.
- Drag any item via the grip icon to permanently reorder the list visually.

### 4. Custom 404 Pages
- Navigate casually to `http://localhost:3000/fake-url`. Experience the gracefully designed "Page Not Found".

---

## Database Features Refresher

**GlobalStock**: Tracks available remaining credits or diamonds locally, automatically deducting upon successful Moogold/Provider responses.
**SystemSetting**: High-priority database configuration keys preventing hard-restarts to change variables like `BAKONG_ACCOUNT_ID`.
**Review**: Stores `{rating, comment, isApproved}` objects for the client Testimonial widgets.

---

## Deployment Ready
The current state is ready for rigorous staging server validation. The code builds utilizing `npm run build` and uses `Suspense` wraps for nested page parameters solving Vercel hydration flags. All pages dynamically use `/app/globals.css` containing extensive custom variables.

**To transition to production**, insert real Bakong IDs, update `.env.production`, deploy PostgreSQL, and start monitoring!
