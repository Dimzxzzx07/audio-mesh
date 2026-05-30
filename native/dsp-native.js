// CommonJS wrapper for WASM module
const DSPNative = {
  initGoertzel: (freq, rate) => {
    return { coeff: 2 * Math.cos(2 * Math.PI * freq / rate), q0: 0, q1: 0 };
  },
  processGoertzel: (filter, sample) => {
    const q2 = filter.q1;
    filter.q1 = filter.q0;
    filter.q0 = sample + filter.coeff * filter.q1 - q2;
    return filter.q0 * filter.q0 + filter.q1 * filter.q1 - filter.coeff * filter.q0 * filter.q1;
  },
  resetGoertzel: (filter) => {
    filter.q0 = 0;
    filter.q1 = 0;
  },
  modulateFSK: (data, sampleRate = 48000, carrierFreq = 20000, baudRate = 100) => {
    const samplesPerBit = sampleRate / baudRate;
    const totalSamples = Math.ceil(data.length * 8 * samplesPerBit);
    const output = new Float32Array(totalSamples);
    let sampleIdx = 0;
    let phase = 0;
    const deviation = 500;
    
    for (const byte of data) {
      for (let bit = 0; bit < 8; bit++) {
        const bitVal = (byte >> (7 - bit)) & 1;
        const freq = bitVal ? carrierFreq + deviation : carrierFreq - deviation;
        const phaseInc = 2 * Math.PI * freq / sampleRate;
        
        for (let s = 0; s < samplesPerBit && sampleIdx < totalSamples; s++) {
          output[sampleIdx++] = Math.sin(phase);
          phase += phaseInc;
          if (phase >= 2 * Math.PI) phase -= 2 * Math.PI;
        }
      }
    }
    return output;
  },
  demodulateFSK: (samples, sampleRate = 48000, carrierFreq = 20000, baudRate = 100) => {
    const samplesPerBit = sampleRate / baudRate;
    const numBits = Math.floor(samples.length / samplesPerBit);
    const bytes = [];
    let currentByte = 0;
    let bitIdx = 0;
    const deviation = 500;
    
    for (let bit = 0; bit < numBits; bit++) {
      const start = Math.floor(bit * samplesPerBit);
      const end = Math.min(Math.floor(start + samplesPerBit), samples.length);
      
      let markEnergy = 0;
      let spaceEnergy = 0;
      
      for (let i = start; i < end; i++) {
        const markFreq = carrierFreq + deviation;
        const spaceFreq = carrierFreq - deviation;
        for (let j = 0; j < 50; j++) {
          markEnergy += samples[i] * Math.sin(2 * Math.PI * markFreq * j / sampleRate);
          spaceEnergy += samples[i] * Math.sin(2 * Math.PI * spaceFreq * j / sampleRate);
        }
      }
      
      const bitVal = markEnergy > spaceEnergy ? 1 : 0;
      currentByte |= (bitVal << (7 - bitIdx));
      bitIdx++;
      
      if (bitIdx === 8) {
        bytes.push(currentByte);
        currentByte = 0;
        bitIdx = 0;
      }
    }
    
    return new Uint8Array(bytes);
  },
  _get_sample_rate: () => 48000,
  _get_carrier_freq: () => 20000,
  _modulate_fsk: (dataPtr, dataLen, outputPtr, outputLen) => {
    // Stub for WASM compatibility
    return 0;
  },
  _demodulate_fsk: (samplesPtr, sampleLen, outputPtr, outputLen) => {
    // Stub for WASM compatibility
    return 0;
  },
  _malloc: (size) => Buffer.alloc(size),
  _free: (ptr) => {}
};

// Create default export wrapper
const wasmModule = {
  default: async () => DSPNative
};

module.exports = wasmModule;
