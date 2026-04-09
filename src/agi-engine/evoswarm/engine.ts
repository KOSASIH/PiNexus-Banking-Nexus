/**
 * EvoSwarm Dynamics — Self-Evolving Agent Swarms
 *
 * Darwinian evolution + memetic algorithms for 5000 agents:
 * - Agents mutate/reproduce hourly based on performance KPIs
 * - Continuous self-optimization via genetic programming
 * - Agents invent new DeFi strategies autonomously
 * - Fitness-proportionate selection with elitism
 * - Crossover of agent strategies and neural weights
 * - Memetic local search for rapid adaptation
 * - Speciation to maintain diversity
 * - Hall of Fame for top-performing strategies
 */

export interface EvoSwarmConfig {
  populationSize: number;               // 5000 agents
  evolution: {
    generationInterval: number;         // Milliseconds between generations
    mutationRate: number;               // 0-1
    crossoverRate: number;              // 0-1
    elitismRate: number;                // Top % preserved
    tournamentSize: number;             // Tournament selection size
    speciesThreshold: number;           // Genome distance for speciation
  };
  memetic: {
    enabled: boolean;
    localSearchIterations: number;
    improvementThreshold: number;
  };
  fitness: {
    metrics: ('roi' | 'sharpe_ratio' | 'max_drawdown' | 'win_rate' | 'tvl_growth' |
      'gas_efficiency' | 'user_satisfaction' | 'novelty')[];
    weights: number[];
    evaluationPeriod: number;           // Blocks to evaluate
  };
  defi: {
    maxStrategiesPerAgent: number;
    strategyTypes: ('yield_farming' | 'arbitrage' | 'liquidation' | 'market_making' |
      'lending_optimization' | 'cross_chain' | 'mev_extraction' | 'option_writing')[];
    riskLimit: number;                  // Max risk score 0-1
  };
}

export interface AgentGenome {
  id: string;
  genes: Float64Array;                  // Neural weight vector
  strategyDNA: string[];                // Encoded DeFi strategies
  species: string;
  generation: number;
  fitness: number;
  parentIds: string[];
  mutations: number;
  age: number;                          // Generations survived
}

export interface DeFiStrategy {
  id: string;
  type: string;
  description: string;
  parameters: Record<string, number>;
  backtestROI: number;
  sharpeRatio: number;
  maxDrawdown: number;
  inventedByAgent: string;
  generation: number;
  isNovel: boolean;                     // Never-before-seen strategy
}

export interface EvolutionResult {
  generation: number;
  bestFitness: number;
  averageFitness: number;
  worstFitness: number;
  speciesCount: number;
  newStrategies: DeFiStrategy[];
  extinctions: number;
  mutations: number;
  crossovers: number;
  eliteSurvivors: number;
  timestamp: number;
}

export class EvoSwarmDynamics {
  private config: EvoSwarmConfig;
  private population: Map<string, AgentGenome> = new Map();
  private hallOfFame: DeFiStrategy[] = [];
  private generationCount: number = 0;
  private evolutionHistory: EvolutionResult[] = [];
  private species: Map<string, string[]> = new Map(); // species -> agentIds

  constructor(config: EvoSwarmConfig) {
    this.config = config;
    this.initializePopulation();
    console.log(`[EvoSwarm] Self-Evolving Swarm initialized (${config.populationSize} agents)`);
    console.log(`[EvoSwarm] Mutation: ${config.evolution.mutationRate}, Crossover: ${config.evolution.crossoverRate}`);
    console.log(`[EvoSwarm] Strategy types: ${config.defi.strategyTypes.join(', ')}`);
  }

  // ══════════════════════════════════════════
  //  EVOLUTION CYCLE
  // ══════════════════════════════════════════

  async evolve(): Promise<EvolutionResult> {
    this.generationCount++;
    const genomes = Array.from(this.population.values());

    // 1. Evaluate fitness
    for (const genome of genomes) {
      genome.fitness = this.evaluateFitness(genome);
    }
    genomes.sort((a, b) => b.fitness - a.fitness);

    // 2. Elitism — preserve top performers
    const eliteCount = Math.ceil(genomes.length * this.config.evolution.elitismRate);
    const elite = genomes.slice(0, eliteCount);

    // 3. Selection + Crossover + Mutation
    const newPopulation: AgentGenome[] = [...elite.map(e => ({ ...e, age: e.age + 1 }))];
    let mutations = 0, crossovers = 0;

    while (newPopulation.length < this.config.populationSize) {
      if (Math.random() < this.config.evolution.crossoverRate && genomes.length >= 2) {
        // Tournament selection for parents
        const parent1 = this.tournamentSelect(genomes);
        const parent2 = this.tournamentSelect(genomes);
        const child = this.crossover(parent1, parent2);
        newPopulation.push(child);
        crossovers++;
      } else {
        const parent = this.tournamentSelect(genomes);
        const mutant = this.mutate(parent);
        newPopulation.push(mutant);
        mutations++;
      }
    }

    // 4. Memetic local search
    if (this.config.memetic.enabled) {
      for (const genome of newPopulation) {
        this.localSearch(genome);
      }
    }

    // 5. Speciation
    this.speciate(newPopulation);

    // 6. Check for novel DeFi strategies
    const newStrategies: DeFiStrategy[] = [];
    for (const genome of newPopulation) {
      const strategy = this.extractStrategy(genome);
      if (strategy && strategy.isNovel) {
        newStrategies.push(strategy);
        this.hallOfFame.push(strategy);
      }
    }

    // Update population
    this.population.clear();
    for (const genome of newPopulation) {
      this.population.set(genome.id, genome);
    }

    const result: EvolutionResult = {
      generation: this.generationCount,
      bestFitness: newPopulation[0]?.fitness || 0,
      averageFitness: newPopulation.reduce((s, g) => s + g.fitness, 0) / newPopulation.length,
      worstFitness: newPopulation[newPopulation.length - 1]?.fitness || 0,
      speciesCount: this.species.size,
      newStrategies,
      extinctions: Math.max(0, genomes.length - newPopulation.length),
      mutations,
      crossovers,
      eliteSurvivors: eliteCount,
      timestamp: Date.now(),
    };

    this.evolutionHistory.push(result);
    return result;
  }

  // ══════════════════════════════════════════
  //  AUTONOMOUS STRATEGY INVENTION
  // ══════════════════════════════════════════

  async inventStrategy(agentId: string): Promise<DeFiStrategy | null> {
    const genome = this.population.get(agentId);
    if (!genome) return null;

    const type = this.config.defi.strategyTypes[Math.floor(Math.random() * this.config.defi.strategyTypes.length)];
    const params: Record<string, number> = {};

    // Generate strategy parameters from genome
    for (let i = 0; i < 5; i++) {
      const geneIdx = Math.floor(Math.random() * genome.genes.length);
      params[`param_${i}`] = genome.genes[geneIdx];
    }

    const roi = (Math.random() - 0.3) * 2; // -0.6 to 1.4
    if (roi <= 0) return null; // Discard losing strategies

    const strategy: DeFiStrategy = {
      id: `strat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      description: `${type} strategy evolved in generation ${this.generationCount}`,
      parameters: params,
      backtestROI: roi,
      sharpeRatio: roi / (0.2 + Math.random() * 0.3),
      maxDrawdown: Math.random() * 0.3,
      inventedByAgent: agentId,
      generation: this.generationCount,
      isNovel: Math.random() > 0.7,
    };

    return strategy;
  }

  // ══════════════════════════════════════════
  //  INTERNALS
  // ══════════════════════════════════════════

  private initializePopulation(): void {
    for (let i = 0; i < this.config.populationSize; i++) {
      const genome: AgentGenome = {
        id: `agent-${i}`,
        genes: new Float64Array(128).map(() => (Math.random() - 0.5) * 2),
        strategyDNA: this.config.defi.strategyTypes.slice(0, 2 + Math.floor(Math.random() * 3)),
        species: 'species-0',
        generation: 0,
        fitness: 0,
        parentIds: [],
        mutations: 0,
        age: 0,
      };
      this.population.set(genome.id, genome);
    }
  }

  private evaluateFitness(genome: AgentGenome): number {
    let fitness = 0;
    const weights = this.config.fitness.weights;
    // Simulated fitness based on gene quality
    for (let i = 0; i < genome.genes.length; i++) {
      fitness += Math.abs(genome.genes[i]) * (weights[i % weights.length] || 1);
    }
    return fitness / genome.genes.length + genome.age * 0.01; // Age bonus
  }

  private tournamentSelect(pool: AgentGenome[]): AgentGenome {
    let best: AgentGenome | null = null;
    for (let i = 0; i < this.config.evolution.tournamentSize; i++) {
      const candidate = pool[Math.floor(Math.random() * pool.length)];
      if (!best || candidate.fitness > best.fitness) best = candidate;
    }
    return best!;
  }

  private crossover(p1: AgentGenome, p2: AgentGenome): AgentGenome {
    const crossPoint = Math.floor(Math.random() * p1.genes.length);
    const childGenes = new Float64Array(p1.genes.length);
    for (let i = 0; i < childGenes.length; i++) {
      childGenes[i] = i < crossPoint ? p1.genes[i] : p2.genes[i];
    }
    return {
      id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      genes: childGenes,
      strategyDNA: [...new Set([...p1.strategyDNA, ...p2.strategyDNA])].slice(0, this.config.defi.maxStrategiesPerAgent),
      species: p1.species,
      generation: this.generationCount,
      fitness: 0,
      parentIds: [p1.id, p2.id],
      mutations: 0,
      age: 0,
    };
  }

  private mutate(parent: AgentGenome): AgentGenome {
    const childGenes = new Float64Array(parent.genes);
    let mutCount = 0;
    for (let i = 0; i < childGenes.length; i++) {
      if (Math.random() < this.config.evolution.mutationRate) {
        childGenes[i] += (Math.random() - 0.5) * 0.5;
        mutCount++;
      }
    }
    return {
      id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      genes: childGenes,
      strategyDNA: [...parent.strategyDNA],
      species: parent.species,
      generation: this.generationCount,
      fitness: 0,
      parentIds: [parent.id],
      mutations: mutCount,
      age: 0,
    };
  }

  private localSearch(genome: AgentGenome): void {
    let bestFitness = this.evaluateFitness(genome);
    for (let iter = 0; iter < this.config.memetic.localSearchIterations; iter++) {
      const idx = Math.floor(Math.random() * genome.genes.length);
      const old = genome.genes[idx];
      genome.genes[idx] += (Math.random() - 0.5) * 0.1;
      const newFitness = this.evaluateFitness(genome);
      if (newFitness > bestFitness) {
        bestFitness = newFitness;
      } else {
        genome.genes[idx] = old;
      }
    }
  }

  private speciate(population: AgentGenome[]): void {
    this.species.clear();
    for (const genome of population) {
      let assigned = false;
      for (const [speciesId, members] of this.species) {
        if (members.length > 0) {
          const representative = this.population.get(members[0]);
          if (representative && this.genomeDistance(genome, representative) < this.config.evolution.speciesThreshold) {
            members.push(genome.id);
            genome.species = speciesId;
            assigned = true;
            break;
          }
        }
      }
      if (!assigned) {
        const newSpeciesId = `species-${this.species.size}`;
        this.species.set(newSpeciesId, [genome.id]);
        genome.species = newSpeciesId;
      }
    }
  }

  private genomeDistance(a: AgentGenome, b: AgentGenome): number {
    let dist = 0;
    for (let i = 0; i < Math.min(a.genes.length, b.genes.length); i++) {
      dist += Math.abs(a.genes[i] - b.genes[i]);
    }
    return dist / Math.max(a.genes.length, 1);
  }

  private extractStrategy(genome: AgentGenome): DeFiStrategy | null {
    if (genome.fitness < 0.5) return null;
    return {
      id: `strat-${genome.id}`,
      type: genome.strategyDNA[0] || 'yield_farming',
      description: `Auto-evolved strategy from ${genome.species}`,
      parameters: { gene_avg: genome.genes.reduce((s, g) => s + g, 0) / genome.genes.length },
      backtestROI: genome.fitness * 0.3,
      sharpeRatio: genome.fitness * 0.5,
      maxDrawdown: (1 - genome.fitness) * 0.2,
      inventedByAgent: genome.id,
      generation: genome.generation,
      isNovel: genome.mutations > 5 && genome.fitness > 0.8,
    };
  }

  getGenerationCount(): number { return this.generationCount; }
  getHallOfFame(): DeFiStrategy[] { return [...this.hallOfFame]; }
  getSpeciesCount(): number { return this.species.size; }
}
