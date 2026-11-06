import React, { useEffect, useRef, useState } from 'react';
import { ANCAudioEngine } from '../audio/ancEngine';

interface SpectrogramWaterfallProps {
  engine: ANCAudioEngine;
}

export const SpectrogramWaterfall: React.FC<SpectrogramWaterfallProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inspectChannel, setInspectChannel] = useState<'output' | 'input'>('output');
  const [speed, setSpeed] = useState<number>(2); // pixel scroll per frame

  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper: Viridis / Jet-style color ramp from dB value (-90dB to -10dB)
    const getColor = (db: number) => {
      // Normalize -80dB to -10dB into 0.0 to 1.0
      const norm = Math.max(0, Math.min(1, (db + 80) / 70));

      if (norm < 0.2) {
        // Deep Obsidian to Dark Navy
        const r = Math.floor(norm * 5 * 20);
        const g = Math.floor(norm * 5 * 30);
        const b = Math.floor(norm * 5 * 80);
        return `rgb(${r},${g},${b})`;
      } else if (norm < 0.5) {
        // Navy to Cyan
        const t = (norm - 0.2) / 0.3;
        const r = Math.floor(20 * (1 - t) + 6 * t);
        const g = Math.floor(30 * (1 - t) + 182 * t);
        const b = Math.floor(80 * (1 - t) + 212 * t);
        return `rgb(${r},${g},${b})`;
      } else if (norm < 0.8) {
        // Cyan to Amber/Yellow
        const t = (norm - 0.5) / 0.3;
        const r = Math.floor(6 * (1 - t) + 245 * t);
        const g = Math.floor(182 * (1 - t) + 158 * t);
        const b = Math.floor(212 * (1 - t) + 11 * t);
        return `rgb(${r},${g},${b})`;
      } else {
        // Yellow to Bright Red/White
        const t = (norm - 0.8) / 0.2;
        const r = Math.floor(245 * (1 - t) + 255 * t);
        const g = Math.floor(158 * (1 - t) + 60 * t);
        const b = Math.floor(11 * (1 - t) + 60 * t);
        return `rgb(${r},${g},${b})`;
      }
    };

    const render = () => {
      const analyser = inspectChannel === 'output' ? engine.outputAnalyser : engine.inputAnalyser;
      if (!analyser) {
        animationId = requestAnimationFrame(render);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      // Shift existing canvas to the left by `speed` pixels
      ctx.drawImage(canvas, speed, 0, width - speed, height, 0, 0, width - speed, height);

      // Get latest FFT frequencies
      const binCount = analyser.frequencyBinCount;
      const freqData = new Float32Array(binCount);
      analyser.getFloatFrequencyData(freqData);

      // Focus on 0 to 4500 Hz where noise and voice exist
      const sampleRate = analyser.context.sampleRate;
      const maxFreq = 4500;
      const maxBin = Math.floor((maxFreq / (sampleRate / 2)) * binCount);

      // Draw vertical stripe on right edge
      const colX = width - speed;
      for (let y = 0; y < height; y++) {
        // Top = High freq, Bottom = Low freq (0 Hz)
        const fraction = 1 - (y / height);
        const bin = Math.min(binCount - 1, Math.floor(fraction * maxBin));
        const db = freqData[bin];
        ctx.fillStyle = getColor(db);
        ctx.fillRect(colX, y, speed, 1);
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [engine, inspectChannel, speed]);

  return (
    <div className="bg-slate-900/90 rounded-lg border border-slate-800 p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-slate-200">
            Spectrogram Waterfall (Time-Frequency Evolution)
          </span>
          <span className="text-xs text-slate-500 font-mono">[0 – 4.5 kHz]</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Channel selector */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded border border-slate-700">
            <button
              onClick={() => setInspectChannel('output')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                inspectChannel === 'output'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Output (After ANC)
            </button>
            <button
              onClick={() => setInspectChannel('input')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                inspectChannel === 'input'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Input (Before ANC)
            </button>
          </div>

          {/* Speed control */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded border border-slate-700 text-slate-400">
            <span>Scroll:</span>
            <button
              onClick={() => setSpeed(1)}
              className={`px-1 rounded ${speed === 1 ? 'text-amber-400 font-bold' : ''}`}
            >
              1x
            </button>
            <button
              onClick={() => setSpeed(2)}
              className={`px-1 rounded ${speed === 2 ? 'text-amber-400 font-bold' : ''}`}
            >
              2x
            </button>
            <button
              onClick={() => setSpeed(4)}
              className={`px-1 rounded ${speed === 4 ? 'text-amber-400 font-bold' : ''}`}
            >
              4x
            </button>
          </div>
        </div>
      </div>

      <div className="relative w-full h-48 bg-slate-950 rounded border border-slate-800/80 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          className="w-full h-full block"
        />

        {/* Frequency scale overlay */}
        <div className="absolute top-1 left-2 pointer-events-none flex flex-col justify-between h-[90%] text-[10px] font-mono text-slate-400 bg-slate-950/60 px-1 py-0.5 rounded">
          <span>4.5 kHz</span>
          <span>3.0 kHz</span>
          <span>1.5 kHz</span>
          <span>500 Hz</span>
          <span>0 Hz</span>
        </div>

        {/* Legend color bar */}
        <div className="absolute bottom-2 right-2 pointer-events-none flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded border border-slate-800 text-[10px] font-mono text-slate-300">
          <span>-80dB</span>
          <div className="w-16 h-2 rounded-xs bg-gradient-to-r from-blue-950 via-cyan-400 to-amber-400"></div>
          <span>-10dB</span>
        </div>
      </div>
    </div>
  );
};
