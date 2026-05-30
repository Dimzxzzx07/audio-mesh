export class RoutingTable {
  private routes: Map<string, { nextHop: string; hops: number; timestamp: number }> = new Map();
  private nodeId: string;
  
  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }
  
  updateRoute(destination: string, hops: number): void {
    const existing = this.routes.get(destination);
    if (!existing || existing.hops > hops) {
      this.routes.set(destination, {
        nextHop: destination,
        hops: hops,
        timestamp: Date.now()
      });
    }
  }
  
  getNextHop(destination: string): string | null {
    const route = this.routes.get(destination);
    if (route && Date.now() - route.timestamp < 60000) {
      return route.nextHop;
    }
    return null;
  }
  
  getAllRoutes(): Map<string, any> {
    return this.routes;
  }
  
  addRoute(destination: string, nextHop: string, hops: number): void {
    this.routes.set(destination, {
      nextHop: nextHop,
      hops: hops,
      timestamp: Date.now()
    });
  }
}