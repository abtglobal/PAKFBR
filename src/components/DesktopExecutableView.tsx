import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Cpu,
  Download,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  FolderArchive,
  Play,
  FileCode,
  Laptop,
  Share2,
  HardDrive,
  CheckSquare,
  Zap,
  AlertCircle
} from 'lucide-react';

export function DesktopExecutableView() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Listen for PWA desktop install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!installPrompt) {
      alert('To install instantly without downloading any software:\n1. In Chrome or Edge, click the Install icon (computer with down arrow) in your browser address bar at the top right.\n2. Or click the browser 3-dots menu -> "Install PakTax FBR Invoicing...".\n\nIt opens in its own standalone desktop window immediately!');
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Download the instant 2-second launcher script
  const downloadInstantLauncher = () => {
    const batContent = `@echo off
title PakTax FBR - Instant Desktop Launcher
color 0A

echo ======================================================================
echo           PakTax FBR - Digital Invoicing Compliance Platform
echo                       Instant Desktop Window
echo ======================================================================
echo.

if not exist "node_modules\\" (
    echo [INFO] First-time startup: Initializing local packages (one-time only)...
    call npm install
)

if not exist "dist\\" (
    echo [INFO] Compiling local assets...
    call npm run build
)

echo.
echo [1/2] Starting local compliance server...
start /b cmd /c "npx vite preview --port 3000 --host localhost >nul 2>&1"
timeout /t 2 /nobreak >nul

echo [2/2] Opening native desktop application window...

if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app=http://localhost:3000 --window-size=1366,800
    goto :done
)

if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app=http://localhost:3000 --window-size=1366,800
    goto :done
)

start http://localhost:3000

:done
echo.
echo ======================================================================
echo  [RUNNING] PakTax FBR is now open in a standalone desktop window!
echo ======================================================================
echo.
pause
`;

    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Launch-PakTax-Desktop.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download the build-windows-exe.bat for compiling full .exe
  const downloadBatchScript = () => {
    const batContent = `@echo off
title PakTax FBR - Windows Desktop Executable & Setup Builder (.exe)
color 0A

echo ======================================================================
echo           PakTax FBR - Digital Invoicing Compliance Platform
echo         Windows Standalone Installer & Executable (.exe) Compiler
echo ======================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please download and install Node.js (LTS version) from https://nodejs.org
    echo Then double-click this script again.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\\" (
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

echo.
echo [2/3] Compiling optimized web assets...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] npm run build failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Generating Windows Executable (.exe)...
echo [INFO] Note: First-time packaging downloads the Electron Windows engine (~100MB).
echo        Please wait 2-4 minutes depending on your internet connection...
echo.

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
    if exist "dist-electron\\" (
        explorer dist-electron
    )
) else (
    echo.
    echo ======================================================================
    echo  [NOTICE] If download timed out, use "Launch-PakTax-Desktop.bat" instead
    echo  which launches instantly in a standalone window with 0 wait time.
    echo ======================================================================
)

echo.
pause
`;

    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'build-windows-exe.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1">
            <Monitor className="w-4 h-4 text-amber-600" />
            <span>DESKTOP APP & STANDALONE EXECUTION</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Run as Desktop App or Build Windows Installer</h1>
          <p className="text-xs text-stone-600 font-medium mt-1">
            Choose between instant zero-download desktop mode (recommended) or compile a standalone <code className="font-mono text-stone-900 bg-stone-100 px-1 py-0.5 rounded font-bold">.exe</code> setup file.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadInstantLauncher}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Instant Desktop Launcher (.bat)</span>
          </button>
          <button
            onClick={downloadBatchScript}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Build .EXE Installer (.bat)</span>
          </button>
        </div>
      </div>

      {/* Explanation Banner: Why .EXE takes time & Faster Alternatives */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="text-sm font-bold text-amber-950">Why is the `.exe` builder downloading and taking time?</h3>
            <p className="text-xs text-stone-700 leading-relaxed font-medium">
              When compiling a standalone <code className="font-bold text-stone-900 font-mono">.exe</code>, the build tool must download the **Electron Chromium Engine (~100MB) + NSIS Windows Installer binaries** from GitHub. On standard internet connections, this download can take 3 to 10 minutes or time out if the connection fluctuates.
            </p>
            <div className="text-xs font-bold text-amber-950 pt-1">
              ✨ Fast Alternative: You can use the application as a standalone desktop app <strong>instantly with 0 wait time</strong> using Option 1 or Option 2 below!
            </div>
          </div>
        </div>
      </div>

      {/* 3 Quick Execution Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Option 1: Browser 1-Click Desktop Install */}
        <div className="bg-white border-2 border-emerald-500 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative">
          <div className="absolute -top-3 right-4 px-2.5 py-0.5 bg-emerald-700 text-white font-bold text-[10px] rounded-full uppercase shadow-xs">
            Fastest • 0 Seconds
          </div>
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Option 1: 1-Click Browser Desktop Install</h3>
              <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">Zero downloads • Native Desktop Window</div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              In Chrome or Edge, click the <strong>Install</strong> button in your browser address bar. It creates a desktop icon and runs as a separate native desktop app window.
            </p>
          </div>

          <div className="pt-4 border-t border-stone-200 mt-4">
            <button
              onClick={handleInstallPWA}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Install to Desktop Now</span>
            </button>
          </div>
        </div>

        {/* Option 2: Instant 2-Second Launcher */}
        <div className="bg-white border border-stone-200 hover:border-amber-400 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Option 2: Instant Desktop Launcher (.bat)</h3>
              <div className="text-[11px] text-amber-800 font-semibold mt-0.5">2 Seconds • Uses Built-in Edge/Chrome</div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              Launches the app in a clean, borderless standalone desktop window without browser toolbars. No heavy 300MB downloads needed!
            </p>
          </div>

          <div className="pt-4 border-t border-stone-200 mt-4">
            <button
              onClick={downloadInstantLauncher}
              className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Instant Launcher</span>
            </button>
          </div>
        </div>

        {/* Option 3: Full .EXE Installer */}
        <div className="bg-white border border-stone-200 hover:border-amber-400 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Option 3: Full Setup Installer (.exe)</h3>
              <div className="text-[11px] text-stone-600 font-semibold mt-0.5">For Offline USB Distribution</div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              Packages into <code className="font-mono text-stone-900 font-bold">PakTax-FBR-Setup.exe</code>. Requires downloading the ~100MB Electron engine once during build.
            </p>
          </div>

          <div className="pt-4 border-t border-stone-200 mt-4">
            <button
              onClick={downloadBatchScript}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .EXE Builder (.bat)</span>
            </button>
          </div>
        </div>
      </div>

      {/* How to Distribute to Other Machines */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <h2 className="text-base font-bold text-stone-900">Sharing with Other Computers in Your Office</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-700 font-medium">
          <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-1.5">
            <div className="font-bold text-stone-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] flex items-center justify-center font-bold">A</span>
              <span>Online Sharing (Zero Setup):</span>
            </div>
            <p className="text-stone-600">
              Send colleagues the link: <br />
              <code className="bg-white px-2 py-1 rounded border border-stone-300 font-mono text-[11px] text-stone-900 block mt-1 select-all">
                https://ais-pre-b6yavrrm4y6xnazppzn2zf-50674581901.asia-east1.run.app
              </code>
              They open it and click "Install" in their browser.
            </p>
          </div>

          <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-1.5">
            <div className="font-bold text-stone-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] flex items-center justify-center font-bold">B</span>
              <span>Offline USB Sharing (.exe):</span>
            </div>
            <p className="text-stone-600">
              Run <code className="font-mono text-stone-900 font-bold">build-windows-exe.bat</code> once on your PC, then copy <code className="font-mono text-stone-900 font-bold">PakTax-FBR-Setup.exe</code> from the <code className="font-mono text-stone-900 font-bold">dist-electron/</code> folder to a USB drive to install on other PCs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
