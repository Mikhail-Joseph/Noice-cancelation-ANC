export type AudioSourceType = 'mic' | 'synthetic' | 'file';

export type SyntheticNoiseType = 
  | 'airplane'
  | 'hvac'
  | 'mains_hum'
  | 'traffic'
  | 'speech_and_drone'
  | 'pink_noise'
  | 'sine_and_noise';

export type MonitorOutputMode = 'anc_processed' | 'raw_bypass' | 'anti_noise_only' | 'transparency';

export type VisualizerMode = 'spectrum' | 'oscilloscope' | 'waterfall' | 'vectorscope' | 'all';

export interface ANCSettings {
  enabled: boolean;
  phaseInvert: boolean; // 180 deg anti-phase
  phaseFineDegrees: number; // 0 to 360 degrees fine tuning
  delayCompensationMs: number; // 0.0 to 25.0 ms
  antiNoiseGain: number; // 0.0 to 2.0 (1.0 = unity gain)
  
  // Latency & Sidetone Controls
  lowLatencyNativeMode: boolean; // Ultra-low latency native C++ graph (< 3ms, bypasses JS processor)
  muteDirectSidetone: boolean; // Mutes direct microphone passthrough to eliminate headphone echo/delay
  bufferSizeSamples: 256 | 512 | 1024; // JS DSP frame size when adaptive mode is active
  
  // Adaptive LMS filter
  adaptiveFilterEnabled: boolean;
  adaptiveLmsStepSize: number; // mu: 0.001 to 0.05
  filterTaps: number; // 16, 32, 64, 128
  
  // Spectral Subtraction & Gating
  spectralSubtractionEnabled: boolean;
  subtractionIntensity: number; // alpha: 0.5 to 3.0
  spectralFloorDb: number; // -60 to -12 dB
  
  // Notch & Resonance
  notch50Hz: boolean;
  notch60Hz: boolean;
  notchHarmonics: boolean;
  
  // Voice & Transparency
  voiceBandPreserve: boolean; // protects 300 - 3400 Hz
  transparencyMix: number; // 0 to 1
  
  // Output master
  outputGain: number; // 0 to 1.5
  limiterThreshold: number; // -1 to -0.1 dB
}

export interface ANCTelemetry {
  inputRmsDb: number;
  outputRmsDb: number;
  attenuationDb: number; // e.g. -18.5 dB
  peakAttenuatedFreq: number; // e.g. 120 Hz
  estimatedSnrGainDb: number; // e.g. +14.2 dB
  phaseMarginDegrees: number;
  estimatedLatencyMs: number;
  noiseProfileSamples: number;
  isCalibrated: boolean;
}

export interface NoiseProfile {
  name: string;
  timestamp: number;
  bins: Float32Array;
  sampleRate: number;
  dominantFreqs: { freq: number; magnitudeDb: number }[];
  noiseFloorAverageDb: number;
}
