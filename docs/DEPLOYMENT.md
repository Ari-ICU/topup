# Production Deployment Guide — TopUpPay

## Architecture
```
Internet → Nginx (SSL Termination) → Frontend (Next.js) → Backend (Express) → PostgreSQL
```

## Pre-Deployment Checklist
- [ ] Real server/VPS with Ubuntu 22.04+ (DigitalOcean, AWS EC2, Vultr, etc.)
- [ ] Domain name pointed at server IP
- [ ] SSL certificate via Let's Encrypt (Certbot)
- [ ] Real Bakong KHQR production credentials from NBC (or dynamically set in Admin Settings)
- [ ] Real Top-up provider API credentials (MooGold, Digiflazz) dynamically entered in Database
- [ ] Turn off MooGold "Test Mode" in the Admin Settings

## Quick Deploy
```bash
git clone <your-repo>
cd top-up

# Configure actual environment variables (Backend Node/Prisma URLs & Frontend endpoints)
cp frontend/.env.local frontend/.env.production
cp backend/.env.example backend/.env

# Build and start all services using production compose configurations
docker compose -f docker-compose.prod.yml up -d --build
```

**Note:** The system relies on Prisma running database migrations and Next.js building server actions. Ensure port 3000 and 4000 are not blocked internally by firewalls if routing individually.

---

**Last Updated**: March 2026
