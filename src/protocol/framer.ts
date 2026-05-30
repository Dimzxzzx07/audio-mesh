import { crc16 } from "./crc16.js";

export class Framer {
  private preamble = new Uint8Array([0xAA, 0xAA, 0xAA, 0xAA]);
  private syncWord = new Uint8Array([0x7E, 0x7E]);
  
  encode(source: string, target: string, payload: Uint8Array): Uint8Array {
    const srcBytes = new TextEncoder().encode(source);
    const dstBytes = new TextEncoder().encode(target);
    const header = new Uint8Array([srcBytes.length, dstBytes.length, ...srcBytes, ...dstBytes]);
    const length = header.length + payload.length + 2;
    const frame = new Uint8Array(this.preamble.length + this.syncWord.length + length);
    
    frame.set(this.preamble);
    frame.set(this.syncWord, this.preamble.length);
    frame.set(header, this.preamble.length + this.syncWord.length);
    frame.set(payload, this.preamble.length + this.syncWord.length + header.length);
    
    const crc = crc16(frame.slice(this.preamble.length + this.syncWord.length, frame.length));
    frame[frame.length - 2] = crc >> 8;
    frame[frame.length - 1] = crc & 0xFF;
    
    return frame;
  }
  
  decode(frame: Uint8Array): { source: string; target: string; payload: Uint8Array } | null {
    if (frame.length < 10) return null;
    
    for (let i = 0; i < this.preamble.length; i++) {
      if (frame[i] !== this.preamble[i]) return null;
    }
    
    for (let i = 0; i < this.syncWord.length; i++) {
      if (frame[this.preamble.length + i] !== this.syncWord[i]) return null;
    }
    
    const headerStart = this.preamble.length + this.syncWord.length;
    const srcLen = frame[headerStart];
    const dstLen = frame[headerStart + 1];
    const source = new TextDecoder().decode(frame.slice(headerStart + 2, headerStart + 2 + srcLen));
    const target = new TextDecoder().decode(frame.slice(headerStart + 2 + srcLen, headerStart + 2 + srcLen + dstLen));
    
    const payloadStart = headerStart + 2 + srcLen + dstLen;
    const payloadEnd = frame.length - 2;
    const payload = frame.slice(payloadStart, payloadEnd);
    
    const receivedCrc = (frame[frame.length - 2] << 8) | frame[frame.length - 1];
    const calculatedCrc = crc16(frame.slice(headerStart, payloadEnd));
    
    if (receivedCrc !== calculatedCrc) return null;
    
    return { source, target, payload };
  }
}