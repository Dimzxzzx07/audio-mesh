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
Object.defineProperty(exports, "__esModule", { value: true });
const modulator_1 = require("./dsp/modulator");
const demodulator_1 = require("./dsp/demodulator");
const framer_1 = require("./protocol/framer");
const csma_ca_1 = require("./protocol/csma-ca");
const routing_table_1 = require("./mesh/routing-table");
const packet_forwarder_1 = require("./mesh/packet-forwarder");
const encryption_1 = require("./crypto/encryption");
const peer_discovery_1 = require("./mesh/peer-discovery");
const readline = __importStar(require("readline"));
class AudioMeshNode {
    constructor(nodeId) {
        this.nodeId = nodeId;
        this.modulator = new modulator_1.Modulator();
        this.demodulator = new demodulator_1.Demodulator();
        this.framer = new framer_1.Framer();
        this.csma = new csma_ca_1.CSMA_CA();
        this.routingTable = new routing_table_1.RoutingTable(nodeId);
        this.forwarder = new packet_forwarder_1.PacketForwarder(this.routingTable);
        this.encryption = new encryption_1.Encryption();
        this.peerDiscovery = new peer_discovery_1.PeerDiscovery(nodeId);
    }
    async start() {
        await this.modulator.init();
        await this.demodulator.init();
        console.log(`\n========================================`);
        console.log(`Node ${this.nodeId} started`);
        console.log(`Frequency: 20kHz (ultrasound - inaudible)`);
        console.log(`Encryption: XOR stream cipher enabled`);
        console.log(`WASM DSP: Active`);
        console.log(`========================================\n`);
        this.broadcastPresence();
        this.startRepl();
    }
    async sendMessage(targetId, message) {
        const encrypted = this.encryption.encrypt(message);
        const framed = this.framer.encode(this.nodeId, targetId, encrypted);
        const modulated = this.modulator.modulate(framed);
        await this.csma.waitForChannel();
        console.log(`\n[→] Sent to ${targetId}: "${message}"`);
        return modulated;
    }
    receiveAudio(samples) {
        const demodulated = this.demodulator.process(samples);
        if (demodulated) {
            const decoded = this.framer.decode(demodulated);
            if (decoded && this.csma.canReceive()) {
                const decrypted = this.encryption.decrypt(decoded.payload);
                if (decrypted) {
                    const message = new TextDecoder().decode(decrypted);
                    console.log(`\n[←] Received from ${decoded.source}: "${message}"`);
                    this.routingTable.updateRoute(decoded.source, 1);
                    this.peerDiscovery.discoverPeer(decoded.source, 50);
                    this.forwarder.forward(decoded.source, decoded.target, decrypted, this.sendMessage.bind(this));
                }
            }
        }
    }
    broadcastPresence() {
        setInterval(async () => {
            await this.sendMessage("BROADCAST", `HELLO from ${this.nodeId}`);
        }, 30000);
    }
    startRepl() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const prompt = () => {
            rl.question(`[${this.nodeId}] > `, async (input) => {
                if (input.startsWith("/send ")) {
                    const parts = input.slice(6).split(" ");
                    const target = parts[0];
                    const msg = parts.slice(1).join(" ");
                    await this.sendMessage(target, msg);
                }
                else if (input === "/peers") {
                    console.log("\nKnown peers:", this.peerDiscovery.getPeers());
                }
                else if (input === "/routes") {
                    console.log("\nRouting table:", Array.from(this.routingTable.getAllRoutes().entries()));
                }
                else if (input === "/help") {
                    console.log("\nCommands:");
                    console.log("  /send <nodeId> <message> - Send encrypted message");
                    console.log("  /peers - List known peers");
                    console.log("  /routes - Show routing table");
                    console.log("  /quit - Exit");
                }
                else if (input === "/quit") {
                    console.log("Shutting down...");
                    process.exit(0);
                }
                else if (input.trim()) {
                    console.log(`\nUnknown command: ${input}`);
                    console.log("Type /help for available commands");
                }
                prompt();
            });
        };
        prompt();
    }
}
const nodeId = process.argv[2] || `node-${Math.floor(Math.random() * 1000)}`;
const node = new AudioMeshNode(nodeId);
node.start().catch(console.error);
