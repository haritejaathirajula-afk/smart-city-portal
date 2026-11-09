@echo off
setlocal enabledelayedexpansion

echo =====================================================================
echo       Smart City Service Portal - Production Deployment Script
echo =====================================================================
echo.

:: 1. Verify Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

echo [1/4] Checking Node.js environment...
node -v

:: 2. Build Client Production Bundle
echo.
echo [2/4] Building Client Production Bundle (Vite)...
call npm.cmd --prefix client run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b 1
)
echo [OK] Client build succeeded!

:: 3. Run Automated Release Test Suite
echo.
echo [3/4] Running Automated Test Suite (All 17 Suites)...
call npm.cmd --prefix server test
if %errorlevel% neq 0 (
    echo [ERROR] Automated test suite failed! Deployment aborted.
    pause
    exit /b 1
)
echo [OK] All automated tests passed!

:: 4. Launch Production Server
echo.
echo [4/4] Starting Unified Server in Production Mode...
echo Server will serve REST API and Static Client from http://localhost:5000
echo.
set NODE_ENV=production
node server/src/server.js

endlocal

