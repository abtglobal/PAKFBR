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

:: 2. Check and install core dependencies
if not exist "node_modules\" (
    echo [1/3] Installing core dependencies (one-time only)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed. Please check your internet connection.
        pause
        exit /b 1
    )
) else (
    echo [1/3] Core dependencies already installed. Skipping...
)

:: 3. Build production web assets
echo.
echo [2/3] Compiling optimized web assets...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] npm run build failed.
    pause
    exit /b 1
)

:: 4. Package into Windows Executable
echo.
echo [3/3] Generating Windows Executable (.exe)...
echo [INFO] Note: First-time packaging downloads the Electron Windows engine (~100MB).
echo        Please wait 2-4 minutes depending on your internet connection...
echo.

:: Run electron-builder with increased timeout and verbose feedback
call npx --yes electron-builder --win portable nsis

if %errorlevel% equ 0 (
    echo.
    echo ======================================================================
    echo  [SUCCESS] Executable files created successfully!
    echo.
    echo  Files ready in the "dist-electron" folder:
    echo    1. Setup Installer (.exe)  - for full desktop installation & shortcuts
    echo    2. Portable (.exe)         - for instant 1-click run from USB flash drive
    echo ======================================================================
    if exist "dist-electron\" (
        explorer dist-electron
    )
) else (
    echo.
    echo ======================================================================
    echo  [NOTICE] If the GitHub download timed out due to slow internet:
    echo  You can use the INSTANT launcher instead: "Launch-PakTax-Desktop.bat"
    echo  It opens the app in a standalone desktop window with 0 wait time!
    echo ======================================================================
)

echo.
pause
