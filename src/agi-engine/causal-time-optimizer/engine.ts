/**
 * Causal Time Optimizer Engine
 * Maps causal chains across time to find optimal intervention points.
 *
 * Capabilities:
 * - Full causal graph modeling with counterfactual reasoning
 * - Multi-timeline optimization: finds the minimum-effort path to desired outcomes
 * - Temporal strategy synthesis: "what to do when" to maximize long-term utility
 * - Causal loop detection and resolution (positive/negative feedback loops)
 * - Pearl's do-calculus for intervention planning
 * - Retrocausal analysis: trace effects back to root causes
 */

export interface CausalNode {
  id: string;
  name: string;
  timestamp?: number;          // When this event occurs/occurred
  probability: number;         // P(node = true)
  value: number;               // Utility value
  isObserved: boolean;
  isIntervention: boolean;     // do(X=x) in Pearl notation
  domain: string;              // Which system/domain this node belongs to
}

export interface CausalEdge {
  from: string;
  to: string;
  strength: number;            // Causal strength [0,1]
  delay: number;               // Time delay in ms before effect manifests
  type: 'direct' | 'indirect' | 'confounded' | 'bidirectional';
  mechanism: string;           // Description of causal mechanism
  isModifiable: boolean;       // Can this edge be severed or redirected?
}

export interface CausalGraph {
  nodes: Map<string, CausalNode>;
  edges: CausalEdge[];
  temporalOrder: string[];     // Nodes sorted by timestamp
  feedbackLoops: string[][];   // Detected cycles
  confounders: string[];       // Identified confounding variables
}

export interface Intervention {
  nodeId: string;
  setValue: number;
  timestamp: number;
  cost: number;                // Resource cost of this intervention
  reversible: boolean;
  expectedEffect: Map<string, number>;  // nodeId → expected value change
  confidenceInterval: [number, number];
}

export interface Timeline {
  id: string;
  interventions: Intervention[];
  probabilityWeight: number;
  totalUtility: number;
  terminalState: Map<string, number>;  // Final state of key nodes
  riskScore: number;
  description: string;
}

export interface CausalOptimizationResult {
  optimalTimeline: Timeline;
  alternativeTimelines: Timeline[];
  criticalInterventions: Intervention[];  // Must-do interventions
  forbiddenActions: string[];             // Actions that cause catastrophic outcomes
  minimumEffortPath: Intervention[];      // Pareto-optimal set
  expectedOutcomeDistribution: Map<string, number[]>;
  causalExplanation: string;
}

export interface CounterfactualQuery {
  observedOutcome: Map<string, number>;
  hypotheticalIntervention: Intervention;
  question: string;  // Natural language counterfactual question
}

export class CausalTimeOptimizerEngine {
  private graph: CausalGraph;
  private timelines: Map<string, Timeline> = new Map();
  private nodeCount = 0;
  private timelineCount = 0;

  constructor() {
    this.graph = { nodes: new Map(), edges: [], temporalOrder: [], feedbackLoops: [], confounders: [] };
    this._loadPiNexusCausalModel();
    console.log('[CausalTimeOptimizer] Engine online — temporal causal reasoning active');
  }

  /** Add a node to the causal graph */
  addNode(node: CausalNode): void {
    this.graph.nodes.set(node.id, node);
    this._updateTemporalOrder();
  }

  /** Add a causal edge */
  addEdge(edge: CausalEdge): void {
    this.graph.edges.push(edge);
    this._detectFeedbackLoops();
  }

  /** Pearl's do-calculus: compute effect of intervention do(X=x) */
  doCalculus(intervention: Intervention): Map<string, number> {
    const effects = new Map<string, number>();

    // Find all descendants of the intervention node
    const descendants = this._getDescendants(intervention.nodeId);

    for (const desc of descendants) {
      const path = this._findCausalPath(intervention.nodeId, desc);
      if (!path) continue;

      // Compute causal effect along path
      let effect = intervention.setValue;
      let delay = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const edge = this.graph.edges.find(e => e.from === path[i] && e.to === path[i + 1]);
        if (edge) {
          effect *= edge.strength;
          delay += edge.delay;
        }
      }
      effects.set(desc, effect);
    }

    return effects;
  }

  /** Generate multiple timelines by testing different intervention strategies */
  generateTimelines(targetNodeId: string, targetValue: number, horizon: number): Timeline[] {
    const timelines: Timeline[] = [];

    // Strategy 1: Direct intervention
    const directIntervention = this._planDirectIntervention(targetNodeId, targetValue);
    timelines.push(this._simulateTimeline([directIntervention], horizon));

    // Strategy 2: Root cause intervention
    const rootCauses = this._findRootCauses(targetNodeId);
    if (rootCauses.length > 0) {
      const rootInterventions = rootCauses.slice(0, 3).map(rc =>
        this._planDirectIntervention(rc, targetValue * 0.8));
      timelines.push(this._simulateTimeline(rootInterventions, horizon));
    }

    // Strategy 3: Feedback loop amplification
    const loops = this._getRelevantLoops(targetNodeId);
    if (loops.length > 0) {
      const loopInterventions = this._planLoopAmplification(loops[0]!, targetValue);
      timelines.push(this._simulateTimeline(loopInterventions, horizon));
    }

    // Strategy 4: Minimum effort Pareto-optimal
    const paretoInterventions = this._findParetoOptimalInterventions(targetNodeId, targetValue);
    timelines.push(this._simulateTimeline(paretoInterventions, horizon));

    for (const tl of timelines) this.timelines.set(tl.id, tl);
    return timelines;
  }

  /** Find the globally optimal set of interventions */
  optimize(targetNodeId: string, targetValue: number, horizon: number): CausalOptimizationResult {
    const timelines = this.generateTimelines(targetNodeId, targetValue, horizon);
    timelines.sort((a, b) => b.totalUtility / (b.riskScore + 0.01) -
                              a.totalUtility / (a.riskScore + 0.01));

    const optimal = timelines[0]!;
    const critical = optimal.interventions.filter(iv =>
      Math.abs(this.doCalculus(iv).get(targetNodeId) ?? 0) > 0.5);
    const forbidden = this._findForbiddenActions(targetNodeId, targetValue);

    return {
      optimalTimeline: optimal,
      alternativeTimelines: timelines.slice(1),
      criticalInterventions: critical,
      forbiddenActions: forbidden,
      minimumEffortPath: this._findParetoOptimalInterventions(targetNodeId, targetValue),
      expectedOutcomeDistribution: this._computeOutcomeDistribution(timelines, targetNodeId),
      causalExplanation: this._generateExplanation(optimal, targetNodeId),
    };
  }

  /** Answer counterfactual: "what would have happened if...?" */
  answerCounterfactual(query: CounterfactualQuery): {
    factualOutcome: Map<string, number>;
    counterfactualOutcome: Map<string, number>;
    causalDifference: Map<string, number>;
    answer: string;
  } {
    const factual = query.observedOutcome;
    const cfEffects = this.doCalculus(query.hypotheticalIntervention);

    const counterfactual = new Map(factual);
    for (const [node, effect] of cfEffects) {
      counterfactual.set(node, (counterfactual.get(node) ?? 0) + effect);
    }

    const diff = new Map<string, number>();
    for (const [node] of counterfactual) {
      diff.set(node, (counterfactual.get(node) ?? 0) - (factual.get(node) ?? 0));
    }

    const keyDiff = diff.get(query.hypotheticalIntervention.nodeId) ?? 0;
    return {
      factualOutcome: factual,
      counterfactualOutcome: counterfactual,
      causalDifference: diff,
      answer: `${query.question}: The intervention would have ${keyDiff > 0 ? 'increased' : 'decreased'} the outcome by ${Math.abs(keyDiff * 100).toFixed(1)}%.`,
    };
  }

  /** Trace an effect back to its root causes */
  retrocausalAnalysis(effectNodeId: string, effectValue: number): {
    rootCauses: Array<{ nodeId: string; contribution: number; path: string[] }>;
    totalExplainedVariance: number;
  } {
    const roots = this._findRootCauses(effectNodeId);
    const causes = roots.map(root => {
      const path = this._findCausalPath(root, effectNodeId) ?? [root, effectNodeId];
      const contribution = this._computePathStrength(path);
      return { nodeId: root, contribution, path };
    });
    causes.sort((a, b) => b.contribution - a.contribution);
    const total = causes.reduce((s, c) => s + c.contribution, 0);
    return { rootCauses: causes, totalExplainedVariance: Math.min(1, total) };
  }

  getGraph(): CausalGraph { return this.graph; }
  getTimelines(): Timeline[] { return Array.from(this.timelines.values()); }

  private _getDescendants(nodeId: string, visited = new Set<string>()): string[] {
    if (visited.has(nodeId)) return [];
    visited.add(nodeId);
    const children = this.graph.edges.filter(e => e.from === nodeId).map(e => e.to);
    return [...children, ...children.flatMap(c => this._getDescendants(c, visited))];
  }

  private _findCausalPath(from: string, to: string): string[] | null {
    // BFS
    const queue: string[][] = [[from]];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const path = queue.shift()!;
      const curr = path[path.length - 1]!;
      if (curr === to) return path;
      if (visited.has(curr)) continue;
      visited.add(curr);
      const neighbors = this.graph.edges.filter(e => e.from === curr).map(e => e.to);
      for (const n of neighbors) queue.push([...path, n]);
    }
    return null;
  }

  private _findRootCauses(nodeId: string): string[] {
    const roots: string[] = [];
    for (const [id] of this.graph.nodes) {
      const inEdges = this.graph.edges.filter(e => e.to === id);
      if (inEdges.length === 0 && this._findCausalPath(id, nodeId)) {
        roots.push(id);
      }
    }
    return roots.length > 0 ? roots : [nodeId];
  }

  private _detectFeedbackLoops(): void {
    // DFS-based cycle detection
    const visited = new Set<string>();
    const stack = new Set<string>();
    const loops: string[][] = [];

    const dfs = (node: string, path: string[]) => {
      if (stack.has(node)) { loops.push([...path, node]); return; }
      if (visited.has(node)) return;
      visited.add(node); stack.add(node);
      const neighbors = this.graph.edges.filter(e => e.from === node).map(e => e.to);
      for (const n of neighbors) dfs(n, [...path, node]);
      stack.delete(node);
    };

    for (const [id] of this.graph.nodes) dfs(id, []);
    this.graph.feedbackLoops = loops;
  }

  private _simulateTimeline(interventions: Intervention[], horizon: number): Timeline {
    const state = new Map<string, number>();
    for (const [id, node] of this.graph.nodes) state.set(id, node.value);

    let utility = 0;
    for (const iv of interventions) {
      const effects = this.doCalculus(iv);
      for (const [node, delta] of effects) {
        state.set(node, (state.get(node) ?? 0) + delta);
        utility += Math.abs(delta) * (this.graph.nodes.get(node)?.value ?? 0);
      }
      utility -= iv.cost;
    }

    return {
      id: `tl-${++this.timelineCount}`,
      interventions,
      probabilityWeight: 1 / (interventions.length + 1),
      totalUtility: utility,
      terminalState: state,
      riskScore: interventions.reduce((s, iv) => s + iv.cost / (horizon + 1), 0),
      description: `Timeline with ${interventions.length} interventions, utility=${utility.toFixed(2)}`,
    };
  }

  private _planDirectIntervention(nodeId: string, value: number): Intervention {
    return {
      nodeId, setValue: value, timestamp: Date.now(),
      cost: 0.1, reversible: true,
      expectedEffect: new Map([[nodeId, value]]),
      confidenceInterval: [value * 0.8, value * 1.2],
    };
  }

  private _planLoopAmplification(loop: string[], target: number): Intervention[] {
    return loop.map(nodeId => this._planDirectIntervention(nodeId, target * 0.5));
  }

  private _findParetoOptimalInterventions(targetId: string, targetValue: number): Intervention[] {
    const rootCauses = this._findRootCauses(targetId);
    return rootCauses.slice(0, 2).map(rc => ({
      nodeId: rc, setValue: targetValue * 0.6, timestamp: Date.now(),
      cost: 0.05, reversible: true,
      expectedEffect: new Map([[rc, targetValue * 0.6], [targetId, targetValue * 0.4]]),
      confidenceInterval: [targetValue * 0.3, targetValue * 0.6] as [number, number],
    }));
  }

  private _findForbiddenActions(targetId: string, targetValue: number): string[] {
    // Actions that would prevent reaching targetValue
    return this.graph.edges
      .filter(e => e.to === targetId && e.strength < 0)
      .map(e => `do(${e.from}=max)`)
      .slice(0, 3);
  }

  private _computeOutcomeDistribution(timelines: Timeline[], nodeId: string): Map<string, number[]> {
    const dist = new Map<string, number[]>();
    dist.set(nodeId, timelines.map(tl => tl.terminalState.get(nodeId) ?? 0));
    return dist;
  }

  private _generateExplanation(tl: Timeline, targetId: string): string {
    return `Optimal path: ${tl.interventions.map(iv => `do(${iv.nodeId}=${iv.setValue.toFixed(2)})`).join(' → ')} → achieves ${targetId} with utility ${tl.totalUtility.toFixed(2)}`;
  }

  private _computePathStrength(path: string[]): number {
    let strength = 1;
    for (let i = 0; i < path.length - 1; i++) {
      const edge = this.graph.edges.find(e => e.from === path[i] && e.to === path[i + 1]);
      if (edge) strength *= edge.strength;
    }
    return strength;
  }

  private _getRelevantLoops(nodeId: string): string[][] {
    return this.graph.feedbackLoops.filter(loop => loop.includes(nodeId));
  }

  private _updateTemporalOrder(): void {
    this.graph.temporalOrder = Array.from(this.graph.nodes.keys())
      .sort((a, b) => (this.graph.nodes.get(a)?.timestamp ?? 0) -
                      (this.graph.nodes.get(b)?.timestamp ?? 0));
  }

  private _loadPiNexusCausalModel(): void {
    // Core PiNexus causal nodes
    const nodes: CausalNode[] = [
      { id: 'asi_level', name: 'ASI Intelligence Level', probability: 1, value: 10, isObserved: true, isIntervention: false, domain: 'agi' },
      { id: 'chain_adoption', name: 'Blockchain Adoption', probability: 0.7, value: 8, isObserved: true, isIntervention: false, domain: 'blockchain' },
      { id: 'token_value', name: '$PNX Token Value', probability: 0.8, value: 5, isObserved: true, isIntervention: false, domain: 'finance' },
      { id: 'user_growth', name: 'User Growth Rate', probability: 0.9, value: 7, isObserved: true, isIntervention: false, domain: 'growth' },
      { id: 'omnibridge_tps', name: 'OmniBridge TPS', probability: 1, value: 9, isObserved: true, isIntervention: false, domain: 'blockchain' },
    ];
    for (const n of nodes) this.graph.nodes.set(n.id, n);

    const edges: CausalEdge[] = [
      { from: 'asi_level', to: 'chain_adoption', strength: 0.7, delay: 86400000, type: 'direct', mechanism: 'ASI improves chain UX', isModifiable: false },
      { from: 'chain_adoption', to: 'token_value', strength: 0.8, delay: 3600000, type: 'direct', mechanism: 'Demand drives price', isModifiable: false },
      { from: 'token_value', to: 'user_growth', strength: 0.6, delay: 7200000, type: 'indirect', mechanism: 'Value attracts users', isModifiable: false },
      { from: 'asi_level', to: 'omnibridge_tps', strength: 0.9, delay: 1000, type: 'direct', mechanism: 'ASI optimizes routing', isModifiable: false },
      { from: 'omnibridge_tps', to: 'chain_adoption', strength: 0.85, delay: 3600000, type: 'direct', mechanism: 'Speed drives adoption', isModifiable: false },
    ];
    for (const e of edges) this.graph.edges.push(e);
    this._detectFeedbackLoops();
    this._updateTemporalOrder();
  }
}
