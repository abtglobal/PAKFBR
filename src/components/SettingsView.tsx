import React, { useState } from 'react';
import {
  Sliders,
  Building2,
  Calendar,
  Save,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Trash2,
  AlertTriangle,
  Monitor,
  Download,
  Terminal
} from 'lucide-react';
import { Workspace } from '../types/fbr';
import { storageService } from '../services/storageService';

export function SettingsView({
  workspace,
  onUpdateWorkspace,
  onOpenDesktopGuide,
}: {
  workspace: Workspace;
  onUpdateWorkspace: (ws: Workspace) => void;
  onOpenDesktopGuide?: () => void;
}) {
  const [profile, setProfile] = useState({ ...workspace.profile });
  const [taxConfig, setTaxConfig] = useState({ ...workspace.taxConfig });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWorkspace({
      ...workspace,
      profile,
      taxConfig,
    });
    alert('Taxpayer Profile & System Settings saved successfully.');
  };

  const handleWipeData = () => {
    if (window.confirm('Are you sure you want to completely purge and reset all local data back to a clean state? This cannot be undone.')) {
      storageService.wipeAllData();
      window.location.reload();
    }
  };

  const handleDownloadBuildScript = () => {
    const batContent = `@echo off
title PakTax FBR - Windows Desktop Executable Builder (.exe)
color 0A

echo ======================================================================
echo           PakTax FBR - Digital Invoicing Compliance Platform
echo               Windows Desktop Executable (.exe) Compiler
echo ======================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please download and install Node.js (LTS version) from https://nodejs.org
    echo Then run this script again.
    pause
    exit /b 1
)

echo [1/4] Installing project dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo.
echo [2/4] Building production web assets...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] npm run build failed.
    pause
    exit /b 1
)

echo.
echo [3/4] Installing Electron packager...
call npm install --save-dev electron electron-builder --legacy-peer-deps

echo.
echo [4/4] Compiling Windows Standalone Executable (.exe)...
call npx electron-builder --win portable

if %errorlevel% equ 0 (
    echo.
    echo ======================================================================
    echo  SUCCESS! Your standalone Windows .exe is ready in the "dist" folder!
    echo ======================================================================
    explorer dist
) else (
    echo.
    echo [ERROR] Compilation encountered an issue. See logs above.
)

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
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1">
            <Sliders className="w-4 h-4 text-amber-600" />
            <span>TAXPAYER PROFILE & SYSTEM PREFERENCES</span>
          </div>
          <h2 className="text-base font-bold text-stone-900">Company Profile & Compliance Parameters</h2>
          <p className="text-xs text-stone-600 font-medium mt-0.5">
            Configure registered corporate details, sector classification, and provincial sales tax jurisdiction.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs text-stone-900">
        {/* Business Identity */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>Registered Taxpayer Identity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-stone-700 font-bold block mb-1">Business Legal Name *</label>
              <input
                type="text"
                required
                value={profile.businessName}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none"
                placeholder="Enter Registered Legal Entity Name"
              />
            </div>

            <div>
              <label className="text-stone-700 font-bold block mb-1">National Tax Number (NTN) *</label>
              <input
                type="text"
                required
                value={profile.ntn}
                onChange={(e) => setProfile({ ...profile, ntn: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 font-mono focus:border-amber-500 focus:outline-none"
                placeholder="1234567-8"
              />
            </div>

            <div>
              <label className="text-stone-700 font-bold block mb-1">Sales Tax Reg. Number (STRN)</label>
              <input
                type="text"
                value={profile.strn}
                onChange={(e) => setProfile({ ...profile, strn: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 font-mono focus:border-amber-500 focus:outline-none"
                placeholder="17-00-1234-567-89"
              />
            </div>

            <div>
              <label className="text-stone-700 font-bold block mb-1">FBR POS Identification ID</label>
              <input
                type="text"
                value={profile.posId || ''}
                onChange={(e) => setProfile({ ...profile, posId: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 font-mono focus:border-amber-500 focus:outline-none"
                placeholder="POS-01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="sm:col-span-2">
              <label className="text-stone-700 font-bold block mb-1">Principal Place of Business (Address)</label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none"
                placeholder="Industrial Area / Head Office Address"
              />
            </div>

            <div>
              <label className="text-stone-700 font-bold block mb-1">City</label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none"
                placeholder="Karachi, Lahore, etc."
              />
            </div>
          </div>
        </div>

        {/* Sector & Jurisdiction */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900">Tax Jurisdiction & Industry Sector</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-stone-700 font-bold block mb-1">Provincial Tax Jurisdiction</label>
              <select
                value={profile.province}
                onChange={(e) => setProfile({ ...profile, province: e.target.value as any })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none font-medium"
              >
                <option value="Sindh">Sindh (SRB / FBR)</option>
                <option value="Punjab">Punjab (PRA / FBR)</option>
                <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa (KPRA / FBR)</option>
                <option value="Balochistan">Balochistan (BRA / FBR)</option>
                <option value="Islamabad Capital Territory">Islamabad Capital Territory (FBR)</option>
              </select>
            </div>

            <div>
              <label className="text-stone-700 font-bold block mb-1">Taxpayer Industry Sector</label>
              <select
                value={profile.businessType}
                onChange={(e) => setProfile({ ...profile, businessType: e.target.value as any })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none font-medium"
              >
                <option value="Manufacturer">Manufacturer / Large Scale</option>
                <option value="Importer">Importer / Commercial Trader</option>
                <option value="Wholesaler">Wholesaler / Distributor</option>
                <option value="Tier-1 Retailer">Tier-1 Retailer (Integrated POS)</option>
                <option value="Service Provider">Service Provider</option>
                <option value="Exporter">Exporter (Zero-Rated 5th Sched)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Desktop Application & Offline Executable */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-amber-600" />
              <span>Desktop Application & Windows Executable (.exe)</span>
            </h3>
            <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Offline Ready
            </span>
          </div>
          <p className="text-xs text-stone-600 font-medium">
            PakTax can be compiled into a standalone Windows executable (<code className="text-stone-900 bg-stone-100 px-1 py-0.5 rounded font-mono font-bold">.exe</code>) or installed as a desktop application with local offline storage.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleDownloadBuildScript}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download .exe Build Script (.bat)</span>
            </button>
            {onOpenDesktopGuide && (
              <button
                type="button"
                onClick={onOpenDesktopGuide}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Terminal className="w-4 h-4 text-stone-600" />
                <span>View Full Build Guide</span>
              </button>
            )}
          </div>
        </div>

        {/* Local Storage Wipe & Clean Reset */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-stone-900">Reset Local Storage & Clear Cache</h4>
            <p className="text-xs text-stone-600 font-medium mt-0.5">
              Purges all browser-cached invoices and customer records back to clean slate state.
            </p>
          </div>

          <button
            type="button"
            onClick={handleWipeData}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl border border-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Purge & Reset All Local Data</span>
          </button>
        </div>
      </form>
    </div>
  );
}
