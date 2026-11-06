import React from 'react';
import { Download, Laptop, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface TopBarProps {
  onOpenInstall: () => void;
  activeView: 'workstation' | 'telemetry' | 'presets';
  setActiveView: (view: 'workstation' | 'telemetry' | 'presets') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenInstall,
  activeView,
  setActiveView,
}) => {
  const { isInstalled, isWindows, isAndroid } = usePWAInstall();

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800/90 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Brand Wordmark (Single text element) */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
          <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3l3-8 4 16 3-8h5" />
          </svg>
        </div>
        <span className="text-base font-bold tracking-tight text-slate-100 font-sans">
          AeroSilence ANC
        </span>
      </div>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={() => setActiveView('workstation')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'workstation' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Acoustic Workstation
        </button>
        <a
          href="#visualizers"
          className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
        >
          Signal Visualizers
        </a>
        <button
          onClick={() => setActiveView('presets')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'presets' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Noise Environments
        </button>
        <a
          href="#dsp-controls"
          className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
        >
          DSP Parameters
        </a>
      </nav>

      {/* Zone 3: 1 primary action (Install Windows / Android) */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenInstall}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-amber-400 hover:from-cyan-300 hover:to-amber-300 rounded-lg transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          {isWindows ? (
            <Laptop size={14} />
          ) : isAndroid ? (
            <Smartphone size={14} />
          ) : (
            <Download size={14} />
          )}
          <span>{isInstalled ? 'App Installed' : 'Install Windows / Android'}</span>
        </button>
      </div>
    </header>
  );
};
