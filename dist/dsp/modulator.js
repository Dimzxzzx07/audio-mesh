"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modulator = void 0;
class Modulator {
    constructor() {
        this.useWasm = false;
        this.dspModule = null;
    }
    async init() {
        try {
            this.dspModule = require("../../native/dsp-native.js").default;
            const module = await this.dspModule();
            this.dspModule = module;
            this.useWasm = true;
            console.log("[DSP] Modulator ready");
        }
        catch (e) {
            const fallback = require("../../native/dsp-native.js");
            this.dspModule = fallback.default ? await fallback.default() : fallback;
            this.useWasm = true;
            console.log("[DSP] Modulator using fallback");
        }
    }
    modulate(data) {
        if (this.dspModule && this.dspModule.modulateFSK) {
            return this.dspModule.modulateFSK(data);
        }
        return this.modulateFallback(data);
    }
    modulateFallback(data) {
        const sampleRate = 48000;
        const carrierFreq = 20000;
        const baudRate = 100;
        const samplesPerBit = sampleRate / baudRate;
        const totalSamples = Math.ceil(data.length * 8 * samplesPerBit);
        const output = new Float32Array(totalSamples);
        let sampleIdx = 0;
        let phase = 0;
        for (const byte of data) {
            for (let bit = 0; bit < 8; bit++) {
                const bitVal = (byte >> (7 - bit)) & 1;
                const freq = bitVal ? carrierFreq + 500 : carrierFreq - 500;
                const phaseInc = 2 * Math.PI * freq / sampleRate;
                for (let s = 0; s < samplesPerBit && sampleIdx < totalSamples; s++) {
                    output[sampleIdx++] = Math.sin(phase);
                    phase += phaseInc;
                    if (phase >= 2 * Math.PI)
                        phase -= 2 * Math.PI;
                }
            }
        }
        return output;
    }
}
exports.Modulator = Modulator;
