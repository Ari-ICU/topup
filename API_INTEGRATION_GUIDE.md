# API Integration Guide - TopUpPay Platform

## Overview
This guide documents all API endpoints and integration points between the frontend (Next.js) and backend (Express.js + Node.js), including Advanced Top-up features.

## Environment Configuration

### SystemSettings DB
Instead of relying purely on `.env` files, **Production Bakong IDs and Top-up Provider (MooGold, Digiflazz) Keys** can be modified directly within the Admin UI under "Settings." Database values override `.env` variables if configured.

### Fallback Settings
TopUpPay utilizes fallback data located in `frontend/src/lib/fallback-data.ts`. This protects the public UI from breaking if connection limits drop temporarily.

## New API Endpoints

### 1. Games and Verification
*Account Validation API*
- **Endpoint**: `GET /api/verify/[gameSlug]?playerId=123&serverId=456`
- **Usage**: Used internally by the Frontend's Next.js API route (`/api/verify/[gameSlug]/route.ts`) to validate an external username or format dynamically. Normalizes `Mobile Legends` zone parameters.

### 2. Admin Capabilities (`/admin`)
*Reviews Management*
- **Endpoint**: `GET /api/admin/reviews` | `PUT /api/admin/reviews/:id`
- **Frontend Usage**: Manage user-generated feedback and perform visual approval.

*System Settings*
- **Endpoint**: `GET /api/admin/settings` | `PUT /api/admin/settings`
- **Frontend Usage**: Easily control MooGold Test Mode, Provider prioritizing, and BAKONG credentials.

*Global Stock Syncing*
- **Endpoint**: `POST /api/admin/global-stock/sync`
- **Frontend Usage**: Refresh diamond balances and count stock in packages directly from API responses.

### 3. Customer Actions
*Customer Review Creation*
- **Endpoint**: `POST /api/reviews`
- **Payload**: `{ rating: number, comment: string, name: string, gameName: string }`
- **Usage**: Displayed via frontend testimonial screens when `isApproved` equals true.

### 4. Drag & Drop Sorting
When sorting Games or Packages via the admin UI drag elements, an API route calculates internal positioning fields:
- `PUT /api/admin/games/reorder` receives the new package array positioning format `[{id, sortOrder}]`.

## Testing the API
```bash
# Verify Account ID format
curl "http://localhost:4000/api/verify/mobile-legends?playerId=123&serverId=456"

# Get Settings
curl http://localhost:4000/api/admin/settings
```

**Last Updated**: March 2026
**Status**: Ready & Integrated
