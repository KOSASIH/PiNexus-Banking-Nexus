/**
 * UBI Distributor — Universal Basic Intelligence Token Distribution
 */

import { UBIAllocation } from '../../types';

export class UBIDistributor {
  private allocations: Map<string, UBIAllocation> = new Map();
  private readonly BASE_DAILY = BigInt(100) * BigInt(1e18);
  private readonly MAX_MULTIPLIER = 5.0;

  constructor() {
    console.log('[UBI] Distributor initialized');
  }

  async registerUser(address: string): Promise<UBIAllocation> {
    const allocation: UBIAllocation = {
      address,
      dailyBase: this.BASE_DAILY,
      engagementMultiplier: 1.0,
      agiContributionBonus: BigInt(0),
      totalDaily: this.BASE_DAILY,
      lastDistribution: 0,
      lifetimeReceived: BigInt(0),
      eligible: true,
    };
    this.allocations.set(address, allocation);
    return allocation;
  }

  async distribute(): Promise<{ totalDistributed: bigint; recipients: number }> {
    let total = BigInt(0);
    let count = 0;

    for (const [, alloc] of this.allocations) {
      if (!alloc.eligible) continue;
      const amount = this.calculateDaily(alloc);
      alloc.totalDaily = amount;
      alloc.lifetimeReceived += amount;
      alloc.lastDistribution = Date.now();
      total += amount;
      count++;
    }

    console.log(`[UBI] Distributed to ${count} users, total: ${total}`);
    return { totalDistributed: total, recipients: count };
  }

  async updateEngagement(address: string, multiplier: number): Promise<void> {
    const alloc = this.allocations.get(address);
    if (alloc) {
      alloc.engagementMultiplier = Math.min(this.MAX_MULTIPLIER, multiplier);
    }
  }

  async addAGIBonus(address: string, bonus: bigint): Promise<void> {
    const alloc = this.allocations.get(address);
    if (alloc) {
      alloc.agiContributionBonus += bonus;
    }
  }

  getStatus(address: string): UBIAllocation | undefined {
    return this.allocations.get(address);
  }

  private calculateDaily(alloc: UBIAllocation): bigint {
    const base = alloc.dailyBase;
    const multiplied = (base * BigInt(Math.floor(alloc.engagementMultiplier * 100))) / BigInt(100);
    return multiplied + alloc.agiContributionBonus;
  }
}
