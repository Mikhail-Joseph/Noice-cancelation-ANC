import React, { useState } from 'react';
import { ANCAudioEngine } from '../audio/ancEngine';
import { NoiseProfile } from '../types/audio';
import { Sparkles, X, CheckCircle2, Loader2, Gauge } from 'lucide-react';

interface NoiseProfilerModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: ANCAudioEngine;
  onCalibrationComplete: () => void;
}

export const NoiseProfilerModal: React.FC<NoiseProfilerModalProps> = ({
  isOpen,
  onClose,
  engine,
  onCalibrationComplete,
}) => {
  const [isSampling, setIsSampling] = useState(false);
  const [profile, setProfile] = useState<NoiseProfile | null>(engine.getNoiseProfile());

  if (!isOpen) return null;

  const handleStartCalibration = async () => {
    setIsSampling(true);
    try {
      const result = await engine.calibrateNoiseFloor(1500);
      setProfile(result);
      onCalibrationComplete();
    } catch (err) {
      console.error('Calibration error:', err);
    } finally {
      setIsSampling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Acoustic Noise Floor Profiler
              </h3>
              <p className="text-xs text-slate-400">
                Samples ambient background noise to optimize ANC spectral subtraction
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

        {/* Instructions */}
        <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
          <p className="font-semibold text-slate-200 mb-1">Calibration Procedure:</p>
          <p className="text-slate-400">
            Remain silent for <strong>1.5 seconds</strong>. The analyzer will take 30 FFT frequency snapshots of ambient room sound, calculate the stationary noise floor, and automatically calculate notch harmonics and spectral gating thresholds.
          </p>
        </div>

        {/* Current / Result Status */}
        {profile ? (
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                <CheckCircle2 size={15} />
                <span>Calibrated Noise Profile Active</span>
              </span>
              <span className="text-slate-500">{new Date(profile.timestamp).toLocaleTimeString()}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Mean Noise Floor:</span>
                <span className="text-amber-400 text-lg font-bold">{profile.noiseFloorAverageDb} dBFS</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Primary Resonances:</span>
                <span className="text-cyan-400 text-sm font-semibold truncate block">
                  {profile.dominantFreqs.length > 0
                    ? profile.dominantFreqs.map((d) => `${d.freq}Hz`).join(', ')
                    : 'Broadband'}
                </span>
              </div>
            </div>

            {/* Dominant Peak List */}
            {profile.dominantFreqs.length > 0 && (
              <div className="flex flex-col gap-1 text-[11px] font-mono text-slate-400">
                <span className="text-slate-500 uppercase text-[10px]">Detected Acoustic Peaks:</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.dominantFreqs.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300"
                    >
                      {p.freq} Hz ({p.magnitudeDb} dB)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-950 p-6 rounded-lg border border-slate-800 text-center flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Gauge size={28} className="text-slate-600 mb-1" />
            <span>No custom acoustic profile recorded yet.</span>
            <span className="text-slate-500 text-[11px]">Using standard generic noise floor baseline (-38 dBFS).</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-slate-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleStartCalibration}
            disabled={isSampling}
            className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isSampling ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Sampling Noise Floor (1.5s)...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>{profile ? 'Recalibrate Noise Floor' : 'Capture Noise Floor'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
