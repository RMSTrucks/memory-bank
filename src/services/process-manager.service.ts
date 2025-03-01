import { spawn, ChildProcess } from 'child_process';
import { logger } from '../utils/logger';
import {
  ProcessManager,
  ProcessConfig,
  ProcessInfo,
  ProcessState,
  ProcessStats,
  HealthCheck
} from '../types/process';

export class ProcessManagerService implements ProcessManager {
  private processes: Map<string, ProcessInfo> = new Map();
  private childProcesses: Map<string, ChildProcess> = new Map();
  private healthChecks: Map<string, NodeJS.Timeout> = new Map();

  async register(config: ProcessConfig): Promise<void> {
    if (this.processes.has(config.id)) {
      throw new Error(`Process ${config.id} already registered`);
    }

    const processInfo: ProcessInfo = {
      id: config.id,
      state: ProcessState.STOPPED,
      config,
      restartCount: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      eventQueueSize: 0
    };

    this.processes.set(config.id, processInfo);
    logger.info(`Registered process ${config.id}`);
  }

  async start(id: string): Promise<void> {
    const processInfo = this.getProcessInfo(id);
    if (processInfo.state === ProcessState.RUNNING) {
      logger.warn(`Process ${id} is already running`);
      return;
    }

    try {
      processInfo.state = ProcessState.STARTING;
      const childProcess = this.spawnProcess(processInfo.config);
      this.childProcesses.set(id, childProcess);

      childProcess.on('error', (error) => {
        logger.error(`Process ${id} error:`, error);
        processInfo.lastError = error;
        if (processInfo.state !== ProcessState.STOPPING) {
          processInfo.state = ProcessState.ERROR;
          this.handleProcessFailure(processInfo);
        }
      });

      childProcess.on('exit', (code) => {
        logger.info(`Process ${id} exited with code ${code}`);
        if (code !== 0 && processInfo.state !== ProcessState.STOPPING) {
          processInfo.state = ProcessState.ERROR;
          this.handleProcessFailure(processInfo);
        } else {
          processInfo.state = ProcessState.STOPPED;
        }
      });

      // Set up stdio handlers
      childProcess.stdout?.on('data', (data) => {
        logger.info(`[${id}] ${data.toString().trim()}`);
      });

      childProcess.stderr?.on('data', (data) => {
        logger.error(`[${id}] ${data.toString().trim()}`);
      });

      // Set process as running immediately after spawn
      processInfo.state = ProcessState.RUNNING;
      processInfo.startTime = new Date();
      processInfo.pid = childProcess.pid;

      this.startHealthCheck(processInfo);
      logger.info(`Started process ${id} (pid: ${childProcess.pid})`);
    } catch (error) {
      logger.error(`Failed to start process ${id}:`, error);
      processInfo.lastError = error as Error;
      processInfo.state = ProcessState.ERROR;
      throw error;
    }
  }

  async stop(id: string): Promise<void> {
    const processInfo = this.getProcessInfo(id);
    if (processInfo.state === ProcessState.STOPPED) {
      logger.warn(`Process ${id} is already stopped`);
      return;
    }

    try {
      processInfo.state = ProcessState.STOPPING;
      const childProcess = this.childProcesses.get(id);
      if (childProcess) {
        childProcess.kill();
        this.childProcesses.delete(id);
      }

      this.stopHealthCheck(id);
      processInfo.state = ProcessState.STOPPED;
      processInfo.stopTime = new Date();
      logger.info(`Stopped process ${id}`);
    } catch (error) {
      logger.error(`Failed to stop process ${id}:`, error);
      processInfo.lastError = error as Error;
      processInfo.state = ProcessState.ERROR;
      throw error;
    }
  }

  async restart(id: string): Promise<void> {
    await this.stop(id);
    await this.start(id);
  }

  async getInfo(id: string): Promise<ProcessInfo> {
    return this.getProcessInfo(id);
  }

  getStats(id: string): Promise<ProcessStats> {
    const processInfo = this.getProcessInfo(id);
    const childProcess = this.childProcesses.get(id);

    if (!childProcess || !childProcess.pid) {
      throw new Error(`Process ${id} is not running`);
    }

    return Promise.resolve({
      memoryUsageMB: processInfo.memoryUsage || 0,
      cpuPercent: processInfo.cpuUsage || 0,
      uptime: processInfo.startTime ? Date.now() - processInfo.startTime.getTime() : 0,
      restarts: processInfo.restartCount
    });
  }

  async dispose(): Promise<void> {
    const processes = Array.from(this.processes.values());
    await Promise.all(processes.map(p => this.stop(p.id)));
    this.processes.clear();
    this.childProcesses.clear();
    this.healthChecks.clear();
  }

  private getProcessInfo(id: string): ProcessInfo {
    const processInfo = this.processes.get(id);
    if (!processInfo) {
      throw new Error(`Process ${id} not found`);
    }
    return processInfo;
  }

  private spawnProcess(config: ProcessConfig): ChildProcess {
    const childProcess = spawn(config.command, config.args || [], {
      cwd: config.cwd,
      env: { ...process.env, ...config.env },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    if (!childProcess.stdin || !childProcess.stdout) {
      throw new Error(`Failed to create stdio streams for ${config.id}`);
    }

    // Handle stdio errors
    childProcess.stdin.on('error', (error) => {
      logger.error(`stdin error for ${config.id}:`, error);
    });

    childProcess.stdout.on('error', (error) => {
      logger.error(`stdout error for ${config.id}:`, error);
    });

    childProcess.stderr.on('data', (data) => {
      logger.error(`stderr output from ${config.id}:`, data.toString());
    });

    return childProcess;
  }

  private startHealthCheck(processInfo: ProcessInfo): void {
    // Simple process monitoring
    const interval = setInterval(() => {
      const childProcess = this.childProcesses.get(processInfo.id);
      if (!childProcess?.pid || processInfo.state !== ProcessState.RUNNING) {
        logger.error(`Process ${processInfo.id} is not running`);
        this.handleProcessFailure(processInfo);
      }
    }, 30000);

    this.healthChecks.set(processInfo.id, interval);
    logger.info(`Started monitoring for ${processInfo.id}`);
  }

  private stopHealthCheck(id: string): void {
    const interval = this.healthChecks.get(id);
    if (interval) {
      clearInterval(interval);
      this.healthChecks.delete(id);
    }
  }

  private async handleProcessFailure(processInfo: ProcessInfo): Promise<void> {
    if (processInfo.state === ProcessState.ERROR && processInfo.config.autoRestart) {
      if (!processInfo.config.maxRestarts || processInfo.restartCount < processInfo.config.maxRestarts) {
        logger.info(`Restarting process ${processInfo.id} (attempt ${processInfo.restartCount + 1})`);
        processInfo.restartCount++;

        const delay = processInfo.config.restartDelay || 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.restart(processInfo.id);
      } else {
        logger.error(`Process ${processInfo.id} exceeded max restarts (${processInfo.config.maxRestarts})`);
      }
    }
  }
}
