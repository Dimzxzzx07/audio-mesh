export class Demodulator {
  private dspModule: any = null;

  async init() {
    try {
      const module = require("../../native/dsp-native.js");
      this.dspModule = module.default ? await module.default() : module;
      console.log("[DSP] Demodulator ready");
    } catch (e: any) {
      console.warn("[DSP] Demodulator error:", e.message);
      this.dspModule = null;
    }
  }

  process(samples: Float32Array): Uint8Array | null {
    if (this.dspModule && this.dspModule.demodulateFSK) {
      const result = this.dspModule.demodulateFSK(samples);
      if (result && result.length > 0) {
        return result;
      }
    }
    return null;
  }
}
