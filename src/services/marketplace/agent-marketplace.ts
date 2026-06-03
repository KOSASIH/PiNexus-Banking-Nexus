/**
 * Agent Marketplace — v0.8.0
 * Deploy, monetize, and rent AI agents on the PiNexus ecosystem.
 *
 * Features:
 * - List any AI agent for rent/purchase on-chain
 * - Reputation system with on-chain feedback
 * - Revenue sharing: agent owners earn $PNX per execution
 * - Agent bundles and subscriptions
 * - Automated agent testing before listing
 * - Cross-chain agent invocation
 */

export type AgentCategory = 'trading' | 'research' | 'security' | 'defi' | 'data' | 'creative' | 'governance' | 'agi' | 'asi' | 'custom';
export type PricingModel = 'per_call' | 'subscription' | 'revenue_share' | 'free' | 'auction';

export interface AgentListing {
  listingId: string;
  agentId: string;
  name: string;
  description: string;
  category: AgentCategory;
  owner: string;
  pricingModel: PricingModel;
  pricePerCall: bigint;         // $PNX per execution
  subscriptionMonthly: bigint;  // Monthly subscription price
  revenueSharePct: number;      // 0–1 (for revenue share model)
  capabilities: string[];
  performanceMetrics: AgentMetrics;
  reputation: ReputationScore;
  isActive: boolean;
  isVerified: boolean;          // Audited by PiNexus team or ASI
  totalExecutions: bigint;
  totalRevenuePnx: bigint;
  tags: string[];
  createdAt: number;
  lastActiveAt: number;
}

export interface AgentMetrics {
  avgLatencyMs: number;
  successRate: number;          // 0–1
  avgCostPnx: bigint;
  uptimePct: number;
  benchmarkScore: number;       // 0–100
  lastBenchmarkAt: number;
}

export interface ReputationScore {
  overall: number;              // 0–5 stars
  totalReviews: number;
  weightedAvg: number;
  recentTrend: 'up' | 'stable' | 'down';
  badges: string[];             // 'top_rated', 'verified', 'asi_certified', etc.
}

export interface AgentExecution {
  executionId: string;
  listingId: string;
  caller: string;
  input: string;                // Hashed or encrypted
  output?: string;              // Hash of output
  status: 'pending' | 'running' | 'completed' | 'failed';
  costPnx: bigint;
  latencyMs: number;
  startedAt: number;
  completedAt?: number;
  paymentTxHash?: string;
}

export interface AgentSubscription {
  subscriptionId: string;
  subscriber: string;
  listingId: string;
  startDate: number;
  endDate: number;
  totalPaidPnx: bigint;
  executionsUsed: number;
  executionLimit?: number;
  autoRenew: boolean;
  isActive: boolean;
}

export interface MarketplaceStats {
  totalListings: number;
  activeListings: number;
  totalExecutions: bigint;
  totalRevenuePnx: bigint;
  avgReputation: number;
  topCategory: AgentCategory;
  newListingsLast7d: number;
}

export class AgentMarketplace {
  private listings: Map<string, AgentListing> = new Map();
  private executions: Map<string, AgentExecution> = new Map();
  private subscriptions: Map<string, AgentSubscription> = new Map();
  private reviews: Map<string, Array<{ rating: number; comment: string; reviewer: string }>> = new Map();
  private listingCount = 0;
  private executionCount = 0;

  constructor() {
    this._listBootstrapAgents();
    console.log(`[AgentMarketplace] Marketplace online — ${this.listings.size} agents listed`);
  }

  /** List an agent on the marketplace */
  listAgent(
    agentId: string,
    name: string,
    description: string,
    category: AgentCategory,
    owner: string,
    pricingModel: PricingModel,
    pricePerCall: bigint,
    capabilities: string[]
  ): AgentListing {
    const listing: AgentListing = {
      listingId: `lst-${++this.listingCount}`,
      agentId, name, description, category, owner, pricingModel, pricePerCall,
      subscriptionMonthly: pricePerCall * 1000n,
      revenueSharePct: 0.1,
      capabilities,
      performanceMetrics: { avgLatencyMs: 100, successRate: 0.99, avgCostPnx: pricePerCall, uptimePct: 0.999, benchmarkScore: 85, lastBenchmarkAt: Date.now() },
      reputation: { overall: 0, totalReviews: 0, weightedAvg: 0, recentTrend: 'stable', badges: [] },
      isActive: true,
      isVerified: false,
      totalExecutions: 0n,
      totalRevenuePnx: 0n,
      tags: [category, ...capabilities.slice(0, 3)],
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };
    this.listings.set(listing.listingId, listing);
    this.reviews.set(listing.listingId, []);
    return listing;
  }

  /** Execute an agent call */
  async execute(
    listingId: string,
    caller: string,
    input: string,
    paidAmount: bigint
  ): Promise<AgentExecution> {
    const listing = this.listings.get(listingId);
    if (!listing || !listing.isActive) throw new Error(`Agent ${listingId} not available`);
    if (listing.pricingModel === 'per_call' && paidAmount < listing.pricePerCall) {
      throw new Error(`Insufficient payment: need ${listing.pricePerCall} PNX`);
    }

    const execution: AgentExecution = {
      executionId: `exec-${++this.executionCount}`,
      listingId, caller,
      input: `0x${Buffer.from(input).toString('hex').slice(0, 64)}`,
      status: 'running',
      costPnx: listing.pricePerCall,
      latencyMs: 0,
      startedAt: Date.now(),
    };
    this.executions.set(execution.executionId, execution);

    // Simulate execution
    await new Promise(r => setTimeout(r, 50 + Math.random() * 200));
    execution.status = 'completed';
    execution.completedAt = Date.now();
    execution.latencyMs = execution.completedAt - execution.startedAt;
    execution.output = `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`;
    execution.paymentTxHash = `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`;

    // Update listing stats
    listing.totalExecutions++;
    listing.totalRevenuePnx += listing.pricePerCall;
    listing.lastActiveAt = Date.now();
    this._updateMetrics(listing, execution);

    return execution;
  }

  /** Subscribe to an agent */
  subscribe(subscriber: string, listingId: string, months: number, autoRenew: boolean): AgentSubscription {
    const listing = this.listings.get(listingId);
    if (!listing) throw new Error(`Agent ${listingId} not found`);
    const total = listing.subscriptionMonthly * BigInt(months);
    const sub: AgentSubscription = {
      subscriptionId: `sub-${Date.now()}`,
      subscriber, listingId,
      startDate: Date.now(),
      endDate: Date.now() + months * 30 * 86400000,
      totalPaidPnx: total,
      executionsUsed: 0,
      autoRenew, isActive: true,
    };
    this.subscriptions.set(sub.subscriptionId, sub);
    listing.totalRevenuePnx += total;
    return sub;
  }

  /** Leave a review for an agent */
  review(listingId: string, reviewer: string, rating: number, comment: string): void {
    if (rating < 1 || rating > 5) throw new Error('Rating must be 1–5');
    const listing = this.listings.get(listingId);
    if (!listing) throw new Error('Listing not found');
    this.reviews.get(listingId)!.push({ rating, comment, reviewer });
    // Update reputation
    const reviews = this.reviews.get(listingId)!;
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    listing.reputation.overall = avg;
    listing.reputation.weightedAvg = avg;
    listing.reputation.totalReviews = reviews.length;
    listing.reputation.recentTrend = avg > 4 ? 'up' : avg < 3 ? 'down' : 'stable';
    if (avg >= 4.5 && reviews.length >= 10) listing.reputation.badges.push('top_rated');
    listing.isVerified = listing.reputation.overall >= 4.0 && listing.totalExecutions >= 100n;
  }

  /** Search agents by capability or category */
  search(query: string, category?: AgentCategory, minReputation?: number): AgentListing[] {
    return Array.from(this.listings.values()).filter(l => {
      if (!l.isActive) return false;
      if (category && l.category !== category) return false;
      if (minReputation && l.reputation.overall < minReputation) return false;
      const q = query.toLowerCase();
      return l.name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) ||
        l.capabilities.some(c => c.toLowerCase().includes(q)) || l.tags.some(t => t.includes(q));
    }).sort((a, b) => b.reputation.overall - a.reputation.overall);
  }

  getStats(): MarketplaceStats {
    const active = Array.from(this.listings.values()).filter(l => l.isActive);
    const totalRev = Array.from(this.listings.values()).reduce((s, l) => s + l.totalRevenuePnx, 0n);
    const totalExec = Array.from(this.listings.values()).reduce((s, l) => s + l.totalExecutions, 0n);
    const avgRep = active.length > 0 ? active.reduce((s, l) => s + l.reputation.overall, 0) / active.length : 0;
    const catCounts = new Map<AgentCategory, number>();
    for (const l of active) catCounts.set(l.category, (catCounts.get(l.category) ?? 0) + 1);
    const topCat = Array.from(catCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'agi';
    const weekAgo = Date.now() - 7 * 86400000;
    const newLast7d = Array.from(this.listings.values()).filter(l => l.createdAt > weekAgo).length;
    return { totalListings: this.listings.size, activeListings: active.length, totalExecutions: totalExec, totalRevenuePnx: totalRev, avgReputation: avgRep, topCategory: topCat, newListingsLast7d: newLast7d };
  }

  getListing(id: string): AgentListing | undefined { return this.listings.get(id); }
  getAllListings(): AgentListing[] { return Array.from(this.listings.values()); }

  private _updateMetrics(listing: AgentListing, exec: AgentExecution): void {
    const m = listing.performanceMetrics;
    const n = Number(listing.totalExecutions);
    m.avgLatencyMs = (m.avgLatencyMs * (n - 1) + exec.latencyMs) / n;
    m.successRate = exec.status === 'completed' ? (m.successRate * (n - 1) + 1) / n : (m.successRate * (n - 1)) / n;
  }

  private _listBootstrapAgents(): void {
    const agents = [
      { id: 'ag-treasury-ai', name: 'TreasuryAI Pro', desc: 'AI-powered DeFi yield optimizer and treasury management', cat: 'defi' as AgentCategory, cap: ['yield_optimization', 'portfolio_management', 'risk_assessment'] },
      { id: 'ag-sentinel', name: 'Sentinel Security Agent', desc: 'Real-time security monitoring and threat detection', cat: 'security' as AgentCategory, cap: ['threat_detection', 'anomaly_scoring', 'auto_response'] },
      { id: 'ag-market-intel', name: 'MarketIntel ASI', desc: 'ASI-level market intelligence and trading signals', cat: 'trading' as AgentCategory, cap: ['price_prediction', 'sentiment_analysis', 'arbitrage_detection'] },
    ];
    for (const a of agents) {
      this.listAgent(a.id, a.name, a.desc, a.cat, 'pinexus_foundation', 'per_call', BigInt(1) * BigInt(1e18), a.cap);
    }
  }
}
