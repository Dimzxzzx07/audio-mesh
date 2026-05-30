export class PeerDiscovery {
  private peers: Map<string, { lastSeen: number; signalStrength: number }> = new Map();
  private nodeId: string;
  private onPeerDiscoveredCallback: ((peerId: string) => void) | null = null;
  
  constructor(nodeId: string) {
    this.nodeId = nodeId;
    this.startCleanupInterval();
  }
  
  discoverPeer(peerId: string, signalStrength: number): void {
    const existing = this.peers.get(peerId);
    if (!existing || Date.now() - existing.lastSeen > 30000) {
      this.peers.set(peerId, {
        lastSeen: Date.now(),
        signalStrength: signalStrength
      });
      if (this.onPeerDiscoveredCallback) {
        this.onPeerDiscoveredCallback(peerId);
      }
    } else {
      existing.lastSeen = Date.now();
      existing.signalStrength = (existing.signalStrength + signalStrength) / 2;
    }
  }
  
  getPeers(): string[] {
    const activePeers: string[] = [];
    for (const [peerId, data] of this.peers.entries()) {
      if (Date.now() - data.lastSeen < 60000) {
        activePeers.push(peerId);
      }
    }
    return activePeers;
  }
  
  getBestPeer(): string | null {
    let bestPeer: string | null = null;
    let bestStrength = -Infinity;
    
    for (const [peerId, data] of this.peers.entries()) {
      if (Date.now() - data.lastSeen < 60000 && data.signalStrength > bestStrength) {
        bestStrength = data.signalStrength;
        bestPeer = peerId;
      }
    }
    return bestPeer;
  }
  
  onPeerDiscovered(callback: (peerId: string) => void): void {
    this.onPeerDiscoveredCallback = callback;
  }
  
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [peerId, data] of this.peers.entries()) {
        if (now - data.lastSeen > 120000) {
          this.peers.delete(peerId);
        }
      }
    }, 30000);
  }
  
  calculateSignalStrength(samples: Float32Array): number {
    let rms = 0;
    for (let i = 0; i < samples.length; i++) {
      rms += samples[i] * samples[i];
    }
    rms = Math.sqrt(rms / samples.length);
    return Math.min(100, Math.max(0, 20 * Math.log10(rms + 0.001) + 60));
  }
}