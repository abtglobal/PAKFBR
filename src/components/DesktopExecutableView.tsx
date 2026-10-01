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
  AlertCircle,
  FolderDown,
  Info
} from 'lucide-react';

export function DesktopExecutableView() {
  const [copiedLink, setCopiedLink] = useState(false);

  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-b6yavrrm4y6xnazppzn2zf-50674581901.asia-east1.run.app';

  const copyLink = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const openAppInNewTab = () => {
    window.open(currentAppUrl, '_blank');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-1">
            <Monitor className="w-4 h-4 text-emerald-700" />
            <span>DESKTOP VERSION INSTALLATION</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Run PakTax FBR as a Desktop Application</h1>
          <p className="text-xs text-stone-600 font-medium mt-1">
            Follow the simple guide below to create a permanent desktop app on any Windows or Mac computer.
          </p>
        </div>

        <button
          onClick={openAppInNewTab}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open in Full Desktop Tab</span>
        </button>
      </div>

      {/* WHY THE .BAT FILE ALONE DOES NOT WORK BANNER */}
      <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="text-sm font-bold text-amber-950">Why did downloading the `.bat` file alone not work?</h3>
            <p className="text-xs text-stone-800 leading-relaxed font-medium">
              If you only downloaded a single <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold">.bat</code> file into your <em>Downloads</em> folder, Windows cannot run it by itself because a compiler requires the complete application files (<code className="font-mono">package.json</code>, <code className="font-mono">src/</code>, <code className="font-mono">index.html</code>).
            </p>
            <div className="text-xs text-emerald-900 font-bold bg-emerald-100/80 p-2 rounded-lg border border-emerald-300 mt-2">
              💡 <strong>Instant Solution:</strong> Use <strong>Method 1 below</strong> to install the desktop app in 5 seconds with <strong>zero downloads and zero technical setup</strong>!
            </div>
          </div>
        </div>
      </div>

      {/* METHOD 1: OFFICIAL 1-CLICK DESKTOP APP (PWA) */}
      <div className="bg-white border-2 border-emerald-500 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Method 1: Instant Desktop App (Works on ANY Computer)</h2>
              <p className="text-xs text-emerald-800 font-semibold mt-0.5">Zero downloads • Zero errors • Native Windows/Mac Desktop Window</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-700 text-white text-[11px] font-bold rounded-lg uppercase">
            Recommended
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Step 1: Open Dedicated Tab</div>
            <p className="text-xs text-stone-700 leading-relaxed font-medium">
              Open the live application link directly in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>:
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={openAppInNewTab}
                className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open App Tab</span>
              </button>
              <button
                onClick={copyLink}
                className="py-2 px-3 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                title="Copy Link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Step 2: Click "Install"</div>
            <p className="text-xs text-stone-700 leading-relaxed font-medium">
              In the top-right corner of your browser's address bar, click the <strong>Install icon</strong> (small computer screen icon with a down arrow).
            </p>
            <div className="p-2.5 bg-white border border-stone-300 rounded-lg text-[11px] text-stone-600 font-medium">
              <em>Or click Chrome/Edge 3-dots menu $\rightarrow$ <strong>"Save and share"</strong> $\rightarrow$ <strong>"Install PakTax FBR..."</strong></em>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Step 3: Desktop App Ready!</div>
            <p className="text-xs text-stone-700 leading-relaxed font-medium">
              Click <strong>"Install"</strong>. Windows immediately puts a <strong>PakTax FBR icon on your Desktop</strong> and opens it in a dedicated desktop window.
            </p>
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-900 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Works 100% offline with local storage!</span>
            </div>
          </div>
        </div>
      </div>

      {/* METHOD 2: HOW TO PROPERLY BUILD .EXE ON YOUR PC */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center font-bold text-base">
            2
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Method 2: Full Project Download & Offline `.exe` Setup</h2>
            <p className="text-xs text-stone-600 font-medium mt-0.5">If you require a physical setup installer file (<code className="font-mono font-bold">.exe</code>) for USB drives</p>
          </div>
        </div>

        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs text-stone-700 space-y-3 font-medium">
          <p>
            To compile the <code className="font-bold text-stone-900 font-mono">.exe</code> on your computer without errors, you must download the <strong>complete project ZIP</strong>:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 pl-2">
            <li>In the top bar of Google AI Studio, click <strong>"Export"</strong> or <strong>"Download Project"</strong> to download the full <code className="font-mono font-bold">project.zip</code>.</li>
            <li>Extract the ZIP file into a folder on your computer (e.g. <code className="font-mono font-bold">C:\PakTax\</code>).</li>
            <li>Open the extracted <code className="font-mono font-bold">C:\PakTax\</code> folder and double-click <code className="font-mono font-bold text-emerald-800">Launch-PakTax-Desktop.bat</code> or <code className="font-mono font-bold text-amber-800">build-windows-exe.bat</code>.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
