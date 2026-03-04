# Production Deployment Guide — TopUpPay

## Architecture
```
Internet → Nginx (SSL Termination) → Frontend (Next.js) → Backend (Express) → PostgreSQL
```

## Pre-Deployment Checklist
- [ ] Real server/VPS with Ubuntu 22.04+ (DigitalOcean, AWS EC2, Vultr, etc.)
- [ ] Domain name pointed at server IP
- [ ] SSL certificate via Let's Encrypt (Certbot)
- [ ] Real Bakong KHQR production credentials from NBC
- [ ] Real Top-up provider API credentials

## Quick Deploy
```bash
git clone <your-repo>
cd top-up
cp .env.production.example .env.production   # fill in real values
docker compose -f docker-compose.prod.yml up -d --build
```
