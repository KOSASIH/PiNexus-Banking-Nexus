/**
 * Neural Mining Engine
 * 
 * Allows any device to contribute AI compute and earn $PNX tokens.
 * AGI assigns personalized mining tasks based on device capabilities.
 */

import { NeuralMiningSession, DeviceProfile, AITask, AITaskType } from '../../types';

interface MiningConfig {
  maxCpuUsage: number;
  maxGpuUsage: number;
  preferredTaskTypes: AITaskType[];
  autoOptimize: boolean;
}

interface MiningStats {
  sessionsStarted: number;
  tasksCompleted: number;
  totalEarned: bigint;
  averageScore: number;
  bestScore: number;
  uptime: number;
}

export class NeuralMiner {
  private sessions: Map<string, NeuralMiningSession> = new Map();
  private stats: MiningStats;
  private sessionCounter: number = 0;

  constructor() {
    this.stats = {
      sessionsStarted: 0,
      tasksCompleted: 0,
      totalEarned: BigInt(0),
      averageScore: 0,
      bestScore: 0,
      uptime: 0,
    };

    console.log('[NeuralMiner] Mining engine initialized');
  }

  /**
   * Start a new mining session
   */
  async startSession(
    minerAddress: string,
    deviceProfile: DeviceProfile,
    config?: Partial<MiningConfig>
  ): Promise<NeuralMiningSession> {
    const sessionId = `ms-${++this.sessionCounter}-${Date.now()}`;

    // Analyze device capabilities
    const optimalTasks = this.analyzeDevice(deviceProfile);

    // Request tasks from AGI engine
    const tasks = this.generateOptimalTasks(optimalTasks, deviceProfile);

    const session: NeuralMiningSession = {
      sessionId,
      minerAddress,
      deviceProfile,
      assignedTasks: tasks,
      totalEarned: BigInt(0),
      intelligenceScore: 0,
      startTime: Date.now(),
      status: 'active',
    };

    this.sessions.set(sessionId, session);
    this.stats.sessionsStarted++;

    console.log(`[NeuralMiner] Session ${sessionId} started for ${minerAddress}`);
    console.log(`[NeuralMiner] Device: ${deviceProfile.platform}, ${deviceProfile.cpuCores} cores`);
    console.log(`[NeuralMiner] Assigned ${tasks.length} tasks`);

    return session;
  }

  /**
   * Submit a completed task result
   */
  async submitResult(
    sessionId: string,
    taskId: string,
    result: Uint8Array,
    accuracy: number
  ): Promise<{ reward: bigint; score: number }> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') {
      throw new Error('Invalid or inactive session');
    }

    const task = session.assignedTasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found in session');

    // Calculate reward
    const speedFactor = Math.min(2.0, 10000 / (Date.now() - task.createdAt));
    const score = task.difficulty * accuracy * speedFactor;
    const reward = BigInt(Math.floor(score * 100)) * BigInt(1e15);

    // Update session
    session.totalEarned += reward;
    session.intelligenceScore += score;
    task.status = 'completed';
    task.result = result;
    task.completedAt = Date.now();

    // Update global stats
    this.stats.tasksCompleted++;
    this.stats.totalEarned += reward;
    if (score > this.stats.bestScore) this.stats.bestScore = score;

    // Assign new task to replace completed one
    const newTask = this.generateOptimalTasks(
      this.analyzeDevice(session.deviceProfile),
      session.deviceProfile,
      1
    )[0];
    if (newTask) session.assignedTasks.push(newTask);

    return { reward, score };
  }

  /**
   * Get session status
   */
  getSession(sessionId: string): NeuralMiningSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Pause a mining session
   */
  pauseSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') return false;
    session.status = 'paused';
    console.log(`[NeuralMiner] Session ${sessionId} paused`);
    return true;
  }

  /**
   * Get mining statistics
   */
  getStats(): MiningStats {
    return { ...this.stats };
  }

  /**
   * Estimate earnings for a device profile
   */
  estimateEarnings(deviceProfile: DeviceProfile): { perHour: bigint; perDay: bigint } {
    const basePower = this.calculateComputePower(deviceProfile);
    const perHour = BigInt(Math.floor(basePower * 1000)) * BigInt(1e18);
    const perDay = perHour * BigInt(24);
    return { perHour, perDay };
  }

  // ── Private Methods ──

  private analyzeDevice(profile: DeviceProfile): AITaskType[] {
    const tasks: AITaskType[] = [];

    // High CPU → inference, data processing
    if (profile.cpuCores >= 4) {
      tasks.push('inference', 'data_processing');
    }

    // GPU available → training, generation
    if (profile.gpuModel) {
      tasks.push('training', 'generation');
    }

    // High RAM → large model inference
    if (profile.ramGB >= 16) {
      tasks.push('prediction');
    }

    // High bandwidth → distributed tasks
    if (profile.bandwidthMbps >= 50) {
      tasks.push('verification');
    }

    // Fallback: any device can do basic optimization
    if (tasks.length === 0) {
      tasks.push('optimization');
    }

    return tasks;
  }

  private generateOptimalTasks(
    taskTypes: AITaskType[],
    profile: DeviceProfile,
    count: number = 5
  ): AITask[] {
    const computePower = this.calculateComputePower(profile);
    const maxDifficulty = Math.min(1000, Math.floor(computePower * 100));

    return Array.from({ length: count }, (_, i) => ({
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: taskTypes[i % taskTypes.length],
      difficulty: 50 + Math.floor(Math.random() * maxDifficulty),
      payload: new Uint8Array(32 + Math.floor(Math.random() * 224)),
      status: 'assigned' as const,
      reward: BigInt(500 + Math.floor(Math.random() * 5000)) * BigInt(1e18),
      deadline: Date.now() + 120000,
      createdAt: Date.now(),
    }));
  }

  private calculateComputePower(profile: DeviceProfile): number {
    let power = 0;
    power += profile.cpuCores * 1.0;
    power += (profile.gpuVRAM || 0) * 2.0;
    power += profile.ramGB * 0.3;
    power += profile.bandwidthMbps * 0.05;
    return power;
  }
}
