# 💎 Docker Deployment with Cloudflare Tunnel

This guide explains how to deploy the TopUp platform using **Cloudflare Tunnel (cloudflared)**. This method is highly secure because it allows your server to remain invisible to the public internet while Cloudflare handles all traffic routing and SSL.

---

## 🏗️ Architecture Overview

1.  **Server**: Runs Docker Compose with Backend, Frontend, DB, and Nginx.
2.  **Cloudflare Tunnel**: An outbound connection from your server to Cloudflare's network.
3.  **Internet**: Users access `yourdomain.com` -> `Cloudflare` -> `Tunnel` -> `Nginx`.

**Benefits**:
- ✅ **Zero Open Ports**: No need to open 80, 443, or any other ports in your firewall.
- ✅ **Secure Edge**: Cloudflare absorbs DDoS attacks and filters malicious traffic before it reaches you.
- ✅ **Automatic SSL**: Cloudflare handles your certificates automatically.

---

## 🛠️ Step 1: Cloudflare Dashboard Setup

1.  Log in to [Cloudflare Zero Trust](https://dash.cloudflare.com/).
2.  Navigate to **Networks** ➔ **Tunnels**.
3.  Click **Create a Tunnel** and select **cloudflared**.
4.  Name it (e.g., `topup-production`).
5.  **Install Connector**:
    - Under the Docker tab, look for the `TUNNEL_TOKEN`.
    - It will look like a long string of random characters. **Copy this.**

---

## 🔑 Step 2: Environment Variables

Configure your production secrets in `.env.production`.

1.  Open `.env.production`.
2.  Add your token:
    ```bash
    CLOUDFLARE_TUNNEL_TOKEN=your_copied_token_here
    ```
3.  Ensure your `DATABASE_URL` and other credentials (Bakong, etc.) are filled correctly.

---

## 🐳 Step 3: Docker Configuration

Your `docker-compose.prod.yml` is already pre-configured to use the tunnel. It includes the `tunnel` service:

```yaml
  tunnel:
    image: cloudflare/cloudflared:latest
    restart: always
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    command: tunnel run
    networks:
      - internal
    depends_on:
      - nginx
```

> [!IMPORTANT]
> The `nginx` service in `docker-compose.prod.yml` has **no ports mapped to the host**. This is correct—all traffic flows through the tunnel container.

---

## 🌐 Step 4: Route Public Traffic

Back in the Cloudflare Dashboard, go to the **Public Hostname** tab of your tunnel:

1.  **Add a public hostname**:
    - **Subdomain**: (Leave blank for root)
    - **Domain**: `yourdomain.com`
    - **Service Type**: `HTTP`
    - **URL**: `nginx:80` (Internal Docker network address)
2.  **(Optional) API Subdomain**:
    - **Subdomain**: `api`
    - **Domain**: `yourdomain.com`
    - **Service Type**: `HTTP`
    - **URL**: `nginx:80`

---

## 🚀 Step 5: Launch

Run the following command on your server:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Check logs to ensure the tunnel is connected:
```bash
docker logs cloudflared
```

---

## 🛡️ Security Hardening

- **Firewall**: Ensure your server firewall (UFW/iptables) blocks **ALL** incoming traffic on ports 80 and 443. The tunnel does not need them.
- **Headers**: Cloudflare Tunnel automatically provides the `CF-Connecting-IP` header. Your Nginx and Backend are already configured to prioritize this for real user IP logging and rate limiting.
- **Maintenance Mode**: Set `MAINTENANCE_MODE=true` in `.env.production` during deployments or updates to show a friendly maintenance page to your users without breaking your admin panel access.
