# PiNexus Hybrid Dual Coin System — Technical Specification

## Overview

The PiNexus Hybrid Dual Coin System creates a symbiotic relationship between two tokens:

| Token | Symbol | Type | Purpose |
|-------|--------|------|---------|
| PiNexus Token | **$PNX** | Volatile / Utility | Governance, staking, compute, mining rewards |
| PiNexus Stablecoin | **PiNEX** | Stable (1:1 USD) | Payments, settlements, DeFi collateral |

```
┌───────────────────────────────────────────────────────────────────┐
│                   HYBRID DUAL COIN SYSTEM                         │
│                                                                    │
│  ╔═══════════════════╗     SWAP ENGINE     ╔═══════════════════╗  │
│  ║     $PNX          ║ ◄═══════════════► ║     PiNEX         ║  │
│  ║  Utility Token     ║    AGI Arbitrage    ║  Stablecoin       ║  │
│  ║                    ║    TWAP Pricing     ║                    ║  │
│  ║  • Governance      ║    Anti-Manipulation ║  • 1:1 USD Peg    ║  │
│  ║  • Staking         ║    Flash Loan Guard  ║  • Payments       ║  │
│  ║  • AGI Compute     ║                     ║  • Settlements     ║  │
│  ║  • Mining Rewards  ║                     ║  • DeFi Collateral ║  │
│  ║  • Deflationary    ║                     ║  • Cross-border    ║  │
│  ╚═══════════════════╝                     ╚═══════════════════╝  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                 STABILITY MECHANISMS                         │  │
│  │                                                              │  │
│  │  1. Collateral Vaults (150% min ratio)                      │  │
│  │  2. Algorithmic Expansion/Contraction (AGI-managed)         │  │
│  │  3. Stability Pool (liquidation buffer)                     │  │
│  │  4. AGI Oracle (multi-source price feeds)                   │  │
│  │  5. Circuit Breaker (5% deviation threshold)                │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

---

## PiNEX Stablecoin

### Stability Mechanism: Hybrid Algorithmic + Collateral

PiNEX uses a **dual-mechanism** approach combining the best of collateral-backed (like DAI) and algorithmic (like FRAX) stablecoins:

#### 1. Collateral Vaults

Users deposit accepted collateral to mint PiNEX:

| Parameter | Value |
|-----------|-------|
| Minimum Collateral Ratio | 150% |
| Liquidation Ratio | 120% |
| Liquidation Penalty | 10% |
| Stability Fee | 0.5% annual |
| Redemption Fee | 0.3% |

**Supported Collateral:**
- $PNX (weight: 80%)
- ETH (weight: 90%)
- BTC (weight: 90%)
- USDC (weight: 95%)
- RWA tokens (weight: 70%)

#### 2. Algorithmic Supply Management

The AGI engine monitors the peg and adjusts supply:

- **Above peg (>$1.005)**: Mint new PiNEX, add to Stability Pool
  - Maximum expansion: 3% of supply per epoch
  - Requires 3 consecutive above-peg observations
- **Below peg (<$0.995)**: Buy back and burn PiNEX from Stability Pool
  - Maximum contraction: 3% of pool per epoch
  - Requires 3 consecutive below-peg observations

#### 3. Stability Pool

- Funded by PiNEX stakers who earn yield
- Acts as liquidation buffer
- Receives expansion mints (distributed to depositors)
- Absorbs bad debt from under-collateralized vaults

#### 4. AGI Oracle

Multi-source price feeds with anomaly detection:
- Chainlink, Band Protocol, Pyth, API3
- TWAP (Time-Weighted Average Price) over 1-hour window
- Outlier detection removes manipulated feeds
- Heartbeat: 60-second update interval

#### 5. Circuit Breaker

Emergency mechanism when peg deviation exceeds 5%:
- Halts all new minting
- Increases collateral requirements
- Triggers AGI emergency response
- Auto-resets when deviation drops below 2.5%

---

## Swap Engine (PNX ↔ PiNEX)

### Pricing

The swap rate is determined by:
1. **Spot Price**: PNX/USD from AGI oracle
2. **TWAP**: 1-hour time-weighted average to smooth manipulation
3. **Fee**: 0.3% per swap (split: 50% to liquidity providers, 50% to treasury)

### Anti-Manipulation Protections

| Protection | Description |
|------------|-------------|
| Flash Loan Guard | No same-block swaps (prevents flash loan attacks) |
| Cooldown | 1-minute minimum between swaps per address |
| Per-TX Limit | Maximum 1M tokens per transaction |
| Daily Limit | Maximum 50M tokens per address per day |
| Price Impact | Maximum 2% price impact per swap |
| TWAP | 1-hour smoothing resists short-term manipulation |

### AGI Arbitrage Engine

Automated arbitrage maintains price consistency:

```typescript
interface ArbitrageConfig {
  minSpread: 50,        // 0.5% minimum spread to trigger
  maxPosition: 10M PNX, // Maximum position size
  enabled: true,
  // Automatically:
  // - PiNEX overvalued → sell PiNEX, buy PNX (increases PNX demand)
  // - PiNEX undervalued → buy PiNEX, sell PNX (restores peg)
}
```

---

## Smart Contracts

### PiNEXStablecoin.sol

| Function | Description |
|----------|-------------|
| `openVault()` | Create a collateral vault |
| `depositCollateral(token, amount)` | Deposit collateral into vault |
| `mintPiNEX(amount)` | Mint PiNEX against collateral |
| `redeemPiNEX(amount)` | Burn PiNEX and reclaim collateral |
| `liquidateVault(owner)` | Liquidate under-collateralized vault |
| `depositToStabilityPool(amount)` | Stake PiNEX in stability pool |
| `withdrawFromStabilityPool(amount)` | Withdraw from stability pool |
| `updatePrice(newPrice)` | AGI oracle price update |
| `executeAlgorithmicRebalance()` | Trigger supply expansion/contraction |
| `resetCircuitBreaker()` | Reset after emergency stabilizes |

### HybridDualCoinSystem.sol

| Function | Description |
|----------|-------------|
| `swapPNXtoPiNEX(amount)` | Swap $PNX → PiNEX |
| `swapPiNEXtoPNX(amount)` | Swap PiNEX → $PNX |
| `updatePNXRate(newRate)` | Update PNX/USD rate |
| `getTWAP()` | Get time-weighted average price |
| `executeAGIArbitrage()` | Execute AGI arbitrage |
| `addLiquidity(pnx, pinex)` | Add swap pool liquidity |
| `getSwapQuote(direction, amount)` | Get quote without executing |
| `getSystemHealth()` | Get full system health metrics |

---

## Tokenomics Impact

### PNX Deflationary Pressure

1. **Staking Lock**: PNX locked as collateral for PiNEX minting
2. **Burn Tax**: 1% burn on all PNX transfers
3. **Swap Fees**: 50% of fees used for PNX buyback and burn
4. **Governance Lock**: Voting requires locked PNX

### PiNEX Supply Control

- **Elastic Supply**: Expands/contracts based on demand and peg status
- **Hard Cap**: No fixed cap (supply is demand-driven, controlled by collateral)
- **Fully Backed**: Every PiNEX is backed by ≥150% collateral value

---

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| De-peg event | Circuit breaker + algorithmic rebalancing + stability pool |
| Oracle manipulation | Multi-source TWAP + anomaly detection |
| Flash loan attack | Same-block swap prevention |
| Bank run | Over-collateralization + liquidation engine |
| Smart contract exploit | Formal verification + adversarial testing |
| Governance attack | Quadratic voting + time locks + constitutional AI |
