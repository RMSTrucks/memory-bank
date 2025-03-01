/**
 * Configuration for the Cognitive Tools Integration
 */

export interface CognitiveToolsConfig {
  knowledge: KnowledgeConfig;
  pattern: PatternConfig;
  memory: MemoryConfig;
  visualization: VisualizationConfig;
  api: ApiConfig;
  logging: LoggingConfig;
}

export interface KnowledgeConfig {
  knowledgeSystemMcp: string;
  defaultSearchLimit: number;
  cacheEnabled: boolean;
  cacheTtl: number; // in milliseconds
}

export interface PatternConfig {
  patternSystemEnabled: boolean;
  defaultConfidenceThreshold: number;
  optimizationEnabled: boolean;
}

export interface MemoryConfig {
  memorySystemMcp: string;
  defaultSearchLimit: number;
  markdownIntegration: boolean;
  markdownPath: string;
}

export interface VisualizationConfig {
  defaultDiagramType: string;
  maxDiagramSize: number;
  colorScheme: string[];
}

export interface ApiConfig {
  timeout: number; // in milliseconds
  retries: number;
  backoffFactor: number;
}

export interface LoggingConfig {
  level: LogLevel;
  format: LogFormat;
  destination: LogDestination;
  includeTimestamp: boolean;
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

export enum LogFormat {
  TEXT = 'text',
  JSON = 'json'
}

export enum LogDestination {
  CONSOLE = 'console',
  FILE = 'file',
  BOTH = 'both'
}

/**
 * Default configuration
 */
export const defaultConfig: CognitiveToolsConfig = {
  knowledge: {
    knowledgeSystemMcp: 'knowledge-system',
    defaultSearchLimit: 10,
    cacheEnabled: true,
    cacheTtl: 5 * 60 * 1000 // 5 minutes
  },
  pattern: {
    patternSystemEnabled: true,
    defaultConfidenceThreshold: 0.7,
    optimizationEnabled: true
  },
  memory: {
    memorySystemMcp: 'knowledge-system',
    defaultSearchLimit: 10,
    markdownIntegration: true,
    markdownPath: './'
  },
  visualization: {
    defaultDiagramType: 'flowchart',
    maxDiagramSize: 5000,
    colorScheme: ['#007bff', '#6c757d', '#28a745', '#dc3545', '#ffc107', '#17a2b8']
  },
  api: {
    timeout: 30000, // 30 seconds
    retries: 3,
    backoffFactor: 1.5
  },
  logging: {
    level: LogLevel.INFO,
    format: LogFormat.TEXT,
    destination: LogDestination.CONSOLE,
    includeTimestamp: true
  }
};

/**
 * Current configuration (can be modified at runtime)
 */
export let config: CognitiveToolsConfig = { ...defaultConfig };

/**
 * Update configuration
 * @param newConfig Partial configuration to merge with current config
 */
export function updateConfig(newConfig: Partial<CognitiveToolsConfig>): void {
  config = {
    ...config,
    ...newConfig,
    knowledge: {
      ...config.knowledge,
      ...(newConfig.knowledge || {})
    },
    pattern: {
      ...config.pattern,
      ...(newConfig.pattern || {})
    },
    memory: {
      ...config.memory,
      ...(newConfig.memory || {})
    },
    visualization: {
      ...config.visualization,
      ...(newConfig.visualization || {})
    },
    api: {
      ...config.api,
      ...(newConfig.api || {})
    },
    logging: {
      ...config.logging,
      ...(newConfig.logging || {})
    }
  };
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): void {
  config = { ...defaultConfig };
}
