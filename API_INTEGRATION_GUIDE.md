# API Integration Guide - TopUpPay Platform

## Overview
This guide documents all API endpoints and integration points between the frontend (Next.js) and backend (Express.js + Node.js).

## Environment Configuration

### Frontend Environment Variables
**Development** (`/frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

**Production** (`/frontend/.env.production`):
```env
NEXT_PUBLIC_API_URL=https://api.topuppay.com/api
```

### Backend Environment Variables
**Development** (`/backend/.env`):
```env
PORT=4000
DATABASE_URL="postgresql://postgres:password@localhost:5050/topup_db?schema=public"
NODE_ENV=development

# Bakong KHQR Settings (Sandbox)
BAKONG_ACCOUNT_ID="thoeurnratha@devb"
BAKONG_MERCHANT_NAME="TopUpPay Sandbox"
BAKONG_MERCHANT_CITY="Phnom Penh"
BAKONG_ACQUIRING_BANK="ABA Bank"

# Third Party Provider Credentials
TOPUP_PROVIDER_URL="https://api.provider.com"
TOPUP_PROVIDER_KEY="your_api_key_here"
TOPUP_PROVIDER_SECRET="your_secret_here"
```

## API Base URL
- **Development**: `http://localhost:4000/api`
- **Production**: `https://api.topuppay.com/api`

All routes are prefixed with `/api` by Express middleware in `app.ts`

## API Endpoints

### 1. Games API (`/games`)
Public endpoints for game listings.

#### Get All Games
- **Endpoint**: `GET /api/games`
- **Frontend**: `apiRequest<Game[]>("/games")`
- **Response**: Array of games with id, name, slug, iconUrl, isActive
- **Usage**: GameGrid component, homepage game listing
- **Status**: ✅ Implemented

```typescript
interface Game {
  id: string;
  slug: string;
  name: string;
  iconUrl: string;
  bannerUrl?: string;
  isActive: boolean;
  packages?: Package[];
}
```

#### Get Game by Slug
- **Endpoint**: `GET /api/games/:slug`
- **Frontend**: `apiRequest<Game>("/games/[slug]")`
- **Response**: Single game object with packages
- **Usage**: TopUp page game details
- **Status**: ✅ Implemented

### 2. Admin Dashboard API (`/admin`)
Protected endpoints for admin panel operations.

#### Get Dashboard Overview
- **Endpoint**: `GET /api/admin/overview`
- **Frontend**: `apiRequest<DashboardStats>("/admin/overview")`
- **Response**: `{ revenue: number, transactions: number, activeGames: number }`
- **Usage**: Admin dashboard home page
- **Status**: ✅ Implemented

#### Games Management
- **Get All Games**: `GET /api/admin/games`
- **Create Game**: `POST /api/admin/games`
- **Update Game**: `PUT /api/admin/games/:id`
- **Delete Game**: `DELETE /api/admin/games/:id`
- **Status**: ✅ Implemented

#### Packages Management
- **Get All Packages**: `GET /api/admin/packages`
- **Status**: ✅ Implemented

#### Transactions Management
- **Get All Transactions**: `GET /api/admin/transactions`
- **Update Transaction Status**: `PUT /api/admin/transactions/:id/status`
- **Status**: ✅ Implemented

#### Settings
- **Get Settings**: `GET /api/admin/settings`
- **Update Settings**: `PUT /api/admin/settings`
- **Status**: ✅ Implemented

### 3. Transactions API (`/transactions`)
Public endpoints for payment processing.

#### Create Transaction
- **Endpoint**: `POST /api/transactions`
- **Frontend**: `apiRequest("/transactions", { method: "POST", body: JSON.stringify({...}) })`
- **Payload**:
```typescript
{
  packageId: string;
  playerInfo: { playerId: string; zoneId?: string };
  paymentMethod: "ABA" | "WING" | "BAKONG";
}
```
- **Response**: `{ success: true, data: { id: string, qrCode?: string, md5?: string } }`
- **Usage**: TopUp page payment processing
- **Status**: ✅ Implemented

## Frontend Integration Points

### 1. API Request Handler (`/frontend/src/lib/api.ts`)
Central utility for all API calls with automatic error handling.

```typescript
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T>
```

**Features**:
- Automatic error handling
- Throws on API errors
- Uses `NEXT_PUBLIC_API_URL` environment variable
- Type-safe responses

**Usage**:
```typescript
const data = await apiRequest<Game>("/games/mobile-legends");
const games = await apiRequest<Game[]>("/games");
```

### 2. Admin Dashboard (`/frontend/src/app/admin/page.tsx`)
- Fetches: Dashboard overview statistics
- API Call: `GET /admin/overview`
- Status: ✅ Implemented

### 3. Admin Games Page (`/frontend/src/app/admin/games/page.tsx`)
- Fetches: All games with CRUD operations
- API Calls:
  - `GET /admin/games` - List all games
  - `PUT /admin/games/:id` - Toggle active status
  - `DELETE /admin/games/:id` - Delete game
  - `POST /admin/games` - Create new game
- Status: ✅ Implemented

### 4. Admin Packages Page (`/frontend/src/app/admin/packages/page.tsx`)
- Fetches: All packages
- API Call: `GET /admin/packages`
- Status: ✅ Implemented

### 5. Admin Transactions Page (`/frontend/src/app/admin/transactions/page.tsx`)
- Fetches: All transactions
- API Calls:
  - `GET /admin/transactions` - List all transactions
  - `PUT /admin/transactions/:id/status` - Update transaction status
- Status: ✅ Implemented

### 6. Homepage (`/frontend/src/app/page.tsx`)
- Component: GameGrid
- Fetches: Public games list
- API Call: `GET /games`
- Status: ✅ Implemented

### 7. TopUp Page (`/frontend/src/app/topup/[gameId]/page.tsx`)
- Fetches: Game details and processes payment
- API Calls:
  - `GET /games/:slug` - Get game details
  - `POST /transactions` - Create transaction
- Status: ✅ Implemented

### 8. Game Grid Component (`/frontend/src/components/game/game-grid.tsx`)
- Fetches: All games for display
- API Call: `GET /games`
- Status: ✅ Implemented

## Testing API Integration

### Prerequisites
1. PostgreSQL running on localhost:5050
2. Backend running on localhost:4000
3. Frontend running on localhost:3000
4. Docker Compose: `docker-compose up`

### Manual Testing

#### 1. Test Games API
```bash
# Get all games
curl http://localhost:4000/api/games

# Get game by slug
curl http://localhost:4000/api/games/mobile-legends
```

#### 2. Test Admin Dashboard
```bash
# Get dashboard overview
curl http://localhost:4000/api/admin/overview

# Get all games
curl http://localhost:4000/api/admin/games

# Get all packages
curl http://localhost:4000/api/admin/packages

# Get all transactions
curl http://localhost:4000/api/admin/transactions

# Get settings
curl http://localhost:4000/api/admin/settings
```

#### 3. Test Transaction Creation
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "pkg-id",
    "playerInfo": { "playerId": "player123", "zoneId": "zone1" },
    "paymentMethod": "BAKONG"
  }'
```

### Frontend Browser Testing

#### 1. Check API URL Configuration
Open browser console and run:
```javascript
console.log(process.env.NEXT_PUBLIC_API_URL);
// Should output: http://localhost:4000/api
```

#### 2. Test Game Fetching
Go to homepage and check:
- Network tab should show successful `GET /api/games`
- Games should load and display in grid
- Game grid component should render without errors

#### 3. Test TopUp Page
1. Click on any game from homepage
2. URL should change to `/topup/[game-slug]`
3. Network tab should show:
   - `GET /api/games/[slug]` returning game details
   - Form should be pre-populated with game info

#### 4. Test Admin Dashboard
1. Navigate to `/admin`
2. Network tab should show:
   - `GET /api/admin/overview` returning stats
   - Stats cards should display with real data from database

## Troubleshooting

### Issue: "Failed to fetch" errors
**Solution**:
1. Verify backend is running: `npm run dev` in `/backend` directory
2. Check database connection: PostgreSQL on port 5050
3. Verify environment variables are set correctly
4. Check CORS settings in backend `app.ts`

### Issue: API returns 500 error
**Solution**:
1. Check backend console for error messages
2. Verify database schema is migrated: `npx prisma migrate deploy`
3. Check Prisma connection string in `.env`

### Issue: Frontend shows "API endpoint not found"
**Solution**:
1. Verify `NEXT_PUBLIC_API_URL` is set in `.env.local`
2. Check that endpoint exists in backend routes
3. Verify backend app is serving on correct port (4000)

### Issue: CORS errors
**Solution**:
1. Backend `app.ts` should have CORS enabled
2. Check origin is allowed in CORS configuration
3. For development, should allow `http://localhost:3000`

## Security Notes

### To Implement
1. ⚠️ JWT/Bearer token authentication for admin endpoints
2. ⚠️ HTTPS only in production
3. ⚠️ Rate limiting on payment endpoints
4. ⚠️ Input validation on all endpoints
5. ⚠️ CSRF token protection for form submissions
6. ⚠️ Secure cookie settings (HttpOnly, SameSite)

### Current Status
All API functionality is implemented but without authentication layer.
Recommend implementing JWT before production deployment.

## Deployment Checklist

- [ ] Set production `NEXT_PUBLIC_API_URL` to correct API domain
- [ ] Update backend `DATABASE_URL` to production database
- [ ] Set `NODE_ENV=production` in backend
- [ ] Implement JWT authentication
- [ ] Enable HTTPS
- [ ] Set up rate limiting
- [ ] Configure CORS for production domain
- [ ] Test all endpoints in production
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for database

## API Response Format

All API responses follow this format:

**Success (200-201)**:
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error (4xx-5xx)**:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Next Steps

1. ✅ API integration complete
2. ⏳ Test all endpoints in development
3. ⏳ Implement JWT authentication
4. ⏳ Add error logging and monitoring
5. ⏳ Deploy to production
6. ⏳ Monitor API performance and errors

---

**Last Updated**: $(date)
**Status**: API Integration Complete ✅
