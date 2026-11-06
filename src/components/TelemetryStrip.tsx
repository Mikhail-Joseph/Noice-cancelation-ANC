import React, { useEffect, useState } from 'react';
import { ANCAudioEngine } from '../audio/ancEngine';
import { ANCTelemetry } from '../types/audio';
import { Activity, ShieldCheck, Zap, Gauge, Sparkles } from 'lucide-react';

interface TelemetryStripProps {
  engine: ANCAudioEngine;
  onOpenCalibration: () => void;
}

export const TelemetryStrip: React.FC<TelemetryStripProps> = ({ engine, onOpenCalibration }) => {
  const [telemetry, setTelemetry] = useState<ANCTelemetry>(engine.computeTelemetry());

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry(engine.computeTelemetry());
    }, 100);
    return () => clearInterval(timer);
  }, [engine]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Attenuation dB */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="uppercase tracking-wider font-mono text-[11px]">Noise Attenuation</span>
          <Activity size={14} className={engine.settings.enabled ? 'text-amber-400' : 'text-slate-600'} />
        </div>
        <div className="mt-2 flex items-baseline">
          <span className={`text-2xl font-mono font-bold tabular-nums ${
            engine.settings.enabled && telemetry.attenuationDb < -3 ? 'text-amber-400' : 'text-slate-400'
          }`}>
            {engine.settings.enabled ? `${telemetry.attenuationDb}` : '0.0'}
          </span>
          <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">dB</span>
        </div>
        <div className="mt-1 text-[10px] font-mono text-slate-500 truncate">
          {engine.settings.enabled && telemetry.attenuationDb < -15
            ? 'Deep Cancellation'
            : engine.settings.enabled
            ? 'Moderate Attenuation'
            : 'ANC Engine Inactive'}
        </div>
      </div>

      {/* 2. Estimated SNR Boost */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="uppercase tracking-wider font-mono text-[11px]">SNR Improvement</span>
          <Zap size={14} className={engine.settings.enabled ? 'text-emerald-400' : 'text-slate-600'} />
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
            +{engine.settings.enabled ? telemetry.estimatedSnrGainDb : '0.0'}
          </span>
          <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">dB</span>
        </div>
        <div className="mt-1 text-[10px] font-mono text-slate-500 truncate">
          Voice / Signal Clarity Boost
        </div>
      </div>

      {/* 3. Peak Cancellation Frequency */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="uppercase tracking-wider font-mono text-[11px]">Peak Null Freq</span>
          <Gauge size={14} className="text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-2xl font-mono font-bold text-cyan-400 tabular-nums">
            {engine.settings.enabled ? telemetry.peakAttenuatedFreq : '---'}
          </span>
          <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">Hz</span>
        </div>
        <div className="mt-1 text-[10px] font-mono text-slate-500 truncate">
          Target Resonance Zone
        </div>
      </div>

      {/* 4. Input vs Output Level (dBFS) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="uppercase tracking-wider font-mono text-[11px]">Signal Levels</span>
          <span className="text-[10px] font-mono text-slate-500">IN / OUT</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1 text-sm font-mono">
          <span className="text-cyan-400 font-bold tabular-nums">{telemetry.inputRmsDb}</span>
          <span className="text-slate-600">/</span>
          <span className="text-emerald-400 font-bold tabular-nums">{telemetry.outputRmsDb}</span>
          <span className="text-[10px] uppercase font-mono text-slate-400 ml-0.5">dBFS</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-cyan-500 h-full transition-all duration-75"
              style={{ width: `${Math.max(0, Math.min(100, (telemetry.inputRmsDb + 70) * 1.5))}%` }}
            />
          </div>
          <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-75"
              style={{ width: `${Math.max(0, Math.min(100, (telemetry.outputRmsDb + 70) * 1.5))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5. Latency */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="uppercase tracking-wider font-mono text-[11px]">Algorithmic Latency</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 font-bold">
            ⚡ 0.0 ms
          </span>
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-2xl font-mono font-bold tabular-nums text-emerald-400">
            {telemetry.estimatedLatencyMs.toFixed(1)}
          </span>
          <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">ms</span>
        </div>
        <div className="mt-1 text-[10px] font-mono text-slate-400 truncate">
          Instant Destructive Null
        </div>
      </div>

      {/* 6. Calibration Status */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="uppercase tracking-wider font-mono text-[11px]">Noise Calibration</span>
          <ShieldCheck size={14} className={telemetry.isCalibrated ? 'text-emerald-400' : 'text-slate-600'} />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-sm font-mono font-semibold ${
            telemetry.isCalibrated ? 'text-emerald-400' : 'text-slate-400'
          }`}>
            {telemetry.isCalibrated ? 'Calibrated' : 'Default Floor'}
          </span>
          <button
            onClick={onOpenCalibration}
            className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center gap-1 transition-colors"
          >
            <Sparkles size={11} className="text-amber-400" />
            <span>Profile</span>
          </button>
        </div>
        <div className="mt-1 text-[10px] font-mono text-slate-500 truncate">
          {telemetry.isCalibrated
            ? `${telemetry.noiseProfileSamples} FFT snapshots active`
            : 'Click Profile to sample room'}
        </div>
      </div>
    </div>
  );
};
