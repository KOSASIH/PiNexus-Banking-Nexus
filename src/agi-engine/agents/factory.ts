/**
 * Agent Factory — Creates and manages the 5000 God-level Autonomous Agents
 */

import { Agent, AgentType, AgentStatus, AITask } from '../../types';

interface AgentBlueprint {
  type: AgentType;
  subType: string;
  count: number;
  capabilities: string[];
}

const AGENT_BLUEPRINTS: AgentBlueprint[] = [
  // Oracle Agents (1000)
  { type: 'oracle', subType: 'financial', count: 400, capabilities: ['market_data', 'price_feeds', 'derivatives'] },
  { type: 'oracle', subType: 'environmental', count: 200, capabilities: ['weather', 'climate', 'satellite'] },
  { type: 'oracle', subType: 'social', count: 200, capabilities: ['sentiment', 'trends', 'news'] },
  { type: 'oracle', subType: 'iot', count: 100, capabilities: ['telemetry', 'supply_chain', 'sensors'] },
  { type: 'oracle', subType: 'government', count: 100, capabilities: ['regulation', 'economics', 'policy'] },

  // DeFi Agents (1500)
  { type: 'defi', subType: 'trading', count: 500, capabilities: ['spot', 'derivatives', 'arbitrage'] },
  { type: 'defi', subType: 'yield', count: 400, capabilities: ['farming', 'apy_optimization', 'auto_compound'] },
  { type: 'defi', subType: 'risk', count: 300, capabilities: ['portfolio_risk', 'liquidation_prevention', 'var'] },
  { type: 'defi', subType: 'market_making', count: 200, capabilities: ['amm', 'price_stability', 'depth'] },
  { type: 'defi', subType: 'lending', count: 100, capabilities: ['credit_scoring', 'collateral', 'rates'] },

  // Governance Agents (500)
  { type: 'governance', subType: 'proposal_analyst', count: 200, capabilities: ['impact_simulation', 'cost_benefit'] },
  { type: 'governance', subType: 'vote_coordinator', count: 150, capabilities: ['quorum', 'delegation', 'quadratic'] },
  { type: 'governance', subType: 'treasury_manager', count: 100, capabilities: ['allocation', 'investment', 'reserves'] },
  { type: 'governance', subType: 'conflict_resolver', count: 50, capabilities: ['mediation', 'consensus', 'arbitration'] },

  // Innovation Agents (1000)
  { type: 'innovation', subType: 'nft_creator', count: 300, capabilities: ['image_gen', 'music_gen', '3d_gen'] },
  { type: 'innovation', subType: 'metaverse_architect', count: 300, capabilities: ['terrain', 'buildings', 'npcs'] },
  { type: 'innovation', subType: 'rwa_tokenizer', count: 200, capabilities: ['verification', 'legal', 'valuation'] },
  { type: 'innovation', subType: 'smart_contract_engineer', count: 200, capabilities: ['template', 'audit', 'optimization'] },

  // Security Agents (500)
  { type: 'security', subType: 'threat_hunter', count: 200, capabilities: ['vulnerability_scan', 'exploit_detection'] },
  { type: 'security', subType: 'incident_responder', count: 150, capabilities: ['mitigation', 'rollback', 'alerting'] },
  { type: 'security', subType: 'audit_agent', count: 100, capabilities: ['contract_audit', 'formal_verification'] },
  { type: 'security', subType: 'network_guardian', count: 50, capabilities: ['topology_monitor', 'ddos_protection'] },

  // User Agents (500)
  { type: 'user', subType: 'onboarding_guide', count: 150, capabilities: ['tutorial', 'kyc_assist', 'wallet_setup'] },
  { type: 'user', subType: 'mining_advisor', count: 150, capabilities: ['device_optimization', 'task_selection'] },
  { type: 'user', subType: 'portfolio_advisor', count: 100, capabilities: ['recommendations', 'risk_profile'] },
  { type: 'user', subType: 'support_agent', count: 100, capabilities: ['faq', 'troubleshooting', 'feedback'] },
];

export class AgentFactory {
  private agents: Map<string, Agent> = new Map();
  private agentsByType: Map<AgentType, Agent[]> = new Map();
  private totalCreated: number = 0;

  constructor() {
    console.log('[AgentFactory] Agent factory initialized');
    console.log(`[AgentFactory] Blueprints loaded: ${AGENT_BLUEPRINTS.length} sub-types`);
  }

  /**
   * Deploy all 5000 agents according to blueprints
   */
  async deployAll(): Promise<void> {
    console.log('[AgentFactory] Deploying 5000 God-level Autonomous Super AI Agents...');

    for (const blueprint of AGENT_BLUEPRINTS) {
      for (let i = 0; i < blueprint.count; i++) {
        const agent = this.createAgent(blueprint);
        this.agents.set(agent.id, agent);

        const typeList = this.agentsByType.get(blueprint.type) || [];
        typeList.push(agent);
        this.agentsByType.set(blueprint.type, typeList);
      }
    }

    console.log(`[AgentFactory] ✅ Deployed ${this.totalCreated} agents`);
    this.printDeploymentSummary();
  }

  /**
   * Get an available agent of a specific type
   */
  getAvailableAgent(type: AgentType, subType?: string): Agent | undefined {
    const typeAgents = this.agentsByType.get(type) || [];
    return typeAgents.find((a) =>
      a.status === 'idle' &&
      (!subType || a.subType === subType)
    );
  }

  /**
   * Assign a task to an agent
   */
  assignTask(agentId: string, task: AITask): boolean {
    const agent = this.agents.get(agentId);
    if (!agent || agent.status !== 'idle') return false;

    agent.status = 'processing';
    agent.currentTask = task;
    return true;
  }

  /**
   * Complete a task and free the agent
   */
  completeTask(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent || agent.status !== 'processing') return false;

    agent.tasksCompleted++;
    agent.currentTask = undefined;
    agent.status = 'idle';
    return true;
  }

  /**
   * Get agent statistics
   */
  getStats(): Record<AgentType, { total: number; active: number; idle: number; processing: number }> {
    const stats: any = {};

    for (const [type, agents] of this.agentsByType) {
      stats[type] = {
        total: agents.length,
        active: agents.filter((a) => a.status === 'active' || a.status === 'processing').length,
        idle: agents.filter((a) => a.status === 'idle').length,
        processing: agents.filter((a) => a.status === 'processing').length,
      };
    }

    return stats;
  }

  /**
   * Get all agents of a specific type
   */
  getAgentsByType(type: AgentType): Agent[] {
    return this.agentsByType.get(type) || [];
  }

  /**
   * Get total agent count
   */
  getTotalAgents(): number {
    return this.agents.size;
  }

  // ── Private Methods ──

  private createAgent(blueprint: AgentBlueprint): Agent {
    const id = `${blueprint.type}_${blueprint.subType}_${String(this.totalCreated).padStart(4, '0')}`;
    this.totalCreated++;

    return {
      id,
      type: blueprint.type,
      subType: blueprint.subType,
      status: 'idle',
      performanceScore: 5.0 + Math.random() * 5.0,
      tasksCompleted: 0,
      uptime: 100,
      version: '1.0.0',
      capabilities: blueprint.capabilities,
      swarmConnections: [],
    };
  }

  private printDeploymentSummary(): void {
    console.log('[AgentFactory] ── Deployment Summary ──');
    for (const [type, agents] of this.agentsByType) {
      console.log(`  ${type.toUpperCase()}: ${agents.length} agents`);
    }
  }
}
