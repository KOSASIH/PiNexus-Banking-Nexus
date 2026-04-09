/**
 * PiNexus Testnet Launcher
 */

import { PiNexusChain } from './chain';
import { ProofOfIntelligence } from './consensus/poi';
import { QuantumCrypto } from './crypto/quantum';
import { DynamicShardManager } from './sharding/manager';
import { PiNexusConfig } from '../types';

const TESTNET_CONFIG: PiNexusConfig = {
  network: 'testnet',
  chain: {
    blockTime: 400,
    maxShards: 256,
    validatorCount: 100,
    minStake: BigInt('100000000000000000000000'),
  },
  agi: {
    totalAgents: 100, // Reduced for testnet
    swarmProtocol: 'gossip-v1',
    selfEvolution: false,
  },
  mining: {
    baseReward: BigInt('1000000000000000000000'), // 1000 PNX
    halvingInterval: 1000000,
    maxDifficulty: 1000,
  },
  tokenomics: {
    totalSupply: BigInt('100000000000000') * BigInt(1e18),
    burnRate: 0.004, // 0.4% of 1% tax
    taxRate: 0.01,
  },
};

async function launchTestnet() {
  console.log('═'.repeat(50));
  console.log('  PiNexus Testnet Launcher');
  console.log('═'.repeat(50));

  // Initialize crypto
  const crypto = new QuantumCrypto();

  // Initialize blockchain
  const chain = new PiNexusChain(TESTNET_CONFIG);
  await chain.initialize();

  // Initialize consensus
  const poi = new ProofOfIntelligence();

  // Initialize sharding
  const shardManager = new DynamicShardManager();
  await shardManager.initialize(4); // 4 shards for testnet

  console.log('\n✅ Testnet is running');
  console.log(`  Chain height: ${chain.getHeight()}`);
  console.log(`  Shards: ${shardManager.getShards().length}`);
  console.log(`  Block time: ${TESTNET_CONFIG.chain.blockTime}ms`);
  console.log(`  Network: ${TESTNET_CONFIG.network}`);

  return { chain, poi, crypto, shardManager };
}

// Run if executed directly
launchTestnet().catch(console.error);
