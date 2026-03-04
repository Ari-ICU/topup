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
│   ├── globals.css             # Global styles & theme
│   ├── admin/
│   │   ├── layout.tsx          # Admin panel layout
│   │   ├── page.tsx            # Dashboard
│   │   ├── games/page.tsx      # Games CRUD
│   │   ├── packages/page.tsx   # Packages CRUD
│   │   ├── transactions/page.tsx # Transactions list
│   │   └── settings/page.tsx   # Settings
│   └── topup/
│       └── [gameId]/page.tsx   # Game topup flow
├── components/
│   └── game/game-grid.tsx      # Games display grid
└── lib/
    ├── api.ts                  # API request handler
    └── services/
        └── topup-provider.ts   # Topup service
```

### Key Components

#### API Handler (`lib/api.ts`)
All API calls go through this central handler:
```typescript
const data = await apiRequest<T>(endpoint, options);
```

**Features**:
- Automatic error handling
- Type-safe responses
- Uses NEXT_PUBLIC_API_URL environment variable

**Example Usage**:
```typescript
// Simple GET request
const games = await apiRequest<Game[]>("/games");

// POST request with body
const transaction = await apiRequest("/transactions", {
  method: "POST",
  body: JSON.stringify({
    packageId: "123",
    playerInfo: { playerId: "user123" },
    paymentMethod: "BAKONG"
  })
});
```

#### Admin Dashboard (`app/admin/page.tsx`)
```typescript
// Fetches overview stats
const response = await apiRequest('/admin/overview');
// Returns: { revenue, transactions, activeGames }
```

#### Admin Games (`app/admin/games/page.tsx`)
```typescript
// Fetch games
const games = await apiRequest('/admin/games');

// Update game
await apiRequest(`/admin/games/${id}`, {
  method: 'PUT',
  body: JSON.stringify({ isActive: true })
});

// Delete game
await apiRequest(`/admin/games/${id}`, { method: 'DELETE' });
```

#### GameGrid Component (`components/game/game-grid.tsx`)
```typescript
// Fetches and displays games
const data = await apiRequest<Game[]>("/games");
// Displays in responsive grid
// Links to /topup/:slug
```

---

## Backend Architecture

### File Structure
```
backend/src/
├── app.ts                      # Express configuration
├── server.ts                   # Entry point
├── routes/
│   ├── index.ts               # Route aggregation
│   ├── game.routes.ts         # Public game routes
│   ├── admin.routes.ts        # Admin routes
│   └── transaction.routes.ts  # Payment routes
├── controllers/
│   ├── admin.controller.ts    # Admin handlers
│   ├── game.controller.ts     # Game handlers
│   └── transaction.controller.ts # Payment handlers
├── services/
│   ├── admin.service.ts       # Admin logic
│   ├── game.service.ts        # Game logic
│   ├── transaction.service.ts # Payment logic
│   └── bakong.service.ts      # Bakong KHQR
├── lib/
│   └── prisma.ts              # Database client
├── types/
│   └── bakong-khqr.d.ts      # Type definitions
└── utils/
    └── apiResponse.ts         # Response formatting
```

### Backend Flow

**Request** → **Route** → **Controller** → **Service** → **Database** → **Response**

#### Example: Get All Games
```typescript
// Route: GET /api/games
routes/game.routes.ts:
  router.get("/", gameController.getAllGames);

// Controller
controllers/game.controller.ts:
  export const getAllGames = async (req, res) => {
    const data = await gameService.getAllGames();
    res.json({ success: true, data });
  };

// Service
services/game.service.ts:
  getAllGames: async () => {
    return prisma.game.findMany({...});
  };
```

### Adding New Endpoints

**Step 1**: Create route
```typescript
// routes/admin.routes.ts
router.post("/new-feature", newFeatureController);
```

**Step 2**: Create controller
```typescript
// controllers/admin.controller.ts
export const newFeatureController = async (req: Request, res: Response) => {
  try {
    const data = await adminService.newFeature(req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**Step 3**: Create service
```typescript
// services/admin.service.ts
newFeature: async (body) => {
  return prisma.table.create({ data: body });
};
```

**Step 4**: Use in frontend
```typescript
const result = await apiRequest('/admin/new-feature', {
  method: 'POST',
  body: JSON.stringify({...})
});
```

---

## Database (Prisma)

### Schema Location
`backend/prisma/schema.prisma`

### Common Operations

**Query**:
```typescript
const games = await prisma.game.findMany({});
const game = await prisma.game.findUnique({ where: { id: "123" } });
```

**Create**:
```typescript
const newGame = await prisma.game.create({
  data: {
    name: "Mobile Legends",
    slug: "mobile-legends",
    iconUrl: "...",
    isActive: true
  }
});
```

**Update**:
```typescript
const updated = await prisma.game.update({
  where: { id: "123" },
  data: { isActive: false }
});
```

**Delete**:
```typescript
await prisma.game.delete({
  where: { id: "123" }
});
```

### Running Migrations
```bash
cd backend

# Apply migrations
npx prisma migrate deploy

# Create migration
npx prisma migrate dev --name migration_name

# View database
npx prisma studio
```

### Real Diamond / Stock Handling

The system is capable of operating with a live provider and optionally
tracking a local inventory of diamonds.  When you move to production or when
integrating a new supplier, make sure you understand how these pieces fit:

- **Provider status** is surfaced by `getProviderStatus()` in
  `backend/src/services/topup-provider.service.ts`.  The admin dashboard uses
  this to warn if no real provider is configured or if the store is in test
  mode.
- **Balance checks** happen when a customer creates a transaction
  (`createNewTransaction` in `transaction.service.ts`).  The helper first
  queries `getActiveProviderBalance()`; if the value is finite and less than
  the requested package amount, the order is blocked with a
  `Global Stock Insufficient` error.
- A secondary guard reads the `globalStock` table, which admins can update
  manually using the `/api/admin/global-stock` endpoint.  The new
  `POST /api/admin/global-stock/sync` route will also fetch the current
  balance from the provider and persist it locally, making it easier to keep
  the dashboard in sync.
- **Deduction** occurs after fulfillment in `deductGlobalStock()`:
  this helper will attempt to sync with the provider balance and subtract the
  delivered amount; if in unlimited mode (`-1`), it simply logs and does
  nothing.
- You can view the live provider balance on the dashboard overview via
  `adminService.getOverview`.

To go live you must populate real credentials (e.g., `MOOGOLD_PARTNER_ID`,
`MOOGOLD_API_KEY`, `DIGIFLAZZ_USERNAME`, etc.) either via environment variables
or the `systemSetting` table.  Ensure `MOOGOLD_TEST_MODE` is set to `false`.


---

## Making Changes

### Add New Admin Page

**Step 1**: Create page component
```typescript
// frontend/src/app/admin/new-page/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

export default function NewPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await apiRequest('/admin/new-endpoint');
        setData(result);
      } catch (error) {
        console.error('Failed to fetch', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      {/* Your content here */}
    </div>
  );
}
```

**Step 2**: Add route to admin layout
```typescript
// frontend/src/app/admin/layout.tsx
// Add link in sidebar navigation
<a href="/admin/new-page">New Page</a>
```

**Step 3**: Create backend endpoint
```typescript
// backend/src/routes/admin.routes.ts
router.get("/new-endpoint", getNewData);

// backend/src/controllers/admin.controller.ts
export const getNewData = async (req, res) => {
  try {
    const data = await adminService.getNewData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// backend/src/services/admin.service.ts
getNewData: async () => {
  return prisma.table.findMany({...});
};
```

### Add New Game

**Via Admin UI**:
1. Go to Admin → Games
2. Click "Add Game"
3. Fill form
4. Submit

**Via API Directly**:
```bash
curl -X POST http://localhost:4000/api/admin/games \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Game Name",
    "slug": "game-slug",
    "iconUrl": "https://...",
    "isActive": true,
    "inputConfig": {}
  }'
```

### Update UI Styling

**Global Styles**: `frontend/src/app/globals.css`
- Color theme variables
- Animations
- Utility classes

**Component Styles**: Use Tailwind CSS inline
```tsx
<div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-lg">
  Content
</div>
```

---

## Common Issues & Fixes

### API Not Responding

**Debug**:
1. Check backend is running: `docker-compose ps`
2. Check logs: `docker-compose logs backend`
3. Verify database connection: `docker-compose logs postgres`

**Fix**:
```bash
docker-compose restart
docker-compose logs -f  # Follow logs
```

### Data Not Showing

**Debug**:
1. Check Network tab in browser (F12)
2. Look for failed API requests
3. Check API response status and message
4. Verify data exists in database

**Fix**:
```bash
# Connect to database
docker exec -it postgres psql -U postgres -d topup_db

# Check data
SELECT * FROM "Game";
SELECT * FROM "Package";
```

### Database Migration Issues

**Reset Database** (⚠️ Loses Data):
```bash
cd backend
npx prisma migrate reset
```

**Check Migration Status**:
```bash
npx prisma migrate status
```

---

## Testing

### Manual Testing Checklist
- [ ] Frontend loads without errors
- [ ] Admin dashboard shows real data
- [ ] Can create/edit/delete games
- [ ] Payment flow works
- [ ] API responses are correct
- [ ] Database updates reflect on UI

### Testing API Endpoints
```bash
# Get all games
curl http://localhost:4000/api/games | json_pp

# Get admin overview
curl http://localhost:4000/api/admin/overview | json_pp

# Create game
curl -X POST http://localhost:4000/api/admin/games \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","slug":"test"}'
```

---

## Performance Optimization

### Frontend
- Use `'use client'` only when needed
- Implement loading skeletons
- Cache API responses
- Lazy load components

### Backend
- Add database indexes
- Use pagination for large datasets
- Cache frequently accessed data
- Optimize queries

---

## Security Best Practices

### Frontend
- Never store sensitive data in localStorage
- Sanitize user inputs
- Use environment variables for secrets

### Backend
- Validate all inputs
- Use environment variables
- Implement rate limiting
- Add authentication before production

---

## Deployment

### Building
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

### Production Environment Variables

**Frontend** (`.env.production`):
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

**Backend** (`.env`):
```env
PORT=4000
DATABASE_URL="postgresql://user:password@host:port/db"
NODE_ENV=production
```

### Docker Deployment
```bash
docker-compose -f docker-compose.yml up -d
```

---

## Useful Commands

```bash
# Frontend
npm install               # Install dependencies
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run linter

# Backend
npm install              # Install dependencies
npm run dev              # Start dev server
npm run build            # Build for production
npx prisma migrate dev   # Run migrations

# Docker
docker-compose up        # Start all services
docker-compose down      # Stop services
docker-compose logs      # View logs
docker-compose ps        # List running services
```

---

## Key Technologies

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **React Hooks** - State management
- **Lucide React** - Icons

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma ORM** - Database
- **PostgreSQL** - Database
- **JWT** - Authentication (todo)

---

## Resources

- Next.js Docs: https://nextjs.org
- Express Docs: https://expressjs.com
- Prisma Docs: https://prisma.io
- Tailwind CSS: https://tailwindcss.com
- PostgreSQL: https://postgresql.org

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Review this guide
3. Check API_INTEGRATION_GUIDE.md
4. Review code comments

---

**Happy Coding! 🚀**
