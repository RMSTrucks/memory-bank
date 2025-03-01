import { KnowledgeGraphService } from '../services/knowledge-graph.service';
import { KnowledgeNode, Relationship, NodeType, RelationType } from '../types/knowledge';

describe('KnowledgeGraphService', () => {
    let graphService: KnowledgeGraphService;

    beforeEach(() => {
        graphService = new KnowledgeGraphService();
    });

    describe('Node Operations', () => {
        const testNode: KnowledgeNode = {
            id: 'test-1',
            type: 'concept',
            content: {
                title: 'Test Node',
                description: 'A test node for unit testing',
                data: {}
            },
            metadata: {
                created: new Date(),
                updated: new Date(),
                version: 1,
                confidence: 0.8,
                source: 'test',
                tags: ['test', 'unit-testing']
            },
            relationships: []
        };

        it('should add a node successfully', async () => {
            await graphService.addNode(testNode);
            const retrieved = await graphService.getNode(testNode.id);
            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(testNode.id);
        });

        it('should update a node successfully', async () => {
            await graphService.addNode(testNode);
            const updates = {
                content: {
                    ...testNode.content,
                    description: 'Updated description'
                }
            };
            await graphService.updateNode(testNode.id, updates);
            const updated = await graphService.getNode(testNode.id);
            expect(updated.content.description).toBe('Updated description');
        });

        it('should delete a node successfully', async () => {
            await graphService.addNode(testNode);
            await graphService.deleteNode(testNode.id);
            await expect(graphService.getNode(testNode.id)).rejects.toThrow();
        });
    });

    describe('Relationship Operations', () => {
        const node1: KnowledgeNode = {
            id: 'node-1',
            type: 'concept',
            content: {
                title: 'Node 1',
                description: 'First test node',
                data: {}
            },
            metadata: {
                created: new Date(),
                updated: new Date(),
                version: 1,
                confidence: 0.8,
                source: 'test',
                tags: ['test']
            },
            relationships: []
        };

        const node2: KnowledgeNode = {
            id: 'node-2',
            type: 'concept',
            content: {
                title: 'Node 2',
                description: 'Second test node',
                data: {}
            },
            metadata: {
                created: new Date(),
                updated: new Date(),
                version: 1,
                confidence: 0.8,
                source: 'test',
                tags: ['test']
            },
            relationships: []
        };

        const testRelationship: Relationship = {
            sourceId: 'node-1',
            targetId: 'node-2',
            type: 'related',
            strength: 0.8,
            metadata: {},
            created: new Date(),
            updated: new Date()
        };

        beforeEach(async () => {
            await graphService.addNode(node1);
            await graphService.addNode(node2);
        });

        it('should add a relationship successfully', async () => {
            await graphService.addRelationship(testRelationship);
            const sourceNode = await graphService.getNode(node1.id);
            expect(sourceNode.relationships).toHaveLength(1);
            expect(sourceNode.relationships[0].targetId).toBe(node2.id);
        });

        it('should update a relationship successfully', async () => {
            await graphService.addRelationship(testRelationship);
            const updates: Partial<Relationship> = {
                strength: 0.9
            };
            await graphService.updateRelationship(node1.id, node2.id, updates);
            const sourceNode = await graphService.getNode(node1.id);
            expect(sourceNode.relationships[0].strength).toBe(0.9);
        });

        it('should delete a relationship successfully', async () => {
            await graphService.addRelationship(testRelationship);
            await graphService.deleteRelationship(node1.id, node2.id);
            const sourceNode = await graphService.getNode(node1.id);
            expect(sourceNode.relationships).toHaveLength(0);
        });
    });

    describe('Analysis and Learning', () => {
        const createTestNode = (id: string, type: NodeType, tags: string[]): KnowledgeNode => ({
            id,
            type,
            content: {
                title: `Test ${id}`,
                description: 'Test node for analysis',
                data: {}
            },
            metadata: {
                created: new Date(),
                updated: new Date(),
                version: 1,
                confidence: 0.8,
                source: 'test',
                tags
            },
            relationships: []
        });

        const createRelationship = (
            sourceId: string,
            targetId: string,
            type: RelationType,
            strength: number
        ): Relationship => ({
            sourceId,
            targetId,
            type,
            strength,
            metadata: {},
            created: new Date(),
            updated: new Date()
        });

        beforeEach(async () => {
            // Create test nodes
            const nodes = [
                createTestNode('n1', 'concept', ['test', 'analysis']),
                createTestNode('n2', 'concept', ['test', 'analysis']),
                createTestNode('n3', 'task', ['test', 'learning'])
            ];

            // Add nodes
            await Promise.all(nodes.map(node => graphService.addNode(node)));

            // Create relationships
            const relationships = [
                createRelationship('n1', 'n2', 'related', 0.8),
                createRelationship('n2', 'n3', 'depends_on', 0.7)
            ];

            // Add relationships
            await Promise.all(relationships.map(rel => graphService.addRelationship(rel)));
        });

        it('should analyze patterns successfully', async () => {
            const analysis = await graphService.findPatterns();
            expect(analysis.patterns).toBeDefined();
            expect(analysis.insights).toBeDefined();
            expect(analysis.metrics).toBeDefined();
        });

        it('should suggest improvements for a node', async () => {
            const improvements = await graphService.suggestImprovements('n1');
            expect(improvements.patterns).toBeDefined();
            expect(improvements.insights).toBeDefined();
            expect(improvements.insights.some(i => i.actionable)).toBe(true);
        });

        it('should learn from analysis results', async () => {
            const analysis = await graphService.findPatterns();
            await graphService.learn(analysis);

            // Verify that learning created new nodes
            const nodes = await graphService.query({ type: ['pattern'] });
            expect(nodes.length).toBeGreaterThan(0);
        });
    });

    describe('Graph Validation', () => {
        it('should validate graph integrity', async () => {
            // Add some test nodes and relationships
            const node1 = {
                id: 'test-1',
                type: 'concept' as NodeType,
                content: {
                    title: 'Test Node 1',
                    description: 'Test node for validation',
                    data: {}
                },
                metadata: {
                    created: new Date(),
                    updated: new Date(),
                    version: 1,
                    confidence: 0.8,
                    source: 'test',
                    tags: ['test']
                },
                relationships: []
            };

            await graphService.addNode(node1);

            const validation = await graphService.validateGraph();
            expect(validation.isValid).toBeDefined();
            expect(Array.isArray(validation.errors)).toBe(true);
            expect(Array.isArray(validation.warnings)).toBe(true);
        });
    });

    describe('Query Operations', () => {
        beforeEach(async () => {
            // Add test nodes with different types and tags
            const nodes = [
                createTestNode('q1', 'concept', ['tag1', 'tag2'], 0.9),
                createTestNode('q2', 'task', ['tag2', 'tag3'], 0.7),
                createTestNode('q3', 'concept', ['tag1', 'tag3'], 0.8)
            ];

            await Promise.all(nodes.map(node => graphService.addNode(node)));
        });

        function createTestNode(
            id: string,
            type: NodeType,
            tags: string[],
            confidence: number
        ): KnowledgeNode {
            return {
                id,
                type,
                content: {
                    title: `Test ${id}`,
                    description: 'Test node for querying',
                    data: {}
                },
                metadata: {
                    created: new Date(),
                    updated: new Date(),
                    version: 1,
                    confidence,
                    source: 'test',
                    tags
                },
                relationships: []
            };
        }

        it('should query nodes by type', async () => {
            const concepts = await graphService.query({ type: ['concept'] });
            expect(concepts.length).toBe(2);
            expect(concepts.every(node => node.type === 'concept')).toBe(true);
        });

        it('should query nodes by tags', async () => {
            const nodesWithTag1 = await graphService.query({ tags: ['tag1'] });
            expect(nodesWithTag1.length).toBe(2);
            expect(nodesWithTag1.every(node => node.metadata.tags.includes('tag1'))).toBe(true);
        });

        it('should query nodes by confidence range', async () => {
            const highConfidenceNodes = await graphService.query({
                confidence: { min: 0.8, max: 1.0 }
            });
            expect(highConfidenceNodes.length).toBe(2);
            expect(
                highConfidenceNodes.every(node => node.metadata.confidence >= 0.8)
            ).toBe(true);
        });
    });
});
