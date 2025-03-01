import { Result } from '../../../types/common';
import { ProjectContext } from '../types/context-model';
import { Requirement, RequirementRelationship } from '../types/requirement';
import { RequirementsCollector } from './requirements-collector.service';
import { RequirementsAnalyzer, RequirementsSetAnalysis } from './requirements-analyzer.service';

/**
 * Options for creating a new project context
 */
export interface CreateContextOptions {
  name: string;
  description: string;
  version: string;
  scope?: {
    objectives?: string[];
    deliverables?: string[];
    constraints?: string[];
    assumptions?: string[];
    exclusions?: string[];
  };
  timeline?: {
    startDate?: Date;
    endDate?: Date;
    milestones?: {
      title: string;
      date: Date;
      deliverables: string[];
    }[];
  };
  stakeholders?: {
    name: string;
    role: string;
    responsibilities: string[];
    contactInfo?: Record<string, string>;
  }[];
}

/**
 * Service for building and managing project context
 */
export class ContextBuilder {
  private requirementsCollector: RequirementsCollector;
  private requirementsAnalyzer: RequirementsAnalyzer;

  constructor() {
    this.requirementsCollector = new RequirementsCollector();
    this.requirementsAnalyzer = new RequirementsAnalyzer();
  }

  /**
   * Create a new project context
   */
  public async createContext(options: CreateContextOptions): Promise<Result<ProjectContext>> {
    try {
      const context: ProjectContext = {
        id: this.generateContextId(),
        name: options.name,
        description: options.description,
        version: options.version,

        // Core project information
        scope: {
          objectives: options.scope?.objectives || [],
          deliverables: options.scope?.deliverables || [],
          constraints: options.scope?.constraints || [],
          assumptions: options.scope?.assumptions || [],
          exclusions: options.scope?.exclusions || []
        },

        timeline: {
          startDate: options.timeline?.startDate || new Date(),
          endDate: options.timeline?.endDate || new Date(),
          milestones: options.timeline?.milestones?.map(m => ({
            id: this.generateMilestoneId(),
            ...m,
            status: 'pending'
          })) || []
        },

        stakeholders: options.stakeholders?.map(s => ({
          id: this.generateStakeholderId(),
          ...s
        })) || [],

        // Requirements and relationships
        requirements: [],
        requirementRelationships: [],

        // Project management
        risks: [],
        decisions: [],

        // Technical aspects
        architecture: {
          components: [],
          patterns: [],
          constraints: []
        },
        implementationPlan: {
          phases: [],
          dependencies: []
        },

        // Knowledge integration
        relatedPatterns: [],
        knowledgeReferences: [],

        // Metadata
        metadata: {
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastValidated: new Date(),
          lastAnalyzed: new Date(),
          healthScore: 1,
          completeness: 0
        }
      };

      return {
        success: true,
        data: context
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONTEXT_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create context',
          details: error
        }
      };
    }
  }

  /**
   * Add requirements to the context
   */
  public async addRequirements(
    context: ProjectContext,
    requirements: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<Result<ProjectContext>> {
    try {
      // Add each requirement
      for (const req of requirements) {
        const result = await this.requirementsCollector.addRequirement(req);
        if (!result.success || !result.data) {
          return {
            success: false,
            error: {
              code: 'REQUIREMENT_ADDITION_FAILED',
              message: `Failed to add requirement: ${result.error?.message}`,
              details: result.error
            }
          };
        }
        context.requirements.push(result.data);
      }

      // Detect relationships between requirements
      const relationshipsResult = await this.requirementsAnalyzer.detectRelationships(
        context.requirements
      );

      if (relationshipsResult.success && relationshipsResult.data) {
        // Add new relationships
        for (const relationship of relationshipsResult.data) {
          const result = this.requirementsCollector.addRelationship(relationship);
          if (result.success && result.data) {
            context.requirementRelationships.push(result.data);
          }
        }
      }

      // Analyze the updated requirement set
      const analysisResult = await this.requirementsAnalyzer.analyzeRequirementSet(
        context.requirements,
        context.requirementRelationships
      );

      if (analysisResult.success && analysisResult.data) {
        await this.updateContextFromAnalysis(context, analysisResult.data);
      }

      // Update context metadata
      context.metadata.updatedAt = new Date();
      context.metadata.lastAnalyzed = new Date();

      return {
        success: true,
        data: context
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REQUIREMENTS_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update requirements',
          details: error
        }
      };
    }
  }

  /**
   * Update context based on requirements analysis
   */
  private async updateContextFromAnalysis(
    context: ProjectContext,
    analysis: RequirementsSetAnalysis
  ): Promise<void> {
    // Update risks based on analysis
    context.risks = analysis.risks.topRisks.map(risk => ({
      id: this.generateRiskId(),
      title: risk.risk,
      description: risk.risk,
      probability: 'medium',
      impact: 'medium',
      priority: risk.severity,
      mitigation: [],
      status: 'identified'
    }));

    // Update implementation plan based on analysis
    if (analysis.dependencies.criticalPath.length > 0) {
      const phase = {
        id: this.generatePhaseId(),
        name: 'Initial Implementation Phase',
        description: 'Based on requirements analysis',
        deliverables: [],
        requirements: analysis.dependencies.criticalPath,
        tasks: [],
        startDate: new Date(),
        endDate: new Date()
      };

      context.implementationPlan.phases = [phase];
    }

    // Update patterns based on analysis
    context.relatedPatterns = analysis.patterns.topPatterns.map(pattern => ({
      patternId: pattern.patternId,
      relevance: pattern.confidence,
      context: `Identified in ${pattern.occurrences} requirements`
    }));

    // Update metadata
    context.metadata.healthScore = (
      analysis.metrics.overallClarity +
      analysis.metrics.overallCompleteness +
      analysis.metrics.overallTestability +
      analysis.metrics.overallFeasibility
    ) / 4;

    context.metadata.completeness = analysis.metrics.overallCompleteness;
  }

  /**
   * Generate unique IDs
   */
  private generateContextId(): string {
    return `CTX${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }

  private generateMilestoneId(): string {
    return `MIL${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }

  private generateStakeholderId(): string {
    return `STK${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }

  private generateRiskId(): string {
    return `RSK${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }

  private generatePhaseId(): string {
    return `PHS${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }
}
