import React, { useEffect, useRef, useState, useTransition } from 'react';
import { ANCAudioEngine } from './audio/ancEngine';
import { TopBar } from './components/TopBar';
import { TelemetryStrip } from './components/TelemetryStrip';
import { Oscilloscope } from './components/Oscilloscope';
import { SpectrumAnalyzer } from './components/SpectrumAnalyzer';
import { SpectrogramWaterfall } from './components/SpectrogramWaterfall';
import { PhaseVectorscope } from './components/PhaseVectorscope';
import { DSPControlPanel } from './components/DSPControlPanel';
import { AcousticPresets } from './components/AcousticPresets';
import { NoiseProfilerModal } from './components/NoiseProfilerModal';
import { InstallModal } from './components/InstallModal';
import { VisualizerMode } from './types/audio';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Sliders, 
  Layers, 
  Activity, 
  Waves,
  Sparkles,
  Download,
  Laptop,
  Smartphone
} from 'lucide-react';

export default function App() {
  const engineRef = useRef<ANCAudioEngine | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [hasStartedAudio, setHasStartedAudio] = useState(false);
  const [activeView, setActiveView] = useState<'workstation' | 'telemetry' | 'presets'>('workstation');
  const [visualizerTab, setVisualizerTab] = useState<VisualizerMode>('all');
  
  // Modals
  const [isProfilerOpen, setIsProfilerOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  // Force re-render state trigger when settings change
  const [, startTransition] = useTransition();
  const [, setTick] = useState(0);

  const notifyChange = () => {
    startTransition(() => {
      setTick((t) => t + 1);
    });
  };

  useEffect(() => {
    // Create audio engine instance
    const engine = new ANCAudioEngine();
    engineRef.current = engine;
    setEngineReady(true);

    // AudioContext unlocker on first touch/click (mandatory for mobile WebAudio autoplay policies)
    const unlockAudio = () => {
      if (engineRef.current) {
        engineRef.current.ensureContext().catch(() => {});
      }
    };
    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      engine.destroy();
    };
  }, []);

  const handleStartWithMic = async () => {
    if (!engineRef.current) return;
    try {
      await engineRef.current.initEngine();
      await engineRef.current.setSource('mic');
      engineRef.current.updateSettings({
        lowLatencyNativeMode: true,
        muteDirectSidetone: true,
        delayCompensationMs: 0.0,
      });
      setHasStartedAudio(true);
      notifyChange();
    } catch (err) {
      console.error('Audio init with mic error:', err);
      setHasStartedAudio(true);
      notifyChange();
    }
  };

  const handleStartAudio = async () => {
    if (!engineRef.current) return;
    try {
      await engineRef.current.initEngine();
      setHasStartedAudio(true);
      notifyChange();
    } catch (err) {
      console.error('Audio init error:', err);
    }
  };

  if (!engineReady || !engineRef.current) {
    return (
      <div className="min-h-screen bg-[#070b12] flex items-center justify-center text-slate-400 font-mono text-xs">
        Loading AeroSilence Audio DSP Engine...
      </div>
    );
  }

  const engine = engineRef.current;

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-200 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Universal Top Bar */}
      <TopBar
        onOpenInstall={() => setIsInstallOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">

        {/* Start Audio Banner (if user hasn't interacted to start AudioContext yet) */}
        {!hasStartedAudio && (
          <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-amber-950/80 border border-cyan-800/60 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Play size={24} className="ml-0.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">
                  Initialize Real-Time ANC DSP Engine
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose your input source below to activate real-time 48 kHz acoustic processing.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleStartWithMic}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-lg font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <Activity size={16} />
                <span>Start with Live Mic</span>
              </button>
              <button
                onClick={handleStartAudio}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-lg font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Play size={16} className="text-amber-400" />
                <span>Simulated Noise Test</span>
              </button>
            </div>
          </div>
        )}

        {/* Precision Acoustic Telemetry Strip */}
        <section aria-label="Acoustic Telemetry">
          <TelemetryStrip
            engine={engine}
            onOpenCalibration={() => setIsProfilerOpen(true)}
          />
        </section>

        {/* Signal Source & Noise Environments */}
        <section id="presets">
          <AcousticPresets
            engine={engine}
            onSourceChange={notifyChange}
          />
        </section>

        {/* DSP Control Parameters Panel */}
        <section id="dsp-controls">
          <DSPControlPanel
            engine={engine}
            onSettingsChange={notifyChange}
          />
        </section>

        {/* Signal Visualizers Section */}
        <section id="visualizers" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <Activity size={17} className="text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Acoustic Signal Visualizers
              </h2>
            </div>

            {/* Visualizer Mode Tabs */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setVisualizerTab('all')}
                className={`px-3 py-1 rounded transition-colors ${
                  visualizerTab === 'all'
                    ? 'bg-slate-800 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Multi-View Matrix
              </button>
              <button
                onClick={() => setVisualizerTab('oscilloscope')}
                className={`px-3 py-1 rounded transition-colors ${
                  visualizerTab === 'oscilloscope'
                    ? 'bg-slate-800 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Oscilloscope
              </button>
              <button
                onClick={() => setVisualizerTab('spectrum')}
                className={`px-3 py-1 rounded transition-colors ${
                  visualizerTab === 'spectrum'
                    ? 'bg-slate-800 text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                FFT Spectrum
              </button>
              <button
                onClick={() => setVisualizerTab('waterfall')}
                className={`px-3 py-1 rounded transition-colors ${
                  visualizerTab === 'waterfall'
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Spectrogram Waterfall
              </button>
              <button
                onClick={() => setVisualizerTab('vectorscope')}
                className={`px-3 py-1 rounded transition-colors ${
                  visualizerTab === 'vectorscope'
                    ? 'bg-slate-800 text-purple-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Phase Vectorscope
              </button>
            </div>
          </div>

          {/* Render Active Visualizers */}
          {visualizerTab === 'all' && (
            <div className="flex flex-col gap-4">
              {/* Top row: Oscilloscope & FFT Spectrum */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Oscilloscope engine={engine} />
                <SpectrumAnalyzer engine={engine} />
              </div>

              {/* Bottom row: Spectrogram Waterfall & Phase Vectorscope */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <SpectrogramWaterfall engine={engine} />
                </div>
                <div className="lg:col-span-1">
                  <PhaseVectorscope engine={engine} />
                </div>
              </div>
            </div>
          )}

          {visualizerTab === 'oscilloscope' && (
            <div className="w-full">
              <Oscilloscope engine={engine} />
            </div>
          )}

          {visualizerTab === 'spectrum' && (
            <div className="w-full">
              <SpectrumAnalyzer engine={engine} />
            </div>
          )}

          {visualizerTab === 'waterfall' && (
            <div className="w-full">
              <SpectrogramWaterfall engine={engine} />
            </div>
          )}

          {visualizerTab === 'vectorscope' && (
            <div className="max-w-md mx-auto w-full">
              <PhaseVectorscope engine={engine} />
            </div>
          )}
        </section>

        {/* Windows & Android Quick Install Callout Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
              <Download size={18} className="text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <span>Looking for the Windows Desktop & Android Mobile App?</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                  Windows + Android
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Download the standalone signed Android APK directly, or run the Windows desktop application installer.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="/AeroSilence-ANC.apk"
              download="AeroSilence-ANC.apk"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <Smartphone size={14} />
              <span>Download Android APK</span>
            </a>
            <button
              onClick={() => setIsInstallOpen(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Laptop size={14} className="text-cyan-400" />
              <span>Windows App & Instructions</span>
            </button>
          </div>
        </div>

      </main>

      {/* Clean Scientific Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono">
          <div>
            AeroSilence Active Noise Cancellation Software · Real-Time Web Audio DSP
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Phase Inversion</span>
            <span>·</span>
            <span>Adaptive LMS</span>
            <span>·</span>
            <span>Wiener Spectral Gating</span>
          </div>
        </div>
      </footer>

      {/* Noise Profiler Calibration Modal */}
      <NoiseProfilerModal
        isOpen={isProfilerOpen}
        onClose={() => setIsProfilerOpen(false)}
        engine={engine}
        onCalibrationComplete={notifyChange}
      />

      {/* Windows & Android Install Modal */}
      <InstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
      />

    </div>
  );
}
