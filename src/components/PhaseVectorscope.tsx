import React, { useEffect, useRef } from 'react';
import { ANCAudioEngine } from '../audio/ancEngine';

interface PhaseVectorscopeProps {
  engine: ANCAudioEngine;
}

export const PhaseVectorscope: React.FC<PhaseVectorscopeProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 16;

      // Dark background
      ctx.fillStyle = '#070b12';
      ctx.fillRect(0, 0, width, height);

      // Polar concentric circles
      ctx.strokeStyle = '#151e2e';
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75, 1.0].forEach((rFactor) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * rFactor, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Diagonal axes: +45 deg (in-phase) and -45 deg (anti-phase cancellation)
      ctx.strokeStyle = '#1f2d42';
      ctx.beginPath();
      // In-phase line
      ctx.moveTo(centerX - radius * 0.7, centerY + radius * 0.7);
      ctx.lineTo(centerX + radius * 0.7, centerY - radius * 0.7);
      ctx.stroke();

      // Ideal Anti-Phase 180° ANC Cancellation Axis (highlighted)
      ctx.strokeStyle = '#f59e0b44';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(centerX - radius * 0.7, centerY - radius * 0.7);
      ctx.lineTo(centerX + radius * 0.7, centerY + radius * 0.7);
      ctx.stroke();
      ctx.setLineDash([]);

      // Cardinal axes
      ctx.strokeStyle = '#151e2e';
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Read time-domain buffers
      const inAnalyser = engine.inputAnalyser;
      const antiAnalyser = engine.antiNoiseAnalyser;
      if (!inAnalyser || !antiAnalyser) {
        animationId = requestAnimationFrame(render);
        return;
      }

      const len = 512;
      const inBuffer = new Float32Array(len);
      const antiBuffer = new Float32Array(len);
      inAnalyser.getFloatTimeDomainData(inBuffer);
      antiAnalyser.getFloatTimeDomainData(antiBuffer);

      // Draw Lissajous trajectory
      ctx.strokeStyle = engine.settings.enabled ? '#f59e0b' : '#06b6d4';
      ctx.shadowColor = engine.settings.enabled ? 'rgba(245, 158, 11, 0.5)' : 'rgba(6, 182, 212, 0.3)';
      ctx.shadowBlur = 4;
      ctx.lineWidth = 1.6;
      ctx.beginPath();

      for (let i = 0; i < len; i++) {
        const xVal = inBuffer[i];
        const yVal = antiBuffer[i];

        const x = centerX + xVal * radius * 0.95;
        const y = centerY + yVal * radius * 0.95;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [engine]);

  return (
    <div className="bg-slate-900/90 rounded-lg border border-slate-800 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-wide text-slate-200">
          Lissajous Phase Vectorscope
        </span>
        <span className="text-xs text-slate-400 font-mono">
          {engine.settings.enabled ? '180° Anti-Phase Axis' : 'Uncorrelated'}
        </span>
      </div>

      <div className="relative w-full aspect-square max-h-56 mx-auto bg-slate-950 rounded border border-slate-800/80 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          className="w-full h-full block"
        />

        <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-400 pointer-events-none">
          +Y (Anti-Noise)
        </div>
        <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-400 pointer-events-none">
          +X (Input)
        </div>
        <div className="absolute top-2 right-2 text-[10px] font-mono text-amber-400/80 pointer-events-none bg-slate-950/70 px-1.5 py-0.5 rounded">
          Ideal 180° Null
        </div>
      </div>
    </div>
  );
};
