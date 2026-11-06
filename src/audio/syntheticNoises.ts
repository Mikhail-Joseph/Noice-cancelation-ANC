import { SyntheticNoiseType } from '../types/audio';

export interface SyntheticNoiseSource {
  start: () => void;
  stop: () => void;
  outputNode: AudioNode;
}

/**
 * Creates rich, realistic acoustic simulation environments for ANC benchmarking.
 */
export function createSyntheticNoise(
  ctx: AudioContext,
  type: SyntheticNoiseType
): SyntheticNoiseSource {
  const masterOut = ctx.createGain();
  masterOut.gain.value = 0.8;

  const cleanupTasks: (() => void)[] = [];

  switch (type) {
    case 'airplane': {
      // Airplane Cabin: Heavy low-frequency turbofan rumble (85-180 Hz) + cabin ventilation
      const bufferSize = ctx.sampleRate * 3;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      // Brown noise integration
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.03 * white) / 1.03;
        lastOut = data[i];
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Low pass to emphasize cabin rumble
      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.value = 220;
      rumbleFilter.Q.value = 2.0;

      // Turbofan blade hum fundamentals
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = 92; // 92 Hz cabin fundamental

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 184; // 2nd harmonic
      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.25;

      const osc2Gain = ctx.createGain();
      osc2Gain.gain.value = 0.15;

      noiseSource.connect(rumbleFilter);
      rumbleFilter.connect(masterOut);

      osc1.connect(oscGain);
      oscGain.connect(masterOut);

      osc2.connect(osc2Gain);
      osc2Gain.connect(masterOut);

      cleanupTasks.push(() => {
        try {
          noiseSource.stop();
          osc1.stop();
          osc2.stop();
        } catch {
          // ignore already stopped
        }
      });

      return {
        start: () => {
          noiseSource.start();
          osc1.start();
          osc2.start();
        },
        stop: () => cleanupTasks.forEach((fn) => fn()),
        outputNode: masterOut,
      };
    }

    case 'hvac': {
      // HVAC Ventilation / Server Room: 120Hz motor drone + air duct turbulent resonance
      const osc120 = ctx.createOscillator();
      osc120.type = 'triangle';
      osc120.frequency.value = 120; // 120 Hz electrical motor hum

      const humGain = ctx.createGain();
      humGain.gain.value = 0.35;
      osc120.connect(humGain);
      humGain.connect(masterOut);

      // Airflow pink noise
      const bufferSize = ctx.sampleRate * 2;
      const pinkBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const out = pinkBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + white * 0.5362) * 0.08;
      }

      const airSource = ctx.createBufferSource();
      airSource.buffer = pinkBuffer;
      airSource.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 450;
      bandpass.Q.value = 1.2;

      airSource.connect(bandpass);
      bandpass.connect(masterOut);

      cleanupTasks.push(() => {
        try {
          osc120.stop();
          airSource.stop();
        } catch {
          // ignore
        }
      });

      return {
        start: () => {
          osc120.start();
          airSource.start();
        },
        stop: () => cleanupTasks.forEach((fn) => fn()),
        outputNode: masterOut,
      };
    }

    case 'mains_hum': {
      // 60Hz Ground Loop with realistic harmonic progression
      const freqs = [60, 120, 180, 240, 300];
      const gains = [0.4, 0.25, 0.15, 0.08, 0.04];
      const oscs: OscillatorNode[] = [];

      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;

        const g = ctx.createGain();
        g.gain.value = gains[idx];

        osc.connect(g);
        g.connect(masterOut);
        oscs.push(osc);
      });

      cleanupTasks.push(() => {
        oscs.forEach((o) => {
          try {
            o.stop();
          } catch {
            // ignore
          }
        });
      });

      return {
        start: () => oscs.forEach((o) => o.start()),
        stop: () => cleanupTasks.forEach((fn) => fn()),
        outputNode: masterOut,
      };
    }

    case 'traffic': {
      // Urban traffic: sub-woofer road rumble + occasional diesel engine pulsation
      const bufferSize = ctx.sampleRate * 3;
      const buff = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const ch = buff.getChannelData(0);
      let lastVal = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        ch[i] = (lastVal + 0.015 * white) / 1.015;
        lastVal = ch[i];
      }

      const trafficSource = ctx.createBufferSource();
      trafficSource.buffer = buff;
      trafficSource.loop = true;

      const subFilter = ctx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.value = 140;

      trafficSource.connect(subFilter);
      subFilter.connect(masterOut);

      cleanupTasks.push(() => {
        try {
          trafficSource.stop();
        } catch {
          // ignore
        }
      });

      return {
        start: () => trafficSource.start(),
        stop: () => cleanupTasks.forEach((fn) => fn()),
        outputNode: masterOut,
      };
    }

    case 'pink_noise': {
      const bufferSize = ctx.sampleRate * 2;
      const pinkBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const out = pinkBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + white * 0.5362) * 0.1;
      }
      const src = ctx.createBufferSource();
      src.buffer = pinkBuffer;
      src.loop = true;
      src.connect(masterOut);

      cleanupTasks.push(() => {
        try {
          src.stop();
        } catch {
          // ignore
        }
      });

      return {
        start: () => src.start(),
        stop: () => cleanupTasks.forEach((fn) => fn()),
        outputNode: masterOut,
      };
    }

    case 'sine_and_noise': {
      // 1000 Hz reference pilot tone masked under 120Hz hum + pink noise
      const sine = ctx.createOscillator();
      sine.type = 'sine';
      sine.frequency.value = 1000;
      const sineGain = ctx.createGain();
      sineGain.gain.value = 0.22;
      sine.connect(sineGain);
      sineGain.connect(masterOut);

      const drone = ctx.createOscillator();
      drone.type = 'sawtooth';
      drone.frequency.value = 110;
      const droneFilter = ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 280;
      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.4;
      drone.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(masterOut);

      cleanupTasks.push(() => {
        try {
          sine.stop();
          drone.stop();
        } catch {
          // ignore
        }
      });

      return {
        start: () => {
          sine.start();
          drone.start();
        },
        stop: () => cleanupTasks.forEach((fn) => fn()),
        outputNode: masterOut,
      };
    }

    case 'speech_and_drone':
    default: {
      // Voice utterance simulation combined with heavy cabin engine drone
      // Demonstrates voice transparency and ANC noise removal
      const droneOsc = ctx.createOscillator();
      droneOsc.type = 'sawtooth';
      droneOsc.frequency.value = 105;
      const droneFilt = ctx.createBiquadFilter();
      droneFilt.type = 'lowpass';
      droneFilt.frequency.value = 240;
      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.45;
      droneOsc.connect(droneFilt);
      droneFilt.connect(droneGain);
      droneGain.connect(masterOut);

      // Synthesize rhythmic speech-like formant harmonics (350Hz, 700Hz, 1200Hz, 2400Hz)
      const formantOsc = ctx.createOscillator();
      formantOsc.type = 'triangle';
      formantOsc.frequency.value = 220; // vocal cord fundamental A3

      // Speech envelope modulator (cadence like speaking)
      const speechGain = ctx.createGain();
      speechGain.gain.value = 0.0;

      // Formant bandpass
      const speechFilter = ctx.createBiquadFilter();
      speechFilter.type = 'bandpass';
      speechFilter.frequency.value = 950;
      speechFilter.Q.value = 2.5;

      formantOsc.connect(speechFilter);
      speechFilter.connect(speechGain);
      speechGain.connect(masterOut);

      // LFO modulation to simulate syllables / speech phrases
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 1.8; // 1.8 Hz syllable cadence
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.28;
      lfo.connect(speechGain.gain);

      cleanupTasks.push(() => {
        try {
          droneOsc.stop();
          formantOsc.stop();
          lfo.stop();
        } catch {
          // ignore
        }
      });

      return {
        start: () => {
          droneOsc.start();
          formantOsc.start();
          lfo.start();
        },
        stop: () => cleanupTasks.forEach((fn) => fn()),
        outputNode: masterOut,
      };
    }
  }
}
