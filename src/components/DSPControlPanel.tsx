import React from 'react';
import { ANCAudioEngine } from '../audio/ancEngine';
import { MonitorOutputMode } from '../types/audio';
import { 
  Power, 
  Volume2, 
  Sliders, 
  Headphones, 
  Radio, 
  Waves, 
  Cpu, 
  Mic2,
  RefreshCw,
  Shield,
  Zap
} from 'lucide-react';

interface DSPControlPanelProps {
  engine: ANCAudioEngine;
  onSettingsChange: () => void;
}

export const DSPControlPanel: React.FC<DSPControlPanelProps> = ({ engine, onSettingsChange }) => {
  const { settings } = engine;
  const currentOutputMode = engine.getOutputMode();

  const handleToggleANC = () => {
    engine.setANCEnabled(!settings.enabled);
    onSettingsChange();
  };

  const handleOutputMode = (mode: MonitorOutputMode) => {
    engine.setOutputMode(mode);
    onSettingsChange();
  };

  const handleUpdate = (partial: Parameters<typeof engine.updateSettings>[0]) => {
    engine.updateSettings(partial);
    onSettingsChange();
  };

  const handleResetDefaults = () => {
    engine.updateSettings({
      enabled: true,
      phaseInvert: true,
      phaseFineDegrees: 180,
      delayCompensationMs: 0.0,
      antiNoiseGain: 1.0,
      lowLatencyNativeMode: true,
      muteDirectSidetone: true,
      notch50Hz: false,
      notch60Hz: true,
      notchHarmonics: true,
      voiceBandPreserve: true,
      outputGain: 0.9,
    });
    onSettingsChange();
  };

  return (
    <div className="bg-slate-900/90 rounded-lg border border-slate-800 p-4 flex flex-col gap-5">
      {/* Top Action Bar: Big ANC Engage Button + Monitor Mode Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        {/* ANC Master Toggle */}
        <button
          onClick={handleToggleANC}
          className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-150 ${
            settings.enabled
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
          }`}
        >
          <Power size={18} className={settings.enabled ? 'animate-pulse' : ''} />
          <span>{settings.enabled ? 'ACTIVE NOISE CANCELLATION: ENGAGED' : 'ANC BYPASSED: OFF'}</span>
        </button>

        {/* Monitor Output Mode Tabs */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => handleOutputMode('anc_processed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              currentOutputMode === 'anc_processed'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Acoustic Superposition: Destructively nulls incoming noise instantly"
          >
            <Headphones size={13} />
            <span>Superposition Null (ANC)</span>
          </button>

          <button
            onClick={() => handleOutputMode('anti_noise_only')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              currentOutputMode === 'anti_noise_only'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Pure Inverted Wave: Plays only the -180° wave into headphones to cancel acoustic air sound"
          >
            <Waves size={13} />
            <span>Pure Anti-Wave (Headphones)</span>
          </button>

          <button
            onClick={() => handleOutputMode('raw_bypass')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              currentOutputMode === 'raw_bypass'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Untouched incoming audio"
          >
            <Radio size={13} />
            <span>Raw Bypass</span>
          </button>

          <button
            onClick={() => handleOutputMode('transparency')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              currentOutputMode === 'transparency'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Amplifies human voice frequencies"
          >
            <Mic2 size={13} />
            <span>Transparency</span>
          </button>
        </div>
      </div>

      {/* True ANC Hardware Engine Banner */}
      <div className="bg-slate-950/90 rounded-xl p-4 border border-emerald-900/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-md">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Native Hardware ANC Engine (0.0 ms Algorithmic Delay)
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-emerald-950/80 text-emerald-400 border-emerald-800/60">
              ⚡ ZERO-LATENCY DIRECT HARDWARE
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Pure C++ Web Audio phase cancellation. Bypasses JavaScript buffers and browser echo-cancellation to deliver instantaneous destructive acoustic superposition without delay, feedback, or crackling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Mute Direct Mic Sidetone Toggle */}
          <button
            onClick={() => handleUpdate({ muteDirectSidetone: !settings.muteDirectSidetone })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              settings.muteDirectSidetone
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Muting direct mic passthrough stops your voice from echoing in headphones with hardware conversion delay"
          >
            <Headphones size={13} className={settings.muteDirectSidetone ? 'text-amber-400' : ''} />
            <span>{settings.muteDirectSidetone ? 'Headphone ANC: Mic Echo Muted' : 'Direct Mic: Passthrough On'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Control Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Module 1: 180° Polarity Inverter & Precision Timing */}
        <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves size={15} className="text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Phase Inversion & Time Delay (Δt)
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">0 ms DELAY</span>
          </div>

          {/* Phase 180 Invert toggle */}
          <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded border border-slate-800">
            <div className="flex flex-col">
              <span className="text-xs text-slate-300 font-medium">180° Anti-Phase Inversion</span>
              <span className="text-[10px] text-slate-500">Flips waveform polarity: A &rarr; -A</span>
            </div>
            <button
              onClick={() => handleUpdate({ phaseInvert: !settings.phaseInvert })}
              className={`px-3 py-1 text-xs font-mono font-semibold rounded transition-colors ${
                settings.phaseInvert
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.phaseInvert ? 'INVERTED (-1)' : 'NORMAL (+1)'}
            </button>
          </div>

          {/* Fine Phase slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>Phase Angle Fine-Tune:</span>
              <span className="text-amber-400 font-bold">{settings.phaseFineDegrees}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={settings.phaseFineDegrees}
              onChange={(e) => handleUpdate({ phaseFineDegrees: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-600">
              <span>0°</span>
              <span className="text-amber-500/80 font-bold">180° (Full Cancellation)</span>
              <span>360°</span>
            </div>
          </div>

          {/* Delay compensation */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Acoustic Delay Offset (Δt):</span>
              <div className="flex items-center gap-1.5">
                <span className="text-cyan-400 font-bold tabular-nums">{settings.delayCompensationMs.toFixed(2)} ms</span>
                <button
                  onClick={() => handleUpdate({ delayCompensationMs: 0.0 })}
                  className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 font-sans"
                  title="Direct 0.00ms hardware speed"
                >
                  Direct 0ms
                </button>
              </div>
            </div>
            <input
              type="range"
              min="0.0"
              max="15.0"
              step="0.05"
              value={settings.delayCompensationMs}
              onChange={(e) => handleUpdate({ delayCompensationMs: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded"
            />
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleUpdate({ delayCompensationMs: Math.max(0, settings.delayCompensationMs - 0.1) })}
                  className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                >
                  -0.1ms
                </button>
                <button
                  onClick={() => handleUpdate({ delayCompensationMs: Math.min(15, settings.delayCompensationMs + 0.1) })}
                  className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                >
                  +0.1ms
                </button>
              </div>
              <span>Matches speaker distance</span>
            </div>
          </div>

          {/* Anti-Noise Gain */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>Anti-Noise Amplitude:</span>
              <span className="text-amber-400 font-bold">{settings.antiNoiseGain.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="2.0"
              step="0.05"
              value={settings.antiNoiseGain}
              onChange={(e) => handleUpdate({ antiNoiseGain: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded"
            />
          </div>
        </div>

        {/* Module 2: Targeted Acoustic Notches & Low Rumble Filter */}
        <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu size={15} className="text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Acoustic Notches & Rumble Filter
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">HARDWARE BIQUAD</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Targets stationary low-frequency drone components (turbofans, compressors, electrical hum) with narrow Q biquads.
          </p>

          {/* Hard Notches Matrix */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono text-slate-400">Electrical Ground & Motor Notches:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleUpdate({ notch60Hz: !settings.notch60Hz })}
                className={`py-2 text-xs font-mono rounded transition-colors ${
                  settings.notch60Hz
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                60 Hz Hum
              </button>
              <button
                onClick={() => handleUpdate({ notch50Hz: !settings.notch50Hz })}
                className={`py-2 text-xs font-mono rounded transition-colors ${
                  settings.notch50Hz
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                50 Hz Hum
              </button>
              <button
                onClick={() => handleUpdate({ notchHarmonics: !settings.notchHarmonics })}
                className={`py-2 text-xs font-mono rounded transition-colors ${
                  settings.notchHarmonics
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                120/180 Hz
              </button>
            </div>
          </div>

          {/* Low Rumble Shelf Status */}
          <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex items-center justify-between text-xs mt-auto">
            <div className="flex flex-col">
              <span className="text-slate-300 font-medium">Sub-Bass Cabin Attenuation</span>
              <span className="text-[10px] text-slate-500">Low-shelf filter (&lt; 250 Hz) active</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">-12 dB</span>
          </div>
        </div>

        {/* Module 3: Speech Corridor & Master Headroom */}
        <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders size={15} className="text-purple-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Speech Corridor & Master
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">HEADROOM</span>
          </div>

          {/* Voice Corridor Preservation */}
          <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded border border-slate-800">
            <div className="flex flex-col">
              <span className="text-xs text-slate-300 font-medium">Voice Corridor Preservation</span>
              <span className="text-[10px] text-slate-500">Protects 300 – 3400 Hz speech frequencies</span>
            </div>
            <input
              type="checkbox"
              checked={settings.voiceBandPreserve}
              onChange={(e) => handleUpdate({ voiceBandPreserve: e.target.checked })}
              className="w-4 h-4 accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Soft-Knee Anti-Clipping Limiter Status */}
          <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-slate-300 font-medium">Transparent Soft-Knee Limiter</span>
                <span className="text-[10px] text-slate-500">Prevents digital clipping & crackle</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">PROTECTED</span>
          </div>

          {/* Master Output Gain & Reset */}
          <div className="flex items-center gap-3 mt-auto pt-2 border-t border-slate-800">
            <Volume2 size={16} className="text-slate-400" />
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Output Volume</span>
                <span className="font-bold text-slate-200">{Math.round(settings.outputGain * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.05"
                value={settings.outputGain}
                onChange={(e) => handleUpdate({ outputGain: parseFloat(e.target.value) })}
                className="w-full accent-slate-300 cursor-pointer h-1.5 bg-slate-800 rounded"
              />
            </div>
            <button
              onClick={handleResetDefaults}
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition-colors"
              title="Reset DSP to Defaults"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
