"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingTable = void 0;
class RoutingTable {
    constructor(nodeId) {
        this.routes = new Map();
        this.nodeId = nodeId;
    }
    updateRoute(destination, hops) {
        const existing = this.routes.get(destination);
        if (!existing || existing.hops > hops) {
            this.routes.set(destination, {
                nextHop: destination,
                hops: hops,
                timestamp: Date.now()
            });
        }
    }
    getNextHop(destination) {
        const route = this.routes.get(destination);
        if (route && Date.now() - route.timestamp < 60000) {
            return route.nextHop;
        }
        return null;
    }
    getAllRoutes() {
        return this.routes;
    }
    addRoute(destination, nextHop, hops) {
        this.routes.set(destination, {
            nextHop: nextHop,
            hops: hops,
            timestamp: Date.now()
        });
    }
}
exports.RoutingTable = RoutingTable;
