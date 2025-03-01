import {
    KnowledgeNode,
    Relationship,
    QueryParams,
    GraphStats,
    Analysis,
    GraphValidation,
    GraphService,
    Pattern,
    NodeType,
    RelationType
} from '../types/knowledge';
import { GraphAnalyzer } from '../utils/graph-analysis';

export class KnowledgeGraphService implements GraphService {
    private nodes: Map<string, KnowledgeNode>;
    private analyzer: GraphAnalyzer;

    constructor() {
        this.nodes = new Map();
        this.analyzer = new GraphAnalyzer([], []);
    }

    // Node operations
    public async addNode(node: KnowledgeNode): Promise<void> {
        this.nodes.set(node.id, node);
        this.updateAnalyzer();
    }

    public async updateNode(id: string, updates: Partial<KnowledgeNode>): Promise<void> {
        const node = this.nodes.get(id);
        if (!node) throw new Error(`Node not found: ${id}`);

        this.nodes.set(id, { ...node, ...updates });
        this.updateAnalyzer();
    }

    public async deleteNode(id: string): Promise<void> {
        this.nodes.delete(id);
        this.updateAnalyzer();
    }

    public async getNode(id: string): Promise<KnowledgeNode> {
        const node = this.nodes.get(id);
        if (!node) throw new Error(`Node not found: ${id}`);
        return node;
    }

    // Relationship operations
    public async addRelationship(relationship: Relationship): Promise<void> {
        const sourceNode = this.nodes.get(relationship.sourceId);
        if (!sourceNode) throw new Error(`Source node not found: ${relationship.sourceId}`);

        const targetNode = this.nodes.get(relationship.targetId);
        if (!targetNode) throw new Error(`Target node not found: ${relationship.targetId}`);

        sourceNode.relationships.push(relationship);
        this.nodes.set(sourceNode.id, sourceNode);
        this.updateAnalyzer();
    }

    public async updateRelationship(
        sourceId: string,
        targetId: string,
        updates: Partial<Relationship>
    ): Promise<void> {
        const sourceNode = this.nodes.get(sourceId);
        if (!sourceNode) throw new Error(`Source node not found: ${sourceId}`);

        const relationshipIndex = sourceNode.relationships.findIndex(
            r => r.sourceId === sourceId && r.targetId === targetId
        );

        if (relationshipIndex === -1) {
            throw new Error(`Relationship not found: ${sourceId} -> ${targetId}`);
        }

        sourceNode.relationships[relationshipIndex] = {
            ...sourceNode.relationships[relationshipIndex],
            ...updates
        };

        this.nodes.set(sourceId, sourceNode);
        this.updateAnalyzer();
    }

    public async deleteRelationship(sourceId: string, targetId: string): Promise<void> {
        const sourceNode = this.nodes.get(sourceId);
        if (!sourceNode) throw new Error(`Source node not found: ${sourceId}`);

        sourceNode.relationships = sourceNode.relationships.filter(
            r => !(r.sourceId === sourceId && r.targetId === targetId)
        );

        this.nodes.set(sourceId, sourceNode);
        this.updateAnalyzer();
    }

    // Query operations
    public async query(params: QueryParams): Promise<KnowledgeNode[]> {
        let results = Array.from(this.nodes.values());

        if (params.type) {
            results = results.filter(node => params.type?.includes(node.type));
        }

        if (params.tags) {
            results = results.filter(node =>
                params.tags?.every(tag => node.metadata.tags.includes(tag))
            );
        }

        if (params.dateRange) {
            results = results.filter(node => {
                const updated = node.metadata.updated.getTime();
                return updated >= params.dateRange!.start.getTime() &&
                       updated <= params.dateRange!.end.getTime();
            });
        }

        if (params.confidence) {
            results = results.filter(node =>
                node.metadata.confidence >= params.confidence!.min &&
                node.metadata.confidence <= params.confidence!.max
            );
        }

        if (params.relationshipType) {
            results = results.filter(node =>
                node.relationships.some(r => r.type === params.relationshipType)
            );
        }

        if (params.timeWindow) {
            results = results.filter(node => {
                const workflow = node.content.workflow;
                if (!workflow?.timeWindow) return false;

                const nodeStart = workflow.timeWindow.start?.getTime() || 0;
                const nodeEnd = workflow.timeWindow.end?.getTime() || Infinity;
                const queryStart = params.timeWindow!.start?.getTime() || 0;
                const queryEnd = params.timeWindow!.end?.getTime() || Infinity;

                return nodeStart <= queryEnd && nodeEnd >= queryStart;
            });
        }

        if (params.limit) {
            results = results.slice(params.offset || 0, (params.offset || 0) + params.limit);
        }

        return results;
    }

    public async findRelated(nodeId: string, params?: QueryParams): Promise<KnowledgeNode[]> {
        const node = this.nodes.get(nodeId);
        if (!node) throw new Error(`Node not found: ${nodeId}`);

        const relatedIds = new Set(
            node.relationships.flatMap(r => [r.sourceId, r.targetId])
        );
        relatedIds.delete(nodeId);

        let related = Array.from(relatedIds)
            .map(id => this.nodes.get(id))
            .filter((n): n is KnowledgeNode => n !== undefined);

        if (params) {
            related = await this.query({ ...params, offset: 0 });
        }

        return related;
    }

    public async findPatterns(params?: QueryParams): Promise<Analysis> {
        const patterns = this.analyzer.analyzePatterns();
        let filteredPatterns = patterns;

        if (params?.patternType) {
            filteredPatterns = patterns.filter(p => p.type === params.patternType);
        }

        return {
            patterns: filteredPatterns,
            insights: this.generateInsights(filteredPatterns),
            metrics: this.calculateMetrics(filteredPatterns),
            workflowAnalysis: this.analyzeWorkflows(filteredPatterns)
        };
    }

    // Analysis operations
    public async analyze(nodeId: string): Promise<Analysis> {
        const node = this.nodes.get(nodeId);
        if (!node) throw new Error(`Node not found: ${nodeId}`);

        const patterns = this.analyzer.analyzePatterns()
            .filter(p => p.relatedNodes.includes(nodeId));

        return {
            patterns,
            insights: this.generateInsights(patterns),
            metrics: this.calculateMetrics(patterns),
            workflowAnalysis: this.analyzeWorkflows(patterns)
        };
    }

    public async validateGraph(): Promise<GraphValidation> {
        const errors: GraphValidation['errors'] = [];
        const warnings: GraphValidation['warnings'] = [];

        // Check for orphaned nodes
        for (const node of this.nodes.values()) {
            if (node.relationships.length === 0) {
                warnings.push({
                    type: 'orphaned_node',
                    message: `Node ${node.id} has no relationships`,
                    suggestion: 'Consider connecting this node to related concepts',
                    affectedNodes: [node.id]
                });
            }
        }

        // Check for broken relationships
        for (const node of this.nodes.values()) {
            for (const rel of node.relationships) {
                if (!this.nodes.has(rel.targetId)) {
                    errors.push({
                        type: 'broken_relationship',
                        message: `Relationship ${rel.sourceId} -> ${rel.targetId} references non-existent target`,
                        nodeId: rel.sourceId,
                        relationshipIds: [rel.targetId],
                        severity: 'critical',
                        impact: ['data_integrity', 'graph_consistency']
                    });
                }
            }
        }

        // Check for workflow consistency
        for (const node of this.nodes.values()) {
            if (node.type === 'workflow') {
                const steps = Array.from(this.nodes.values())
                    .filter(n => n.relationships
                        .some(r => r.type === 'part_of' && r.targetId === node.id)
                    );

                if (steps.length === 0) {
                    warnings.push({
                        type: 'empty_workflow',
                        message: `Workflow ${node.id} has no steps`,
                        suggestion: 'Add steps to complete the workflow definition',
                        affectedNodes: [node.id]
                    });
                }

                // Check for temporal consistency
                const temporalRels = steps
                    .flatMap(s => s.relationships)
                    .filter(r => r.type === 'follows');

                if (temporalRels.length > 0 && !this.isAcyclic(temporalRels)) {
                    errors.push({
                        type: 'temporal_cycle',
                        message: `Workflow ${node.id} contains circular temporal dependencies`,
                        nodeId: node.id,
                        severity: 'major',
                        impact: ['workflow_execution', 'temporal_consistency']
                    });
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    public async getStats(): Promise<GraphStats> {
        const nodes = Array.from(this.nodes.values());
        const relationships = nodes.flatMap(n => n.relationships);

        const nodesByType = nodes.reduce((acc, node) => {
            acc[node.type] = (acc[node.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const relationshipsByType = relationships.reduce((acc, rel) => {
            acc[rel.type] = (acc[rel.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const workflowMetrics = this.calculateWorkflowMetrics();

        return {
            totalNodes: nodes.length,
            nodesByType: nodesByType as Record<NodeType, number>,
            totalRelationships: relationships.length,
            relationshipsByType: relationshipsByType as Record<RelationType, number>,
            averageConfidence: nodes.reduce((sum, n) => sum + n.metadata.confidence, 0) / nodes.length,
            lastUpdated: new Date(),
            workflowMetrics
        };
    }

    // Batch operations
    public async batchAddNodes(nodes: KnowledgeNode[]): Promise<void> {
        for (const node of nodes) {
            this.nodes.set(node.id, node);
        }
        this.updateAnalyzer();
    }

    public async batchAddRelationships(relationships: Relationship[]): Promise<void> {
        for (const rel of relationships) {
            const sourceNode = this.nodes.get(rel.sourceId);
            if (!sourceNode) continue;

            sourceNode.relationships.push(rel);
            this.nodes.set(sourceNode.id, sourceNode);
        }
        this.updateAnalyzer();
    }

    // Learning operations
    public async learn(analysis: Analysis): Promise<void> {
        // Implement pattern learning
        for (const pattern of analysis.patterns) {
            for (const nodeId of pattern.relatedNodes) {
                const node = this.nodes.get(nodeId);
                if (!node) continue;

                // Update node metadata based on pattern
                node.metadata.confidence = Math.min(1, node.metadata.confidence + 0.1);
                if (node.metadata.frequency !== undefined) {
                    node.metadata.frequency += pattern.frequency;
                }
                if (node.metadata.importance !== undefined) {
                    node.metadata.importance = Math.min(1, node.metadata.importance + pattern.impact);
                }

                this.nodes.set(nodeId, node);
            }
        }

        // Apply insights
        for (const insight of analysis.insights) {
            if (insight.actionable && insight.suggestedActions) {
                // TODO: Implement automated actions based on insights
            }
        }

        this.updateAnalyzer();
    }

    public async improveNode(nodeId: string, improvements: Partial<KnowledgeNode>): Promise<void> {
        const node = this.nodes.get(nodeId);
        if (!node) throw new Error(`Node not found: ${nodeId}`);

        // Apply improvements
        const improved = { ...node, ...improvements };
        improved.metadata.version += 1;
        improved.metadata.updated = new Date();

        this.nodes.set(nodeId, improved);
        this.updateAnalyzer();
    }

    public async suggestImprovements(nodeId: string): Promise<Analysis> {
        const node = this.nodes.get(nodeId);
        if (!node) throw new Error(`Node not found: ${nodeId}`);

        const patterns = this.analyzer.analyzePatterns()
            .filter(p => p.relatedNodes.includes(nodeId));

        const insights = patterns.map(p => ({
            type: 'improvement_opportunity',
            description: `Potential improvement based on ${p.type} pattern`,
            importance: p.impact,
            actionable: true,
            suggestedActions: this.generateSuggestedActions(p),
            impact: {
                timeReduction: p.temporal?.averageDuration || 0,
                qualityImprovement: p.impact,
                resourceOptimization: p.optimization?.potentialGain || 0
            }
        }));

        return {
            patterns,
            insights,
            metrics: this.calculateMetrics(patterns),
            workflowAnalysis: this.analyzeWorkflows(patterns)
        };
    }

    // Workflow operations
    public async findWorkflowPatterns(nodeId: string): Promise<Pattern[]> {
        const node = this.nodes.get(nodeId);
        if (!node) throw new Error(`Node not found: ${nodeId}`);

        return this.analyzer.analyzePatterns()
            .filter(p => p.relatedNodes.includes(nodeId));
    }

    public async analyzeWorkflowEfficiency(nodeId: string): Promise<Analysis> {
        const node = this.nodes.get(nodeId);
        if (!node) throw new Error(`Node not found: ${nodeId}`);

        const patterns = this.analyzer.analyzePatterns()
            .filter(p => p.relatedNodes.includes(nodeId));

        const workflowAnalysis = this.analyzeWorkflows(patterns);

        return {
            patterns,
            insights: this.generateInsights(patterns),
            metrics: this.calculateMetrics(patterns),
            workflowAnalysis
        };
    }

    public async optimizeWorkflow(nodeId: string): Promise<Analysis> {
        const node = this.nodes.get(nodeId);
        if (!node) throw new Error(`Node not found: ${nodeId}`);

        const patterns = this.analyzer.analyzePatterns()
            .filter(p => p.relatedNodes.includes(nodeId))
            .filter(p => (p.optimization?.potentialGain ?? 0) > 0);

        const insights = patterns.map(p => ({
            type: 'optimization_opportunity',
            description: `Optimization based on ${p.type} pattern`,
            importance: p.optimization?.potentialGain ?? 0,
            actionable: true,
            suggestedActions: this.generateSuggestedActions(p),
            impact: {
                timeReduction: p.temporal?.averageDuration || 0,
                qualityImprovement: p.impact,
                resourceOptimization: p.optimization?.potentialGain || 0
            }
        }));

        return {
            patterns,
            insights,
            metrics: this.calculateMetrics(patterns),
            workflowAnalysis: this.analyzeWorkflows(patterns)
        };
    }

    public async predictWorkflowOutcome(nodeId: string): Promise<Analysis> {
        const node = this.nodes.get(nodeId);
        if (!node) throw new Error(`Node not found: ${nodeId}`);

        const patterns = this.analyzer.analyzePatterns()
            .filter(p => p.relatedNodes.includes(nodeId));

        const predictions = patterns.map(p => ({
            type: 'prediction',
            description: `Prediction based on ${p.type} pattern`,
            importance: p.impact,
            actionable: false,
            impact: {
                timeReduction: p.temporal?.averageDuration || 0,
                qualityImprovement: p.impact,
                resourceOptimization: p.optimization?.potentialGain || 0
            }
        }));

        return {
            patterns,
            insights: predictions,
            metrics: this.calculateMetrics(patterns),
            workflowAnalysis: this.analyzeWorkflows(patterns)
        };
    }

    // Private helper methods
    private updateAnalyzer(): void {
        this.analyzer = new GraphAnalyzer(
            Array.from(this.nodes.values()),
            Array.from(this.nodes.values()).flatMap(n => n.relationships)
        );
    }

    private generateInsights(patterns: Pattern[]): Analysis['insights'] {
        return patterns.map(p => ({
            type: p.type,
            description: p.description,
            importance: p.impact,
            actionable: true,
            suggestedActions: this.generateSuggestedActions(p),
            impact: {
                timeReduction: p.temporal?.averageDuration || 0,
                qualityImprovement: p.impact,
                resourceOptimization: p.optimization?.potentialGain || 0
            }
        }));
    }

    private calculateMetrics(patterns: Pattern[]): Analysis['metrics'] {
        return [
            {
                name: 'pattern_confidence',
                value: patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length,
                trend: 'stable',
                context: {
                    historical: patterns.map(p => p.confidence),
                    benchmark: 0.8,
                    goal: 0.9
                }
            },
            {
                name: 'pattern_impact',
                value: patterns.reduce((sum, p) => sum + p.impact, 0) / patterns.length,
                trend: 'increasing',
                context: {
                    historical: patterns.map(p => p.impact),
                    benchmark: 0.7,
                    goal: 0.8
                }
            }
        ];
    }

    private analyzeWorkflows(patterns: Pattern[]): Analysis['workflowAnalysis'] {
        const workflowPatterns = patterns.filter(p =>
            p.type === 'sequence' ||
            p.type === 'parallel' ||
            p.type === 'choice'
        );

        if (workflowPatterns.length === 0) return undefined;

        const efficiency = workflowPatterns.reduce((sum, p) => sum + p.impact, 0) / workflowPatterns.length;
        const bottlenecks = this.findBottlenecks(workflowPatterns);
        const suggestions = this.generateSuggestions(workflowPatterns);

        const timeline = workflowPatterns.reduce((acc, p) => {
            if (p.temporal) {
                acc.optimal += p.temporal.averageDuration;
                acc.actual += p.temporal.averageDuration * (1 + p.temporal.variability);
                acc.variance += p.temporal.variability;
            }
            return acc;
        }, { optimal: 0, actual: 0, variance: 0 });

        return {
            efficiency,
            bottlenecks,
            suggestions,
            timeline
        };
    }

    private findBottlenecks(patterns: Pattern[]): string[] {
        return patterns
            .filter(p => (p.temporal?.variability ?? 0) > 0.5)
            .flatMap(p => p.relatedNodes);
    }

    private generateSuggestions(patterns: Pattern[]): string[] {
        return patterns
            .filter(p => (p.optimization?.potentialGain ?? 0) > 0.3)
            .map(p => `Optimize ${p.description} for potential ${Math.round((p.optimization?.potentialGain ?? 0) * 100)}% improvement`);
    }

    private generateSuggestedActions(pattern: Pattern): string[] {
        const actions: string[] = [];

        if (pattern.optimization) {
            actions.push(
                `Implement optimization with ${Math.round((pattern.optimization?.potentialGain ?? 0) * 100)}% potential gain`,
                `Address prerequisites: ${pattern.optimization.prerequisites.join(', ')}`
            );
        }

        if (pattern.temporal) {
            actions.push(
                `Reduce duration variability from ${Math.round(pattern.temporal.variability * 100)}%`,
                `Optimize for target duration of ${pattern.temporal.averageDuration}ms`
            );
        }

        return actions;
    }

    private calculateWorkflowMetrics(): GraphStats['workflowMetrics'] {
        const workflowNodes = Array.from(this.nodes.values())
            .filter(n => n.type === 'workflow');

        if (workflowNodes.length === 0) {
            return {
                averageDuration: 0,
                successRate: 0,
                bottlenecks: [],
                criticalPaths: []
            };
        }

        const durations = workflowNodes
            .map(n => n.content.workflow?.estimatedDuration)
            .filter((d): d is number => d !== undefined);

        const successRates = workflowNodes
            .map(n => n.metadata.reliability)
            .filter((r): r is number => r !== undefined);

        const bottlenecks = this.findBottlenecks(this.analyzer.analyzePatterns());
        const criticalPaths = this.findCriticalPaths(workflowNodes);

        return {
            averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
            successRate: successRates.reduce((sum, r) => sum + r, 0) / successRates.length,
            bottlenecks,
            criticalPaths
        };
    }

    private findCriticalPaths(workflowNodes: KnowledgeNode[]): Array<{path: string[], frequency: number}> {
        const paths: Array<{path: string[], frequency: number}> = [];

        for (const workflow of workflowNodes) {
            const steps = Array.from(this.nodes.values())
                .filter(n => n.relationships
                    .some(r => r.type === 'part_of' && r.targetId === workflow.id)
                );

            if (steps.length === 0) continue;

            const temporalRels = steps
                .flatMap(s => s.relationships)
                .filter(r => r.type === 'follows');

            const path = this.longestPath(steps.map(s => s.id), temporalRels);
            if (path.length > 0) {
                paths.push({
                    path,
                    frequency: steps.reduce((sum, s) => sum + (s.metadata.frequency || 0), 0) / steps.length
                });
            }
        }

        return paths;
    }

    private longestPath(nodes: string[], edges: Relationship[]): string[] {
        const graph = new Map<string, string[]>();
        for (const node of nodes) {
            graph.set(node, []);
        }
        for (const edge of edges) {
            const targets = graph.get(edge.sourceId);
            if (targets) targets.push(edge.targetId);
        }

        let longest: string[] = [];
        const visited = new Set<string>();

        const dfs = (node: string, path: string[]) => {
            if (visited.has(node)) return;
            visited.add(node);

            const newPath = [...path, node];
            if (newPath.length > longest.length) {
                longest = newPath;
            }

            const targets = graph.get(node);
            if (targets) {
                for (const target of targets) {
                    dfs(target, newPath);
                }
            }

            visited.delete(node);
        };

        for (const node of nodes) {
            dfs(node, []);
        }

        return longest;
    }

    private isAcyclic(relationships: Relationship[]): boolean {
        const graph = new Map<string, string[]>();
        const visited = new Set<string>();
        const recStack = new Set<string>();

        // Build adjacency list
        for (const rel of relationships) {
            if (!graph.has(rel.sourceId)) {
                graph.set(rel.sourceId, []);
            }
            graph.get(rel.sourceId)!.push(rel.targetId);
        }

        const hasCycle = (node: string): boolean => {
            if (!visited.has(node)) {
                visited.add(node);
                recStack.add(node);

                const neighbors = graph.get(node);
                if (neighbors) {
                    for (const neighbor of neighbors) {
                        if (!visited.has(neighbor) && hasCycle(neighbor)) {
                            return true;
                        } else if (recStack.has(neighbor)) {
                            return true;
                        }
                    }
                }
            }
            recStack.delete(node);
            return false;
        };

        for (const node of graph.keys()) {
            if (hasCycle(node)) {
                return false;
            }
        }

        return true;
    }
}
