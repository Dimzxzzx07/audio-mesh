export class CSMA_CA {
  private isChannelBusy: boolean = false;
  private backoffSlots: number = 8;
  private slotTime: number = 100;
  
  async waitForChannel(): Promise<void> {
    let backoff = Math.floor(Math.random() * this.backoffSlots);
    
    while (this.isChannelBusy) {
      await this.sleep(this.slotTime * backoff);
      backoff = Math.min(backoff * 2, 64);
    }
    
    this.isChannelBusy = true;
    await this.sleep(this.slotTime);
    this.isChannelBusy = false;
  }
  
  canReceive(): boolean {
    return !this.isChannelBusy;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}