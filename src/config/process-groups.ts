import { ProcessConfig, ProcessGroup } from '../types/process';

export const fileOperationsConfig: ProcessConfig = {
  id: 'file-operations',
  name: 'File Operations MCP Server',
  command: 'node',
  args: ['--trace-warnings', '--trace-uncaught', 'src/index.js'],
  cwd: 'C:/Users/jaked/OneDrive/Documents/Cline/MCP/file-operations-server',
  env: {
    NODE_ENV: 'production',
    DEBUG: 'true',
    NODE_OPTIONS: '--unhandled-rejections=strict'
  },
  group: ProcessGroup.SERVICES,
  autoRestart: true,
  restartDelay: 1000,
  maxRestarts: 3,
  resourceLimits: {
    maxMemoryMB: 256,
    maxCPUPercent: 25,
    maxProcesses: 5,
    maxOpenFiles: 50
  }
};

export const knowledgeSystemConfig: ProcessConfig = {
  id: 'knowledge-system',
  name: 'Knowledge System MCP Server',
  command: 'node',
  args: ['--trace-warnings', '--trace-uncaught', 'src/index.js'],
  cwd: 'C:/Users/jaked/OneDrive/Documents/Cline/MCP/knowledge-system',
  env: {
    NODE_ENV: 'production',
    DEBUG: 'true',
    NODE_OPTIONS: '--unhandled-rejections=strict --trace-warnings --trace-uncaught',
    PINECONE_API_KEY: 'pcsk_48rMwT_6cASDjMTVD9AAh4ey4J4nThVtxyQ2zA5KJbeXHesyEY6LwhP2HzQUvymShx8DWM',
    PINECONE_ENVIRONMENT: 'us-west1-gcp',
    PINECONE_INDEX_NAME: 'cline-memory',
    OPENAI_API_KEY: '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',
    VECTOR_DIMENSIONS: '1536',
    METRIC: 'cosine',
    PODS: '1',
    POD_TYPE: 'p1.x1',
    PATH: process.env.PATH || ''
  },
  group: ProcessGroup.SERVICES,
  autoRestart: true,
  restartDelay: 1000,
  maxRestarts: 3,
  resourceLimits: {
    maxMemoryMB: 512,
    maxCPUPercent: 50,
    maxProcesses: 5,
    maxOpenFiles: 50
  }
};
