"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioEngine = void 0;
const naudiodon = __importStar(require("naudiodon"));
const speaker_1 = __importDefault(require("speaker"));
class AudioEngine {
    constructor() {
        this.sampleRate = 48000;
        this.onDataCallback = null;
        this.audioOut = null;
    }
    async init() {
        const devices = naudiodon.getDevices();
        const inputDev = devices.find((d) => d.maxInputChannels > 0);
        if (inputDev) {
            this.audioIn = naudiodon.AudioIO({
                inOptions: {
                    deviceId: inputDev.id,
                    sampleRate: this.sampleRate,
                    channelCount: 1,
                    sampleFormat: naudiodon.SampleFormatFloat32
                }
            });
            this.audioIn.on("data", (buffer) => {
                const floats = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
                if (this.onDataCallback)
                    this.onDataCallback(floats);
            });
            this.audioIn.start();
        }
        this.audioOut = new speaker_1.default({
            channels: 1,
            bitDepth: 32,
            sampleRate: this.sampleRate
        });
    }
    play(samples) {
        if (this.audioOut) {
            const buffer = Buffer.from(samples.buffer);
            this.audioOut.write(buffer);
        }
    }
    onAudioData(callback) {
        this.onDataCallback = callback;
    }
}
exports.AudioEngine = AudioEngine;
