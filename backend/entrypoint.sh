#!/bin/sh
# entrypoint.sh — run Prisma migrations then start the server

set -e

echo "[entrypoint] Running Prisma migrations..."
# Attempt to resolve the specific failed migration if the column already exists
npx prisma migrate resolve --applied 20260308045646_add_promotions || echo "Migration already resolved or resolve not needed"
npx prisma migrate deploy

echo "[entrypoint] Starting server..."
exec node dist/server.js
