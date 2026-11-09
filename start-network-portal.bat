@echo off
title Smart City Portal - Multi-Network Access
echo ========================================================
echo     SMART CITY SERVICE PORTAL - MULTI-NETWORK LAUNCHER
echo ========================================================
echo.
echo Starting secure tunnel so you can access the app from:
echo   - Mobile Phone (any network: 4G/5G, Wi-Fi, hotspot)
echo   - Laptop / Desktop (any browser anywhere)
echo.

cd /d "%~dp0"

REM Check if dist exists, if not build client once
if not exist "client\dist\index.html" (
    echo Building frontend for high performance...
    cd client
    call npm run build
    cd ..
)

echo Launching Multi-Network Tunnel...
node scripts/start-tunnel.js
pause
