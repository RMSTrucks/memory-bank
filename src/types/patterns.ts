export type PatternType =
    | 'workflow'
    | 'command'
    | 'document'
    | 'automation'
    | 'interaction'
    | 'learning'
    | 'integration'
    | 'temporal'
    | 'predictive';

export interface Pattern {
  id: string;
  type: PatternType;
  name: string;
  description: string;
  confidence: number;
  impact: number;
  tags: string[];
  timestamp: Date;
  metadata: {
    source: string;
    category: string;
    priority: number;
    status: 'active' | 'inactive' | 'deprecated';
    version: string;
    lastModified: Date;
    createdBy: string;
    dependencies: string[];
    relatedPatterns: string[];
  };
  metrics: {
    usageCount: number;
    successRate: number;
    failureRate: number;
    averageExecutionTime: number;
    resourceUtilization: number;
    complexityScore: number;
    maintainabilityIndex: number;
    testCoverage: number;
  };
  implementation: {
    code?: string;
    configuration?: Record<string, unknown>;
    requirements?: string[];
    constraints?: string[];
    examples?: string[];
    testCases?: string[];
  };
  validation: {
    rules: string[];
    conditions: string[];
    assertions: string[];
    errorHandling: string[];
  };
  evolution: {
    version: string;
    changes: Array<{
      date: Date;
      type: 'major' | 'minor' | 'patch';
      description: string;
      impact: number;
    }>;
    previousVersions: string[];
    nextVersion?: string;
    deprecationDate?: Date;
  };
}

export interface PatternMatch {
  pattern: Pattern;
  confidence: number;
  context: {
    input: any;
    output: any;
    timestamp: Date;
    environment: Record<string, unknown>;
  };
  metrics: {
    executionTime: number;
    resourceUsage: number;
    accuracy: number;
    precision: number;
    recall: number;
  };
}

export interface PatternAnalysis {
  pattern: Pattern;
  metrics: {
    frequency: number;
    impact: number;
    confidence: number;
    reliability: number;
    efficiency: number;
    complexity: number;
  };
  insights: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    risks: string[];
  };
  recommendations: {
    improvements: string[];
    optimizations: string[];
    alternatives: string[];
  };
  trends: {
    usage: number[];
    performance: number[];
    reliability: number[];
    timestamps: Date[];
  };
}

export interface PatternValidation {
  pattern: Pattern;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  metrics: {
    coverage: number;
    completeness: number;
    consistency: number;
    quality: number;
  };
}

export interface PatternOptimization {
  pattern: Pattern;
  improvements: Array<{
    type: string;
    description: string;
    impact: number;
    effort: number;
    priority: number;
  }>;
  metrics: {
    before: Record<string, number>;
    after: Record<string, number>;
    improvement: Record<string, number>;
  };
  validation: {
    tests: Array<{
      name: string;
      result: boolean;
      message: string;
    }>;
    coverage: number;
    performance: number;
  };
}
