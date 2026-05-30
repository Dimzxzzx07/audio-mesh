import { Modulator } from "./dsp/modulator";
import { Demodulator } from "./dsp/demodulator";
import { Framer } from "./protocol/framer";
import { CSMA_CA } from "./protocol/csma-ca";
import { RoutingTable } from "./mesh/routing-table";
import { PacketForwarder } from "./mesh/packet-forwarder";
import { Encryption } from "./crypto/encryption";
import { PeerDiscovery } from "./mesh/peer-discovery";
import * as readline from "readline";

class AudioMeshNode {
  private modulator: Modulator;
  private demodulator: Demodulator;
  private framer: Framer;
  private csma: CSMA_CA;
  private routingTable: RoutingTable;
  private forwarder: PacketForwarder;
  private encryption: Encryption;
  private peerDiscovery: PeerDiscovery;
  private nodeId: string;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
    this.modulator = new Modulator();
    this.demodulator = new Demodulator();
    this.framer = new Framer();
    this.csma = new CSMA_CA();
    this.routingTable = new RoutingTable(nodeId);
    this.forwarder = new PacketForwarder(this.routingTable);
    this.encryption = new Encryption();
    this.peerDiscovery = new PeerDiscovery(nodeId);
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

  async sendMessage(targetId: string, message: string) {
    const encrypted = this.encryption.encrypt(message);
    const framed = this.framer.encode(this.nodeId, targetId, encrypted);
    const modulated = this.modulator.modulate(framed);
    await this.csma.waitForChannel();
    console.log(`\n[→] Sent to ${targetId}: "${message}"`);
    return modulated;
  }

  receiveAudio(samples: Float32Array) {
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

  private broadcastPresence() {
    setInterval(async () => {
      await this.sendMessage("BROADCAST", `HELLO from ${this.nodeId}`);
    }, 30000);
  }

  private startRepl() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const prompt = () => {
      rl.question(`[${this.nodeId}] > `, async (input: string) => {
        if (input.startsWith("/send ")) {
          const parts = input.slice(6).split(" ");
          const target = parts[0];
          const msg = parts.slice(1).join(" ");
          await this.sendMessage(target, msg);
        } else if (input === "/peers") {
          console.log("\nKnown peers:", this.peerDiscovery.getPeers());
        } else if (input === "/routes") {
          console.log("\nRouting table:", Array.from(this.routingTable.getAllRoutes().entries()));
        } else if (input === "/help") {
          console.log("\nCommands:");
          console.log("  /send <nodeId> <message> - Send encrypted message");
          console.log("  /peers - List known peers");
          console.log("  /routes - Show routing table");
          console.log("  /quit - Exit");
        } else if (input === "/quit") {
          console.log("Shutting down...");
          process.exit(0);
        } else if (input.trim()) {
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
