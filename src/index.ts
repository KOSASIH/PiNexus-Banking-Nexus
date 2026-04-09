/**
 * PiNexus Core v0.4.0 — Entry Point
 * The Ultimate Decentralized AGI-Powered Ecosystem
 * Hybrid Dual Coin System: $PNX + $PiNEX (USD-pegged stablecoin)
 */

// ── Blockchain Layer ──
export { PiNexusChain } from './blockchain/chain';
export { ProofOfIntelligence } from './blockchain/consensus/poi';
export { QuantumCrypto } from './blockchain/crypto/quantum';
export { DynamicShardManager } from './blockchain/sharding/manager';

// ── AGI Engine — Core ──
export { SuperAGICore } from './agi-engine/core/agi-core';
export { TransformerEngine } from './agi-engine/core/transformer';

// ── AGI Engine — Training ──
export { RLHFEngine } from './agi-engine/training/rlhf';
export { DistributedTrainingEngine } from './agi-engine/training/distributed';

// ── AGI Engine — RAG ──
export { RAGEngine } from './agi-engine/rag/engine';

// ── AGI Engine — Multi-Modal ──
export { MultiModalEngine } from './agi-engine/multimodal/engine';

// ── AGI Engine — Quantum AI ──
export { QuantumNeuralNetwork } from './agi-engine/quantum/qnn';

// ── AGI Engine — Knowledge Graph ──
export { KnowledgeGraphEngine } from './agi-engine/knowledge/graph';

// ── AGI Engine — World Model ──
export { WorldModelEngine } from './agi-engine/world-model/engine';

// ── AGI Engine — Safety & Alignment ──
export { AISafetyFramework } from './agi-engine/safety/framework';

// ── AGI Engine — Code Auditor ──
export { AutonomousCodeAuditor } from './agi-engine/auditor/engine';

// ── AGI Engine — Federated Learning ──
export { FederatedLearningEngine } from './agi-engine/federated/engine';

// ── AGI Engine — Agents ──
export { SwarmOrchestrator } from './agi-engine/swarm/orchestrator';
export { AgentFactory } from './agi-engine/agents/factory';
export { AIAgent } from './agi-engine/agents/agent-framework';

// ── AGI Engine — Mining & Self-Dev ──
export { NeuralMiner } from './agi-engine/neural-mining/miner';
export { AutoSelfDevelopmentEngine } from './agi-engine/self-development/engine';

// ── Dual Coin System ──
export { HybridDualCoinService } from './services/dual-coin/service';

// ── Service Layer ──
export { DeFiEngine } from './services/defi/engine';
export { RWANexus } from './services/rwa/nexus';
export { MetaverseEngine } from './services/metaverse/engine';
export { UBIDistributor } from './services/ubi/distributor';
export { CrossChainBridge } from './services/bridge/router';
export { PrivacyShield } from './services/privacy/zkproof';

// ── Advanced Services ──
export { PredictiveMarketsEngine } from './services/predictions/engine';
export { AutonomousDAO } from './services/governance/dao';
export { IdentityEngine } from './services/identity/engine';
export { SecurityFortress } from './services/security/fortress';
export { AIMarketplace } from './services/marketplace/ai-marketplace';
export { InterplanetaryProtocol } from './services/interplanetary/protocol';

// ── Types ──
export * from './types';

// ── Constants ──
export const VERSION = '0.4.0-alpha';
export const NETWORK = 'pinexus-testnet';
export const DUAL_COINS = { utility: '$PNX', stable: '$PiNEX' };
export const AI_CAPABILITIES = [
  'transformer_inference',
  'rlhf_training',
  'dpo_training',
  'constitutional_ai',
  'rag_retrieval',
  'multimodal_vision',
  'multimodal_audio',
  'multimodal_code',
  'federated_learning',
  'agent_framework',
  'self_development',
  'neural_mining',
  'quantum_neural_network',
  'knowledge_graph',
  'world_model',
  'ai_safety',
  'code_auditor',
  'distributed_training',
] as const;

console.log(`
╔════════════════════════════════════════════════════════════╗
║                PiNexus Core v${VERSION}                  ║
║         The Ultimate Decentralized AGI Economy             ║
║         Hybrid Dual Coin: $PNX + $PiNEX (USD peg)         ║
║         ${AI_CAPABILITIES.length} AI Capabilities • 5000 Agents • Self-Evolving    ║
╚════════════════════════════════════════════════════════════╝
`);
