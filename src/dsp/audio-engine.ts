import * as naudiodon from "naudiodon";
import Speaker from "speaker";

export class AudioEngine {
  private audioIn: any;
  private audioOut: Speaker | null;
  private sampleRate = 48000;
  private onDataCallback: ((data: Float32Array) => void) | null = null;

  constructor() {
    this.audioOut = null;
  }

  async init(): Promise<void> {
    const devices = naudiodon.getDevices();
    const inputDev = devices.find((d: any) => d.maxInputChannels > 0);
    
    if (inputDev) {
      this.audioIn = naudiodon.AudioIO({
        inOptions: {
          deviceId: inputDev.id,
          sampleRate: this.sampleRate,
          channelCount: 1,
          sampleFormat: naudiodon.SampleFormatFloat32
        }
      });
      
      this.audioIn.on("data", (buffer: Buffer) => {
        const floats = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
        if (this.onDataCallback) this.onDataCallback(floats);
      });
      
      this.audioIn.start();
    }
    
    this.audioOut = new Speaker({
      channels: 1,
      bitDepth: 32,
      sampleRate: this.sampleRate
    });
  }

  play(samples: Float32Array): void {
    if (this.audioOut) {
      const buffer = Buffer.from(samples.buffer);
      this.audioOut.write(buffer);
    }
  }

  onAudioData(callback: (data: Float32Array) => void): void {
    this.onDataCallback = callback;
  }
}