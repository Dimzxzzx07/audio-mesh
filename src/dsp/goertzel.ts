export class Goertzel {
  private targetFreq: number;
  private sampleRate: number;
  private coeff: number;
  private q0: number = 0;
  private q1: number = 0;

  constructor(targetFreq: number, sampleRate: number) {
    this.targetFreq = targetFreq;
    this.sampleRate = sampleRate;
    const k = Math.round(0.5 + (targetFreq * sampleRate) / sampleRate);
    const omega = (2 * Math.PI * k) / sampleRate;
    this.coeff = 2 * Math.cos(omega);
  }

  process(sample: number): number {
    const q2 = this.q1;
    this.q1 = this.q0;
    this.q0 = sample + this.coeff * this.q1 - q2;
    return this.q0 * this.q0 + this.q1 * this.q1 - this.coeff * this.q0 * this.q1;
  }

  reset(): void {
    this.q0 = 0;
    this.q1 = 0;
  }
}