/**
 * Swarm Orchestrator
 * 
 * Coordinates the 5000 agents, managing inter-agent communication,
 * task distribution, consensus voting, and self-evolution proposals.
 */

import { Agent, AgentType, SwarmMessage, AITask } from '../../types';

interface SwarmConfig {
  maxAgents: number;
  messageLatencyTarget: number; // ms
  consensusThreshold: number; // percentage for swarm decisions
  evolutionInterval: number; // ms between self-evolution cycles
}

interface TaskAllocation {
  taskId: string;
  agentIds: string[];
  priority: number;
  deadline: number;
}

export class SwarmOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private messageQueue: SwarmMessage[] = [];
  private taskAllocations: Map<string, TaskAllocation> = new Map();
  private evolutionProposals: Map<string, EvolutionProposal> = new Map();
  private config: SwarmConfig;
  private messagesSent: number = 0;

  constructor(config?: Partial<SwarmConfig>) {
    this.config = {
      maxAgents: 5000,
      messageLatencyTarget: 10,
      consensusThreshold: 0.67,
      evolutionInterval: 3600000, // 1 hour
      ...config,
    };

    console.log('[Swarm] Orchestrator initialized');
    console.log(`[Swarm] Max agents: ${this.config.maxAgents}`);
  }

  /**
   * Register an agent in the swarm
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);

    // Establish swarm connections with same-type agents
    for (const [id, existing] of this.agents) {
      if (existing.type === agent.type && id !== agent.id) {
        agent.swarmConnections.push(id);
        if (existing.swarmConnections.length < 50) {
          existing.swarmConnections.push(agent.id);
        }
      }
    }
  }

  /**
   * Broadcast a message to all agents or a specific type
   */
  async broadcast(message: Omit<SwarmMessage, 'id' | 'timestamp'>, targetType?: AgentType): Promise<void> {
    const fullMessage: SwarmMessage = {
      ...message,
      id: `msg-${++this.messagesSent}`,
      timestamp: Date.now(),
    } as SwarmMessage;

    const targets = targetType
      ? Array.from(this.agents.values()).filter((a) => a.type === targetType)
      : Array.from(this.agents.values());

    this.messageQueue.push(fullMessage);

    // Simulate message delivery
    for (const agent of targets) {
      await this.deliverMessage(agent, fullMessage);
    }
  }

  /**
   * Allocate a task to the best agent(s)
   */
  async allocateTask(task: AITask, requiredType?: AgentType): Promise<string[]> {
    // Find best agents for this task
    const candidates = this.findBestAgents(task, requiredType);

    if (candidates.length === 0) {
      console.log(`[Swarm] No available agents for task ${task.id}`);
      return [];
    }

    const allocation: TaskAllocation = {
      taskId: task.id,
      agentIds: candidates.map((a) => a.id),
      priority: task.difficulty,
      deadline: task.deadline,
    };

    this.taskAllocations.set(task.id, allocation);

    // Notify allocated agents
    for (const agent of candidates) {
      agent.status = 'processing';
      agent.currentTask = task;
    }

    console.log(`[Swarm] Task ${task.id} allocated to ${candidates.length} agent(s)`);
    return candidates.map((a) => a.id);
  }

  /**
   * Run swarm consensus on a decision
   */
  async swarmConsensus(proposal: string, voters?: AgentType[]): Promise<{ approved: boolean; votes: number; total: number }> {
    const eligibleVoters = voters
      ? Array.from(this.agents.values()).filter((a) => voters.includes(a.type))
      : Array.from(this.agents.values());

    let yesVotes = 0;
    for (const agent of eligibleVoters) {
      // Each agent evaluates the proposal based on its domain expertise
      const vote = this.agentVote(agent, proposal);
      if (vote) yesVotes++;
    }

    const approved = yesVotes / eligibleVoters.length >= this.config.consensusThreshold;

    return {
      approved,
      votes: yesVotes,
      total: eligibleVoters.length,
    };
  }

  /**
   * Propose a self-evolution update
   */
  async proposeEvolution(proposerAgent: string, changes: string): Promise<string> {
    const proposalId = `evo-${Date.now()}`;
    const proposal: EvolutionProposal = {
      id: proposalId,
      proposer: proposerAgent,
      changes,
      status: 'voting',
      votes: { for: 0, against: 0 },
      createdAt: Date.now(),
    };

    this.evolutionProposals.set(proposalId, proposal);

    // Run swarm consensus
    const result = await this.swarmConsensus(changes);

    proposal.votes = { for: result.votes, against: result.total - result.votes };
    proposal.status = result.approved ? 'approved' : 'rejected';

    if (result.approved) {
      console.log(`[Swarm] Evolution proposal ${proposalId} approved (${result.votes}/${result.total})`);
      await this.applyEvolution(proposal);
    }

    return proposalId;
  }

  /**
   * Get swarm statistics
   */
  getStats(): Record<string, unknown> {
    const agentsByType: Record<string, number> = {};
    const agentsByStatus: Record<string, number> = {};

    for (const agent of this.agents.values()) {
      agentsByType[agent.type] = (agentsByType[agent.type] || 0) + 1;
      agentsByStatus[agent.status] = (agentsByStatus[agent.status] || 0) + 1;
    }

    return {
      totalAgents: this.agents.size,
      agentsByType,
      agentsByStatus,
      pendingTasks: this.taskAllocations.size,
      messagesSent: this.messagesSent,
      evolutionProposals: this.evolutionProposals.size,
    };
  }

  // ── Private Methods ──

  private findBestAgents(task: AITask, requiredType?: AgentType): Agent[] {
    let candidates = Array.from(this.agents.values())
      .filter((a) => a.status === 'idle');

    if (requiredType) {
      candidates = candidates.filter((a) => a.type === requiredType);
    }

    // Sort by performance score (descending)
    candidates.sort((a, b) => b.performanceScore - a.performanceScore);

    // Return top agent(s) based on task difficulty
    const needed = task.difficulty > 500 ? 3 : 1;
    return candidates.slice(0, needed);
  }

  private async deliverMessage(agent: Agent, message: SwarmMessage): Promise<void> {
    // Simulated message delivery with target latency
    // In production, this uses libp2p gossip protocol
  }

  private agentVote(agent: Agent, proposal: string): boolean {
    // Simplified voting logic
    // In production, each agent uses its domain expertise to evaluate
    return agent.performanceScore > 5.0;
  }

  private async applyEvolution(proposal: EvolutionProposal): Promise<void> {
    console.log(`[Swarm] Applying evolution: ${proposal.changes}`);
    // In production, this modifies agent behavior parameters
  }
}

interface EvolutionProposal {
  id: string;
  proposer: string;
  changes: string;
  status: 'voting' | 'approved' | 'rejected' | 'applied';
  votes: { for: number; against: number };
  createdAt: number;
}
