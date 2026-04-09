/**
 * PiNexus Core - Entry Point
 * The Ultimate Decentralized AGI-Powered Ecosystem
 * Hybrid Dual Coin System: $PNX + PiNEX (USD-pegged stablecoin)
 */

// Blockchain Layer
export { PiNexusChain } from './blockchain/chain';
export { ProofOfIntelligence } from './blockchain/consensus/poi';
export { QuantumCrypto } from './blockchain/crypto/quantum';
export { DynamicShardManager } from './blockchain/sharding/manager';

// AGI Engine Layer
export { SuperAGICore } from './agi-engine/core/agi-core';
export { SwarmOrchestrator } from './agi-engine/swarm/orchestrator';
export { AgentFactory } from './agi-engine/agents/factory';
export { NeuralMiner } from './agi-engine/neural-mining/miner';
export { AutoSelfDevelopmentEngine } from './agi-engine/self-development/engine';

// Dual Coin System
export { HybridDualCoinService } from './services/dual-coin/service';

// Service Layer
export { DeFiEngine } from './services/defi/engine';
export { RWANexus } from './services/rwa/nexus';
export { MetaverseEngine } from './services/metaverse/engine';
export { UBIDistributor } from './services/ubi/distributor';
export { CrossChainBridge } from './services/bridge/router';
export { PrivacyShield } from './services/privacy/zkproof';

// Advanced Services
export { PredictiveMarketsEngine } from './services/predictions/engine';
export { AutonomousDAO } from './services/governance/dao';
export { IdentityEngine } from './services/identity/engine';
export { SecurityFortress } from './services/security/fortress';
export { AIMarketplace } from './services/marketplace/ai-marketplace';
export { InterplanetaryProtocol } from './services/interplanetary/protocol';

// Types
export * from './types';

// Version
export const VERSION = '0.2.0-alpha';
export const NETWORK = 'pinexus-testnet';
export const DUAL_COINS = { utility: 'PNX', stable: 'PiNEX' };

console.log(`
╔════════════════════════════════════════════════════╗
║            PiNexus Core v${VERSION}              ║
║     The Ultimate Decentralized AGI Economy         ║
║     Hybrid Dual Coin: $PNX + PiNEX (USD peg)      ║
║     Powered by 5000 AI Agents + Self-Evolution     ║
╚════════════════════════════════════════════════════╝
`);
