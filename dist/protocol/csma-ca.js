"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSMA_CA = void 0;
class CSMA_CA {
    constructor() {
        this.isChannelBusy = false;
        this.backoffSlots = 8;
        this.slotTime = 100;
    }
    async waitForChannel() {
        let backoff = Math.floor(Math.random() * this.backoffSlots);
        while (this.isChannelBusy) {
            await this.sleep(this.slotTime * backoff);
            backoff = Math.min(backoff * 2, 64);
        }
        this.isChannelBusy = true;
        await this.sleep(this.slotTime);
        this.isChannelBusy = false;
    }
    canReceive() {
        return !this.isChannelBusy;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.CSMA_CA = CSMA_CA;
