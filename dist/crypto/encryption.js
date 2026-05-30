"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Encryption = void 0;
class Encryption {
    constructor() {
        const seed = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            seed[i] = Math.floor(Math.random() * 256);
        }
        this.key = this.deriveKey(seed);
    }
    encrypt(plaintext) {
        const data = new TextEncoder().encode(plaintext);
        const output = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
            output[i] = data[i] ^ this.key[i % this.key.length];
        }
        return output;
    }
    decrypt(ciphertext) {
        const output = new Uint8Array(ciphertext.length);
        for (let i = 0; i < ciphertext.length; i++) {
            output[i] = ciphertext[i] ^ this.key[i % this.key.length];
        }
        return output;
    }
    deriveKey(seed) {
        const key = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            key[i] = seed[i] ^ (seed[(i + 13) % 32] << 1) ^ (seed[(i + 27) % 32] >> 1);
        }
        return key;
    }
}
exports.Encryption = Encryption;
