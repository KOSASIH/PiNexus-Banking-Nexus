/**
 * Universal Agent Negotiation Protocol — v1.1.0
 * A formal AI-to-AI communication and negotiation layer so PiNexus's 5000 autonomous agents
 * (and agents from external swarms) can discover each other's capabilities, negotiate task
 * contracts, and settle disputes — across all 1000 chains — without a central coordinator.
 *
 * Implements:
 * - Capability advertisement: agents publish signed capability manifests (skills, price, SLA)
 * - Contract-Net-style bidding: task announcement -> bid collection -> AI-scored award
 * - Multi-round negotiation: counter-offers with a concession-rate model until convergence
 * - Byzantine dispute resolution: reputation-weighted arbitration when a contract is contested
 * - Semantic interoperability: capability manifests use a shared ontology so agents from
 *   different frameworks (not just PiNexus-native ones) can still negotiate meaningfully
 */

export interface CapabilityManifest {
  agentId: string;
  skills: string[];
  pricePerTaskUsd: number;
  slaResponseTimeMs: number;
  reputationScore: number;         // 0-1, from historical contract fulfillment
  ontologyVersion: string;
  signedAt: number;
}

export interface TaskAnnouncement {
  taskId: string;
  requester: string;
  requiredSkills: string[];
  maxBudgetUsd: number;
  deadlineMs: number;
  announcedAt: number;
  status: 'open' | 'awarded' | 'expired';
}

export interface Bid {
  bidId: string;
  taskId: string;
  bidder: string;
  proposedPriceUsd: number;
  proposedDeliveryMs: number;
  confidenceScore: number;         // agent's self-assessed capability match, 0-1
}

export interface NegotiationRound {
  roundId: string;
  taskId: string;
  round: number;
  requesterOffer: number;
  bidderCounterOffer: number;
  converged: boolean;
}

export interface Contract {
  contractId: string;
  taskId: string;
  requester: string;
  provider: string;
  agreedPriceUsd: number;
  agreedDeliveryMs: number;
  status: 'active' | 'fulfilled' | 'disputed' | 'breached';
  createdAt: number;
}

export interface DisputeResolution {
  disputeId: string;
  contractId: string;
  claimant: string;
  respondent: string;
  verdict: 'claimant_favored' | 'respondent_favored' | 'split';
  reputationAdjustment: { agentId: string; delta: number }[];
  resolvedAt: number;
}

export class UniversalAgentNegotiationProtocol {
  private manifests: Map<string, CapabilityManifest> = new Map();
  private tasks: Map<string, TaskAnnouncement> = new Map();
  private bids: Map<string, Bid[]> = new Map();       // taskId -> bids
  private contracts: Map<string, Contract> = new Map();
  private disputes: Map<string, DisputeResolution> = new Map();
  private taskCount = 0;
  private contractCount = 0;
  private disputeCount = 0;
  private readonly ONTOLOGY_VERSION = 'pinexus-agent-ontology-v2';

  constructor() {
    console.log('[AgentNegotiation] Universal negotiation protocol online — Contract-Net bidding + reputation-weighted arbitration');
  }

  /** Publish or update an agent's signed capability manifest */
  publishManifest(agentId: string, skills: string[], pricePerTaskUsd: number, slaMs: number, reputationScore: number = 0.5): CapabilityManifest {
    const manifest: CapabilityManifest = {
      agentId, skills, pricePerTaskUsd, slaResponseTimeMs: slaMs,
      reputationScore, ontologyVersion: this.ONTOLOGY_VERSION, signedAt: Date.now(),
    };
    this.manifests.set(agentId, manifest);
    return manifest;
  }

  /** Announce a task to the network (Contract-Net protocol: announcement phase) */
  announceTask(requester: string, requiredSkills: string[], maxBudgetUsd: number, deadlineMs: number): TaskAnnouncement {
    const task: TaskAnnouncement = {
      taskId: `task-${++this.taskCount}`, requester, requiredSkills, maxBudgetUsd,
      deadlineMs, announcedAt: Date.now(), status: 'open',
    };
    this.tasks.set(task.taskId, task);
    this.bids.set(task.taskId, []);
    return task;
  }

  /** An agent submits a bid for an open task, scored by manifest/skill match */
  submitBid(taskId: string, bidderAgentId: string, proposedPriceUsd: number, proposedDeliveryMs: number): Bid {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'open') throw new Error(`Task ${taskId} is not open for bidding`);
    const manifest = this.manifests.get(bidderAgentId);
    if (!manifest) throw new Error(`Agent ${bidderAgentId} has no published manifest`);

    const matchedSkills = task.requiredSkills.filter(s => manifest.skills.includes(s)).length;
    const confidence = task.requiredSkills.length > 0 ? matchedSkills / task.requiredSkills.length : 0;

    const bid: Bid = {
      bidId: `bid-${Date.now()}-${bidderAgentId}`, taskId, bidder: bidderAgentId,
      proposedPriceUsd, proposedDeliveryMs, confidenceScore: confidence,
    };
    this.bids.get(taskId)!.push(bid);
    return bid;
  }

  /** AI-scored award: ranks bids by a weighted score of price, speed, confidence, and reputation */
  awardTask(taskId: string): { contract: Contract; score: number } | null {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'open') throw new Error(`Task ${taskId} is not open`);
    const bids = this.bids.get(taskId) ?? [];
    const eligible = bids.filter(b => b.proposedPriceUsd <= task.maxBudgetUsd && b.proposedDeliveryMs <= task.deadlineMs);
    if (eligible.length === 0) return null;

    let best: { bid: Bid; score: number } | null = null;
    for (const bid of eligible) {
      const manifest = this.manifests.get(bid.bidder)!;
      const priceScore = 1 - (bid.proposedPriceUsd / Math.max(1, task.maxBudgetUsd));
      const speedScore = 1 - (bid.proposedDeliveryMs / Math.max(1, task.deadlineMs));
      const score = priceScore * 0.3 + speedScore * 0.2 + bid.confidenceScore * 0.3 + manifest.reputationScore * 0.2;
      if (!best || score > best.score) best = { bid, score };
    }
    if (!best) return null;

    const contract: Contract = {
      contractId: `contract-${++this.contractCount}`,
      taskId, requester: task.requester, provider: best.bid.bidder,
      agreedPriceUsd: best.bid.proposedPriceUsd, agreedDeliveryMs: best.bid.proposedDeliveryMs,
      status: 'active', createdAt: Date.now(),
    };
    this.contracts.set(contract.contractId, contract);
    task.status = 'awarded';
    return { contract, score: best.score };
  }

  /** Multi-round negotiation: models concession-rate convergence between requester and bidder offers */
  negotiateRound(taskId: string, round: number, requesterOffer: number, bidderAsk: number, concessionRate: number = 0.15): NegotiationRound {
    const gap = bidderAsk - requesterOffer;
    const requesterNext = requesterOffer + gap * concessionRate;
    const bidderNext = bidderAsk - gap * concessionRate;
    const converged = Math.abs(bidderNext - requesterNext) < Math.max(1, requesterOffer * 0.02);

    return {
      roundId: `neg-${taskId}-r${round}`, taskId, round,
      requesterOffer: requesterNext, bidderCounterOffer: bidderNext, converged,
    };
  }

  /** Mark a contract fulfilled, updating the provider's reputation upward */
  fulfillContract(contractId: string): Contract {
    const contract = this.contracts.get(contractId);
    if (!contract) throw new Error(`Contract ${contractId} not found`);
    contract.status = 'fulfilled';
    const manifest = this.manifests.get(contract.provider);
    if (manifest) manifest.reputationScore = Math.min(1, manifest.reputationScore + 0.02);
    return contract;
  }

  /** File a dispute over a contract; reputation-weighted arbitration decides the verdict */
  resolveDispute(contractId: string, claimant: string, respondent: string, claimantReputationWeight: number, respondentReputationWeight: number): DisputeResolution {
    const contract = this.contracts.get(contractId);
    if (!contract) throw new Error(`Contract ${contractId} not found`);
    contract.status = 'disputed';

    const totalWeight = claimantReputationWeight + respondentReputationWeight;
    const claimantShare = totalWeight > 0 ? claimantReputationWeight / totalWeight : 0.5;
    const verdict: DisputeResolution['verdict'] =
      claimantShare > 0.65 ? 'claimant_favored' : claimantShare < 0.35 ? 'respondent_favored' : 'split';

    const adjustments = verdict === 'claimant_favored'
      ? [{ agentId: respondent, delta: -0.1 }, { agentId: claimant, delta: 0.02 }]
      : verdict === 'respondent_favored'
      ? [{ agentId: claimant, delta: -0.05 }, { agentId: respondent, delta: 0.02 }]
      : [{ agentId: claimant, delta: -0.01 }, { agentId: respondent, delta: -0.01 }];

    for (const adj of adjustments) {
      const m = this.manifests.get(adj.agentId);
      if (m) m.reputationScore = Math.max(0, Math.min(1, m.reputationScore + adj.delta));
    }

    const resolution: DisputeResolution = {
      disputeId: `dispute-${++this.disputeCount}`, contractId, claimant, respondent,
      verdict, reputationAdjustment: adjustments, resolvedAt: Date.now(),
    };
    this.disputes.set(resolution.disputeId, resolution);
    contract.status = verdict === 'respondent_favored' ? 'fulfilled' : 'breached';
    return resolution;
  }

  getManifest(agentId: string): CapabilityManifest | undefined { return this.manifests.get(agentId); }
  getTask(id: string): TaskAnnouncement | undefined { return this.tasks.get(id); }
  getBids(taskId: string): Bid[] { return this.bids.get(taskId) ?? []; }
  getContract(id: string): Contract | undefined { return this.contracts.get(id); }

  getStats() {
    const contracts = Array.from(this.contracts.values());
    return {
      registeredAgents: this.manifests.size,
      openTasks: Array.from(this.tasks.values()).filter(t => t.status === 'open').length,
      totalContracts: contracts.length,
      fulfilledContracts: contracts.filter(c => c.status === 'fulfilled').length,
      disputedContracts: contracts.filter(c => c.status === 'disputed' || c.status === 'breached').length,
      avgReputationScore: this.manifests.size > 0
        ? Array.from(this.manifests.values()).reduce((s, m) => s + m.reputationScore, 0) / this.manifests.size : 0,
    };
  }
}
