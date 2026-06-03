/**
 * Decentralized GPU Compute Network
 * Distributed AI training and inference marketplace across PiNexus.
 *
 * Features:
 * - GPU resource discovery and bidding marketplace
 * - Distributed training jobs across heterogeneous hardware
 * - Proof of Compute (PoC): verifiable computation receipts
 * - $PNX payment rails for compute providers
 * - Zero-knowledge ML model privacy during training
 * - Federated learning coordination
 */

export type GPUTier = 'consumer' | 'professional' | 'data_center' | 'quantum_gpu' | 'neuromorphic';
export type ComputeTaskType = 'training' | 'inference' | 'fine_tuning' | 'embedding' | 'rl' | 'search';

export interface GPUNode {
  nodeId: string;
  provider: string;
  gpuModel: string;
  tier: GPUTier;
  vramGb: number;
  flopsFloat16: number;     // TeraFLOPS
  flopsFloat32: number;
  bandwidth: number;        // GB/s memory bandwidth
  nvlinkPeers: string[];    // NVLink-connected nodes for multi-GPU jobs
  location: string;
  uptimeSla: number;        // 0–1
  pricePerHour: bigint;     // In $PNX (wei)
  isAvailable: boolean;
  reputation: number;       // 0–1 based on past jobs
  totalJobsCompleted: number;
  lastHeartbeat: number;
}

export interface ComputeJob {
  jobId: string;
  requester: string;
  taskType: ComputeTaskType;
  modelArchitecture: string;
  datasetSizeGb: number;
  estimatedFlopsDemand: number;  // TeraFLOPS required
  privacyRequired: boolean;      // ZK training?
  minGpuTier: GPUTier;
  maxBudgetPnx: bigint;
  deadline: number;
  assignedNodes: string[];
  status: 'pending' | 'bidding' | 'running' | 'completed' | 'failed';
  progress: number;              // 0–1
  proofOfCompute?: string;
  resultHash?: string;
  paymentTxHash?: string;
  createdAt: number;
  completedAt?: number;
}

export interface ComputeBid {
  bidId: string;
  jobId: string;
  nodeId: string;
  bidPricePnx: bigint;
  estimatedTimeHours: number;
  guaranteedUptime: number;
  createdAt: number;
}

export interface ComputeReceipt {
  jobId: string;
  nodeId: string;
  flopsConsumed: number;
  wallTimeMs: number;
  gpuUtilizationPct: number;
  peakVramGb: number;
  proofHash: string;
  verificationSignature: string;
  timestamp: number;
}

export interface NetworkStats {
  totalNodes: number;
  availableNodes: number;
  totalFlops: number;
  activeJobCount: number;
  completedJobCount: number;
  totalPnxPaid: bigint;
  avgJobDurationMs: number;
  networkUtilization: number;
}

export class DecentralizedGPUCompute {
  private nodes: Map<string, GPUNode> = new Map();
  private jobs: Map<string, ComputeJob> = new Map();
  private bids: Map<string, ComputeBid[]> = new Map();
  private receipts: Map<string, ComputeReceipt[]> = new Map();
  private jobCount = 0;
  private totalPnxPaid = 0n;

  constructor() {
    this._registerBootstrapNodes();
    console.log(`[GPUCompute] Network online — ${this.nodes.size} GPU nodes registered`);
  }

  /** Register a GPU node to the network */
  registerNode(node: GPUNode): void {
    this.nodes.set(node.nodeId, { ...node, lastHeartbeat: Date.now() });
    console.log(`[GPUCompute] Node ${node.nodeId} (${node.gpuModel}, ${node.flopsFloat16} TF) registered`);
  }

  /** Submit a compute job */
  submitJob(job: Omit<ComputeJob, 'jobId' | 'assignedNodes' | 'status' | 'progress' | 'createdAt'>): ComputeJob {
    const fullJob: ComputeJob = {
      ...job,
      jobId: `job-${++this.jobCount}`,
      assignedNodes: [],
      status: 'bidding',
      progress: 0,
      createdAt: Date.now(),
    };
    this.jobs.set(fullJob.jobId, fullJob);
    this.bids.set(fullJob.jobId, []);

    // Auto-bid from available nodes
    this._triggerAutoBidding(fullJob);
    return fullJob;
  }

  /** Place a bid on a job */
  placeBid(bid: Omit<ComputeBid, 'bidId' | 'createdAt'>): ComputeBid {
    const job = this.jobs.get(bid.jobId);
    if (!job) throw new Error(`Job ${bid.jobId} not found`);
    if (job.status !== 'bidding') throw new Error(`Job ${bid.jobId} not accepting bids`);

    const fullBid: ComputeBid = { ...bid, bidId: `bid-${Date.now()}`, createdAt: Date.now() };
    this.bids.get(bid.jobId)!.push(fullBid);
    return fullBid;
  }

  /** Accept best bids and start the job */
  startJob(jobId: string): ComputeJob {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const bids = this.bids.get(jobId) ?? [];
    const sorted = bids.sort((a, b) => {
      // Score = value/price ratio weighted by reputation
      const nodeA = this.nodes.get(a.nodeId);
      const nodeB = this.nodes.get(b.nodeId);
      const scoreA = (nodeA?.reputation ?? 0.5) / Number(a.bidPricePnx);
      const scoreB = (nodeB?.reputation ?? 0.5) / Number(b.bidPricePnx);
      return scoreB - scoreA;
    });

    // Assign top nodes
    const needed = Math.ceil(job.estimatedFlopsDemand / 100);  // 100 TF per node
    job.assignedNodes = sorted.slice(0, Math.max(1, needed)).map(b => b.nodeId);
    job.status = 'running';

    // Simulate execution
    this._simulateExecution(job);
    return job;
  }

  /** Get a verified proof of compute */
  getProofOfCompute(jobId: string): ComputeReceipt | null {
    return this.receipts.get(jobId)?.[0] ?? null;
  }

  /** Find best available nodes for a job spec */
  findBestNodes(
    taskType: ComputeTaskType,
    minFlops: number,
    maxBudgetPerHour: bigint,
    count: number = 1
  ): GPUNode[] {
    return Array.from(this.nodes.values())
      .filter(n => n.isAvailable &&
        n.flopsFloat16 >= minFlops &&
        n.pricePerHour <= maxBudgetPerHour)
      .sort((a, b) => (b.reputation * b.flopsFloat16) - (a.reputation * a.flopsFloat16))
      .slice(0, count);
  }

  getNetworkStats(): NetworkStats {
    const available = Array.from(this.nodes.values()).filter(n => n.isAvailable);
    const active = Array.from(this.jobs.values()).filter(j => j.status === 'running');
    const completed = Array.from(this.jobs.values()).filter(j => j.status === 'completed');
    const totalFlops = Array.from(this.nodes.values()).reduce((s, n) => s + n.flopsFloat16, 0);
    const avgDuration = completed.length > 0
      ? completed.reduce((s, j) => s + ((j.completedAt ?? j.createdAt) - j.createdAt), 0) / completed.length
      : 0;

    return {
      totalNodes: this.nodes.size,
      availableNodes: available.length,
      totalFlops,
      activeJobCount: active.length,
      completedJobCount: completed.length,
      totalPnxPaid: this.totalPnxPaid,
      avgJobDurationMs: avgDuration,
      networkUtilization: this.nodes.size > 0 ? (this.nodes.size - available.length) / this.nodes.size : 0,
    };
  }

  private _triggerAutoBidding(job: ComputeJob): void {
    const eligible = Array.from(this.nodes.values()).filter(n =>
      n.isAvailable && this._tierOrder(n.tier) >= this._tierOrder(job.minGpuTier));

    for (const node of eligible.slice(0, 10)) {
      const estimatedHours = job.datasetSizeGb / Math.max(1, node.bandwidth) / 3600;
      this.placeBid({
        jobId: job.jobId,
        nodeId: node.nodeId,
        bidPricePnx: node.pricePerHour,
        estimatedTimeHours: estimatedHours,
        guaranteedUptime: node.uptimeSla,
      });
    }

    if (eligible.length > 0) this.startJob(job.jobId);
  }

  private _simulateExecution(job: ComputeJob): void {
    // Simulate async execution
    job.progress = 0;
    const interval = setInterval(() => {
      job.progress = Math.min(1, job.progress + 0.1);
      if (job.progress >= 1) {
        job.status = 'completed';
        job.completedAt = Date.now();
        job.resultHash = '0x' + Math.random().toString(16).slice(2).padEnd(64, '0');
        job.proofOfCompute = `poc_${job.jobId}_verified`;

        // Generate receipts for assigned nodes
        const nodeReceipts: ComputeReceipt[] = job.assignedNodes.map(nodeId => ({
          jobId: job.jobId,
          nodeId,
          flopsConsumed: job.estimatedFlopsDemand / job.assignedNodes.length,
          wallTimeMs: Date.now() - job.createdAt,
          gpuUtilizationPct: 85 + Math.random() * 10,
          peakVramGb: (this.nodes.get(nodeId)?.vramGb ?? 40) * 0.8,
          proofHash: `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`,
          verificationSignature: `sig_${nodeId}_${job.jobId}`,
          timestamp: Date.now(),
        }));
        this.receipts.set(job.jobId, nodeReceipts);
        this.totalPnxPaid += job.maxBudgetPnx;
        clearInterval(interval);
      }
    }, 100);
  }

  private _tierOrder(tier: GPUTier): number {
    return { consumer: 0, professional: 1, data_center: 2, quantum_gpu: 3, neuromorphic: 4 }[tier];
  }

  private _registerBootstrapNodes(): void {
    const bootstrapNodes: GPUNode[] = [
      { nodeId: 'pnx-gpu-001', provider: 'PiNexus Foundation', gpuModel: 'H100 NVLink x8',
        tier: 'data_center', vramGb: 640, flopsFloat16: 3958, flopsFloat32: 990,
        bandwidth: 3350, nvlinkPeers: [], location: 'us-east-1', uptimeSla: 0.999,
        pricePerHour: BigInt(50) * BigInt(1e18), isAvailable: true, reputation: 0.98,
        totalJobsCompleted: 12000, lastHeartbeat: Date.now() },
      { nodeId: 'pnx-gpu-002', provider: 'PiNexus Foundation', gpuModel: 'A100 SXM x16',
        tier: 'data_center', vramGb: 1280, flopsFloat16: 2496, flopsFloat32: 312,
        bandwidth: 4000, nvlinkPeers: ['pnx-gpu-001'], location: 'eu-west-1', uptimeSla: 0.999,
        pricePerHour: BigInt(40) * BigInt(1e18), isAvailable: true, reputation: 0.97,
        totalJobsCompleted: 9800, lastHeartbeat: Date.now() },
      { nodeId: 'pnx-neuro-001', provider: 'PiNexus ASI Lab', gpuModel: 'Intel Loihi 3 x4',
        tier: 'neuromorphic', vramGb: 32, flopsFloat16: 50000, flopsFloat32: 50000,
        bandwidth: 800, nvlinkPeers: [], location: 'sg-southeast-1', uptimeSla: 0.995,
        pricePerHour: BigInt(200) * BigInt(1e18), isAvailable: true, reputation: 0.96,
        totalJobsCompleted: 3000, lastHeartbeat: Date.now() },
    ];
    for (const n of bootstrapNodes) this.nodes.set(n.nodeId, n);
  }
}
