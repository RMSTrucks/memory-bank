/**
 * Project Manager
 *
 * This module provides functionality for managing projects, including requirements,
 * architecture, implementation, testing, and deployment.
 */

import { logger } from '../utils/logger';
import {
  Project,
  ProjectType,
  ProjectStatus,
  ProjectMetadata,
  Requirement,
  RequirementType,
  RequirementPriority,
  RequirementStatus,
  ArchitectureComponent,
  ArchitectureComponentType,
  ImplementationComponent,
  ImplementationComponentType,
  ImplementationStatus,
  TestComponent,
  TestType,
  TestStatus,
  DeploymentComponent,
  DeploymentType,
  DeploymentStatus,
  ProjectSearchOptions,
  ProjectResult,
  KnowledgeProjectLink,
  KnowledgeProjectLinkType,
  KnowledgeProjectSearchOptions,
  ErrorCode,
  CognitiveToolsError
} from '../types';

/**
 * Project Manager class
 */
class ProjectManager {
  private projects: Map<string, Project> = new Map();
  private knowledgeProjectLinks: Map<string, KnowledgeProjectLink> = new Map();

  /**
   * Initialize the Project Manager
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing ProjectManager');
    // In a real implementation, this would load projects from storage
    // For now, we'll just initialize the maps
    this.projects = new Map();
    this.knowledgeProjectLinks = new Map();
    logger.info('ProjectManager initialized');
  }

  /**
   * Create a new project
   * @param project Project to create (without id, createdAt, updatedAt)
   * @returns Project ID
   */
  public async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = this.generateId();
      const now = new Date().toISOString();

      const newProject: Project = {
        ...project,
        id,
        createdAt: now,
        updatedAt: now
      };

      this.projects.set(id, newProject);
      logger.info(`Project created: ${id}`);

      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to create project: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to create project: ${message}`);
    }
  }

  /**
   * Get a project by ID
   * @param id Project ID
   * @returns Project
   */
  public async getProjectById(id: string): Promise<Project> {
    const project = this.projects.get(id);

    if (!project) {
      logger.error(`Project not found: ${id}`);
      throw new CognitiveToolsError(ErrorCode.NOT_FOUND, `Project not found: ${id}`);
    }

    return project;
  }

  /**
   * Update a project
   * @param id Project ID
   * @param updates Project updates
   */
  public async updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const project = await this.getProjectById(id);

      const updatedProject: Project = {
        ...project,
        ...updates,
        id,
        createdAt: project.createdAt,
        updatedAt: new Date().toISOString()
      };

      this.projects.set(id, updatedProject);
      logger.info(`Project updated: ${id}`);
    } catch (error) {
      if (error instanceof CognitiveToolsError && error.code === ErrorCode.NOT_FOUND) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to update project: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to update project: ${message}`);
    }
  }

  /**
   * Delete a project
   * @param id Project ID
   */
  public async deleteProject(id: string): Promise<void> {
    try {
      if (!this.projects.has(id)) {
        logger.error(`Project not found: ${id}`);
        throw new CognitiveToolsError(ErrorCode.NOT_FOUND, `Project not found: ${id}`);
      }

      this.projects.delete(id);

      // Delete all knowledge-project links for this project
      const linksToDelete: string[] = [];

      for (const [linkId, link] of this.knowledgeProjectLinks.entries()) {
        if (link.projectId === id) {
          linksToDelete.push(linkId);
        }
      }

      for (const linkId of linksToDelete) {
        this.knowledgeProjectLinks.delete(linkId);
      }

      logger.info(`Project deleted: ${id}`);
    } catch (error) {
      if (error instanceof CognitiveToolsError && error.code === ErrorCode.NOT_FOUND) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to delete project: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to delete project: ${message}`);
    }
  }

  /**
   * Search for projects
   * @param query Search query
   * @param options Search options
   * @returns Project results
   */
  public async searchProjects(query: string, options?: ProjectSearchOptions): Promise<ProjectResult[]> {
    try {
      const results: ProjectResult[] = [];
      const limit = options?.limit || 10;

      for (const project of this.projects.values()) {
        // Simple search implementation for now
        // In a real implementation, this would use a more sophisticated search algorithm
        const nameMatch = project.name.toLowerCase().includes(query.toLowerCase());
        const descriptionMatch = project.description.toLowerCase().includes(query.toLowerCase());

        if (nameMatch || descriptionMatch) {
          // Check if project matches filters
          if (this.matchesFilters(project, options)) {
            // Calculate a simple score based on matches
            const score = (nameMatch ? 0.6 : 0) + (descriptionMatch ? 0.4 : 0);

            results.push({
              project,
              score
            });
          }
        }
      }

      // Sort by score (descending) and limit results
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to search projects: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to search projects: ${message}`);
    }
  }

  /**
   * Add a requirement to a project
   * @param projectId Project ID
   * @param requirement Requirement to add (without id)
   * @returns Requirement ID
   */
  public async addRequirement(projectId: string, requirement: Omit<Requirement, 'id'>): Promise<string> {
    try {
      const project = await this.getProjectById(projectId);

      const id = this.generateId();
      const newRequirement: Requirement = {
        ...requirement,
        id
      };

      const updatedProject: Project = {
        ...project,
        requirements: [...project.requirements, newRequirement],
        updatedAt: new Date().toISOString()
      };

      this.projects.set(projectId, updatedProject);
      logger.info(`Requirement added to project ${projectId}: ${id}`);

      return id;
    } catch (error) {
      if (error instanceof CognitiveToolsError && error.code === ErrorCode.NOT_FOUND) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to add requirement: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to add requirement: ${message}`);
    }
  }

  /**
   * Update a requirement in a project
   * @param projectId Project ID
   * @param requirementId Requirement ID
   * @param updates Requirement updates
   */
  public async updateRequirement(projectId: string, requirementId: string, updates: Partial<Omit<Requirement, 'id'>>): Promise<void> {
    try {
      const project = await this.getProjectById(projectId);

      const requirementIndex = project.requirements.findIndex(r => r.id === requirementId);

      if (requirementIndex === -1) {
        logger.error(`Requirement not found: ${requirementId}`);
        throw new CognitiveToolsError(ErrorCode.NOT_FOUND, `Requirement not found: ${requirementId}`);
      }

      const updatedRequirements = [...project.requirements];
      updatedRequirements[requirementIndex] = {
        ...updatedRequirements[requirementIndex],
        ...updates,
        id: requirementId
      };

      const updatedProject: Project = {
        ...project,
        requirements: updatedRequirements,
        updatedAt: new Date().toISOString()
      };

      this.projects.set(projectId, updatedProject);
      logger.info(`Requirement updated in project ${projectId}: ${requirementId}`);
    } catch (error) {
      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to update requirement: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to update requirement: ${message}`);
    }
  }

  /**
   * Remove a requirement from a project
   * @param projectId Project ID
   * @param requirementId Requirement ID
   */
  public async removeRequirement(projectId: string, requirementId: string): Promise<void> {
    try {
      const project = await this.getProjectById(projectId);

      const requirementIndex = project.requirements.findIndex(r => r.id === requirementId);

      if (requirementIndex === -1) {
        logger.error(`Requirement not found: ${requirementId}`);
        throw new CognitiveToolsError(ErrorCode.NOT_FOUND, `Requirement not found: ${requirementId}`);
      }

      const updatedRequirements = project.requirements.filter(r => r.id !== requirementId);

      const updatedProject: Project = {
        ...project,
        requirements: updatedRequirements,
        updatedAt: new Date().toISOString()
      };

      this.projects.set(projectId, updatedProject);
      logger.info(`Requirement removed from project ${projectId}: ${requirementId}`);
    } catch (error) {
      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to remove requirement: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to remove requirement: ${message}`);
    }
  }

  /**
   * Add an architecture component to a project
   * @param projectId Project ID
   * @param component Architecture component to add (without id)
   * @returns Component ID
   */
  public async addArchitectureComponent(projectId: string, component: Omit<ArchitectureComponent, 'id'>): Promise<string> {
    try {
      const project = await this.getProjectById(projectId);

      const id = this.generateId();
      const newComponent: ArchitectureComponent = {
        ...component,
        id
      };

      const updatedProject: Project = {
        ...project,
        architecture: [...project.architecture, newComponent],
        updatedAt: new Date().toISOString()
      };

      this.projects.set(projectId, updatedProject);
      logger.info(`Architecture component added to project ${projectId}: ${id}`);

      return id;
    } catch (error) {
      if (error instanceof CognitiveToolsError && error.code === ErrorCode.NOT_FOUND) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to add architecture component: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to add architecture component: ${message}`);
    }
  }

  /**
   * Update an architecture component in a project
   * @param projectId Project ID
   * @param componentId Component ID
   * @param updates Component updates
   */
  public async updateArchitectureComponent(projectId: string, componentId: string, updates: Partial<Omit<ArchitectureComponent, 'id'>>): Promise<void> {
    try {
      const project = await this.getProjectById(projectId);

      const componentIndex = project.architecture.findIndex(c => c.id === componentId);

      if (componentIndex === -1) {
        logger.error(`Architecture component not found: ${componentId}`);
        throw new CognitiveToolsError(ErrorCode.NOT_FOUND, `Architecture component not found: ${componentId}`);
      }

      const updatedArchitecture = [...project.architecture];
      updatedArchitecture[componentIndex] = {
        ...updatedArchitecture[componentIndex],
        ...updates,
        id: componentId
      };

      const updatedProject: Project = {
        ...project,
        architecture: updatedArchitecture,
        updatedAt: new Date().toISOString()
      };

      this.projects.set(projectId, updatedProject);
      logger.info(`Architecture component updated in project ${projectId}: ${componentId}`);
    } catch (error) {
      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to update architecture component: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to update architecture component: ${message}`);
    }
  }

  /**
   * Remove an architecture component from a project
   * @param projectId Project ID
   * @param componentId Component ID
   */
  public async removeArchitectureComponent(projectId: string, componentId: string): Promise<void> {
    try {
      const project = await this.getProjectById(projectId);

      const componentIndex = project.architecture.findIndex(c => c.id === componentId);

      if (componentIndex === -1) {
        logger.error(`Architecture component not found: ${componentId}`);
        throw new CognitiveToolsError(ErrorCode.NOT_FOUND, `Architecture component not found: ${componentId}`);
      }

      const updatedArchitecture = project.architecture.filter(c => c.id !== componentId);

      const updatedProject: Project = {
        ...project,
        architecture: updatedArchitecture,
        updatedAt: new Date().toISOString()
      };

      this.projects.set(projectId, updatedProject);
      logger.info(`Architecture component removed from project ${projectId}: ${componentId}`);
    } catch (error) {
      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to remove architecture component: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to remove architecture component: ${message}`);
    }
  }

  /**
   * Add an implementation component to a project
   * @param projectId Project ID
   * @param component Implementation component to add (without id)
   * @returns Component ID
   */
  public async addImplementationComponent(projectId: string, component: Omit<ImplementationComponent, 'id'>): Promise<string> {
    try {
      const project = await this.getProjectById(projectId);

      const id = this.generateId();
      const newComponent: ImplementationComponent = {
        ...component,
        id
      };

      const updatedProject: Project = {
        ...project,
        implementation: [...project.implementation, newComponent],
        updatedAt: new Date().toISOString()
      };

      this.projects.set(projectId, updatedProject);
      logger.info(`Implementation component added to project ${projectId}: ${id}`);

      return id;
    } catch (error) {
      if (error instanceof CognitiveToolsError && error.code === ErrorCode.NOT_FOUND) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to add implementation component: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to add implementation component: ${message}`);
    }
  }

  /**
   * Update an implementation component in a project
   * @param projectId Project ID
   * @param componentId Component ID
   * @param updates Component updates
   */
  public async updateImplementationComponent(projectId: string, componentId: string, updates: Partial<Omit<ImplementationComponent, 'id'>>): Promise<void> {
    try {
      const project = await this.getProjectById(projectId);

      const componentIndex = project.implementation.findIndex(c => c.id === componentId);

      if (componentIndex === -1) {
        logger.error(`Implementation component not found: ${componentId}`);
        throw new CognitiveToolsError(ErrorCode.NOT_FOUND, `Implementation component not found: ${componentId}`);
      }

      const updatedImplementation = [...project.implementation];
      updatedImplementation[componentIndex] = {
        ...updatedImplementation[componentIndex],
        ...updates,
        id: componentId
      };

      const updatedProject: Project = {
        ...project,
        implementation: updatedImplementation,
        updatedAt: new Date().toISOString()
      };

      this.projects.set(projectId, updatedProject);
      logger.info(`Implementation component updated in project ${projectId}: ${componentId}`);
    } catch (error) {
      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to update implementation component: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to update implementation component: ${message}`);
    }
  }

  /**
   * Remove an implementation component from a project
   * @param projectId Project ID
   * @param componentId Component ID
   */
  public async removeImplementationComponent(projectId: string, componentId: string): Promise<void> {
    try {
      const project = await this.getProjectById(projectId);

      const componentIndex = project.implementation.findIndex(c => c.id === componentId);

      if (componentIndex === -1) {
        logger.error(`Implementation component not found: ${componentId}`);
        throw new CognitiveToolsError(ErrorCode.NOT_FOUND, `Implementation component not found: ${componentId}`);
      }

      const updatedImplementation = project.implementation.filter(c => c.id !== componentId);

      const updatedProject: Project = {
        ...project,
        implementation: updatedImplementation,
        updatedAt: new Date().toISOString()
      };

      this.projects.set(projectId, updatedProject);
      logger.info(`Implementation component removed from project ${projectId}: ${componentId}`);
    } catch (error) {
      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to remove implementation component: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to remove implementation component: ${message}`);
    }
  }

  /**
   * Add a test component to a project
   * @param projectId Project ID
   * @param component Test component to add (without id)
   * @returns Component ID
   */
  public async addTestComponent(projectId: string, component: Omit<TestComponent, 'id'>): Promise<string> {
    try {
      const project = await this.getProjectById(projectId);

      const id = this.generateId();
      const newComponent: TestComponent = {
        ...component,
        id
      };

      const updatedProject: Project = {
        ...project,
        testing: [...project.testing, newComponent],
        updatedAt: new Date().toISOString()
      };

      this.projects.set(projectId, updatedProject);
      logger.info(`Test component added to project ${projectId}: ${id}`);

      return id;
    } catch (error) {
      if (error instanceof CognitiveToolsError && error.code === ErrorCode.NOT_FOUND) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to add test component: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to add test component: ${message}`);
    }
  }

  /**
   * Update a test component in a project
   * @param projectId Project ID
   * @param componentId Component ID
   * @param updates Component updates
   */
  public async updateTestComponent(projectId: string, componentId: string, updates: Partial<Omit<TestComponent, 'id'>>): Promise<void> {
    try {
      const project = await this.getProjectById(projectId);

      const componentIndex = project.testing.findIndex(c => c.id === componentId);

      if (componentIndex === -1) {
        logger.error(`Test component not found: ${componentId}`);
        throw new CognitiveToolsError(ErrorCode.NOT_FOUND, `Test component not found: ${componentId}`);
      }

      const updatedTesting = [...project.testing];
      updatedTesting[componentIndex] = {
        ...updatedTesting[componentIndex],
        ...updates,
        id: componentId
      };

      const updatedProject: Project = {
        ...project,
        testing: updatedTesting,
        updatedAt: new Date().toISOString()
      };

      this.projects.set(projectId, updatedProject);
      logger.info(`Test component updated in project ${projectId}: ${componentId}`);
    } catch (error) {
      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to update test component: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to update test component: ${message}`);
    }
  }

  /**
   * Remove a test component from a project
   * @param projectId Project ID
   * @param componentId Component ID
   */
  public async removeTestComponent(projectId: string, componentId: string): Promise<void> {
    try {
      const project = await this.getProjectById(projectId);

      const componentIndex = project.testing.findIndex(c => c.id === componentId);

      if (componentIndex === -1) {
        logger.error(`Test component not found: ${componentId}`);
        throw new CognitiveToolsError(ErrorCode.NOT_FOUND, `Test component not found: ${componentId}`);
      }

      const updatedTesting = project.testing.filter(c => c.id !== componentId);

      const updatedProject: Project = {
        ...project,
        testing: updatedTesting,
        updatedAt: new Date().toISOString()
      };

      this.projects.set(projectId, updatedProject);
      logger.info(`Test component removed from project ${projectId}: ${componentId}`);
    } catch (error) {
      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to remove test component: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to remove test component: ${message}`);
    }
  }

  /**
   * Add a deployment component to a project
   * @param projectId Project ID
   * @param component Deployment component to add (without id)
   * @returns Component ID
   */
  public async addDeploymentComponent(projectId: string, component: Omit<DeploymentComponent, 'id'>): Promise<string> {
    try {
      const project = await this.getProjectById(projectId);

      const id = this.generateId();
      const newComponent: DeploymentComponent = {
        ...component,
        id
      };

      const updatedProject: Project = {
        ...project,
        deployment: [...project.deployment, newComponent],
        updatedAt: new Date().toISOString()
      };

      this.projects.set(projectId, updatedProject);
      logger.info(`Deployment component added to project ${projectId}: ${id}`);

      return id;
    } catch (error) {
      if (error instanceof CognitiveToolsError && error.code === ErrorCode.NOT_FOUND) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to add deployment component: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to add deployment component: ${message}`);
    }
  }

  /**
   * Update a deployment component in a project
   * @param projectId Project ID
   * @param componentId Component ID
   * @param updates Component updates
   */
  public async updateDeploymentComponent(projectId: string, componentId: string, updates: Partial<Omit<DeploymentComponent, 'id'>>): Promise<void> {
    try {
      const project = await this.getProjectById(projectId);

      const componentIndex = project.deployment.findIndex(c => c.id === componentId);

      if (componentIndex === -1) {
        logger.error(`Deployment component not found: ${componentId}`);
        throw new CognitiveToolsError(ErrorCode.NOT_FOUND, `Deployment component not found: ${componentId}`);
      }

      const updatedDeployment = [...project.deployment];
      updatedDeployment[componentIndex] = {
        ...updatedDeployment[componentIndex],
        ...updates,
        id: componentId
      };

      const updatedProject: Project = {
        ...project,
        deployment: updatedDeployment,
        updatedAt: new Date().toISOString()
      };

      this.projects.set(projectId, updatedProject);
      logger.info(`Deployment component updated in project ${projectId}: ${componentId}`);
    } catch (error) {
      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to update deployment component: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to update deployment component: ${message}`);
    }
  }

  /**
   * Remove a deployment component from a project
   * @param projectId Project ID
   * @param componentId Component ID
   */
  public async removeDeploymentComponent(projectId: string, componentId: string): Promise<void> {
    try {
      const project = await this.getProjectById(projectId);

      const componentIndex = project.deployment.findIndex(c => c.id === componentId);

      if (componentIndex === -1) {
        logger.error(`Deployment component not found: ${componentId}`);
        throw new CognitiveToolsError(ErrorCode.NOT_FOUND, `Deployment component not found: ${componentId}`);
      }

      const updatedDeployment = project.deployment.filter(c => c.id !== componentId);

      const updatedProject: Project = {
        ...project,
        deployment: updatedDeployment,
        updatedAt: new Date().toISOString()
      };

      this.projects.set(projectId, updatedProject);
      logger.info(`Deployment component removed from project ${projectId}: ${componentId}`);
    } catch (error) {
      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to remove deployment component: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to remove deployment component: ${message}`);
    }
  }

  /**
   * Create a knowledge-project link
   * @param link Knowledge-project link to create (without id, createdAt, updatedAt)
   * @returns Link ID
   */
  public async createKnowledgeProjectLink(link: Omit<KnowledgeProjectLink, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Verify that the project exists
      await this.getProjectById(link.projectId);

      const id = this.generateId();
      const now = new Date().toISOString();

      const newLink: KnowledgeProjectLink = {
        ...link,
        id,
        createdAt: now,
        updatedAt: now
      };

      this.knowledgeProjectLinks.set(id, newLink);
      logger.info(`Knowledge-project link created: ${id}`);

      return id;
    } catch (error) {
      if (error instanceof CognitiveToolsError && error.code === ErrorCode.NOT_FOUND) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to create knowledge-project link: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to create knowledge-project link: ${message}`);
    }
  }

  /**
   * Get a knowledge-project link by ID
   * @param id Link ID
   * @returns Knowledge-project link
   */
  public async getKnowledgeProjectLinkById(id: string): Promise<KnowledgeProjectLink> {
    const link = this.knowledgeProjectLinks.get(id);

    if (!link) {
      logger.error(`Knowledge-project link not found: ${id}`);
      throw new CognitiveToolsError(ErrorCode.NOT_FOUND, `Knowledge-project link not found: ${id}`);
    }

    return link;
  }

  /**
   * Update a knowledge-project link
   * @param id Link ID
   * @param updates Link updates
   */
  public async updateKnowledgeProjectLink(id: string, updates: Partial<Omit<KnowledgeProjectLink, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const link = await this.getKnowledgeProjectLinkById(id);

      const updatedLink: KnowledgeProjectLink = {
        ...link,
        ...updates,
        id,
        createdAt: link.createdAt,
        updatedAt: new Date().toISOString()
      };

      this.knowledgeProjectLinks.set(id, updatedLink);
      logger.info(`Knowledge-project link updated: ${id}`);
    } catch (error) {
      if (error instanceof CognitiveToolsError && error.code === ErrorCode.NOT_FOUND) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to update knowledge-project link: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to update knowledge-project link: ${message}`);
    }
  }

  /**
   * Delete a knowledge-project link
   * @param id Link ID
   */
  public async deleteKnowledgeProjectLink(id: string): Promise<void> {
    try {
      if (!this.knowledgeProjectLinks.has(id)) {
        logger.error(`Knowledge-project link not found: ${id}`);
        throw new CognitiveToolsError(ErrorCode.NOT_FOUND, `Knowledge-project link not found: ${id}`);
      }

      this.knowledgeProjectLinks.delete(id);
      logger.info(`Knowledge-project link deleted: ${id}`);
    } catch (error) {
      if (error instanceof CognitiveToolsError && error.code === ErrorCode.NOT_FOUND) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to delete knowledge-project link: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to delete knowledge-project link: ${message}`);
    }
  }

  /**
   * Search for knowledge-project links
   * @param options Search options
   * @returns Knowledge-project links
   */
  public async searchKnowledgeProjectLinks(options?: KnowledgeProjectSearchOptions): Promise<KnowledgeProjectLink[]> {
    try {
      const results: KnowledgeProjectLink[] = [];

      for (const link of this.knowledgeProjectLinks.values()) {
        if (this.matchesKnowledgeProjectLinkFilters(link, options)) {
          results.push(link);
        }
      }

      return results;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to search knowledge-project links: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Failed to search knowledge-project links: ${message}`);
    }
  }

  /**
   * Check if a project matches the specified filters
   * @param project Project to check
   * @param options Search options
   * @returns Whether the project matches the filters
   * @private
   */
  private matchesFilters(project: Project, options?: ProjectSearchOptions): boolean {
    if (!options) {
      return true;
    }

    if (options.types && options.types.length > 0 && !options.types.includes(project.type)) {
      return false;
    }

    if (options.statuses && options.statuses.length > 0 && !options.statuses.includes(project.status)) {
      return false;
    }

    if (options.tags && options.tags.length > 0 && !options.tags.some(tag => project.metadata.tags.includes(tag))) {
      return false;
    }

    if (options.fromDate && new Date(project.createdAt) < new Date(options.fromDate)) {
      return false;
    }

    if (options.toDate && new Date(project.createdAt) > new Date(options.toDate)) {
      return false;
    }

    return true;
  }

  /**
   * Check if a knowledge-project link matches the specified filters
   * @param link Knowledge-project link to check
   * @param options Search options
   * @returns Whether the link matches the filters
   * @private
   */
  private matchesKnowledgeProjectLinkFilters(link: KnowledgeProjectLink, options?: KnowledgeProjectSearchOptions): boolean {
    if (!options) {
      return true;
    }

    if (options.projectId && link.projectId !== options.projectId) {
      return false;
    }

    if (options.knowledgeId && link.knowledgeId !== options.knowledgeId) {
      return false;
    }

    if (options.linkTypes && options.linkTypes.length > 0 && !options.linkTypes.includes(link.linkType)) {
      return false;
    }

    if (options.minRelevance && link.relevance < options.minRelevance) {
      return false;
    }

    return true;
  }

  /**
   * Generate a unique ID
   * @returns Unique ID
   * @private
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

/**
 * Export a default instance
 */
export const projectManager = new ProjectManager();
