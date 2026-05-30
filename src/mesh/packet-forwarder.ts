import { RoutingTable } from "./routing-table.js";

export class PacketForwarder {
  private routingTable: RoutingTable;
  private forwardedPackets: Set<string> = new Set();
  
  constructor(routingTable: RoutingTable) {
    this.routingTable = routingTable;
  }
  
  forward(source: string, target: string, data: Uint8Array, sendCallback: (target: string, data: string) => void): boolean {
    if (target === "BROADCAST") {
      const packetId = this.getPacketId(source, data);
      if (this.forwardedPackets.has(packetId)) return false;
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
  
  private getPacketId(source: string, data: Uint8Array): string {
    const hash = data.reduce((acc, val) => acc + val, 0);
    return `${source}-${data.length}-${hash}`;
  }
}