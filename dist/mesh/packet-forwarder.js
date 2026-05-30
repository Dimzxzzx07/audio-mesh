"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketForwarder = void 0;
class PacketForwarder {
    constructor(routingTable) {
        this.forwardedPackets = new Set();
        this.routingTable = routingTable;
    }
    forward(source, target, data, sendCallback) {
        if (target === "BROADCAST") {
            const packetId = this.getPacketId(source, data);
            if (this.forwardedPackets.has(packetId))
                return false;
            this.forwardedPackets.add(packetId);
            return true;
        }
        const nextHop = this.routingTable.getNextHop(target);
        if (nextHop && nextHop !== source) {
            const packetId = this.getPacketId(source, data);
            if (!this.forwardedPackets.has(packetId)) {
                this.forwardedPackets.add(packetId);
                const message = new TextDecoder().decode(data);
                sendCallback(nextHop, message);
                return true;
            }
        }
        return false;
    }
    getPacketId(source, data) {
        const hash = data.reduce((acc, val) => acc + val, 0);
        return `${source}-${data.length}-${hash}`;
    }
}
exports.PacketForwarder = PacketForwarder;
