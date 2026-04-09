/**
 * PiNexus Core - Entry Point
 * The Ultimate Decentralized AGI-Powered Ecosystem
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

// Service Layer
export { DeFiEngine } from './services/defi/engine';
export { RWANexus } from './services/rwa/nexus';
export { MetaverseEngine } from './services/metaverse/engine';
export { UBIDistributor } from './services/ubi/distributor';
export { CrossChainBridge } from './services/bridge/router';
export { PrivacyShield } from './services/privacy/zkproof';

// Types
export * from './types';

// Version
export const VERSION = '0.1.0-alpha';
export const NETWORK = 'pinexus-testnet';

console.log(`
╔═══════════════════════════════════════════╗
║           PiNexus Core v${VERSION}          ║
║   The Ultimate Decentralized AGI Economy  ║
║          Powered by 5000 AI Agents        ║
╚═══════════════════════════════════════════╝
`);
