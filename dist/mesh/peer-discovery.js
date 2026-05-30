"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerDiscovery = void 0;
class PeerDiscovery {
    constructor(nodeId) {
        this.peers = new Map();
        this.onPeerDiscoveredCallback = null;
        this.nodeId = nodeId;
        this.startCleanupInterval();
    }
    discoverPeer(peerId, signalStrength) {
        const existing = this.peers.get(peerId);
        if (!existing || Date.now() - existing.lastSeen > 30000) {
            this.peers.set(peerId, {
                lastSeen: Date.now(),
                signalStrength: signalStrength
            });
            if (this.onPeerDiscoveredCallback) {
                this.onPeerDiscoveredCallback(peerId);
            }
        }
        else {
            existing.lastSeen = Date.now();
            existing.signalStrength = (existing.signalStrength + signalStrength) / 2;
        }
    }
    getPeers() {
        const activePeers = [];
        for (const [peerId, data] of this.peers.entries()) {
            if (Date.now() - data.lastSeen < 60000) {
                activePeers.push(peerId);
            }
        }
        return activePeers;
    }
    getBestPeer() {
        let bestPeer = null;
        let bestStrength = -Infinity;
        for (const [peerId, data] of this.peers.entries()) {
            if (Date.now() - data.lastSeen < 60000 && data.signalStrength > bestStrength) {
                bestStrength = data.signalStrength;
                bestPeer = peerId;
            }
        }
        return bestPeer;
    }
    onPeerDiscovered(callback) {
        this.onPeerDiscoveredCallback = callback;
    }
    startCleanupInterval() {
        setInterval(() => {
            const now = Date.now();
            for (const [peerId, data] of this.peers.entries()) {
                if (now - data.lastSeen > 120000) {
                    this.peers.delete(peerId);
                }
            }
        }, 30000);
    }
    calculateSignalStrength(samples) {
        let rms = 0;
        for (let i = 0; i < samples.length; i++) {
            rms += samples[i] * samples[i];
        }
        rms = Math.sqrt(rms / samples.length);
        return Math.min(100, Math.max(0, 20 * Math.log10(rms + 0.001) + 60));
    }
}
exports.PeerDiscovery = PeerDiscovery;
