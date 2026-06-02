/**
 * Cognitive Architecture Engine — v0.6.0
 * ACT-R declarative memory, SOAR goal stack, Theory of Mind, attention, executive function
 */

export interface MemoryChunk {
  id: string; content: Record<string, unknown>;
  type: 'semantic'|'episodic'|'procedural'|'working';
  activation: number; createdAt: number; lastAccessed: number;
  associativeLinks: string[];
}

export interface Goal {
  id: string; description: string; priority: number; subgoals: Goal[];
  status: 'pending'|'active'|'completed'|'failed'|'suspended'; createdAt: number;
}

export interface TheoryOfMind {
  agentId: string; beliefs: Map<string, unknown>; desires: string[];
  intentions: string[]; confidence: number; lastUpdated: number;
}

export class CognitiveArchitectureEngine {
  private chunks: Map<string, MemoryChunk> = new Map();
  private activations: Map<string, number> = new Map();
  private goals: Goal[] = [];
  private currentGoal: Goal | null = null;
  private completedGoals: Goal[] = [];
  private tomModels: Map<string, TheoryOfMind> = new Map();
  private attentionSpotlight: string[] = [];
  private metacognitiveStack: string[] = [];
  private workingMemoryCapacity: number;
  private cognitiveLoad: number = 0;
  private chunkCount = 0; private goalCount = 0;

  constructor(wmCapacity: number = 7) {
    this.workingMemoryCapacity = wmCapacity;
    console.log('[CogArch] Cognitive Architecture Engine initialized');
  }

  encode(content: Record<string, unknown>, type: MemoryChunk['type'] = 'semantic'): MemoryChunk {
    const chunk: MemoryChunk = { id: `chunk-${++this.chunkCount}`, content, type,
      activation: 0.5, createdAt: Date.now(), lastAccessed: Date.now(), associativeLinks: [] };
    this.chunks.set(chunk.id, chunk); this.activations.set(chunk.id, 0.5);
    return chunk;
  }

  retrieve(query: Record<string, unknown>, topK: number = 5): MemoryChunk[] {
    const results: [MemoryChunk, number][] = [];
    for (const chunk of this.chunks.values()) {
      let score = 0;
      for (const [k, v] of Object.entries(query)) { if (chunk.content[k] === v) score++; else if (JSON.stringify(chunk.content[k]).includes(String(v))) score += 0.5; }
      if (score > 0) { chunk.lastAccessed = Date.now(); results.push([chunk, (this.activations.get(chunk.id) ?? 0) + score * 0.3]); }
    }
    return results.sort(([,a],[,b]) => b-a).slice(0,topK).map(([c]) => c);
  }

  pushGoal(description: string, priority: number = 5): Goal {
    const goal: Goal = { id: `goal-${++this.goalCount}`, description, priority, subgoals: [], status: 'pending', createdAt: Date.now() };
    this.goals.push(goal); this.goals.sort((a,b) => b.priority - a.priority);
    const pending = this.goals.filter(g => g.status === 'pending' || g.status === 'active');
    this.currentGoal = pending[0] ?? null;
    if (this.currentGoal) this.currentGoal.status = 'active';
    return goal;
  }

  async executeCycle(): Promise<{ goal: Goal|null; action: string; outcome: string }> {
    if (!this.currentGoal) return { goal: null, action: 'idle', outcome: 'No active goals' };
    const operators = [`direct_${this.currentGoal.id}`, `decompose_${this.currentGoal.id}`, `delegate_${this.currentGoal.id}`];
    const op = operators[Math.floor(Math.random() * operators.length)] ?? 'default';
    await new Promise(r => setTimeout(r, 5));
    if (Math.random() > 0.3) {
      this.currentGoal.status = 'completed'; this.completedGoals.push(this.currentGoal);
      this.goals = this.goals.filter(g => g.id !== this.currentGoal!.id);
      const pending = this.goals.filter(g => g.status === 'pending');
      this.currentGoal = pending[0] ?? null; if (this.currentGoal) this.currentGoal.status = 'active';
    }
    this.cognitiveLoad = (this.goals.length/10 + this.chunks.size/10000) / 2;
    return { goal: this.currentGoal, action: op, outcome: `Applied ${op}` };
  }

  modelAgent(agentId: string, observations: string[]): TheoryOfMind {
    const beliefs = new Map<string, unknown>();
    for (const obs of observations) beliefs.set(`belief_from:${obs.slice(0,20)}`, obs);
    const tom: TheoryOfMind = { agentId, beliefs,
      desires: observations.slice(0,2).map(o => `desire:${o.slice(0,30)}`),
      intentions: observations.slice(0,1).map(o => `intention:${o.slice(0,30)}`),
      confidence: Math.min(1, 0.5 + observations.length * 0.05), lastUpdated: Date.now() };
    this.tomModels.set(agentId, tom); return tom;
  }

  attend(items: string[]): void {
    this.attentionSpotlight = items.slice(0, this.workingMemoryCapacity);
  }

  plan(goalDesc: string, maxSteps: number = 5): string[] {
    return Array.from({ length: Math.min(maxSteps, 10) }, (_, i) => `Step ${i+1}: ${goalDesc} — action ${i+1}`);
  }

  getCognitiveLoad(): number { return this.cognitiveLoad; }
  getMemorySize(): number { return this.chunks.size; }
  getCurrentGoal(): Goal | null { return this.currentGoal; }
}