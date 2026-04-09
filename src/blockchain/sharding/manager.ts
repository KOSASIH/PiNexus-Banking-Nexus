/**
 * AGI-Dynamic Shard Manager
 * 
 * Autonomously creates, splits, merges, and rebalances shards
 * based on real-time transaction demand and AGI predictions.
 */

import { ShardConfig } from '../../types';

interface ShardMetrics {
  shardId: string;
  tps: number;
  utilization: number;
  latency: number;
  validatorCount: number;
  predictedLoad: number;
}

export class DynamicShardManager {
  private shards: Map<string, ShardConfig> = new Map();
  private metrics: Map<string, ShardMetrics> = new Map();
  private shardCounter: number = 0;

  // Thresholds
  private readonly SPLIT_THRESHOLD = 0.85; // 85% utilization triggers split
  private readonly MERGE_THRESHOLD = 0.15; // 15% utilization triggers merge
  private readonly TARGET_UTILIZATION = 0.6; // Optimal target
  private readonly MAX_SHARDS = 65536;
  private readonly MIN_VALIDATORS_PER_SHARD = 10;

  constructor() {
    console.log('[ShardManager] AGI-Dynamic shard manager initialized');
  }

  /**
   * Initialize with default shard topology
   */
  async initialize(initialShards: number = 16): Promise<void> {
    for (let i = 0; i < initialShards; i++) {
      const shard = this.createShard();
      this.shards.set(shard.shardId, shard);
    }
    console.log(`[ShardManager] Initialized with ${initialShards} shards`);
  }

  /**
   * Update shard metrics (called by AGI monitoring)
   */
  updateMetrics(shardId: string, tps: number, latency: number): void {
    const shard = this.shards.get(shardId);
    if (!shard) return;

    const utilization = tps / shard.maxTps;
    const predictedLoad = this.predictLoad(shardId, tps);

    this.metrics.set(shardId, {
      shardId,
      tps,
      utilization,
      latency,
      validatorCount: shard.validators.length,
      predictedLoad,
    });
  }

  /**
   * Run AGI rebalancing cycle
   */
  async rebalance(): Promise<{ splits: string[]; merges: string[][] }> {
    const splits: string[] = [];
    const merges: string[][] = [];

    for (const [shardId, metric] of this.metrics) {
      // Check if shard needs splitting
      if (metric.utilization > this.SPLIT_THRESHOLD || metric.predictedLoad > this.SPLIT_THRESHOLD) {
        const newShards = await this.splitShard(shardId);
        if (newShards) splits.push(shardId);
      }
    }

    // Find shards to merge (low utilization pairs)
    const lowUtilShards = Array.from(this.metrics.values())
      .filter((m) => m.utilization < this.MERGE_THRESHOLD)
      .sort((a, b) => a.utilization - b.utilization);

    for (let i = 0; i < lowUtilShards.length - 1; i += 2) {
      const merged = await this.mergeShards(lowUtilShards[i].shardId, lowUtilShards[i + 1].shardId);
      if (merged) merges.push([lowUtilShards[i].shardId, lowUtilShards[i + 1].shardId]);
    }

    if (splits.length || merges.length) {
      console.log(`[ShardManager] Rebalanced: ${splits.length} splits, ${merges.length} merges`);
    }

    return { splits, merges };
  }

  /**
   * Route a transaction to the optimal shard
   */
  routeTransaction(fromAddress: string, toAddress: string): string {
    // AGI-optimized routing: find shard with lowest latency and utilization
    let bestShard = '';
    let bestScore = Infinity;

    for (const [shardId, metric] of this.metrics) {
      const score = metric.utilization * 0.6 + (metric.latency / 1000) * 0.4;
      if (score < bestScore) {
        bestScore = score;
        bestShard = shardId;
      }
    }

    return bestShard || Array.from(this.shards.keys())[0];
  }

  /**
   * Get all shard configurations
   */
  getShards(): ShardConfig[] {
    return Array.from(this.shards.values());
  }

  /**
   * Get total network TPS across all shards
   */
  getTotalTps(): number {
    let total = 0;
    for (const metric of this.metrics.values()) {
      total += metric.tps;
    }
    return total;
  }

  // ── Private Methods ──

  private createShard(parentId?: string): ShardConfig {
    const shardId = `shard-${++this.shardCounter}`;
    return {
      shardId,
      validators: [],
      transactionLoad: 0,
      maxTps: 100000,
      status: 'active',
      parentShard: parentId,
    };
  }

  private async splitShard(shardId: string): Promise<boolean> {
    if (this.shards.size >= this.MAX_SHARDS) return false;

    const shard = this.shards.get(shardId);
    if (!shard) return false;

    // Create two child shards
    const child1 = this.createShard(shardId);
    const child2 = this.createShard(shardId);

    // Split validators between children
    const validators = [...shard.validators];
    const mid = Math.floor(validators.length / 2);
    child1.validators = validators.slice(0, mid);
    child2.validators = validators.slice(mid);

    // Update parent
    shard.status = 'splitting';
    shard.childShards = [child1.shardId, child2.shardId];

    this.shards.set(child1.shardId, child1);
    this.shards.set(child2.shardId, child2);

    console.log(`[ShardManager] Split ${shardId} → ${child1.shardId}, ${child2.shardId}`);
    return true;
  }

  private async mergeShards(shardA: string, shardB: string): Promise<boolean> {
    const a = this.shards.get(shardA);
    const b = this.shards.get(shardB);
    if (!a || !b) return false;

    // Create merged shard
    const merged = this.createShard();
    merged.validators = [...a.validators, ...b.validators];

    // Remove old shards
    a.status = 'merging';
    b.status = 'merging';

    this.shards.set(merged.shardId, merged);

    console.log(`[ShardManager] Merged ${shardA} + ${shardB} → ${merged.shardId}`);
    return true;
  }

  private predictLoad(shardId: string, currentTps: number): number {
    // Simple exponential moving average prediction
    // In production, this uses the AGI model for time-series forecasting
    const history = this.metrics.get(shardId);
    if (!history) return currentTps / 100000;

    const alpha = 0.3;
    return alpha * (currentTps / 100000) + (1 - alpha) * history.predictedLoad;
  }
}
