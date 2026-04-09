/**
 * PiNexus Chain - Core Blockchain Implementation
 */

import { Block, Transaction, PiNexusConfig, NetworkStats, ShardConfig } from '../../types';

export class PiNexusChain {
  private config: PiNexusConfig;
  private blocks: Map<string, Block> = new Map();
  private pendingTransactions: Transaction[] = [];
  private shards: Map<string, ShardConfig> = new Map();
  private height: number = 0;

  constructor(config: PiNexusConfig) {
    this.config = config;
    console.log(`[PiNexusChain] Initializing ${config.network} network`);
  }

  /**
   * Initialize the blockchain with genesis block
   */
  async initialize(): Promise<void> {
    const genesisBlock = this.createGenesisBlock();
    this.blocks.set(genesisBlock.hash, genesisBlock);
    this.height = 0;

    // Initialize default shard
    this.shards.set('shard-0', {
      shardId: 'shard-0',
      validators: [],
      transactionLoad: 0,
      maxTps: 100000,
      status: 'active',
    });

    console.log(`[PiNexusChain] Genesis block created: ${genesisBlock.hash}`);
    console.log(`[PiNexusChain] Network ready on ${this.config.network}`);
  }

  /**
   * Submit a transaction to the mempool
   */
  async submitTransaction(tx: Transaction): Promise<string> {
    // Validate transaction
    this.validateTransaction(tx);
    
    // Add to pending pool
    this.pendingTransactions.push(tx);
    
    // Route to appropriate shard
    const shardId = this.routeToShard(tx);
    console.log(`[PiNexusChain] TX ${tx.hash} → Shard ${shardId}`);
    
    return tx.hash;
  }

  /**
   * Produce a new block (called by PoI consensus winner)
   */
  async produceBlock(validatorAddress: string): Promise<Block> {
    const previousBlock = this.getLatestBlock();
    const transactions = this.selectTransactions();

    const block: Block = {
      height: this.height + 1,
      hash: this.computeBlockHash(previousBlock, transactions),
      previousHash: previousBlock.hash,
      timestamp: Date.now(),
      transactions,
      validator: validatorAddress,
      intelligenceProof: {
        taskId: `task-${this.height + 1}`,
        taskType: 'inference',
        difficulty: this.calculateDifficulty(),
        result: new Uint8Array(32),
        accuracy: 0.99,
        computeTime: 100,
        minerAddress: validatorAddress,
        validatorSignatures: [],
        intelligenceScore: 0,
      },
      shardId: 'shard-0',
      stateRoot: this.computeStateRoot(),
      receiptsRoot: this.computeReceiptsRoot(transactions),
    };

    this.blocks.set(block.hash, block);
    this.height = block.height;
    this.pendingTransactions = this.pendingTransactions.filter(
      (tx) => !transactions.includes(tx)
    );

    console.log(`[PiNexusChain] Block #${block.height} produced by ${validatorAddress}`);
    return block;
  }

  /**
   * Get network statistics
   */
  getNetworkStats(): NetworkStats {
    return {
      totalNodes: 0,
      activeValidators: this.config.chain.validatorCount,
      activeMiners: 0,
      totalShards: this.shards.size,
      currentTps: 0,
      peakTps: 0,
      totalTransactions: BigInt(0),
      totalBlocks: this.height,
      activeAgents: this.config.agi.totalAgents,
      networkHash: this.getLatestBlock().hash,
    };
  }

  /**
   * Get block by hash
   */
  getBlock(hash: string): Block | undefined {
    return this.blocks.get(hash);
  }

  /**
   * Get latest block
   */
  getLatestBlock(): Block {
    // Simple: find block at current height
    for (const block of this.blocks.values()) {
      if (block.height === this.height) return block;
    }
    throw new Error('No blocks found');
  }

  /**
   * Get current chain height
   */
  getHeight(): number {
    return this.height;
  }

  // ── Private Methods ──

  private createGenesisBlock(): Block {
    return {
      height: 0,
      hash: '0x' + '0'.repeat(64),
      previousHash: '0x' + '0'.repeat(64),
      timestamp: Date.now(),
      transactions: [],
      validator: '0x0000000000000000000000000000000000000000',
      intelligenceProof: {
        taskId: 'genesis',
        taskType: 'verification',
        difficulty: 0,
        result: new Uint8Array(0),
        accuracy: 1.0,
        computeTime: 0,
        minerAddress: '0x0000000000000000000000000000000000000000',
        validatorSignatures: [],
        intelligenceScore: 0,
      },
      shardId: 'shard-0',
      stateRoot: '0x' + '0'.repeat(64),
      receiptsRoot: '0x' + '0'.repeat(64),
    };
  }

  private validateTransaction(tx: Transaction): void {
    if (!tx.hash) throw new Error('Transaction hash required');
    if (!tx.from) throw new Error('Sender address required');
    if (!tx.to) throw new Error('Recipient address required');
    if (tx.value < BigInt(0)) throw new Error('Negative value not allowed');
  }

  private selectTransactions(): Transaction[] {
    // Select up to 10000 transactions sorted by gas price
    return [...this.pendingTransactions]
      .sort((a, b) => Number(b.gasPrice - a.gasPrice))
      .slice(0, 10000);
  }

  private routeToShard(tx: Transaction): string {
    // Simple hash-based shard routing
    const shardIds = Array.from(this.shards.keys());
    const index = parseInt(tx.from.slice(-4), 16) % shardIds.length;
    return shardIds[index];
  }

  private calculateDifficulty(): number {
    return Math.min(1000, 100 + this.height * 0.01);
  }

  private computeBlockHash(previous: Block, txs: Transaction[]): string {
    // Simplified hash computation
    const data = `${previous.hash}:${txs.length}:${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
  }

  private computeStateRoot(): string {
    return '0x' + Math.random().toString(16).slice(2).padStart(64, '0');
  }

  private computeReceiptsRoot(txs: Transaction[]): string {
    return '0x' + txs.length.toString(16).padStart(64, '0');
  }
}
