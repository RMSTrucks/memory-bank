export enum ProcessGroup {
  CORE = 'core',
  SERVICES = 'services',
  TOOLS = 'tools',
  COMPUTE = 'compute',
  INTEGRATION = 'integration'
}

export enum ProcessState {
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  FAILED = 'failed',
  ERROR = 'error'
}

export interface ResourceLimits {
  maxMemoryMB: number;
  maxCPUPercent: number;
  maxProcesses?: number;
  maxOpenFiles?: number;
}

export const DEFAULT_RESOURCE_LIMITS: ResourceLimits = {
  maxMemoryMB: 512,
  maxCPUPercent: 50,
  maxProcesses: 10,
  maxOpenFiles: 100
};

export interface ProcessConfig {
  id: string;
  name: string;
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  group: ProcessGroup;
  autoRestart: boolean;
  restartDelay?: number;
  maxRestarts?: number;
  resourceLimits: ResourceLimits;
}

export interface ProcessInfo {
  id: string;
  pid?: number;
  state: ProcessState;
  config: ProcessConfig;
  startTime?: Date;
  stopTime?: Date;
  restartCount: number;
  lastError?: Error;
  memoryUsage?: number;
  cpuUsage?: number;
  eventQueueSize?: number;
}

export interface ProcessStats {
  memoryUsageMB: number;
  cpuPercent: number;
  uptime: number;
  restarts: number;
}

export interface HealthCheckCallbacks {
  onFail?: (error?: Error) => Promise<void>;
  onRecover?: (info?: ProcessInfo) => Promise<void>;
}

export interface HealthCheck {
  type: 'process' | 'system' | 'resource';
  healthy: boolean;
  message?: string;
  timestamp: Date;
  metrics: {
    memoryUsage: number;
    cpuUsage: number;
    eventQueueSize: number;
    restartCount: number;
  };
  check: () => Promise<boolean>;
  interval: number;
  callbacks?: HealthCheckCallbacks;
}

export interface ProcessManager {
  register(config: ProcessConfig): Promise<void>;
  start(id: string): Promise<void>;
  stop(id: string): Promise<void>;
  restart(id: string): Promise<void>;
  getInfo(id: string): Promise<ProcessInfo>;
  getStats(id: string): Promise<ProcessStats>;
  dispose(): Promise<void>;
}
