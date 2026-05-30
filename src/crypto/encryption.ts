export class Encryption {
  private key: Uint8Array;
  
  constructor() {
    const seed = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      seed[i] = Math.floor(Math.random() * 256);
    }
    this.key = this.deriveKey(seed);
  }
  
  encrypt(plaintext: string): Uint8Array {
    const data = new TextEncoder().encode(plaintext);
    const output = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      output[i] = data[i] ^ this.key[i % this.key.length];
    }
    return output;
  }
  
  decrypt(ciphertext: Uint8Array): Uint8Array | null {
    const output = new Uint8Array(ciphertext.length);
    for (let i = 0; i < ciphertext.length; i++) {
      output[i] = ciphertext[i] ^ this.key[i % this.key.length];
    }
    return output;
  }
  
  private deriveKey(seed: Uint8Array): Uint8Array {
    const key = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      key[i] = seed[i] ^ (seed[(i + 13) % 32] << 1) ^ (seed[(i + 27) % 32] >> 1);
    }
    return key;
  }
}