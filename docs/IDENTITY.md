# PiNexus Identity & Reputation System

## Decentralized Identity (DID)

### DID Format

```
did:pinexus:0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18
```

### Identity Components

| Component | Description |
|-----------|-------------|
| DID Document | On-chain identity record |
| Public Keys | Quantum-resistant verification keys |
| Credentials | Verifiable, ZK-proven claims |
| Achievements | Soulbound (non-transferable) tokens |
| Reputation | Multi-dimensional score (0-1000) |

### Zero-Knowledge KYC

PiNexus implements **privacy-preserving KYC** using ZK proofs:

| KYC Level | Requirements | Privileges |
|-----------|-------------|------------|
| 0 (None) | Wallet only | Basic trading, limited amounts |
| 1 (Basic) | ZK humanity proof | Full trading, DeFi access |
| 2 (Enhanced) | ZK age + region proof | Governance, higher limits |
| 3 (Full) | ZK identity verification | Institutional features, max limits |

**Key principle**: The verifier learns only the boolean result (pass/fail), never the underlying personal data.

## Reputation System

### Multi-Dimensional Scoring

| Dimension | Weight | Factors |
|-----------|--------|---------|
| Mining | 15% | Blocks mined, uptime, computation contributed |
| Governance | 20% | Proposals created, votes cast, delegation received |
| DeFi | 20% | Liquidity provided, protocol usage, risk management |
| Social | 15% | Community contributions, mentoring, referrals |
| Development | 20% | Code contributions, bug reports, documentation |
| Security | 10% | Vulnerabilities reported, audit participation |

### Achievement Rarities

| Rarity | Rep Bonus | Examples |
|--------|-----------|---------|
| Common | +5 | First transaction, join governance |
| Rare | +15 | 100 blocks mined, 10 proposals voted |
| Epic | +30 | Top 10% miner, sub-DAO leader |
| Legendary | +50 | Protocol upgrade contributor, 1000+ governance votes |
| Mythic | +100 | Core developer, security vulnerability discoverer |

### Trust Graph

Peer-to-peer trust relationships:
- Users rate each other (0-100 trust score)
- Trust is transitive but decays over hops
- Used for: loan underwriting, governance weight, social features
- Sybil-resistant: new accounts start with 0 peer trust

## Verifiable Credentials

Standard credential types:

| Credential | Issuer | Proof Type |
|------------|--------|------------|
| Humanity Proof | PiNexus Protocol | ZK-SNARK |
| Developer Cert | PiNexus Labs | Signature + ZK |
| Validator Status | Consensus Engine | On-chain |
| Reputation Tier | Reputation Engine | ZK range proof |
| KYC Level | Licensed Provider | ZK-STARK |
| Achievement | Protocol Events | Soulbound token |

### Credential Lifecycle

```
Issue → Store (user wallet) → Present (ZK selective disclosure) → Verify → [optional] Revoke
```

Credentials are:
- **Self-sovereign**: User controls their data
- **Portable**: Works across any PiNexus-compatible platform
- **Selective**: Share only what's needed (ZK disclosure)
- **Revocable**: Issuer can revoke if conditions change
