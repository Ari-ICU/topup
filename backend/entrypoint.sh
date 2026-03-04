#!/bin/sh
# entrypoint.sh — run Prisma migrations then start the server

set -e

echo "[entrypoint] Running Prisma migrations..."
npx prisma migrate deploy

echo "[entrypoint] Starting server..."
exec node dist/server.js
