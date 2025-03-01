import { Metadata, Priority } from '../../../types/common';
import { Requirement, RequirementRelationship } from './requirement';

/**
 * Project scope definition
 */
export interface ProjectScope {
  objectives: string[];
  deliverables: string[];
  constraints: string[];
  assumptions: string[];
  exclusions: string[];
}

/**
 * Project timeline definition
 */
export interface ProjectTimeline {
  startDate: Date;
  endDate: Date;
  milestones: {
    id: string;
    title: string;
    date: Date;
    deliverables: string[];
    status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  }[];
}

/**
 * Project stakeholder definition
 */
export interface ProjectStakeholder {
  id: string;
  name: string;
  role: string;
  responsibilities: string[];
  contactInfo?: {
    email?: string;
    slack?: string;
    other?: Record<string, string>;
  };
}

/**
 * Project risk definition
 */
export interface ProjectRisk {
  id: string;
  title: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  priority: Priority;
  mitigation: string[];
  contingency?: string[];
  owner?: string;
  status: 'identified' | 'analyzing' | 'mitigating' | 'resolved' | 'accepted';
}

/**
 * Project decision definition
 */
export interface ProjectDecision {
  id: string;
  title: string;
  description: string;
  context: string;
  alternatives: {
    option: string;
    pros: string[];
    cons: string[];
  }[];
  decision: string;
  rationale: string[];
  impact: string[];
  stakeholders: string[];
  date: Date;
  status: 'proposed' | 'approved' | 'rejected' | 'implemented';
}

/**
 * Technical architecture definition
 */
export interface TechnicalArchitecture {
  components: {
    id: string;
    name: string;
    type: string;
    description: string;
    responsibilities: string[];
    dependencies: string[];
    technologies: string[];
    apis?: {
      name: string;
      type: 'rest' | 'graphql' | 'grpc' | 'other';
      endpoints: string[];
    }[];
  }[];
  patterns: {
    name: string;
    type: string;
    description: string;
    useCases: string[];
  }[];
  constraints: {
    type: string;
    description: string;
    impact: string;
  }[];
}

/**
 * Implementation plan definition
 */
export interface ImplementationPlan {
  phases: {
    id: string;
    name: string;
    description: string;
    deliverables: string[];
    requirements: string[];
    tasks: {
      id: string;
      title: string;
      description: string;
      priority: Priority;
      dependencies: string[];
      estimatedEffort: string;
      assignee?: string;
      status: 'todo' | 'in_progress' | 'review' | 'done';
    }[];
    startDate: Date;
    endDate: Date;
  }[];
  dependencies: {
    id: string;
    source: string;
    target: string;
    type: 'blocks' | 'requires' | 'related_to';
    description?: string;
  }[];
}

/**
 * Project context model
 */
export interface ProjectContext {
  id: string;
  name: string;
  description: string;
  version: string;

  // Core project information
  scope: ProjectScope;
  timeline: ProjectTimeline;
  stakeholders: ProjectStakeholder[];

  // Requirements and relationships
  requirements: Requirement[];
  requirementRelationships: RequirementRelationship[];

  // Project management
  risks: ProjectRisk[];
  decisions: ProjectDecision[];

  // Technical aspects
  architecture: TechnicalArchitecture;
  implementationPlan: ImplementationPlan;

  // Knowledge integration
  relatedPatterns: {
    patternId: string;
    relevance: number;
    context: string;
  }[];
  knowledgeReferences: {
    id: string;
    type: string;
    reference: string;
    relevance: number;
    context: string;
  }[];

  // Metadata
  metadata: Metadata & {
    status: 'draft' | 'active' | 'completed' | 'archived';
    lastValidated: Date;
    lastAnalyzed: Date;
    healthScore: number;
    completeness: number;
  };
}

/**
 * Project context validation result
 */
export interface ProjectContextValidationResult {
  isValid: boolean;
  completeness: number;
  healthScore: number;
  errors: {
    section: string;
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }[];
  recommendations: {
    section: string;
    message: string;
    priority: Priority;
    impact: string;
  }[];
}

/**
 * Project context analysis result
 */
export interface ProjectContextAnalysis {
  requirements: {
    total: number;
    byType: Record<string, number>;
    byPriority: Record<Priority, number>;
    coverage: number;
    completeness: number;
    clarity: number;
  };
  risks: {
    total: number;
    byPriority: Record<Priority, number>;
    mitigationCoverage: number;
    activeRisks: number;
  };
  timeline: {
    duration: number;
    milestoneCount: number;
    onTrack: boolean;
    delays: number;
    predictedEndDate: Date;
  };
  implementation: {
    progress: number;
    tasksByStatus: Record<string, number>;
    blockers: number;
    predictedVelocity: number;
  };
  patterns: {
    applied: number;
    relevance: number;
    effectiveness: number;
    reusability: number;
  };
  knowledge: {
    coverage: number;
    relevance: number;
    utilization: number;
    gaps: string[];
  };
}
