import React, { useEffect, useRef, useState } from 'react';
import { ANCAudioEngine } from '../audio/ancEngine';
import { Eye, EyeOff, ZoomIn, ZoomOut, Pause, Play } from 'lucide-react';

interface OscilloscopeProps {
  engine: ANCAudioEngine;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showInput, setShowInput] = useState(true);
  const [showAntiNoise, setShowAntiNoise] = useState(true);
  const [showOutput, setShowOutput] = useState(true);
  const [zoom, setZoom] = useState<number>(2); // 1x, 2x, 4x
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let animationId: number;

    const render = () => {
      if (isPaused) {
        animationId = requestAnimationFrame(render);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const halfHeight = height / 2;

      // Dark laboratory backdrop with subtle grid
      ctx.fillStyle = '#070b12';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = '#151e2e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += 40) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += 30) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Zero reference line
      ctx.strokeStyle = '#223049';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, halfHeight);
      ctx.lineTo(width, halfHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      const fftSize = engine.inputAnalyser ? engine.inputAnalyser.fftSize : 2048;
      const inputBuffer = new Float32Array(fftSize);
      const antiBuffer = new Float32Array(fftSize);
      const outputBuffer = new Float32Array(fftSize);

      if (engine.inputAnalyser) engine.inputAnalyser.getFloatTimeDomainData(inputBuffer);
      if (engine.antiNoiseAnalyser) engine.antiNoiseAnalyser.getFloatTimeDomainData(antiBuffer);
      if (engine.outputAnalyser) engine.outputAnalyser.getFloatTimeDomainData(outputBuffer);

      // Trigger alignment: find positive zero-crossing to stabilize wave rendering
      let triggerIndex = 0;
      for (let i = 0; i < inputBuffer.length - 1; i++) {
        if (inputBuffer[i] < 0 && inputBuffer[i + 1] >= 0) {
          triggerIndex = i;
          break;
        }
      }

      const samplesToDraw = Math.floor(inputBuffer.length / zoom);

      // Helper to draw a single channel wave trace
      const drawTrace = (
        data: Float32Array,
        color: string,
        glowColor: string,
        lineWidth: number = 2
      ) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 4;
        ctx.beginPath();

        const step = (width / samplesToDraw);
        for (let i = 0; i < samplesToDraw; i++) {
          const sampleIdx = (triggerIndex + i) % data.length;
          const val = data[sampleIdx];
          const y = halfHeight - val * (halfHeight * 0.85);
          const x = i * step;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      // Trace 1: Raw Input Signal (Cyan)
      if (showInput) {
        drawTrace(inputBuffer, '#06b6d4', 'rgba(6, 182, 212, 0.4)', 2);
      }

      // Trace 2: Synthesized Anti-Noise Signal (Inverted, Amber)
      if (showAntiNoise && engine.settings.enabled) {
        drawTrace(antiBuffer, '#f59e0b', 'rgba(245, 158, 11, 0.4)', 2);
      }

      // Trace 3: Resulting Superposition Residual (Clean, Emerald)
      if (showOutput) {
        drawTrace(outputBuffer, '#10b981', 'rgba(16, 185, 129, 0.6)', 2.5);
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [engine, showInput, showAntiNoise, showOutput, zoom, isPaused]);

  return (
    <div className="bg-slate-900/90 rounded-lg border border-slate-800 p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-slate-200">
            Oscilloscope Time-Domain Superposition
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {isPaused ? '[PAUSED]' : '[LIVE 48 kHz]'}
          </span>
        </div>

        {/* Trace toggles & zoom controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Cyan Trace: Input */}
          <button
            onClick={() => setShowInput(!showInput)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              showInput
                ? 'bg-cyan-950/70 border border-cyan-800/80 text-cyan-300'
                : 'bg-slate-800 text-slate-500 border border-transparent'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Raw Input x(t)</span>
            {showInput ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          {/* Amber Trace: Anti-Noise */}
          <button
            onClick={() => setShowAntiNoise(!showAntiNoise)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              showAntiNoise
                ? 'bg-amber-950/70 border border-amber-800/80 text-amber-300'
                : 'bg-slate-800 text-slate-500 border border-transparent'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Anti-Noise -x(t)</span>
            {showAntiNoise ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          {/* Emerald Trace: Residual Output */}
          <button
            onClick={() => setShowOutput(!showOutput)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              showOutput
                ? 'bg-emerald-950/70 border border-emerald-800/80 text-emerald-300'
                : 'bg-slate-800 text-slate-500 border border-transparent'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Cancelled e(t)</span>
            {showOutput ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 ml-2 bg-slate-800/80 p-0.5 rounded border border-slate-700">
            <button
              onClick={() => setZoom(Math.max(1, zoom / 2))}
              className="p-1 text-slate-400 hover:text-slate-200"
              title="Zoom Out Timebase"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] font-mono px-1 text-slate-300">{zoom}x</span>
            <button
              onClick={() => setZoom(Math.min(8, zoom * 2))}
              className="p-1 text-slate-400 hover:text-slate-200"
              title="Zoom In Timebase"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1 text-slate-400 hover:text-slate-200 ml-1 border-l border-slate-700 pl-1.5"
              title={isPaused ? 'Resume' : 'Freeze Waveform'}
            >
              {isPaused ? <Play size={13} /> : <Pause size={13} />}
            </button>
          </div>
        </div>
      </div>

      {/* Scope Canvas */}
      <div className="relative w-full h-56 bg-slate-950 rounded border border-slate-800/80 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={240}
          className="w-full h-full block"
        />

        {/* Scope Scale Overlays */}
        <div className="absolute top-2 left-3 pointer-events-none flex flex-col gap-0.5 text-[10px] font-mono text-slate-500">
          <span>+1.0 FS</span>
          <span className="mt-8">0.0V (NULL)</span>
          <span className="mt-8">-1.0 FS</span>
        </div>

        <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
          Superposition Phase: {engine.settings.enabled ? '180° Inverted' : '0° Bypass'}
        </div>
      </div>
    </div>
  );
};
