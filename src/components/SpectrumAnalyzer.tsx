import React, { useEffect, useRef, useState } from 'react';
import { ANCAudioEngine } from '../audio/ancEngine';

interface SpectrumAnalyzerProps {
  engine: ANCAudioEngine;
}

export const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverInfo, setHoverInfo] = useState<{
    freq: number;
    inDb: number;
    outDb: number;
    deltaDb: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    let animationId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Dark canvas
      ctx.fillStyle = '#070b12';
      ctx.fillRect(0, 0, width, height);

      const inAnalyser = engine.inputAnalyser;
      const outAnalyser = engine.outputAnalyser;
      if (!inAnalyser || !outAnalyser) {
        animationId = requestAnimationFrame(render);
        return;
      }

      const binCount = inAnalyser.frequencyBinCount;
      const inFreqData = new Float32Array(binCount);
      const outFreqData = new Float32Array(binCount);

      inAnalyser.getFloatFrequencyData(inFreqData);
      outAnalyser.getFloatFrequencyData(outFreqData);

      const minDb = -90;
      const maxDb = 0;
      const dbRange = maxDb - minDb;

      const minFreq = 20;
      const maxFreq = 20000;
      const logMin = Math.log10(minFreq);
      const logMax = Math.log10(maxFreq);
      const logRange = logMax - logMin;

      // Draw dB horizontal grid lines
      ctx.strokeStyle = '#151e2e';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#475569';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';

      for (let db = 0; db >= minDb; db -= 15) {
        const y = ((maxDb - db) / dbRange) * (height - 24);
        ctx.beginPath();
        ctx.moveTo(35, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.fillText(`${db}dB`, 30, y + 3);
      }

      // Draw Logarithmic Frequency vertical grid lines
      const freqMarkers = [30, 60, 120, 250, 500, 1000, 2000, 4000, 8000, 16000];
      ctx.textAlign = 'center';
      freqMarkers.forEach((f) => {
        const logF = Math.log10(f);
        const x = 35 + ((logF - logMin) / logRange) * (width - 45);
        ctx.strokeStyle = '#172236';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - 20);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        const label = f >= 1000 ? `${f / 1000}k` : `${f}`;
        ctx.fillText(label, x, height - 6);
      });

      // Frequency bands bracket at bottom
      const bands = [
        { name: 'SUB', start: 20, end: 60, color: '#38bdf8' },
        { name: 'BASS (ANC ZONE)', start: 60, end: 300, color: '#f59e0b' },
        { name: 'VOICE PASSBAND', start: 300, end: 3400, color: '#10b981' },
        { name: 'PRESENCE', start: 3400, end: 20000, color: '#a855f7' },
      ];

      bands.forEach((b) => {
        const x1 = Math.max(35, 35 + ((Math.log10(b.start) - logMin) / logRange) * (width - 45));
        const x2 = Math.min(width, 35 + ((Math.log10(b.end) - logMin) / logRange) * (width - 45));
        ctx.fillStyle = b.color + '22';
        ctx.fillRect(x1, height - 18, x2 - x1, 14);
        ctx.fillStyle = b.color;
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.name, (x1 + x2) / 2, height - 8);
      });

      // Helper to compute coordinates along the logarithmic spectrum
      const sampleRate = inAnalyser.context.sampleRate;
      const getCoord = (freqData: Float32Array, i: number) => {
        const freq = (i / binCount) * (sampleRate / 2);
        if (freq < minFreq) return null;
        const logF = Math.log10(freq);
        const x = 35 + ((logF - logMin) / logRange) * (width - 45);
        const db = Math.max(minDb, Math.min(maxDb, freqData[i]));
        const y = ((maxDb - db) / dbRange) * (height - 24);
        return { x, y, freq, db };
      };

      // Shaded Cancellation Zone: Area between Raw Input and Processed Output
      if (engine.settings.enabled) {
        ctx.beginPath();
        let first = true;
        for (let i = 0; i < binCount; i++) {
          const pt = getCoord(inFreqData, i);
          if (!pt) continue;
          if (first) {
            ctx.moveTo(pt.x, pt.y);
            first = false;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        for (let i = binCount - 1; i >= 0; i--) {
          const pt = getCoord(outFreqData, i);
          if (!pt) continue;
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        ctx.fill();
      }

      // Draw Curve 1: Raw Input Spectrum (Cyan / Slate)
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
      ctx.shadowBlur = 3;
      let started = false;
      for (let i = 0; i < binCount; i++) {
        const pt = getCoord(inFreqData, i);
        if (!pt) continue;
        if (!started) {
          ctx.moveTo(pt.x, pt.y);
          started = true;
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      }
      ctx.stroke();

      // Draw Curve 2: Processed Output Spectrum (Emerald)
      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
      ctx.shadowBlur = 4;
      started = false;
      for (let i = 0; i < binCount; i++) {
        const pt = getCoord(outFreqData, i);
        if (!pt) continue;
        if (!started) {
          ctx.moveTo(pt.x, pt.y);
          started = true;
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [engine]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !engine.inputAnalyser || !engine.outputAnalyser) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 35 || x > rect.width - 10 || y > rect.height - 24) {
      setHoverInfo(null);
      return;
    }

    const minFreq = 20;
    const maxFreq = 20000;
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);
    const logRange = logMax - logMin;

    const fraction = (x - 35) / (rect.width - 45);
    const logFreq = logMin + fraction * logRange;
    const freq = Math.round(Math.pow(10, logFreq));

    const binCount = engine.inputAnalyser.frequencyBinCount;
    const sampleRate = engine.inputAnalyser.context.sampleRate;
    const binIdx = Math.min(binCount - 1, Math.max(0, Math.round((freq / (sampleRate / 2)) * binCount)));

    const inData = new Float32Array(binCount);
    const outData = new Float32Array(binCount);
    engine.inputAnalyser.getFloatFrequencyData(inData);
    engine.outputAnalyser.getFloatFrequencyData(outData);

    const inDb = Math.round(inData[binIdx] * 10) / 10;
    const outDb = Math.round(outData[binIdx] * 10) / 10;
    const deltaDb = Math.round((outDb - inDb) * 10) / 10;

    setHoverInfo({
      freq,
      inDb,
      outDb,
      deltaDb,
      x,
      y,
    });
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

  return (
    <div className="bg-slate-900/90 rounded-lg border border-slate-800 p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-slate-200">
            FFT Spectral Frequency Response (20 Hz – 20 kHz)
          </span>
          <span className="text-xs text-slate-500 font-mono">[LOGARITHMIC]</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-cyan-400"></span>
            <span className="text-slate-400">Raw Input Spectrum</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-400"></span>
            <span className="text-slate-400">ANC Processed Residual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2 bg-amber-400/20 border border-amber-400/40 rounded-xs"></span>
            <span className="text-amber-300">Attenuation Delta (dB)</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-60 bg-slate-950 rounded border border-slate-800/80 overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={800}
          height={260}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block"
        />

        {/* Hover Crosshair Tooltip */}
        {hoverInfo && (
          <div
            className="absolute pointer-events-none bg-slate-900/95 border border-slate-700 p-2 rounded shadow-lg text-[11px] font-mono flex flex-col gap-0.5 z-10"
            style={{
              left: Math.min(hoverInfo.x + 12, 600),
              top: Math.max(10, hoverInfo.y - 45),
            }}
          >
            <span className="text-slate-200 font-bold">{hoverInfo.freq} Hz</span>
            <span className="text-cyan-400">Input: {hoverInfo.inDb} dBFS</span>
            <span className="text-emerald-400">Output: {hoverInfo.outDb} dBFS</span>
            <span className={hoverInfo.deltaDb <= 0 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
              Delta: {hoverInfo.deltaDb > 0 ? `+${hoverInfo.deltaDb}` : hoverInfo.deltaDb} dB
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
