import { Priority, Result, ValidationResult } from '../../../types/common';
import {
  Requirement,
  FunctionalRequirement,
  NonFunctionalRequirement,
  TechnicalRequirement,
  ProjectRequirement,
  RequirementValidationResult,
  RequirementRelationship
} from '../types/requirement';

/**
 * Service for collecting and validating requirements from various input sources
 */
export class RequirementsCollector {
  private requirements: Map<string, Requirement>;
  private relationships: Map<string, RequirementRelationship[]>;

  constructor() {
    this.requirements = new Map();
    this.relationships = new Map();
  }

  /**
   * Add a new requirement to the collection
   */
  public async addRequirement<T extends Requirement>(
    requirement: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Result<T>> {
    try {
      // Generate unique ID
      const id = this.generateRequirementId(requirement.type);

      // Create requirement with metadata
      const newRequirement = {
        ...requirement,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: requirement.tags || [],
        metadata: requirement.metadata || {}
      } as T;

      // Validate requirement
      const validationResult = await this.validateRequirement(newRequirement);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_REQUIREMENT',
            message: 'Requirement validation failed',
            details: validationResult.errors
          }
        };
      }

      // Store requirement
      this.requirements.set(id, newRequirement);

      return {
        success: true,
        data: newRequirement
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REQUIREMENT_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create requirement',
          details: error
        }
      };
    }
  }

  /**
   * Add a relationship between requirements
   */
  public addRelationship(relationship: RequirementRelationship): Result<RequirementRelationship> {
    try {
      // Validate both requirements exist
      if (!this.requirements.has(relationship.sourceId)) {
        return {
          success: false,
          error: {
            code: 'SOURCE_NOT_FOUND',
            message: `Source requirement ${relationship.sourceId} not found`
          }
        };
      }

      if (!this.requirements.has(relationship.targetId)) {
        return {
          success: false,
          error: {
            code: 'TARGET_NOT_FOUND',
            message: `Target requirement ${relationship.targetId} not found`
          }
        };
      }

      // Get existing relationships for source
      const existingRelationships = this.relationships.get(relationship.sourceId) || [];

      // Check for duplicates
      const isDuplicate = existingRelationships.some(
        r => r.targetId === relationship.targetId && r.type === relationship.type
      );

      if (isDuplicate) {
        return {
          success: false,
          error: {
            code: 'DUPLICATE_RELATIONSHIP',
            message: 'Relationship already exists'
          }
        };
      }

      // Add new relationship
      this.relationships.set(
        relationship.sourceId,
        [...existingRelationships, relationship]
      );

      return {
        success: true,
        data: relationship
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RELATIONSHIP_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create relationship',
          details: error
        }
      };
    }
  }

  /**
   * Get all requirements
   */
  public getRequirements(): Requirement[] {
    return Array.from(this.requirements.values());
  }

  /**
   * Get requirement by ID
   */
  public getRequirementById(id: string): Requirement | undefined {
    return this.requirements.get(id);
  }

  /**
   * Get relationships for a requirement
   */
  public getRelationships(requirementId: string): RequirementRelationship[] {
    return this.relationships.get(requirementId) || [];
  }

  /**
   * Update an existing requirement
   */
  public async updateRequirement<T extends Requirement>(
    id: string,
    updates: Partial<T>
  ): Promise<Result<T>> {
    try {
      const existing = this.requirements.get(id);
      if (!existing) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Requirement ${id} not found`
          }
        };
      }

      // Ensure we maintain the same requirement type
      if (updates.type && updates.type !== existing.type) {
        return {
          success: false,
          error: {
            code: 'INVALID_TYPE_CHANGE',
            message: 'Cannot change requirement type after creation'
          }
        };
      }

      const updated = {
        ...existing,
        ...updates,
        id,
        updatedAt: new Date()
      } as T;

      // Validate updated requirement
      const validationResult = await this.validateRequirement(updated);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_REQUIREMENT',
            message: 'Requirement validation failed',
            details: validationResult.errors
          }
        };
      }

      this.requirements.set(id, updated);

      return {
        success: true,
        data: updated
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update requirement',
          details: error
        }
      };
    }
  }

  /**
   * Delete a requirement and its relationships
   */
  public deleteRequirement(id: string): Result<void> {
    try {
      if (!this.requirements.has(id)) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Requirement ${id} not found`
          }
        };
      }

      // Remove requirement
      this.requirements.delete(id);

      // Remove relationships where this requirement is source
      this.relationships.delete(id);

      // Remove relationships where this requirement is target
      for (const [sourceId, relationships] of this.relationships.entries()) {
        this.relationships.set(
          sourceId,
          relationships.filter(r => r.targetId !== id)
        );
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to delete requirement',
          details: error
        }
      };
    }
  }

  /**
   * Validate a requirement
   */
  private async validateRequirement(requirement: Requirement): Promise<RequirementValidationResult> {
    const errors: RequirementValidationResult['errors'] = [];

    // Validate common fields
    if (!requirement.title?.trim()) {
      errors.push({
        field: 'title',
        message: 'Title is required',
        severity: 'error'
      });
    }

    if (!requirement.description?.trim()) {
      errors.push({
        field: 'description',
        message: 'Description is required',
        severity: 'error'
      });
    }

    // Type-specific validation
    switch (requirement.type) {
      case 'functional':
        this.validateFunctionalRequirement(requirement as FunctionalRequirement, errors);
        break;
      case 'non-functional':
        this.validateNonFunctionalRequirement(requirement as NonFunctionalRequirement, errors);
        break;
      case 'technical':
        this.validateTechnicalRequirement(requirement as TechnicalRequirement, errors);
        break;
      case 'project':
        this.validateProjectRequirement(requirement as ProjectRequirement, errors);
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateFunctionalRequirement(
    requirement: FunctionalRequirement,
    errors: RequirementValidationResult['errors']
  ): void {
    if (!requirement.acceptance?.length) {
      errors.push({
        field: 'acceptance',
        message: 'At least one acceptance criterion is required',
        severity: 'error'
      });
    }
  }

  private validateNonFunctionalRequirement(
    requirement: NonFunctionalRequirement,
    errors: RequirementValidationResult['errors']
  ): void {
    if (!requirement.metrics?.length) {
      errors.push({
        field: 'metrics',
        message: 'At least one metric is required',
        severity: 'error'
      });
    }

    requirement.metrics?.forEach((metric, index) => {
      if (!metric.measure?.trim()) {
        errors.push({
          field: `metrics[${index}].measure`,
          message: 'Metric measure is required',
          severity: 'error'
        });
      }
      if (!metric.target?.trim()) {
        errors.push({
          field: `metrics[${index}].target`,
          message: 'Metric target is required',
          severity: 'error'
        });
      }
    });
  }

  private validateTechnicalRequirement(
    requirement: TechnicalRequirement,
    errors: RequirementValidationResult['errors']
  ): void {
    if (!requirement.constraints?.length) {
      errors.push({
        field: 'constraints',
        message: 'At least one constraint is required',
        severity: 'error'
      });
    }

    if (!requirement.impact?.scope?.trim()) {
      errors.push({
        field: 'impact.scope',
        message: 'Impact scope is required',
        severity: 'error'
      });
    }
  }

  private validateProjectRequirement(
    requirement: ProjectRequirement,
    errors: RequirementValidationResult['errors']
  ): void {
    if (!requirement.stakeholders?.length) {
      errors.push({
        field: 'stakeholders',
        message: 'At least one stakeholder is required',
        severity: 'error'
      });
    }
  }

  /**
   * Generate a unique requirement ID based on type
   */
  private generateRequirementId(type: Requirement['type']): string {
    const prefix = type.charAt(0).toUpperCase();
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }
}
