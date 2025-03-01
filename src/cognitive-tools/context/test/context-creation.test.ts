import { ContextBuilder } from '../services/context-builder.service';
import { RequirementsCollector } from '../services/requirements-collector.service';
import { RequirementsAnalyzer } from '../services/requirements-analyzer.service';
import { FunctionalRequirement, NonFunctionalRequirement } from '../types/requirement';

describe('Project Context Creation', () => {
  let contextBuilder: ContextBuilder;

  beforeEach(() => {
    contextBuilder = new ContextBuilder();
  });

  describe('Context Creation', () => {
    it('should create a new project context with basic information', async () => {
      const options = {
        name: 'Test Project',
        description: 'A test project for context creation',
        version: '1.0.0',
        scope: {
          objectives: ['Test objective 1', 'Test objective 2'],
          deliverables: ['Deliverable 1', 'Deliverable 2'],
          constraints: ['Constraint 1'],
          assumptions: ['Assumption 1'],
          exclusions: ['Exclusion 1']
        },
        timeline: {
          startDate: new Date('2025-03-01'),
          endDate: new Date('2025-06-30'),
          milestones: [
            {
              title: 'Phase 1 Complete',
              date: new Date('2025-04-30'),
              deliverables: ['Deliverable 1']
            }
          ]
        },
        stakeholders: [
          {
            name: 'John Doe',
            role: 'Project Manager',
            responsibilities: ['Project oversight', 'Resource management'],
            contactInfo: {
              email: 'john@example.com'
            }
          }
        ]
      };

      const result = await contextBuilder.createContext(options);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.name).toBe(options.name);
        expect(result.data.description).toBe(options.description);
        expect(result.data.version).toBe(options.version);
        expect(result.data.scope.objectives).toEqual(options.scope.objectives);
        expect(result.data.stakeholders).toHaveLength(1);
        expect(result.data.metadata.status).toBe('draft');
      }
    });
  });

  describe('Requirements Management', () => {
    it('should add requirements to the context and analyze them', async () => {
      // Create initial context
      const contextResult = await contextBuilder.createContext({
        name: 'Test Project',
        description: 'A test project',
        version: '1.0.0'
      });

      expect(contextResult.success).toBe(true);
      expect(contextResult.data).toBeDefined();
      if (!contextResult.data) return;

      const context = contextResult.data;

      // Define test requirements
      const requirements = [
        {
          type: 'functional' as const,
          title: 'User Authentication',
          description: 'Users should be able to authenticate using email and password',
          priority: 'high' as const,
          acceptance: [
            'Users can sign up with email and password',
            'Users can log in with email and password',
            'Users can reset their password'
          ],
          dependencies: [],
          implementation: {
            estimatedComplexity: 'medium' as const,
            technicalNotes: 'Use JWT for authentication'
          },
          tags: ['auth', 'security'],
          metadata: {}
        },
        {
          type: 'non-functional' as const,
          title: 'System Performance',
          description: 'System should handle high load efficiently',
          priority: 'high' as const,
          category: 'performance' as const,
          metrics: [
            {
              measure: 'Response Time',
              target: '<200ms',
              current: '150ms'
            }
          ],
          tags: ['performance', 'scalability'],
          metadata: {}
        }
      ];

      // Add requirements to context
      const updateResult = await contextBuilder.addRequirements(context, requirements);

      expect(updateResult.success).toBe(true);
      expect(updateResult.data).toBeDefined();
      if (!updateResult.data) return;

      const updatedContext = updateResult.data;

      // Verify requirements were added
      expect(updatedContext.requirements).toHaveLength(2);
      expect(updatedContext.requirements[0].type).toBe('functional');
      expect(updatedContext.requirements[1].type).toBe('non-functional');

      // Verify relationships were analyzed
      expect(updatedContext.requirementRelationships).toBeDefined();

      // Verify metadata was updated
      expect(updatedContext.metadata.lastAnalyzed).toBeDefined();
      expect(updatedContext.metadata.healthScore).toBeGreaterThan(0);
      expect(updatedContext.metadata.completeness).toBeGreaterThan(0);
    });
  });

  describe('Requirements Analysis', () => {
    it('should analyze requirements and update context accordingly', async () => {
      const analyzer = new RequirementsAnalyzer();
      const collector = new RequirementsCollector();

      // Create test requirements
      const req1: Omit<FunctionalRequirement, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'functional',
        title: 'Data Export',
        description: 'Users should be able to export their data in CSV format',
        priority: 'medium',
        acceptance: ['Export includes all user data', 'CSV format is valid'],
        dependencies: [],
        tags: ['data', 'export'],
        metadata: {}
      };

      const req2: Omit<NonFunctionalRequirement, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'non-functional',
        title: 'Export Performance',
        description: 'Data export should complete within reasonable time',
        priority: 'medium',
        category: 'performance',
        metrics: [
          {
            measure: 'Export Time',
            target: '<5 minutes for 1GB data'
          }
        ],
        tags: ['performance', 'export'],
        metadata: {}
      };

      // Add requirements
      const result1 = await collector.addRequirement(req1);
      const result2 = await collector.addRequirement(req2);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      if (!result1.data || !result2.data) return;

      // Detect relationships
      const relationshipsResult = await analyzer.detectRelationships([
        result1.data,
        result2.data
      ]);

      expect(relationshipsResult.success).toBe(true);
      expect(relationshipsResult.data).toBeDefined();

      if (!relationshipsResult.data) return;

      // Analyze requirements
      const analysisResult = await analyzer.analyzeRequirementSet(
        [result1.data, result2.data],
        relationshipsResult.data
      );

      expect(analysisResult.success).toBe(true);
      expect(analysisResult.data).toBeDefined();

      if (!analysisResult.data) return;

      const analysis = analysisResult.data;

      // Verify analysis results
      expect(analysis.requirements.total).toBe(2);
      expect(analysis.coverage.functional).toBeGreaterThan(0);
      expect(analysis.coverage.nonFunctional).toBeGreaterThan(0);
      expect(analysis.metrics.overallClarity).toBeGreaterThan(0);
      expect(analysis.metrics.overallCompleteness).toBeGreaterThan(0);
    });
  });
});
