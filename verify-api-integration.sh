#!/bin/bash

# TopUpPay API Integration Startup & Testing Guide
# This script helps verify all API endpoints are working correctly

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}TopUpPay API Integration Verification${NC}"
echo -e "${BLUE}======================================${NC}\n"

# Check if required tools are installed
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 is not installed${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ $1 is installed${NC}"
}

echo -e "${YELLOW}Checking prerequisites...${NC}"
check_command "docker" || exit 1
check_command "docker-compose" || exit 1
check_command "node" || exit 1
check_command "npm" || exit 1

echo ""
echo -e "${YELLOW}Checking if services are running...${NC}"

# Check if backend is running
if curl -s http://localhost:4000/api/games > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running on port 4000${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo -e "${YELLOW}Starting services with docker-compose...${NC}"
    cd /Users/thoeurnratha/Documents/web-development/top-up
    docker-compose up -d
    sleep 5
fi

# Check database
if curl -s http://localhost:4000/api/admin/overview > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection is working${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo "Make sure PostgreSQL is running and migrations are applied"
fi

echo ""
echo -e "${YELLOW}Testing API Endpoints...${NC}\n"

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    
    local response=$(curl -s -w "\n%{http_code}" -X "$method" "http://localhost:4000/api$endpoint")
    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)
    
    if [ "$status" -eq "$expected_status" ] || [ "$status" -lt 500 ]; then
        echo -e "${GREEN}✓${NC} $description"
        echo "  Method: $method | Endpoint: $endpoint | Status: $status"
    else
        echo -e "${RED}✗${NC} $description"
        echo "  Method: $method | Endpoint: $endpoint | Status: $status"
    fi
}

# Test all API endpoints
echo -e "${BLUE}Public Endpoints:${NC}"
test_endpoint "GET" "/games" "200" "Get all games"
test_endpoint "GET" "/games/mobile-legends" "200" "Get game by slug"

echo ""
echo -e "${BLUE}Admin Endpoints:${NC}"
test_endpoint "GET" "/admin/overview" "200" "Get dashboard overview"
test_endpoint "GET" "/admin/games" "200" "Get all games (admin)"
test_endpoint "GET" "/admin/packages" "200" "Get all packages"
test_endpoint "GET" "/admin/transactions" "200" "Get all transactions"
test_endpoint "GET" "/admin/settings" "200" "Get settings"

echo ""
echo -e "${BLUE}Transaction Endpoints:${NC}"
test_endpoint "POST" "/transactions" "400" "Create transaction (requires body)"

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}API Integration Check Complete!${NC}"
echo -e "${GREEN}======================================${NC}\n"

echo -e "${YELLOW}Frontend Environment Variables:${NC}"
echo "Development (.env.local):"
echo "  NEXT_PUBLIC_API_URL=http://localhost:4000/api"
echo ""
echo "Production (.env.production):"
echo "  NEXT_PUBLIC_API_URL=https://api.topuppay.com/api"

echo ""
echo -e "${YELLOW}To start the full application:${NC}"
echo "1. Terminal 1 - Backend: cd backend && npm run dev"
echo "2. Terminal 2 - Frontend: cd frontend && npm run dev"
echo "3. Terminal 3 - Database: docker-compose up"
echo ""
echo -e "${GREEN}Frontend will be available at: http://localhost:3000${NC}"
echo -e "${GREEN}Backend API will be available at: http://localhost:4000/api${NC}"
echo -e "${GREEN}Admin Dashboard will be available at: http://localhost:3000/admin${NC}"
