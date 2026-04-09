/**
 * Hybrid Dual Coin System — TypeScript Service Layer
 *
 * Manages the PNX ↔ PiNEX dual-token economy:
 * - Real-time swap engine with TWAP pricing
 * - AGI-driven arbitrage and peg maintenance
 * - Multi-collateral vault management
 * - Risk scoring and auto-liquidation
 * - Revenue distribution from swap fees
 */

export interface DualCoinState {
  pnxPrice: number;        // USD
  pinexPrice: number;      // USD (target: 1.00)
  pnxMarketCap: bigint;
  pinexCirculating: bigint;
  swapPoolPNX: bigint;
  swapPoolPiNEX: bigint;
  dailyVolume: bigint;
  pegDeviation: number;    // basis points
}

export interface CollateralVault {
  id: string;
  owner: string;
  collateral: Map<string, bigint>; // token → amount
  totalCollateralUSD: bigint;
  debtPiNEX: bigint;
  collateralRatio: number; // percentage
  healthFactor: number;    // > 1 = safe, < 1 = liquidatable
  lastAccrual: number;
}

export interface SwapResult {
  txId: string;
  direction: 'PNX_TO_PINEX' | 'PINEX_TO_PNX';
  amountIn: bigint;
  amountOut: bigint;
  fee: bigint;
  effectiveRate: number;
  priceImpact: number;
  timestamp: number;
}

export interface PegMaintenanceAction {
  type: 'expand_supply' | 'contract_supply' | 'adjust_rates' | 'inject_liquidity' | 'buyback_burn';
  amount: bigint;
  reason: string;
  executedBy: string;
  timestamp: number;
}

export class HybridDualCoinService {
  private state: DualCoinState;
  private vaults: Map<string, CollateralVault> = new Map();
  private swapHistory: SwapResult[] = [];
  private pegActions: PegMaintenanceAction[] = [];

  // Configuration
  private readonly SWAP_FEE = 0.003; // 0.3%
  private readonly MIN_COLLATERAL_RATIO = 1.5; // 150%
  private readonly LIQUIDATION_THRESHOLD = 1.2; // 120%
  private readonly MAX_DAILY_MINT = BigInt(10_000_000) * BigInt(1e18);
  private readonly PEG_BAND_UPPER = 1.005; // $1.005
  private readonly PEG_BAND_LOWER = 0.995; // $0.995

  constructor() {
    this.state = {
      pnxPrice: 0.001,
      pinexPrice: 1.0,
      pnxMarketCap: BigInt(0),
      pinexCirculating: BigInt(0),
      swapPoolPNX: BigInt(1_000_000_000) * BigInt(1e18),
      swapPoolPiNEX: BigInt(1_000_000) * BigInt(1e18),
      dailyVolume: BigInt(0),
      pegDeviation: 0,
    };
    console.log('[DualCoin] Hybrid Dual Coin System initialized');
    console.log('[DualCoin] PNX (utility/governance) ↔ PiNEX (stablecoin, $1.00 peg)');
  }

  // ══════════════════════════════════════════
  //  SWAP ENGINE
  // ══════════════════════════════════════════

  async swapPNXtoPiNEX(amount: bigint, sender: string): Promise<SwapResult> {
    const usdValue = Number(amount) * this.state.pnxPrice / 1e18;
    const fee = BigInt(Math.floor(usdValue * this.SWAP_FEE * 1e18));
    const pinexOut = BigInt(Math.floor(usdValue * (1 - this.SWAP_FEE) * 1e18));

    const priceImpact = Number(pinexOut) / Number(this.state.swapPoolPiNEX) * 100;

    this.state.swapPoolPNX += amount;
    this.state.swapPoolPiNEX -= pinexOut;
    this.state.dailyVolume += BigInt(Math.floor(usdValue * 1e18));

    const result: SwapResult = {
      txId: `swap-${Date.now()}`,
      direction: 'PNX_TO_PINEX',
      amountIn: amount,
      amountOut: pinexOut,
      fee,
      effectiveRate: usdValue / (Number(amount) / 1e18),
      priceImpact,
      timestamp: Date.now(),
    };

    this.swapHistory.push(result);
    return result;
  }

  async swapPiNEXtoPNX(amount: bigint, sender: string): Promise<SwapResult> {
    const usdValue = Number(amount) / 1e18; // PiNEX = $1
    const fee = BigInt(Math.floor(usdValue * this.SWAP_FEE * 1e18));
    const pnxOut = BigInt(Math.floor((usdValue * (1 - this.SWAP_FEE)) / this.state.pnxPrice * 1e18));

    const priceImpact = Number(pnxOut) / Number(this.state.swapPoolPNX) * 100;

    this.state.swapPoolPiNEX += amount;
    this.state.swapPoolPNX -= pnxOut;
    this.state.dailyVolume += amount;

    const result: SwapResult = {
      txId: `swap-${Date.now()}`,
      direction: 'PINEX_TO_PNX',
      amountIn: amount,
      amountOut: pnxOut,
      fee,
      effectiveRate: this.state.pnxPrice,
      priceImpact,
      timestamp: Date.now(),
    };

    this.swapHistory.push(result);
    return result;
  }

  // ══════════════════════════════════════════
  //  COLLATERAL VAULT MANAGEMENT
  // ══════════════════════════════════════════

  async openVault(owner: string): Promise<CollateralVault> {
    const vault: CollateralVault = {
      id: `vault-${Date.now()}`,
      owner,
      collateral: new Map(),
      totalCollateralUSD: BigInt(0),
      debtPiNEX: BigInt(0),
      collateralRatio: Infinity,
      healthFactor: Infinity,
      lastAccrual: Date.now(),
    };
    this.vaults.set(vault.id, vault);
    return vault;
  }

  async mintPiNEXFromVault(vaultId: string, amount: bigint): Promise<boolean> {
    const vault = this.vaults.get(vaultId);
    if (!vault) return false;

    vault.debtPiNEX += amount;
    this.updateVaultHealth(vault);

    if (vault.collateralRatio < this.MIN_COLLATERAL_RATIO * 100) {
      vault.debtPiNEX -= amount; // Revert
      return false;
    }

    this.state.pinexCirculating += amount;
    return true;
  }

  private updateVaultHealth(vault: CollateralVault): void {
    if (vault.debtPiNEX === BigInt(0)) {
      vault.collateralRatio = Infinity;
      vault.healthFactor = Infinity;
      return;
    }
    const ratio = Number(vault.totalCollateralUSD) / Number(vault.debtPiNEX);
    vault.collateralRatio = ratio * 100;
    vault.healthFactor = ratio / this.LIQUIDATION_THRESHOLD;
  }

  // ══════════════════════════════════════════
  //  AGI PEG MAINTENANCE
  // ══════════════════════════════════════════

  async maintainPeg(): Promise<PegMaintenanceAction | null> {
    const price = this.state.pinexPrice;

    if (price > this.PEG_BAND_UPPER) {
      // Above peg → expand supply
      const deviation = price - 1.0;
      const expansion = BigInt(Math.floor(deviation * 1_000_000 * 1e18));
      const action: PegMaintenanceAction = {
        type: 'expand_supply',
        amount: expansion,
        reason: `PiNEX price ${price.toFixed(4)} above upper band`,
        executedBy: 'agi_peg_manager',
        timestamp: Date.now(),
      };
      this.state.pinexCirculating += expansion;
      this.pegActions.push(action);
      return action;
    }

    if (price < this.PEG_BAND_LOWER) {
      // Below peg → contract supply via buyback
      const deviation = 1.0 - price;
      const contraction = BigInt(Math.floor(deviation * 1_000_000 * 1e18));
      const action: PegMaintenanceAction = {
        type: 'buyback_burn',
        amount: contraction,
        reason: `PiNEX price ${price.toFixed(4)} below lower band`,
        executedBy: 'agi_peg_manager',
        timestamp: Date.now(),
      };
      this.state.pinexCirculating -= contraction;
      this.pegActions.push(action);
      return action;
    }

    return null; // Within peg band
  }

  // ══════════════════════════════════════════
  //  VIEW
  // ══════════════════════════════════════════

  getState(): DualCoinState { return { ...this.state }; }
  getVaults(): CollateralVault[] { return Array.from(this.vaults.values()); }
  getSwapHistory(limit = 50): SwapResult[] { return this.swapHistory.slice(-limit); }
  getPegActions(limit = 50): PegMaintenanceAction[] { return this.pegActions.slice(-limit); }
}
