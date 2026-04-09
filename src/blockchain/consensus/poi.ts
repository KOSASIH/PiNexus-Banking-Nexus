/**
 * Proof-of-Intelligence (PoI) Consensus Engine
 * 
 * Replaces energy-wasteful PoW with useful AI computation.
 * Miners earn $PNX by contributing intelligence to the network.
 */

import { AITask, AITaskType, IntelligenceProof, Agent } from '../../types';

interface ValidatorInfo {
  address: string;
  stakeAmount: bigint;
  reliability: number;
  region: string;
  hardwareScore: number;
}

interface ConsensusRound {
  epoch: number;
  validators: ValidatorInfo[];
  tasks: AITask[];
  proofs: Map<string, IntelligenceProof>;
  blockProducer?: string;
  status: 'collecting' | 'validating' | 'finalized';
}

export class ProofOfIntelligence {
  private validators: Map<string, ValidatorInfo> = new Map();
  private currentEpoch: number = 0;
  private currentRound: ConsensusRound | null = null;
  private taskQueue: AITask[] = [];
  private intelligenceScores: Map<string, number> = new Map();

  // Configuration
  private readonly VALIDATORS_PER_EPOCH = 1000;
  private readonly BLOCK_TIME_MS = 400;
  private readonly BFT_THRESHOLD = 2 / 3;
  private readonly MIN_STAKE = BigInt('100000000000000000000000'); // 100,000 PNX

  constructor() {
    console.log('[PoI] Proof-of-Intelligence consensus engine initialized');
  }

  /**
   * Register a new validator
   */
  registerValidator(info: ValidatorInfo): boolean {
    if (info.stakeAmount < this.MIN_STAKE) {
      console.log(`[PoI] Validator ${info.address} rejected: insufficient stake`);
      return false;
    }

    this.validators.set(info.address, info);
    this.intelligenceScores.set(info.address, 0);
    console.log(`[PoI] Validator ${info.address} registered (stake: ${info.stakeAmount})`);
    return true;
  }

  /**
   * Start a new consensus epoch
   */
  async startEpoch(): Promise<ConsensusRound> {
    this.currentEpoch++;

    // Select validators using AGI-weighted selection
    const selectedValidators = this.selectValidators();

    // Generate AI tasks for this epoch
    const tasks = this.generateTasks();

    this.currentRound = {
      epoch: this.currentEpoch,
      validators: selectedValidators,
      tasks,
      proofs: new Map(),
      status: 'collecting',
    };

    console.log(`[PoI] Epoch ${this.currentEpoch} started with ${selectedValidators.length} validators`);
    return this.currentRound;
  }

  /**
   * Submit an intelligence proof from a miner
   */
  submitProof(minerAddress: string, proof: IntelligenceProof): boolean {
    if (!this.currentRound || this.currentRound.status !== 'collecting') {
      return false;
    }

    // Verify the proof
    const isValid = this.verifyProof(proof);
    if (!isValid) {
      console.log(`[PoI] Invalid proof from ${minerAddress}`);
      return false;
    }

    // Calculate intelligence score
    const score = this.calculateIntelligenceScore(proof);
    proof.intelligenceScore = score;

    // Update cumulative score
    const currentScore = this.intelligenceScores.get(minerAddress) || 0;
    this.intelligenceScores.set(minerAddress, currentScore + score);

    this.currentRound.proofs.set(minerAddress, proof);
    console.log(`[PoI] Proof accepted from ${minerAddress} (score: ${score})`);
    return true;
  }

  /**
   * Finalize the round and select block producer
   */
  async finalizeRound(): Promise<string> {
    if (!this.currentRound) {
      throw new Error('No active round');
    }

    this.currentRound.status = 'validating';

    // Select block producer based on highest intelligence score in this round
    let maxScore = 0;
    let producer = '';

    for (const [address, proof] of this.currentRound.proofs) {
      if (proof.intelligenceScore > maxScore) {
        maxScore = proof.intelligenceScore;
        producer = address;
      }
    }

    // Verify BFT consensus
    const validVotes = this.currentRound.proofs.size;
    const totalValidators = this.currentRound.validators.length;
    
    if (validVotes / totalValidators < this.BFT_THRESHOLD) {
      throw new Error(`BFT threshold not met: ${validVotes}/${totalValidators}`);
    }

    this.currentRound.blockProducer = producer;
    this.currentRound.status = 'finalized';

    console.log(`[PoI] Round finalized. Block producer: ${producer} (score: ${maxScore})`);
    return producer;
  }

  /**
   * Calculate mining reward for a proof
   */
  calculateReward(proof: IntelligenceProof, baseReward: bigint): bigint {
    const scoreMultiplier = BigInt(Math.floor(proof.intelligenceScore));
    const difficultyBonus = BigInt(proof.difficulty);
    return baseReward + (scoreMultiplier * difficultyBonus) / BigInt(1000);
  }

  /**
   * Get leaderboard of top miners by intelligence score
   */
  getLeaderboard(limit: number = 100): Array<{ address: string; score: number }> {
    return Array.from(this.intelligenceScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([address, score]) => ({ address, score }));
  }

  // ── Private Methods ──

  private selectValidators(): ValidatorInfo[] {
    const allValidators = Array.from(this.validators.values());
    
    // AGI-weighted selection based on stake, reliability, diversity, hardware
    const scored = allValidators.map((v) => ({
      ...v,
      selectionScore:
        Number(v.stakeAmount / BigInt(1e18)) * 0.4 +
        v.reliability * 100 * 0.3 +
        this.diversityScore(v.region) * 0.2 +
        v.hardwareScore * 0.1,
    }));

    // Sort by selection score and take top N
    return scored
      .sort((a, b) => b.selectionScore - a.selectionScore)
      .slice(0, this.VALIDATORS_PER_EPOCH);
  }

  private diversityScore(region: string): number {
    // Simplified: score regions we haven't seen much
    return 50; // Placeholder
  }

  private generateTasks(): AITask[] {
    const taskTypes: AITaskType[] = [
      'inference', 'training', 'data_processing',
      'prediction', 'verification', 'optimization',
    ];

    return Array.from({ length: 100 }, (_, i) => ({
      id: `task-${this.currentEpoch}-${i}`,
      type: taskTypes[i % taskTypes.length],
      difficulty: 100 + Math.floor(Math.random() * 900),
      payload: new Uint8Array(64),
      status: 'pending' as const,
      reward: BigInt(1000 + Math.floor(Math.random() * 9000)) * BigInt(1e18),
      deadline: Date.now() + this.BLOCK_TIME_MS * 1000,
      createdAt: Date.now(),
    }));
  }

  private verifyProof(proof: IntelligenceProof): boolean {
    // Verify:
    // 1. Task exists and is valid
    // 2. Result is non-empty
    // 3. Accuracy meets minimum threshold (0.5)
    // 4. Compute time is reasonable
    return (
      proof.taskId !== '' &&
      proof.result.length > 0 &&
      proof.accuracy >= 0.5 &&
      proof.computeTime > 0 &&
      proof.computeTime < 60000 // Max 60 seconds
    );
  }

  private calculateIntelligenceScore(proof: IntelligenceProof): number {
    // IntelligenceScore = difficulty × accuracy × speed_factor
    const speedFactor = Math.min(2.0, 10000 / proof.computeTime);
    return proof.difficulty * proof.accuracy * speedFactor;
  }
}
