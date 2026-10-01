@echo off
title PakTax FBR - Instant Desktop Launcher
color 0A

echo ======================================================================
echo           PakTax FBR - Digital Invoicing Compliance Platform
echo                       Instant Desktop Window
echo ======================================================================
echo.

:: Check if dependencies are installed
if not exist "node_modules\" (
    echo [INFO] First-time startup: Initializing local packages (one-time only)...
    call npm install
)

:: Build production assets if not built yet
if not exist "dist\" (
    echo [INFO] Compiling local assets...
    call npm run build
)

echo.
echo [1/2] Starting local compliance server...
start /b cmd /c "npx vite preview --port 3000 --host localhost >nul 2>&1"

:: Wait 2 seconds for server to bind
timeout /t 2 /nobreak >nul

echo [2/2] Opening native desktop application window...

:: Check if Microsoft Edge exists (Default on all Windows 10/11)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000 --window-size=1366,800
    goto :done
)

:: Fallback to Chrome
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000 --window-size=1366,800
    goto :done
)

:: Generic Fallback
start http://localhost:3000

:done
echo.
echo ======================================================================
echo  [RUNNING] PakTax FBR is now open in a standalone desktop window!
echo  (You can minimize this command window while using the application)
echo ======================================================================
echo.
pause
