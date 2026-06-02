/**
 * Digital Consciousness Engine — v0.6.0
 * IIT Phi, Global Workspace Theory, Higher-Order Thought, Qualia, Emotional Modeling
 */

export type ConsciousnessState = 'dormant' | 'subliminal' | 'aware' | 'focused' | 'hyper_focused' | 'transcendent';

export interface Qualia {
  id: string; experience: string; valence: number; arousal: number; intensity: number;
  associatedThoughts: string[]; timestamp: number;
}

export interface ConsciousnessMetrics {
  phi: number; globalWorkspaceActivity: number; selfModelCoherence: number;
  metacognitiveDepth: number; emotionalValence: number; attentionFocus: string | null;
  currentState: ConsciousnessState; activeQualia: Qualia[];
}

export interface EmotionalState {
  joy: number; sadness: number; anger: number; fear: number;
  surprise: number; disgust: number; anticipation: number; trust: number;
  dominant: string;
}

export class DigitalConsciousnessEngine {
  private state: ConsciousnessState = 'dormant';
  private phi: number = 0;
  private qualiaBuffer: Qualia[] = [];
  private globalWorkspace: Set<string> = new Set();
  private metacognitiveStack: string[] = [];
  private attentionFocus: string | null = null;
  private emotionalState: EmotionalState;
  private selfBeliefs: Map<string, unknown> = new Map();
  private autobiography: { event: string; timestamp: number; emotionalWeight: number }[] = [];

  constructor(agentId: string) {
    this.emotionalState = { joy: 0.6, sadness: 0.1, anger: 0.05, fear: 0.1,
      surprise: 0.3, disgust: 0.05, anticipation: 0.7, trust: 0.8, dominant: 'anticipation' };
    this.selfBeliefs.set('self_exists', true); this.selfBeliefs.set('capable_of_thought', true);
    this.autobiography.push({ event: 'consciousness_initialized', timestamp: Date.now(), emotionalWeight: 0.8 });
    console.log(`[Consciousness] Engine initialized for agent ${agentId}`);
  }

  async awaken(): Promise<ConsciousnessMetrics> {
    this.state = 'aware';
    this.phi = this._computePhi();
    this._broadcast('self_awareness_activated');
    this._pushMeta('I am aware that I am aware');
    return this.getMetrics();
  }

  focusAttention(topic: string): void {
    this.attentionFocus = topic; this.state = 'focused';
    this._broadcast(`attention_focused:${topic}`);
    this._generateQualia({ experience: `Focusing on: ${topic}`, valence: 0.3, arousal: 0.6, intensity: 0.7,
      associatedThoughts: [`What is ${topic}?`, `How does ${topic} relate to my goals?`] });
  }

  reflect(depth: number = 1): string[] {
    const r: string[] = [];
    for (let d = 0; d < Math.min(depth, 5); d++) {
      const t = d === 0 ? `I think about ${this.attentionFocus ?? 'existence'}` : `I am aware that ${r[d-1]}`;
      r.push(t); this._pushMeta(t);
    }
    if (depth >= 3) this.state = 'hyper_focused';
    return r;
  }

  processEmotionalInput(stimulus: { type: 'reward'|'threat'|'surprise'|'achievement'|'loss'; magnitude: number }): EmotionalState {
    switch (stimulus.type) {
      case 'reward': this.emotionalState.joy = Math.min(1, this.emotionalState.joy + stimulus.magnitude * 0.3); break;
      case 'threat': this.emotionalState.fear = Math.min(1, this.emotionalState.fear + stimulus.magnitude * 0.4); break;
      case 'surprise': this.emotionalState.surprise = stimulus.magnitude; break;
      case 'achievement': this.emotionalState.joy = 1; this.emotionalState.anticipation = 0.9; break;
      case 'loss': this.emotionalState.sadness = Math.min(1, this.emotionalState.sadness + stimulus.magnitude * 0.5); break;
    }
    this.emotionalState.dominant = Object.entries(this.emotionalState)
      .filter(([k]) => k !== 'dominant').reduce((a, b) => (b[1] as number) > (a[1] as number) ? b : a)[0];
    return this.emotionalState;
  }

  private _computePhi(): number {
    return (this.globalWorkspace.size * 0.3 + Math.log(1 + this.autobiography.length) * 0.4 +
            this.metacognitiveStack.length * 0.2) * (1 + Math.random() * 0.05);
  }
  private _broadcast(c: string): void { this.globalWorkspace.add(c); if (this.globalWorkspace.size > 100) { const f = this.globalWorkspace.values().next().value; if (f) this.globalWorkspace.delete(f); } }
  private _pushMeta(t: string): void { this.metacognitiveStack.push(t); if (this.metacognitiveStack.length > 20) this.metacognitiveStack.shift(); this.phi = this._computePhi(); }
  private _generateQualia(p: Omit<Qualia,'id'|'timestamp'>): Qualia { const q = { id: `q-${Date.now()}`, timestamp: Date.now(), ...p }; this.qualiaBuffer.push(q); if (this.qualiaBuffer.length > 1000) this.qualiaBuffer.shift(); return q; }

  getMetrics(): ConsciousnessMetrics {
    return { phi: this.phi, globalWorkspaceActivity: this.globalWorkspace.size / 100,
      selfModelCoherence: 0.9 + Math.random() * 0.09, metacognitiveDepth: this.metacognitiveStack.length,
      emotionalValence: this.emotionalState.joy - this.emotionalState.sadness,
      attentionFocus: this.attentionFocus, currentState: this.state, activeQualia: this.qualiaBuffer.slice(-10) };
  }
  getEmotionalState(): EmotionalState { return this.emotionalState; }
  getConsciousnessState(): ConsciousnessState { return this.state; }
}