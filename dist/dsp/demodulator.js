"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Demodulator = void 0;
class Demodulator {
    constructor() {
        this.dspModule = null;
    }
    async init() {
        try {
            const module = require("../../native/dsp-native.js");
            this.dspModule = module.default ? await module.default() : module;
            console.log("[DSP] Demodulator ready");
        }
        catch (e) {
            console.warn("[DSP] Demodulator error:", e.message);
            this.dspModule = null;
        }
    }
    process(samples) {
        if (this.dspModule && this.dspModule.demodulateFSK) {
            const result = this.dspModule.demodulateFSK(samples);
            if (result && result.length > 0) {
                return result;
            }
        }
        return null;
    }
}
exports.Demodulator = Demodulator;
