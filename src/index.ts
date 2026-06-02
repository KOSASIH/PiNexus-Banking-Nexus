/**
 * PiNexus Core v0.6.0 — Entry Point
 * The Ultimate Decentralized AGI-Powered Ecosystem
 * 41 AI Capabilities | 5000 Agents | 1000 Blockchain Networks | ASI-Level Intelligence
 * Hybrid Dual Coin: $PNX + $PiNEX (USD-pegged stablecoin)
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

// ── OmniChain: 1000+ Networks ──
export { CHAIN_REGISTRY, CHAIN_BY_ID, getChainsByTag, getChainsByFamily, getMainnetChains, getL2Chains, REGISTRY_STATS } from './blockchain/multichain/chains-registry';
export { OmniBridge } from './blockchain/multichain/omnibridge';

// ── AGI Engine — Core ──
export { SuperAGICore } from './agi-engine/core/agi-core';
export { TransformerEngine } from './agi-engine/core/transformer';

// ── AGI Engine — Training ──
export { RLHFEngine } from './agi-engine/training/rlhf';
export { DistributedTrainingEngine } from './agi-engine/training/distributed';

// ── AGI Engine — Specialized ──
export { RAGEngine } from './agi-engine/rag/engine';
export { MultiModalEngine } from './agi-engine/multimodal/engine';
export { QuantumNeuralNetwork } from './agi-engine/quantum/qnn';
export { QuantumNeuralEntanglement } from './agi-engine/quantum/entanglement';
export { KnowledgeGraphEngine } from './agi-engine/knowledge/graph';
export { WorldModelEngine } from './agi-engine/world-model/engine';
export { AISafetyFramework } from './agi-engine/safety/framework';
export { AutonomousCodeAuditor } from './agi-engine/auditor/engine';
export { FederatedLearningEngine } from './agi-engine/federated/engine';

// ── AGI Engine — Super Advanced ──
export { HoloVerseAGI } from './agi-engine/holographic/hagi';
export { SymbioNetEngine } from './agi-engine/symbionet/engine';
export { EvoSwarmDynamics } from './agi-engine/evoswarm/engine';
export { PrediCausalityEngine } from './agi-engine/predicausality/engine';

// ── AGI Engine — Absolute Super Intelligence (ASI) ──
export { ArtificialSuperIntelligence, OmegaRecursiveEngine } from './agi-engine/asi/super-intelligence';
export { DigitalConsciousnessEngine } from './agi-engine/consciousness/engine';
export { NeuroSymbolicEngine } from './agi-engine/neuro-symbolic/engine';
export { OmegaPredictionMatrix } from './agi-engine/omega/matrix';
export { AutonomousRnDEngine } from './agi-engine/autonomous-rnd/engine';
export { CognitiveArchitectureEngine } from './agi-engine/cognitive-arch/engine';

// ── AGI Engine — Agents ──
export { SwarmOrchestrator } from './agi-engine/swarm/orchestrator';
export { AgentFactory } from './agi-engine/agents/factory';
export { AIAgent } from './agi-engine/agents/agent-framework';
export { NeuralMiner } from './agi-engine/neural-mining/miner';
export { AutoSelfDevelopmentEngine } from './agi-engine/self-development/engine';

// ── Dual Coin System ──
export { HybridDualCoinService } from './services/dual-coin/service';

// ── Services ──
export { DeFiEngine } from './services/defi/engine';
export { RWANexus } from './services/rwa/nexus';
export { MetaverseEngine } from './services/metaverse/engine';
export { UBIDistributor } from './services/ubi/distributor';
export { CrossChainBridge } from './services/bridge/router';
export { PrivacyShield } from './services/privacy/zkproof';
export { PredictiveMarketsEngine } from './services/predictions/engine';
export { AutonomousDAO } from './services/governance/dao';
export { IdentityEngine } from './services/identity/engine';
export { SecurityFortress } from './services/security/fortress';
export { AIMarketplace } from './services/marketplace/ai-marketplace';
export { InterplanetaryProtocol } from './services/interplanetary/protocol';
export { AGISentinelShields, QuantumSoulBinding } from './services/security/sentinel';
export { NeuralVerseGenerator, HyperRWAOracle } from './services/metaverse/neuralverse';
export { InfiniteYieldAGI, CarbonNegativeMining } from './services/sustainability/green-mining';

// ── Edge ──
export { NanoAGIChipManager, SwarmEdgeNetwork } from './edge/swarm-edge';

// ── Constants ──
export const VERSION = '0.6.0-alpha';
export const NETWORK = 'pinexus-testnet';
export const DUAL_COINS = { utility: '$PNX', stable: '$PiNEX' };
export const MULTICHAIN_COUNT = 1000;

console.log(`
╔══════════════════════════════════════════════════════════════╗
║            PiNexus Core v0.6.0-alpha                         ║
║     The Ultimate Decentralized AGI Economy                   ║
║     Hybrid Dual Coin: $PNX + $PiNEX (USD peg)               ║
║     41 AI Capabilities • 5000 Agents • ASI-Level            ║
║     1000 Blockchain Networks • OmniBridge                    ║
║     🚀 The Singularity Starts Here                           ║
╚══════════════════════════════════════════════════════════════╝
`);