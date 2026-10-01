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
  CheckSquare
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
      alert('To install as a desktop app in your current browser:\n1. In Chrome or Edge, click the Install App icon in the address bar (top right).\n2. Or click the browser 3-dots menu -> "Install PakTax FBR Invoicing...".\n\nIt runs in its own native standalone window!');
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

  // Download the build-windows-exe.bat directly to user's computer
  const downloadBatchScript = () => {
    const batContent = `@echo off
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
            <span>STANDALONE DESKTOP COMPILATION & DISTRIBUTION</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Generate Setup File & Share on Other Machines</h1>
          <p className="text-xs text-stone-600 font-medium mt-1">
            Create standard Windows <code className="font-mono text-stone-900 bg-stone-100 px-1 py-0.5 rounded font-bold">.exe</code> setup installers that can be copied via USB or Google Drive and installed on any PC without Node.js or internet dependencies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadBatchScript}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download 1-Click Builder (.bat)</span>
          </button>
        </div>
      </div>

      {/* How It Works for Other Machines Banner */}
      <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 mt-0.5">
            <Share2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-950">How to Share & Install on Other Computers:</h3>
            <p className="text-xs text-stone-700 leading-relaxed font-medium">
              1. Run the build script once on your computer to produce the <code className="font-mono text-stone-900 bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold">PakTax-FBR-Setup.exe</code> file.<br />
              2. Copy that single <code className="font-mono text-stone-900 bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold">.exe</code> file to a <strong>USB Flash Drive</strong> or upload to <strong>Google Drive / OneDrive / Email</strong>.<br />
              3. On any client, accountant, or office PC, double-click the file. It installs the desktop app with Desktop & Start Menu shortcuts. <strong>The target machines do NOT need Node.js or any coding tools!</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 2 Output Formats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Output 1: Setup Installer */}
        <div className="bg-white border-2 border-amber-400 rounded-2xl p-6 shadow-xs flex flex-col justify-between relative">
          <div className="absolute -top-3 right-4 px-2.5 py-0.5 bg-amber-600 text-white font-bold text-[10px] rounded-full uppercase shadow-xs">
            Standard Installer Setup
          </div>
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">1. Windows Setup Installer (.exe)</h3>
              <div className="text-xs font-mono font-bold text-amber-900 mt-0.5">PakTax FBR Setup 1.0.0.exe</div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              Standard Windows installation wizard with choose installation folder, creates Desktop icon, Start Menu shortcut, and offline local cache.
            </p>
          </div>

          <div className="pt-4 border-t border-stone-200 mt-4 space-y-2">
            <div className="text-[11px] text-stone-600 font-medium">Build Command:</div>
            <div className="bg-amber-50/60 border border-amber-200 p-2.5 rounded-xl font-mono text-xs text-stone-900 flex items-center justify-between">
              <span className="font-bold">npm run package:setup</span>
              <button
                onClick={() => copyToClipboard('npm run package:setup', 101)}
                className="p-1 hover:text-amber-800 transition-colors cursor-pointer"
              >
                {copiedIndex === 101 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              </button>
            </div>
          </div>
        </div>

        {/* Output 2: Portable Executable */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-colors">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">2. Standalone Portable (.exe)</h3>
              <div className="text-xs font-mono font-bold text-amber-900 mt-0.5">PakTax FBR 1.0.0.exe</div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              Zero installation required. Runs instantly from a USB drive or desktop on any Windows 10/11 PC with zero setup.
            </p>
          </div>

          <div className="pt-4 border-t border-stone-200 mt-4 space-y-2">
            <div className="text-[11px] text-stone-600 font-medium">Build Command:</div>
            <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-xl font-mono text-xs text-stone-900 flex items-center justify-between">
              <span className="font-bold">npm run package:portable</span>
              <button
                onClick={() => copyToClipboard('npm run package:portable', 102)}
                className="p-1 hover:text-amber-800 transition-colors cursor-pointer"
              >
                {copiedIndex === 102 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step by Step Execution Instructions */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900">Step-by-Step Instructions to Generate & Distribute</h2>
            <p className="text-xs text-stone-600 font-medium">Generate the files in under 2 minutes on your primary machine:</p>
          </div>
          <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-300">
            Windows 10 / 11 Compatible
          </span>
        </div>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
              1
            </div>
            <div className="space-y-1 flex-1">
              <div className="text-xs font-bold text-stone-900">Download the 1-Click Builder Script</div>
              <div className="text-xs text-stone-600 font-medium">
                Click the <button onClick={downloadBatchScript} className="text-amber-700 font-bold underline cursor-pointer">Download 1-Click Builder (.bat)</button> button at the top and place the file inside your exported project folder.
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
              2
            </div>
            <div className="space-y-1 flex-1">
              <div className="text-xs font-bold text-stone-900">Double-Click "build-windows-exe.bat"</div>
              <div className="text-xs text-stone-600 font-medium">
                The script will automatically compile the code and create the executables in the <code className="text-stone-900 bg-stone-100 px-1 py-0.5 rounded font-mono font-bold">\dist-electron\</code> folder.
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
              3
            </div>
            <div className="space-y-1 flex-1">
              <div className="text-xs font-bold text-stone-900">Share & Install on Any Machine</div>
              <div className="text-xs text-stone-600 font-medium">
                Copy <code className="text-stone-900 bg-stone-100 px-1 py-0.5 rounded font-mono font-bold">PakTax FBR Setup 1.0.0.exe</code> to a USB stick, or send it via email/cloud drive. Anyone can double-click it to install and use immediately.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
