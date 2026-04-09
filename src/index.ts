/**
 * PiNexus Core v0.5.0 — Entry Point
 * The Ultimate Decentralized AGI-Powered Ecosystem
 * Super Advanced Technologies for Unrivaled Supremacy
 * Hybrid Dual Coin System: $PNX + $PiNEX (USD-pegged stablecoin)
 */

// ── Blockchain Layer ──
export { PiNexusChain } from './blockchain/chain';
export { ProofOfIntelligence } from './blockchain/consensus/poi';
export { QuantumProofOfIntelligence } from './blockchain/consensus/q-poi';
export { QuantumCrypto } from './blockchain/crypto/quantum';
export { ZKHolographicProofs } from './blockchain/crypto/zk-holo';
export { DynamicShardManager } from './blockchain/sharding/manager';
export { FractalShardingV2 } from './blockchain/sharding/fractal-v2';
export { TemporalBlockchain } from './blockchain/temporal/engine';

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
export { QuantumNeuralEntanglement } from './agi-engine/quantum/entanglement';

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

// ── AGI Engine — Super Advanced (World-First Innovations) ──
export { HoloVerseAGI } from './agi-engine/holographic/hagi';
export { SymbioNetEngine } from './agi-engine/symbionet/engine';
export { EvoSwarmDynamics } from './agi-engine/evoswarm/engine';
export { PrediCausalityEngine } from './agi-engine/predicausality/engine';

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

// ── Super Advanced Services ──
export { AGISentinelShields, QuantumSoulBinding } from './services/security/sentinel';
export { NeuralVerseGenerator, HyperRWAOracle } from './services/metaverse/neuralverse';
export { InfiniteYieldAGI, CarbonNegativeMining } from './services/sustainability/green-mining';

// ── Edge AI & IoT ──
export { NanoAGIChipManager, SwarmEdgeNetwork } from './edge/swarm-edge';

// ── Types ──
export * from './types';

// ── Constants ──
export const VERSION = '0.5.0-alpha';
export const NETWORK = 'pinexus-testnet';
export const DUAL_COINS = { utility: '$PNX', stable: '$PiNEX' };
export const SUPER_ADVANCED_TECHNOLOGIES = [
  // Quantum-Enhanced AGI
  'quantum_neural_entanglement',
  'quantum_proof_of_intelligence',
  // Novel AGI Architectures
  'holoverse_agi',
  'symbionet_human_ai_symbiosis',
  'evoswarm_dynamics',
  'predicausality_engine',
  // Super Blockchain
  'fractal_sharding_v2',
  'zk_holographic_proofs',
  'temporal_blockchain',
  // Edge AI & IoT
  'nano_agi_chips',
  'swarm_edge_network',
  // Revolutionary Security
  'agi_sentinel_shields',
  'quantum_soul_binding',
  // Metaverse & RWA
  'neuralverse_generator',
  'hyper_rwa_oracle',
  // Economic & Sustainability
  'infinite_yield_agi',
  'carbon_negative_mining',
] as const;

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
  ...SUPER_ADVANCED_TECHNOLOGIES,
] as const;

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                 PiNexus Core v${VERSION}                    ║
║          The Ultimate Decentralized AGI Economy               ║
║          Hybrid Dual Coin: $PNX + $PiNEX (USD peg)           ║
║          ${AI_CAPABILITIES.length} AI Capabilities • 5000 Agents • Self-Evolving      ║
║          ${SUPER_ADVANCED_TECHNOLOGIES.length} Super Advanced World-First Innovations          ║
║          🚀 The Singularity Starts Here                       ║
╚═══════════════════════════════════════════════════════════════╝
`);
