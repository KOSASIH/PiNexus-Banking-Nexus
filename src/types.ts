/**
 * PiNexus Core Type Definitions
 */

// ============================================================
// Blockchain Types
// ============================================================

export interface Block {
  height: number;
  hash: string;
  previousHash: string;
  timestamp: number;
  transactions: Transaction[];
  validator: string;
  intelligenceProof: IntelligenceProof;
  shardId: string;
  stateRoot: string;
  receiptsRoot: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  data: Uint8Array;
  nonce: number;
  gasLimit: bigint;
  gasPrice: bigint;
  signature: QuantumSignature;
  timestamp: number;
}

export interface IntelligenceProof {
  taskId: string;
  taskType: AITaskType;
  difficulty: number;
  result: Uint8Array;
  accuracy: number;
  computeTime: number;
  minerAddress: string;
  validatorSignatures: QuantumSignature[];
  intelligenceScore: number;
}

export interface QuantumSignature {
  algorithm: 'dilithium' | 'falcon';
  publicKey: Uint8Array;
  signature: Uint8Array;
  securityLevel: 2 | 3 | 5;
}

export interface ShardConfig {
  shardId: string;
  validators: string[];
  transactionLoad: number;
  maxTps: number;
  status: 'active' | 'splitting' | 'merging' | 'idle';
  parentShard?: string;
  childShards?: string[];
}

// ============================================================
// AGI Engine Types
// ============================================================

export type AITaskType =
  | 'inference'
  | 'training'
  | 'data_processing'
  | 'prediction'
  | 'generation'
  | 'verification'
  | 'optimization';

export type AgentType =
  | 'oracle'
  | 'defi'
  | 'governance'
  | 'innovation'
  | 'security'
  | 'user';

export type AgentStatus =
  | 'active'
  | 'idle'
  | 'processing'
  | 'upgrading'
  | 'offline';

export interface Agent {
  id: string;
  type: AgentType;
  subType: string;
  status: AgentStatus;
  performanceScore: number;
  tasksCompleted: number;
  uptime: number;
  version: string;
  capabilities: string[];
  currentTask?: AITask;
  swarmConnections: string[];
}

export interface AITask {
  id: string;
  type: AITaskType;
  difficulty: number;
  payload: Uint8Array;
  assignedAgent?: string;
  assignedMiner?: string;
  status: 'pending' | 'assigned' | 'processing' | 'completed' | 'failed';
  result?: Uint8Array;
  reward: bigint;
  deadline: number;
  createdAt: number;
  completedAt?: number;
}

export interface SwarmMessage {
  id: string;
  from: string;
  to: string | 'broadcast';
  type: 'task_assignment' | 'vote' | 'alert' | 'sync' | 'evolution_proposal';
  payload: unknown;
  timestamp: number;
  signature: QuantumSignature;
}

export interface NeuralMiningSession {
  sessionId: string;
  minerAddress: string;
  deviceProfile: DeviceProfile;
  assignedTasks: AITask[];
  totalEarned: bigint;
  intelligenceScore: number;
  startTime: number;
  status: 'active' | 'paused' | 'completed';
}

export interface DeviceProfile {
  cpuCores: number;
  gpuModel?: string;
  gpuVRAM?: number;
  ramGB: number;
  bandwidthMbps: number;
  platform: 'web' | 'mobile' | 'desktop' | 'iot';
}

// ============================================================
// DeFi Types
// ============================================================

export interface Vault {
  id: string;
  name: string;
  strategy: string;
  apy: number;
  tvl: bigint;
  riskScore: number;
  managedBy: string[];
  assets: string[];
  minDeposit: bigint;
  lockPeriod?: number;
  status: 'active' | 'paused' | 'deprecated';
}

export interface LiquidityPool {
  id: string;
  tokenA: string;
  tokenB: string;
  reserveA: bigint;
  reserveB: bigint;
  fee: number;
  volume24h: bigint;
  apy: number;
}

export interface TradeOrder {
  id: string;
  type: 'market' | 'limit' | 'stop';
  side: 'buy' | 'sell';
  pair: string;
  amount: bigint;
  price?: bigint;
  executedBy?: string;
  status: 'pending' | 'filled' | 'partial' | 'cancelled';
  timestamp: number;
}

// ============================================================
// RWA Types
// ============================================================

export interface RealWorldAsset {
  id: string;
  assetType: 'real_estate' | 'art' | 'equity' | 'commodity' | 'bond';
  name: string;
  valuation: bigint;
  currency: string;
  totalFractions: number;
  availableFractions: number;
  pricePerFraction: bigint;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedBy: string[];
  documents: string[];
  yieldRate?: number;
}

// ============================================================
// Metaverse Types
// ============================================================

export interface MetaverseLand {
  parcelId: string;
  coordinates: { x: number; y: number; z: number };
  zone: string;
  size: string;
  owner?: string;
  price: bigint;
  features: string[];
  generatedBy: string;
  buildStatus: 'empty' | 'building' | 'complete';
}

// ============================================================
// Governance Types
// ============================================================

export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'draft' | 'analysis' | 'discussion' | 'voting' | 'passed' | 'rejected' | 'executed';
  agiAnalysis?: {
    impactScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendation: 'approve' | 'reject' | 'amend';
    simulatedOutcomes: string[];
  };
  votesFor: bigint;
  votesAgainst: bigint;
  quorumReached: boolean;
  createdAt: number;
  votingEnds: number;
}

// ============================================================
// UBI Types
// ============================================================

export interface UBIAllocation {
  address: string;
  dailyBase: bigint;
  engagementMultiplier: number;
  agiContributionBonus: bigint;
  totalDaily: bigint;
  lastDistribution: number;
  lifetimeReceived: bigint;
  eligible: boolean;
}

// ============================================================
// Network Types
// ============================================================

export interface PeerInfo {
  peerId: string;
  address: string;
  latency: number;
  version: string;
  shardIds: string[];
  isValidator: boolean;
  stakeAmount: bigint;
  connectedSince: number;
}

export interface NetworkStats {
  totalNodes: number;
  activeValidators: number;
  activeMiners: number;
  totalShards: number;
  currentTps: number;
  peakTps: number;
  totalTransactions: bigint;
  totalBlocks: number;
  activeAgents: number;
  networkHash: string;
}

// ============================================================
// Dual Coin System Types
// ============================================================

export interface DualCoinConfig {
  pnx: {
    address: string;
    symbol: 'PNX';
    decimals: 18;
    totalSupply: bigint;
  };
  pinex: {
    address: string;
    symbol: 'PiNEX';
    decimals: 18;
    peg: 'USD';
    pegRatio: 1;
    stabilityMechanism: 'hybrid'; // collateral + algorithmic
  };
  swapEngine: {
    fee: number;
    maxPerTx: bigint;
    dailyLimit: bigint;
    cooldown: number;
    twapWindow: number;
  };
  arbitrage: {
    enabled: boolean;
    minSpread: number;
    maxPosition: bigint;
  };
}

export interface StablecoinVault {
  id: string;
  owner: string;
  collateralType: string;
  collateralAmount: bigint;
  debtPiNEX: bigint;
  collateralRatio: number;
  healthFactor: number;
  liquidationPrice: bigint;
  stabilityFee: number;
  lastAccrual: number;
}

export interface PegStatus {
  currentPrice: number;
  targetPrice: number;
  deviation: number;
  band: 'stable' | 'warning' | 'critical';
  lastUpdate: number;
  circuitBreakerActive: boolean;
}

// ============================================================
// Self-Development Types
// ============================================================

export interface EvolutionReport {
  generation: number;
  bestFitness: number;
  avgFitness: number;
  mutations: number;
  eliteSurvivors: number;
  convergenceRate: number;
}

export interface SecurityPatch {
  id: string;
  target: string;
  vulnerability: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  testsPassed: number;
  testsTotal: number;
  approved: boolean;
  deployedAt: number | null;
}

export interface SelfHealReport {
  component: string;
  issue: string;
  resolution: string;
  automated: boolean;
  downtime: number; // ms
  timestamp: number;
}

// ============================================================
// Identity & Reputation Types
// ============================================================

export interface DIDDocument {
  id: string; // did:pinexus:0x...
  controller: string;
  verificationMethods: VerificationMethod[];
  services: DIDService[];
  created: number;
  updated: number;
}

export interface VerificationMethod {
  id: string;
  type: 'QuantumResistantKey2024' | 'Ed25519VerificationKey2020';
  controller: string;
  publicKeyMultibase: string;
}

export interface DIDService {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface ReputationScore {
  did: string;
  overall: number; // 0-1000
  dimensions: {
    mining: number;
    governance: number;
    defi: number;
    social: number;
    development: number;
    security: number;
  };
  percentile: number;
  updatedAt: number;
}

// ============================================================
// Marketplace Types
// ============================================================

export interface MarketplaceListing {
  id: string;
  type: 'model' | 'dataset' | 'compute' | 'service';
  name: string;
  creator: string;
  price: bigint;
  rating: number;
  sales: number;
  revenue: bigint;
  category: string;
  createdAt: number;
}

// ============================================================
// Interplanetary Types
// ============================================================

export interface PlanetaryNodeConfig {
  location: 'earth' | 'leo_orbit' | 'lunar' | 'mars' | 'deep_space';
  role: 'validator' | 'relay' | 'archive' | 'light';
  latencyBudget: number;
  bandwidthMin: number;
  redundancy: number;
}

// ============================================================
// Configuration Types
// ============================================================

export interface PiNexusConfig {
  network: 'mainnet' | 'testnet' | 'devnet';
  chain: {
    blockTime: number;
    maxShards: number;
    validatorCount: number;
    minStake: bigint;
  };
  agi: {
    totalAgents: number;
    swarmProtocol: string;
    selfEvolution: boolean;
  };
  mining: {
    baseReward: bigint;
    halvingInterval: number;
    maxDifficulty: number;
  };
  tokenomics: {
    totalSupply: bigint;
    burnRate: number;
    taxRate: number;
  };
}
