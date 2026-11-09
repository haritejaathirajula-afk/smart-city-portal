@echo off
title Smart City Service Portal
color 0B

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ========================================================
    echo [ERROR] Node.js is not detected on your system.
    echo Please download and install Node.js from https://nodejs.org
    echo ========================================================
    pause
    exit /b 1
)

node scripts\launch.js
if %errorlevel% neq 0 (
    echo.
    echo Portal stopped. Press any key to close this window.
    pause >nul
)
