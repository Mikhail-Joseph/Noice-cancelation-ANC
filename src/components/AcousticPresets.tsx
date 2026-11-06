import React, { useRef, useState } from 'react';
import { ANCAudioEngine } from '../audio/ancEngine';
import { AudioSourceType, SyntheticNoiseType } from '../types/audio';
import { 
  Plane, 
  Wind, 
  Zap, 
  Car, 
  Mic, 
  Upload, 
  MessageSquare,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface AcousticPresetsProps {
  engine: ANCAudioEngine;
  onSourceChange: () => void;
}

export const AcousticPresets: React.FC<AcousticPresetsProps> = ({ engine, onSourceChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets: {
    id: SyntheticNoiseType;
    label: string;
    description: string;
    icon: React.ReactNode;
    dspConfig: Parameters<typeof engine.updateSettings>[0];
  }[] = [
    {
      id: 'speech_and_drone',
      label: 'Speech & Cabin Drone',
      description: 'Voice utterances buried in airplane rumble; demonstrates speech preservation',
      icon: <MessageSquare size={16} className="text-emerald-400" />,
      dspConfig: {
        phaseFineDegrees: 180,
        antiNoiseGain: 1.0,
        adaptiveFilterEnabled: true,
        adaptiveLmsStepSize: 0.02,
        spectralSubtractionEnabled: true,
        subtractionIntensity: 1.6,
        voiceBandPreserve: true,
      },
    },
    {
      id: 'airplane',
      label: 'Commercial Jet Cabin',
      description: 'Low-frequency 92Hz turbofan rumble + cabin resonance',
      icon: <Plane size={16} className="text-cyan-400" />,
      dspConfig: {
        phaseFineDegrees: 180,
        antiNoiseGain: 1.0,
        delayCompensationMs: 0.0,
      },
    },
    {
      id: 'hvac',
      label: 'HVAC & Server Room',
      description: '120Hz electrical motor drone + ventilation airflow turbulence',
      icon: <Wind size={16} className="text-purple-400" />,
      dspConfig: {
        phaseFineDegrees: 180,
        notch60Hz: true,
        notchHarmonics: true,
        antiNoiseGain: 1.0,
      },
    },
    {
      id: 'mains_hum',
      label: '60Hz Ground Loop',
      description: 'Pure 60Hz hum + 120Hz/180Hz/240Hz harmonics',
      icon: <Zap size={16} className="text-amber-400" />,
      dspConfig: {
        phaseFineDegrees: 180,
        notch60Hz: true,
        notchHarmonics: true,
        antiNoiseGain: 1.0,
      },
    },
    {
      id: 'traffic',
      label: 'Urban Traffic & Subway',
      description: 'Sub-bass road friction and low rumble resonance',
      icon: <Car size={16} className="text-rose-400" />,
      dspConfig: {
        phaseFineDegrees: 180,
        antiNoiseGain: 1.0,
      },
    },
    {
      id: 'sine_and_noise',
      label: '1 kHz Tone + Masking Drone',
      description: 'Benchmark isolating a single frequency tone from heavy broadband noise',
      icon: <Activity size={16} className="text-blue-400" />,
      dspConfig: {
        phaseFineDegrees: 180,
        antiNoiseGain: 1.0,
        adaptiveFilterEnabled: true,
        spectralSubtractionEnabled: true,
      },
    },
  ];

  const [micError, setMicError] = useState<string | null>(null);

  const handleSelectPreset = async (type: SyntheticNoiseType, dspConfig: Parameters<typeof engine.updateSettings>[0]) => {
    setMicError(null);
    await engine.setSource('synthetic', type);
    engine.updateSettings(dspConfig);
    onSourceChange();
  };

  const handleSelectMic = async () => {
    setMicError(null);
    try {
      await engine.setSource('mic');
      engine.updateSettings({
        lowLatencyNativeMode: true,
        muteDirectSidetone: true,
        delayCompensationMs: 0.0,
      });
      onSourceChange();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMicError(msg || 'Could not access microphone.');
      onSourceChange();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setMicError(null);
    const file = e.target.files?.[0];
    if (file) {
      await engine.loadAudioFile(file);
      onSourceChange();
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-lg border border-slate-800 p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-slate-200">
            Acoustic Signal Source & Test Environments
          </span>
          <span className="text-xs text-slate-500 font-mono">[REAL-TIME DSP BENCHMARK]</span>
        </div>

        {/* Source Mode Selector */}
        <div className="flex items-center gap-2">
          {/* Live Mic Button */}
          <button
            onClick={handleSelectMic}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              engine.currentSourceType === 'mic'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Mic size={14} className={engine.currentSourceType === 'mic' ? 'animate-pulse' : ''} />
            <span>Live Microphone</span>
          </button>

          {/* Upload Audio File */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              engine.currentSourceType === 'file'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Upload size={14} />
            <span>Upload File</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*"
            className="hidden"
          />
        </div>
      </div>

      {/* Microphone Error Alert Banner */}
      {micError && (
        <div className="bg-rose-950/80 border border-rose-800 p-3.5 rounded-lg flex flex-col gap-2.5 text-xs text-rose-200 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
            <div className="flex items-center gap-2 text-rose-300">
              <AlertTriangle size={16} className="shrink-0 text-rose-400" />
              <span>Microphone Access Notice:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  handleSelectPreset('speech_and_drone', {
                    phaseFineDegrees: 180,
                    antiNoiseGain: 1.0,
                    adaptiveFilterEnabled: true,
                    spectralSubtractionEnabled: true,
                    voiceBandPreserve: true,
                  });
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-amber-300 font-semibold border border-amber-600/40 transition-colors"
              >
                Use Speech & Cabin Simulation
              </button>
              <button
                onClick={handleSelectMic}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 rounded text-xs text-white font-bold transition-colors shadow-sm"
              >
                Grant / Retry Mic
              </button>
            </div>
          </div>
          <p className="text-[11px] text-rose-200/90 font-mono bg-rose-900/40 p-2 rounded border border-rose-800/50 leading-relaxed">
            {micError}
          </p>
          <div className="text-[11px] text-slate-300 space-y-1 bg-slate-950/60 p-2.5 rounded border border-slate-800">
            <div className="font-semibold text-slate-200">How to allow microphone access:</div>
            <div>
              &bull; <strong>On Android (APK / Phone):</strong> Go to <em>Settings &rarr; Apps &rarr; AeroSilence ANC &rarr; Permissions &rarr; Microphone &rarr; Allow</em>, then reopen the app.
            </div>
            <div>
              &bull; <strong>In Chrome / Edge Browser:</strong> Tap the <em>lock or tune icon</em> on the left side of the address bar, then switch <strong>Microphone</strong> to <strong>Allow</strong>.
            </div>
            <div>
              &bull; <strong>Testing ANC without mic:</strong> Click any of the 6 synthetic test environments below (e.g. <em>Speech & Cabin Drone</em> or <em>Commercial Jet Cabin</em>) to immediately test ANC cancellation in real time.
            </div>
          </div>
        </div>
      )}

      {/* Headphone warning reminder when using Live Mic */}
      {engine.currentSourceType === 'mic' && (
        <div className="bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-lg flex items-center justify-between gap-2 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>
              <strong>Live Microphone Active:</strong> Real-time 48 kHz acoustic feed is running.
            </span>
          </div>
          <span className="text-[11px] text-amber-300 font-medium">
            (Wear headphones to avoid acoustic speaker feedback)
          </span>
        </div>
      )}

      {/* Synthetic Noise Environment Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {presets.map((preset) => {
          const isSelected =
            engine.currentSourceType === 'synthetic' &&
            engine.currentSyntheticType === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset.id, preset.dspConfig)}
              className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                isSelected
                  ? 'bg-slate-800/90 border-amber-500/80 shadow-md ring-1 ring-amber-500/40'
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                {preset.icon}
                {isSelected && (
                  <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded">
                    ACTIVE
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">{preset.label}</div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                  {preset.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
