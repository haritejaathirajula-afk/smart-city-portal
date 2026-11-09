#!/usr/bin/env bash
set -e

echo "====================================================================="
echo "      Smart City Service Portal - Linux / Docker Deployment Script    "
echo "====================================================================="
echo ""

# 1. Environment Verification
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed."
    exit 1
fi

echo "[1/4] Node.js environment detected: $(node -v)"

# 2. Build Frontend Production Distribution
echo ""
echo "[2/4] Building Client Bundle (Vite)..."
(cd client && npm run build)

# 3. Run Test Suites
echo ""
echo "[3/4] Running Comprehensive Verification Test Suite..."
(cd server && npm test)

# 4. Starting Production Server
echo ""
echo "[4/4] Starting Unified Server in Production Mode..."
export NODE_ENV=production
export PORT=${PORT:-5000}
node server/src/server.js

