# Implementation Plan - Kubernetes Setup and Installation

This plan outlines the steps to finalize the Kubernetes manifests and deploy the TopUpPay application.

## 1. Sync Secrets and Configuration
- **File**: [k8s/base/env-config.yaml](file:///Users/thoeurnratha/Documents/web-development/top-up/k8s/base/env-config.yaml)
- **Action**: Update with values from [.env.production](file:///Users/thoeurnratha/Documents/web-development/top-up/.env.production).
- **Details**:
    - Update `DB_USER`, `DB_PASSWORD`, `DB_NAME` in `Secret`.
    - Update `JWT_SECRET`, `ADMIN_PASSWORD`, `BAKONG_ACCOUNT_ID` in `Secret`.
    - Update `CLOUDFLARE_TUNNEL_TOKEN` in `Secret`.
    - Update `ALLOWED_ORIGINS` and `NEXT_PUBLIC_API_URL` in `ConfigMap`.

## 2. Prepare Docker Images
- **Action**: Build and tag the production images.
- **Commands**:
    ```bash
    # Build Backend
    docker build -t topup-backend:latest -f backend/Dockerfile.prod backend
    
    # Build Frontend
    docker build -t topup-frontend:latest -f frontend/Dockerfile.prod frontend
    ```
- **Note**: If using a private registry, tag them as `your-registry/topup-backend:latest` and push them.

## 3. Update Manifests with Image Tags
- **Files**: [k8s/base/backend.yaml](file:///Users/thoeurnratha/Documents/web-development/top-up/k8s/base/backend.yaml), [k8s/base/frontend.yaml](file:///Users/thoeurnratha/Documents/web-development/top-up/k8s/base/frontend.yaml)
- **Action**: Replace placeholders with the actual image names.

## 4. Deploy to Kubernetes
- **Command**:
    ```bash
    kubectl apply -k k8s/base
    ```

## 5. Verification
- Use `kubectl get pods` to ensure all services are running.
- Check `kubectl logs -f deployment/cloudflared` to verify the tunnel connection.
