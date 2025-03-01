import { LearningService } from '../services/learning.service';
import { LearningContext, LearningConfig, LearningMode } from '../types/learning';
import { Pattern } from '../types/knowledge';

describe('LearningService', () => {
    let learningService: LearningService;
    let config: LearningConfig;

    beforeEach(() => {
        config = {
            modes: ['pattern', 'workflow', 'temporal', 'efficiency', 'integration', 'predictive'],
            thresholds: {
                confidence: 0.7,
                impact: 0.6,
                improvement: 0.5
            },
            intervals: {
                learning: 1000,
                validation: 500,
                improvement: 2000
            },
            limits: {
                patterns: 100,
                improvements: 50,
                iterations: 10
            }
        };
        learningService = new LearningService(config);
    });

    describe('Core Learning Operations', () => {
        test('should learn from pattern data', async () => {
            const context: LearningContext = {
                mode: 'pattern' as LearningMode,
                confidence: 0.8,
                iteration: 1,
                timestamp: new Date(),
                metadata: {}
            };

            const pattern: Pattern = {
                type: 'sequence',
                description: 'Test pattern',
                confidence: 0.9,
                relatedNodes: ['node1', 'node2'],
                frequency: 0.8,
                impact: 0.7
            };

            const result = await learningService.learn(context, pattern);

            expect(result.success).toBe(true);
            expect(result.confidence).toBeGreaterThanOrEqual(config.thresholds.confidence);
            expect(result.impact).toBeGreaterThanOrEqual(config.thresholds.impact);
            expect(result.improvements).toBeDefined();
            expect(result.metadata).toBeDefined();
        });

        test('should handle learning errors gracefully', async () => {
            const context: LearningContext = {
                mode: 'invalid' as LearningMode,
                confidence: 0.8,
                iteration: 1,
                timestamp: new Date(),
                metadata: {}
            };

            const result = await learningService.learn(context, {});

            expect(result.success).toBe(false);
            expect(result.confidence).toBe(0);
            expect(result.impact).toBe(0);
            expect(result.improvements).toHaveLength(0);
            expect(result.metadata).toHaveProperty('error');
        });
    });

    describe('Pattern Learning', () => {
        test('should learn from pattern', async () => {
            const pattern: Pattern = {
                type: 'sequence',
                description: 'Test pattern',
                confidence: 0.9,
                relatedNodes: ['node1', 'node2'],
                frequency: 0.8,
                impact: 0.7
            };

            const result = await learningService.learnPattern(pattern);

            expect(result.pattern).toEqual(pattern);
            expect(result.frequency).toBeGreaterThan(0);
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.impact).toBeGreaterThan(0);
            expect(result.evolution).toHaveLength(1);
        });

        test('should improve pattern', async () => {
            const pattern: Pattern = {
                type: 'sequence',
                description: 'Test pattern',
                confidence: 0.9,
                relatedNodes: ['node1', 'node2'],
                frequency: 0.8,
                impact: 0.7
            };

            const improvements = await learningService.improvePattern(pattern);

            expect(improvements).toBeDefined();
            expect(Array.isArray(improvements)).toBe(true);
            improvements.forEach(improvement => {
                expect(improvement.type).toBeDefined();
                expect(improvement.description).toBeDefined();
                expect(improvement.impact).toBeGreaterThan(0);
                expect(improvement.confidence).toBeGreaterThan(0);
                expect(improvement.applied).toBe(false);
            });
        });

        test('should validate pattern', async () => {
            const pattern: Pattern = {
                type: 'sequence',
                description: 'Test pattern',
                confidence: 0.9,
                relatedNodes: ['node1', 'node2'],
                frequency: 0.8,
                impact: 0.7
            };

            const isValid = await learningService.validatePattern(pattern);
            expect(isValid).toBe(true);
        });
    });

    describe('Workflow Learning', () => {
        test('should learn from workflow', async () => {
            const nodeId = 'workflow1';
            const result = await learningService.learnWorkflow(nodeId);

            expect(result.nodeId).toBe(nodeId);
            expect(result.patterns).toBeDefined();
            expect(result.efficiency).toBeGreaterThanOrEqual(0);
            expect(result.bottlenecks).toBeDefined();
            expect(result.improvements).toBeDefined();
        });

        test('should improve workflow', async () => {
            const nodeId = 'workflow1';
            const improvements = await learningService.improveWorkflow(nodeId);

            expect(improvements).toBeDefined();
            expect(Array.isArray(improvements)).toBe(true);
        });

        test('should validate workflow', async () => {
            const nodeId = 'workflow1';
            const isValid = await learningService.validateWorkflow(nodeId);
            expect(typeof isValid).toBe('boolean');
        });
    });

    describe('Temporal Learning', () => {
        test('should learn from sequence', async () => {
            const sequence = ['step1', 'step2', 'step3'];
            const result = await learningService.learnTemporal(sequence);

            expect(result.sequence).toEqual(sequence);
            expect(result.duration).toBeGreaterThan(0);
            expect(result.variance).toBeGreaterThanOrEqual(0);
            expect(result.dependencies).toBeDefined();
            expect(result.optimizations).toBeDefined();
        });

        test('should improve temporal sequence', async () => {
            const sequence = ['step1', 'step2', 'step3'];
            const improvements = await learningService.improveTemporal(sequence);

            expect(improvements).toBeDefined();
            expect(Array.isArray(improvements)).toBe(true);
        });

        test('should validate temporal sequence', async () => {
            const sequence = ['step1', 'step2', 'step3'];
            const isValid = await learningService.validateTemporal(sequence);
            expect(typeof isValid).toBe('boolean');
        });
    });

    describe('Analysis Operations', () => {
        test('should analyze node', async () => {
            const nodeId = 'test1';
            const analysis = await learningService.analyze(nodeId);

            expect(analysis.patterns).toBeDefined();
            expect(analysis.insights).toBeDefined();
            expect(analysis.metrics).toBeDefined();
            expect(analysis.workflowAnalysis).toBeDefined();
        });

        test('should suggest improvements', async () => {
            const nodeId = 'test1';
            const suggestions = await learningService.suggest(nodeId);

            expect(suggestions).toBeDefined();
            expect(Array.isArray(suggestions)).toBe(true);
        });

        test('should validate results', async () => {
            const result = {
                success: true,
                confidence: 0.9,
                impact: 0.8,
                improvements: [],
                metadata: {}
            };

            const isValid = await learningService.validate(result);
            expect(isValid).toBe(true);
        });
    });
});
