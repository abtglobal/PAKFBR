@echo off
title PakTax FBR - Windows Desktop Executable & Setup Builder (.exe)
color 0A

echo ======================================================================
echo           PakTax FBR - Digital Invoicing Compliance Platform
echo         Windows Standalone Installer & Executable (.exe) Compiler
echo ======================================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please download and install Node.js (LTS version) from https://nodejs.org
    echo Then double-click this script again.
    echo.
    pause
    exit /b 1
)

echo [1/4] Installing project dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed. Please check your internet connection.
    pause
    exit /b 1
)

echo.
echo [2/4] Compiling optimized production web assets...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] npm run build failed.
    pause
    exit /b 1
)

echo.
echo [3/4] Installing packaging engine (Electron & electron-builder)...
call npm install --save-dev electron electron-builder --legacy-peer-deps

echo.
echo [4/4] Generating Windows Setup Installer (.exe) & Portable Executable...
call npx electron-builder --win nsis portable

if %errorlevel% equ 0 (
    echo.
    echo ======================================================================
    echo  [SUCCESS] Executable files created successfully!
    echo.
    echo  Files ready in the "dist-electron" folder:
    echo    1. Setup Installer (.exe)  - for full desktop installation & shortcuts
    echo    2. Portable (.exe)         - for instant 1-click run from USB flash drive
    echo.
    echo  You can copy either file to any Windows PC to run offline.
    echo ======================================================================
    explorer dist-electron
) else (
    echo.
    echo Notice: Compiling single-directory portable package...
    call npx electron-builder --win --dir
    explorer dist-electron
)

echo.
pause
