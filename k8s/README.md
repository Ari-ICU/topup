# Kubernetes Deployment Guide

This directory contains the Kubernetes manifests for deploying the TopUpPay application.

## Directory Structure

- `base/`: Core manifests (Deployments, Services, ConfigMaps, Secrets, PVCs).
- `overlays/`: (Optional) Environment-specific overrides (dev, prod).

## How to Deploy

### 1. Configure Secrets
Edit `base/env-config.yaml` and update the `Secret` section with your actual production values (passwords, tokens, etc.).

### 2. Update Image Tags
In `base/backend.yaml` and `base/frontend.yaml`, replace `your-registry/topup-backend:latest` and `your-registry/topup-frontend:latest` with your actual Docker image paths.

### 3. Deploy
If you have `kubectl` and `kustomize` installed, run:

```bash
kubectl apply -k k8s/base
```

## Resources Included

- **Database**: PostgreSQL (StatefulSet) with 10Gi PVC.
- **Cache**: Redis (Deployment) with 2Gi PVC.
- **Backend**: Node.js/Express API.
- **Frontend**: Next.js Application.
- **Proxy**: Nginx with rate limiting and static file optimization.
- **Network**: Cloudflare Tunnel for secure edge connection.
