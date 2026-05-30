"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Goertzel = void 0;
class Goertzel {
    constructor(targetFreq, sampleRate) {
        this.q0 = 0;
        this.q1 = 0;
        this.targetFreq = targetFreq;
        this.sampleRate = sampleRate;
        const k = Math.round(0.5 + (targetFreq * sampleRate) / sampleRate);
        const omega = (2 * Math.PI * k) / sampleRate;
        this.coeff = 2 * Math.cos(omega);
    }
    process(sample) {
        const q2 = this.q1;
        this.q1 = this.q0;
        this.q0 = sample + this.coeff * this.q1 - q2;
        return this.q0 * this.q0 + this.q1 * this.q1 - this.coeff * this.q0 * this.q1;
    }
    reset() {
        this.q0 = 0;
        this.q1 = 0;
    }
}
exports.Goertzel = Goertzel;
