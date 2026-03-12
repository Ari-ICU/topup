# Kubernetes Deployment Reference Guide 🚀

This document lists the step-by-step commands used to set up the Kubernetes environment for TopUpPay.

## 1. Local Cluster Setup
We used `kind` (Kubernetes in Docker) to create a local cluster.

```bash
# Install kind (if not already installed)
brew install kind

# Create the cluster
kind create cluster --name topup-cluster

# Verify connection
kubectl cluster-info --context kind-topup-cluster
```

## 2. Docker Image Preparation
Images must be built using production-optimized Dockerfiles. Note that we updated `next.config.ts` to include `output: 'standalone'` for the frontend.

```bash
# Build Backend Image
docker build -t topup-backend:latest -f backend/Dockerfile.prod backend

# Build Frontend Image
docker build -t topup-frontend:latest -f frontend/Dockerfile.prod frontend

# Load images into the kind cluster
kind load docker-image topup-backend:latest topup-frontend:latest --name topup-cluster
```

## 3. Deployment & Secrets
Apply the Kustomization which includes Secrets (synced from `.env.production`) and ConfigMaps.

```bash
# Apply everything in k8s/base
kubectl apply -k k8s/base
```

## 4. Database Setup & Fixes
Because the fresh database didn't have the full schema migration applied, we manually added missing columns to match the Prisma client.

```bash
# Check tables
kubectl exec -it db-0 -- psql -U daigamestopup -d daigametopup -c "\dt"

# Fix missing 'originalPrice' column
kubectl exec -it db-0 -- psql -U daigamestopup -d daigametopup -c "ALTER TABLE \"Package\" ADD COLUMN \"originalPrice\" DECIMAL(10, 2);"

# Restart backend to re-run seeding
kubectl rollout restart deployment/backend
```

## 5. Monitoring
```bash
# Check all resources
kubectl get pods,svc,pvc

# Watch logs
kubectl logs deployment/backend -f
kubectl logs deployment/frontend -f
```

## 6. Accessing Locally
Forward traffic to the Nginx gateway:
```bash
kubectl port-forward service/nginx 8080:80
```
Then visit: [http://localhost:8080](http://localhost:8080)
