@echo off
title PakTax FBR - Instant Desktop Launcher
color 0B

echo Starting PakTax FBR Compliance Gateway...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required. Install from https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Starting local desktop service on port 3000...
start http://localhost:3000
npm run dev
