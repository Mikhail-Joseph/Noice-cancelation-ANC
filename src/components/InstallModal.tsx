import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { 
  X, 
  Download, 
  CheckCircle2, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink,
  Laptop,
  Smartphone,
  Shield,
  Zap,
  ArrowRight
} from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isWindows, isAndroid, isIOS, install } = usePWAInstall();
  
  // Default tab based on user's operating system
  const [activeTab, setActiveTab] = useState<'windows' | 'android' | 'other'>(
    isAndroid ? 'android' : 'windows'
  );

  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    await install();
  };

  const powershellCommand = `Invoke-WebRequest -Uri "${window.location.origin}/Install-AeroSilence-Windows.ps1" -OutFile "$env:TEMP\\Install-AeroSilence.ps1"; powershell -ExecutionPolicy Bypass -File "$env:TEMP\\Install-AeroSilence.ps1"`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(powershellCommand);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-amber-500 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <Download size={18} className="text-amber-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Install AeroSilence ANC Workstation</span>
                {isInstalled && (
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                    Installed
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Native standalone installer for Windows and Android mobile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Platform Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('windows')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
              activeTab === 'windows'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop size={15} />
            <span>Windows Desktop (PC)</span>
            {isWindows && (
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-1 rounded">
                Your OS
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
              activeTab === 'android'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone size={15} />
            <span>Android (APK / WebAPK)</span>
            {isAndroid && (
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-1 rounded">
                Your OS
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('other')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
              activeTab === 'other'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>macOS / Linux / iOS</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          
          {/* WINDOWS TAB */}
          {activeTab === 'windows' && (
            <div className="flex flex-col gap-5">
              
              {/* Method 1: Direct Browser 1-Click Install */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-xs font-bold">
                      1
                    </span>
                    <h4 className="text-sm font-semibold text-slate-200">
                      1-Click Windows Desktop PWA Install
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                    Recommended (Fastest)
                  </span>
                </div>
                
                <p className="text-xs text-slate-400 leading-relaxed">
                  Installs AeroSilence as a standalone Windows desktop app in Microsoft Edge or Google Chrome. Creates a desktop shortcut, Start Menu item, and runs in a dedicated borderless window with zero browser address bar.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {isInstallable ? (
                    <button
                      onClick={handleInstallClick}
                      className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-2 transition-colors shadow-md shadow-cyan-500/20"
                    >
                      <Download size={15} />
                      <span>Install on Windows Now</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                      <span>In Edge or Chrome: click the <strong>Install</strong> icon in the address bar (or Menu &rarr; <strong>Apps &rarr; Install this site as an app</strong>).</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Method 2: Download Windows Batch / PowerShell Script */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono text-xs font-bold">
                      2
                    </span>
                    <h4 className="text-sm font-semibold text-slate-200">
                      Windows Native Standalone Installer Script (.bat / .ps1)
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Offline & Batch Deployment
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Downloads an automated Windows installer script that detects Edge/Chrome, sets optimal low-latency audio flags, creates Desktop and Start Menu shortcuts, and launches the application.
                </p>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <a
                    href="/Install-AeroSilence-Windows.bat"
                    download="Install-AeroSilence-Windows.bat"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-2 transition-colors"
                  >
                    <Download size={14} className="text-amber-400" />
                    <span>Download .BAT Installer</span>
                  </a>

                  <a
                    href="/Install-AeroSilence-Windows.ps1"
                    download="Install-AeroSilence-Windows.ps1"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-2 transition-colors"
                  >
                    <Download size={14} className="text-cyan-400" />
                    <span>Download .PS1 PowerShell</span>
                  </a>
                </div>

                {/* Quick PowerShell One-Liner */}
                <div className="mt-2 flex flex-col gap-1.5">
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <Terminal size={12} className="text-slate-500" />
                    <span>Or run directly in Windows PowerShell:</span>
                  </span>
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-1.5 text-[11px] font-mono text-slate-300">
                    <span className="truncate flex-1 px-1.5 text-slate-400">
                      {powershellCommand}
                    </span>
                    <button
                      onClick={copyToClipboard}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1 transition-colors shrink-0"
                      title="Copy to clipboard"
                    >
                      {copiedScript ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedScript ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Windows Capabilities */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2 text-slate-300">
                  <Zap size={15} className="text-cyan-400 shrink-0" />
                  <span>Hardware-accelerated DSP</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2 text-slate-300">
                  <Shield size={15} className="text-amber-400 shrink-0" />
                  <span>Offline Cache & Audio</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2 text-slate-300">
                  <Laptop size={15} className="text-emerald-400 shrink-0" />
                  <span>Desktop & Taskbar Pinning</span>
                </div>
              </div>

            </div>
          )}

          {/* ANDROID TAB */}
          {activeTab === 'android' && (
            <div className="flex flex-col gap-5">
              
              {/* PRIMARY: Direct APK Download */}
              <div className="bg-gradient-to-br from-emerald-950/60 to-slate-950 rounded-xl p-5 border border-emerald-500/40 shadow-lg flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <Download size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <span>Download Standalone Android APK</span>
                        <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                          Signed Package
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Direct standalone installer — no 3-dot browser menu required!
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                    v1.3.0 (Offline + Secure Mic)
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Download the self-contained <strong>AeroSilence-ANC.apk</strong>. Features an internal secure-context origin allowing <strong>direct live microphone acquisition, zero cookie barriers, and full offline DSP processing</strong>.
                </p>

                {/* Direct APK Download Button */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href="/AeroSilence-ANC.apk"
                    download="AeroSilence-ANC.apk"
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-2.5 transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
                  >
                    <Download size={16} />
                    <span>Download AeroSilence-ANC.apk (414 KB)</span>
                  </a>
                </div>

                {/* Step-by-Step Android Sideload Guide */}
                <div className="bg-slate-900/90 rounded-lg p-3.5 border border-slate-800 flex flex-col gap-2 mt-1">
                  <span className="text-xs font-semibold text-slate-200">
                    Quick Android Install Steps:
                  </span>
                  <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                    <li>
                      Tap the <strong>Download AeroSilence-ANC.apk</strong> button above.
                    </li>
                    <li>
                      Open your phone&apos;s <strong>Downloads</strong> folder (or tap the download finished notification).
                    </li>
                    <li>
                      Tap <strong>AeroSilence-ANC.apk</strong> to start installation.
                    </li>
                    <li>
                      If prompted <em>&quot;Install unknown apps&quot;</em>, tap <strong>Settings</strong> &rarr; toggle <strong>&quot;Allow from this source&quot;</strong>, then tap <strong>Install</strong>.
                    </li>
                    <li>
                      AeroSilence will be added to your Android home screen and app drawer!
                    </li>
                  </ol>
                </div>
              </div>

              {/* SECONDARY: WebAPK / Browser Install (if browser supports it) */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-mono text-xs font-bold">
                      2
                    </span>
                    <h4 className="text-sm font-semibold text-slate-200">
                      Browser WebAPK Option (Optional)
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Chrome / Edge / Samsung Internet
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  If you prefer browser-managed installation without downloading the .apk file, you can install via the browser prompt below (note: some in-app webviews disable this option).
                </p>

                <div>
                  {isInstallable ? (
                    <button
                      onClick={handleInstallClick}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-2 transition-colors"
                    >
                      <Download size={14} className="text-emerald-400" />
                      <span>Trigger WebAPK Install Prompt</span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-slate-500 font-mono">
                      WebAPK prompt not triggered by this browser — please use the direct <strong>Download AeroSilence-ANC.apk</strong> button above.
                    </div>
                  )}
                </div>
              </div>

              {/* Android Permissions Note */}
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Android Audio Optimization:</strong> The APK uses low-latency hardware audio channels with raw microphone streaming, bypassing phone speech filtering to maximize active phase cancellation.
                </span>
              </div>

            </div>
          )}

          {/* OTHER PLATFORMS TAB */}
          {activeTab === 'other' && (
            <div className="flex flex-col gap-4 text-xs text-slate-300">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                  <span>macOS Desktop Installation</span>
                </h4>
                <p className="text-slate-400">
                  In Google Chrome or Microsoft Edge on macOS, click the <strong>Install</strong> icon in the address bar (or <strong>Chrome Menu &rarr; Save and Share &rarr; Install AeroSilence</strong>). It will be saved into your macOS Applications folder and Launchpad.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                  <span>iOS (iPhone / iPad) Installation</span>
                </h4>
                <p className="text-slate-400">
                  Open this page in Safari, tap the <strong>Share</strong> button (box with upward arrow) in the toolbar, scroll down, and tap <strong>Add to Home Screen</strong>.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                  <span>Linux Desktop Installation</span>
                </h4>
                <p className="text-slate-400">
                  In Chromium or Google Chrome, click the install prompt in the address bar to add AeroSilence to your application launcher (GNOME, KDE, or XFCE).
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            {isInstalled ? 'Running in standalone desktop mode' : 'Available for Windows, Android, Mac & Linux'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
