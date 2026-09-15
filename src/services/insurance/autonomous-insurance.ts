/**
 * Autonomous Insurance Protocol — v1.0.0
 * AI-underwritten, parametric on-chain insurance for DeFi risk: smart contract exploits,
 * bridge failures, stablecoin depegs, vault insolvency, and oracle manipulation.
 *
 * Implements:
 * - AI underwriting engine: risk-scores each coverage request against historical exploit data
 * - Parametric triggers: payouts fire automatically on-chain when a measurable condition is met
 *   (no claims adjuster, no dispute for parametric events — e.g. "stablecoin < $0.95 for 1hr")
 * - Coverage pools: capital providers stake into pools per risk category, earn premiums
 * - Reinsurance layer: pools can cede a portion of risk to a reinsurance pool for tail risk
 * - Actuarial pricing: premiums computed from AI risk score + pool utilization + historical loss ratio
 */

export type RiskCategory = 'smart_contract_exploit' | 'bridge_failure' | 'stablecoin_depeg' | 'vault_insolvency' | 'oracle_manipulation' | 'validator_slashing';

export interface CoveragePolicy {
  policyId: string;
  holder: string;
  riskCategory: RiskCategory;
  coveredProtocol: string;         // e.g. contract address or protocol name
  coverageAmount: bigint;
  premiumPaid: bigint;
  riskScore: number;               // 0-1, AI-computed at underwriting
  startEpoch: number;
  endEpoch: number;
  status: 'active' | 'expired' | 'claimed' | 'cancelled';
  parametricTrigger: string;       // Human-readable trigger condition
}

export interface CoveragePool {
  poolId: string;
  riskCategory: RiskCategory;
  totalCapital: bigint;
  totalCoverageWritten: bigint;
  utilizationRate: number;         // coverageWritten / capital
  historicalLossRatio: number;     // claims paid / premiums collected, lifetime
  providers: Map<string, bigint>;  // address -> staked amount
  reinsuranceCeded: number;        // 0-1, fraction of risk ceded to reinsurance pool
}

export interface ParametricEvent {
  eventId: string;
  riskCategory: RiskCategory;
  measuredValue: number;
  triggerThreshold: number;
  triggered: boolean;
  observedAt: number;
  dataSource: string;
}

export interface ClaimPayout {
  claimId: string;
  policyId: string;
  triggerEventId: string;
  payoutAmount: bigint;
  paidAt: number;
  poolsCharged: { poolId: string; amount: bigint }[];
}

export interface UnderwritingAssessment {
  assessmentId: string;
  riskCategory: RiskCategory;
  protocolTvlUsd: number;
  auditScore: number;              // 0-1, based on audit history
  ageInDays: number;
  historicalIncidents: number;
  computedRiskScore: number;
  recommendedPremiumBps: number;   // basis points of coverage amount, per epoch
  maxRecommendedCoverage: bigint;
}

export class AutonomousInsuranceProtocol {
  private policies: Map<string, CoveragePolicy> = new Map();
  private pools: Map<string, CoveragePool> = new Map();
  private events: ParametricEvent[] = [];
  private claims: Map<string, ClaimPayout> = new Map();
  private policyCount = 0;
  private eventCount = 0;
  private claimCount = 0;
  private reinsurancePool = { totalCapital: BigInt(50_000_000) * BigInt(1e18), totalCeded: 0n };

  constructor() {
    this._bootstrapPools();
    console.log('[AutonomousInsurance] Protocol active — AI underwriting + parametric payouts across 6 risk categories');
  }

  /** AI-driven underwriting assessment for a coverage request */
  assessRisk(
    riskCategory: RiskCategory,
    protocolTvlUsd: number,
    auditScore: number,
    ageInDays: number,
    historicalIncidents: number
  ): UnderwritingAssessment {
    // Simplified actuarial model: higher TVL + audits + age = lower risk; incidents raise it sharply
    const tvlFactor = Math.min(1, Math.log10(protocolTvlUsd + 1) / 9);      // caps around $1B TVL
    const ageFactor = Math.min(1, ageInDays / 730);                         // matures over 2 years
    const incidentPenalty = Math.min(0.6, historicalIncidents * 0.15);

    const baseRisk: Record<RiskCategory, number> = {
      smart_contract_exploit: 0.12, bridge_failure: 0.18, stablecoin_depeg: 0.08,
      vault_insolvency: 0.10, oracle_manipulation: 0.14, validator_slashing: 0.06,
    };

    let risk = baseRisk[riskCategory];
    risk -= tvlFactor * 0.04;
    risk -= auditScore * 0.05;
    risk -= ageFactor * 0.03;
    risk += incidentPenalty;
    risk = Math.max(0.01, Math.min(0.95, risk));

    const pool = Array.from(this.pools.values()).find(p => p.riskCategory === riskCategory);
    const utilizationSurcharge = pool ? pool.utilizationRate * 0.02 : 0;
    const premiumBps = Math.round((risk * 1000 + utilizationSurcharge * 1000));

    return {
      assessmentId: `assess-${Date.now()}`,
      riskCategory, protocolTvlUsd, auditScore, ageInDays, historicalIncidents,
      computedRiskScore: risk,
      recommendedPremiumBps: premiumBps,
      maxRecommendedCoverage: pool ? pool.totalCapital / 10n : BigInt(1e6) * BigInt(1e18), // max 10% of pool per policy
    };
  }

  /** Issue a coverage policy after underwriting */
  issuePolicy(
    holder: string,
    riskCategory: RiskCategory,
    coveredProtocol: string,
    coverageAmount: bigint,
    durationEpochs: number,
    parametricTrigger: string,
    assessment: UnderwritingAssessment
  ): CoveragePolicy {
    const pool = this._getOrCreatePool(riskCategory);
    if (coverageAmount > pool.totalCapital - pool.totalCoverageWritten) {
      throw new Error(`Insufficient pool capacity for ${riskCategory}: requested ${coverageAmount}, available ${pool.totalCapital - pool.totalCoverageWritten}`);
    }

    const premium = (coverageAmount * BigInt(assessment.recommendedPremiumBps)) / BigInt(10000);
    const policy: CoveragePolicy = {
      policyId: `policy-${++this.policyCount}`,
      holder, riskCategory, coveredProtocol, coverageAmount,
      premiumPaid: premium,
      riskScore: assessment.computedRiskScore,
      startEpoch: 0, endEpoch: durationEpochs,
      status: 'active', parametricTrigger,
    };
    this.policies.set(policy.policyId, policy);

    pool.totalCoverageWritten += coverageAmount;
    pool.utilizationRate = Number(pool.totalCoverageWritten) / Number(pool.totalCapital);

    // Cede a portion of large policies to reinsurance
    if (coverageAmount > pool.totalCapital / 20n) {
      const cedeAmount = coverageAmount / 4n;
      this.reinsurancePool.totalCeded += cedeAmount;
      pool.reinsuranceCeded = Number(this.reinsurancePool.totalCeded) / Number(this.reinsurancePool.totalCapital);
    }
    return policy;
  }

  /** Record a parametric data observation and check if it triggers a payout condition */
  recordParametricObservation(
    riskCategory: RiskCategory,
    measuredValue: number,
    triggerThreshold: number,
    dataSource: string
  ): ParametricEvent {
    const triggered = riskCategory === 'stablecoin_depeg'
      ? measuredValue < triggerThreshold
      : measuredValue > triggerThreshold;

    const event: ParametricEvent = {
      eventId: `event-${++this.eventCount}`,
      riskCategory, measuredValue, triggerThreshold, triggered,
      observedAt: Date.now(), dataSource,
    };
    this.events.push(event);
    if (this.events.length > 10000) this.events.shift();

    if (triggered) this._processAutoPayouts(event);
    return event;
  }

  /** Automatically pay out all active policies matching a triggered parametric event's category */
  private _processAutoPayouts(event: ParametricEvent): void {
    const affectedPolicies = Array.from(this.policies.values())
      .filter(p => p.riskCategory === event.riskCategory && p.status === 'active');

    for (const policy of affectedPolicies) {
      const pool = this._getOrCreatePool(policy.riskCategory);
      const claim: ClaimPayout = {
        claimId: `claim-${++this.claimCount}`,
        policyId: policy.policyId,
        triggerEventId: event.eventId,
        payoutAmount: policy.coverageAmount,
        paidAt: Date.now(),
        poolsCharged: [{ poolId: pool.poolId, amount: policy.coverageAmount }],
      };
      this.claims.set(claim.claimId, claim);
      policy.status = 'claimed';

      pool.totalCapital -= policy.coverageAmount;
      pool.totalCoverageWritten -= policy.coverageAmount;
      pool.historicalLossRatio = this._recomputeLossRatio(pool);
    }
  }

  /** Stake capital into a coverage pool as a liquidity provider */
  stakeToPool(provider: string, riskCategory: RiskCategory, amount: bigint): CoveragePool {
    const pool = this._getOrCreatePool(riskCategory);
    pool.totalCapital += amount;
    pool.providers.set(provider, (pool.providers.get(provider) ?? 0n) + amount);
    pool.utilizationRate = pool.totalCapital > 0n ? Number(pool.totalCoverageWritten) / Number(pool.totalCapital) : 0;
    return pool;
  }

  getPolicy(id: string): CoveragePolicy | undefined { return this.policies.get(id); }
  getPool(riskCategory: RiskCategory): CoveragePool | undefined {
    return Array.from(this.pools.values()).find(p => p.riskCategory === riskCategory);
  }
  getAllPools(): CoveragePool[] { return Array.from(this.pools.values()); }
  getClaim(id: string): ClaimPayout | undefined { return this.claims.get(id); }

  getStats() {
    const activePolicies = Array.from(this.policies.values()).filter(p => p.status === 'active');
    const totalCoverage = activePolicies.reduce((s, p) => s + p.coverageAmount, 0n);
    const totalPremiums = Array.from(this.policies.values()).reduce((s, p) => s + p.premiumPaid, 0n);
    const totalClaims = Array.from(this.claims.values()).reduce((s, c) => s + c.payoutAmount, 0n);
    return {
      activePolicies: activePolicies.length,
      totalCoverageOutstanding: totalCoverage.toString(),
      totalPremiumsCollected: totalPremiums.toString(),
      totalClaimsPaid: totalClaims.toString(),
      poolCount: this.pools.size,
      reinsurancePoolCapital: this.reinsurancePool.totalCapital.toString(),
      lossRatioAvg: this.pools.size > 0 ? Array.from(this.pools.values()).reduce((s, p) => s + p.historicalLossRatio, 0) / this.pools.size : 0,
    };
  }

  private _getOrCreatePool(riskCategory: RiskCategory): CoveragePool {
    let pool = Array.from(this.pools.values()).find(p => p.riskCategory === riskCategory);
    if (!pool) {
      pool = {
        poolId: `pool-${riskCategory}`, riskCategory,
        totalCapital: 0n, totalCoverageWritten: 0n, utilizationRate: 0,
        historicalLossRatio: 0, providers: new Map(), reinsuranceCeded: 0,
      };
      this.pools.set(pool.poolId, pool);
    }
    return pool;
  }

  private _recomputeLossRatio(pool: CoveragePool): number {
    const policiesInPool = Array.from(this.policies.values()).filter(p => p.riskCategory === pool.riskCategory);
    const premiums = policiesInPool.reduce((s, p) => s + p.premiumPaid, 0n);
    const claims = Array.from(this.claims.values())
      .filter(c => policiesInPool.some(p => p.policyId === c.policyId))
      .reduce((s, c) => s + c.payoutAmount, 0n);
    return premiums > 0n ? Number(claims) / Number(premiums) : 0;
  }

  private _bootstrapPools(): void {
    const categories: RiskCategory[] = ['smart_contract_exploit', 'bridge_failure', 'stablecoin_depeg', 'vault_insolvency', 'oracle_manipulation', 'validator_slashing'];
    for (const cat of categories) {
      const pool = this._getOrCreatePool(cat);
      pool.totalCapital = BigInt(20_000_000) * BigInt(1e18); // seed each pool with 20M units
    }
  }
}
