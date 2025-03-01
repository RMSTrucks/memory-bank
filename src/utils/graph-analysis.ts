import { KnowledgeNode, Relationship, Pattern, PatternType, Analysis, NodeType, RelationType } from '../types/knowledge';

export class GraphAnalyzer {
    private nodes: KnowledgeNode[];
    private relationships: Relationship[];

    constructor(nodes: KnowledgeNode[], relationships: Relationship[]) {
        this.nodes = nodes;
        this.relationships = relationships;
    }

    public analyzePatterns(): Pattern[] {
        const patterns: Pattern[] = [
            ...this.findSequencePatterns(),
            ...this.findParallelPatterns(),
            ...this.findChoicePatterns(),
            ...this.findIterationPatterns(),
            ...this.findTemporalPatterns(),
            ...this.findDependencyPatterns(),
            ...this.findOptimizationPatterns()
        ];

        return patterns;
    }

    private findSequencePatterns(): Pattern[] {
        const sequences: Pattern[] = [];
        const workflowNodes = this.nodes.filter(n => n.type === 'workflow');

        for (const workflow of workflowNodes) {
            const steps = this.relationships
                .filter(r => r.type === 'part_of' && r.targetId === workflow.id)
                .map(r => this.nodes.find(n => n.id === r.sourceId))
                .filter((n): n is KnowledgeNode => n !== undefined);

            if (steps.length > 1) {
                sequences.push({
                    type: 'sequence',
                    description: `Sequential workflow: ${workflow.content.title}`,
                    confidence: this.calculateConfidence(steps),
                    relatedNodes: steps.map(s => s.id),
                    frequency: this.calculateFrequency(steps),
                    impact: this.calculateImpact(steps),
                    temporal: {
                        averageDuration: this.calculateAverageDuration(steps),
                        variability: this.calculateDurationVariability(steps),
                        timeWindows: this.getTimeWindows(steps)
                    }
                });
            }
        }

        return sequences;
    }

    private findParallelPatterns(): Pattern[] {
        const parallels: Pattern[] = [];
        const workflowNodes = this.nodes.filter(n => n.type === 'workflow');

        for (const workflow of workflowNodes) {
            const steps = this.relationships
                .filter(r => r.type === 'part_of' && r.targetId === workflow.id)
                .map(r => this.nodes.find(n => n.id === r.sourceId))
                .filter((n): n is KnowledgeNode => n !== undefined);

            const independentSteps = steps.filter(step => 
                !this.relationships.some(r => 
                    (r.type === 'depends_on' || r.type === 'follows') &&
                    (r.sourceId === step.id || r.targetId === step.id)
                )
            );

            if (independentSteps.length > 1) {
                parallels.push({
                    type: 'parallel',
                    description: `Parallel steps in workflow: ${workflow.content.title}`,
                    confidence: this.calculateConfidence(independentSteps),
                    relatedNodes: independentSteps.map(s => s.id),
                    frequency: this.calculateFrequency(independentSteps),
                    impact: this.calculateImpact(independentSteps),
                    optimization: {
                        potentialGain: this.calculatePotentialGain(independentSteps),
                        riskLevel: this.calculateRiskLevel(independentSteps),
                        prerequisites: this.getPrerequisites(independentSteps)
                    }
                });
            }
        }

        return parallels;
    }

    private findChoicePatterns(): Pattern[] {
        const choices: Pattern[] = [];
        const decisionNodes = this.nodes.filter(n => n.type === 'condition');

        for (const decision of decisionNodes) {
            const outcomes = this.relationships
                .filter(r => r.sourceId === decision.id && r.type === 'enables')
                .map(r => this.nodes.find(n => n.id === r.targetId))
                .filter((n): n is KnowledgeNode => n !== undefined);

            if (outcomes.length > 1) {
                choices.push({
                    type: 'choice',
                    description: `Decision point: ${decision.content.title}`,
                    confidence: this.calculateConfidence([decision, ...outcomes]),
                    relatedNodes: [decision.id, ...outcomes.map(o => o.id)],
                    frequency: this.calculateFrequency(outcomes),
                    impact: this.calculateImpact(outcomes)
                });
            }
        }

        return choices;
    }

    private findIterationPatterns(): Pattern[] {
        const iterations: Pattern[] = [];
        const cycles = this.findCycles();

        for (const cycle of cycles) {
            const cycleNodes = cycle.map(id => 
                this.nodes.find(n => n.id === id)
            ).filter((n): n is KnowledgeNode => n !== undefined);

            iterations.push({
                type: 'iteration',
                description: `Iterative workflow pattern`,
                confidence: this.calculateConfidence(cycleNodes),
                relatedNodes: cycle,
                frequency: this.calculateFrequency(cycleNodes),
                impact: this.calculateImpact(cycleNodes),
                temporal: {
                    averageDuration: this.calculateAverageDuration(cycleNodes),
                    variability: this.calculateDurationVariability(cycleNodes),
                    timeWindows: this.getTimeWindows(cycleNodes)
                }
            });
        }

        return iterations;
    }

    private findTemporalPatterns(): Pattern[] {
        const temporals: Pattern[] = [];
        const timeConstrainedNodes = this.nodes.filter(n => 
            n.content.workflow?.timeWindow !== undefined
        );

        for (const node of timeConstrainedNodes) {
            const relatedNodes = this.relationships
                .filter(r => r.sourceId === node.id || r.targetId === node.id)
                .map(r => this.nodes.find(n => n.id === (r.sourceId === node.id ? r.targetId : r.sourceId)))
                .filter((n): n is KnowledgeNode => n !== undefined);

            temporals.push({
                type: 'temporal',
                description: `Time-constrained workflow: ${node.content.title}`,
                confidence: this.calculateConfidence([node, ...relatedNodes]),
                relatedNodes: [node.id, ...relatedNodes.map(n => n.id)],
                frequency: this.calculateFrequency([node, ...relatedNodes]),
                impact: this.calculateImpact([node, ...relatedNodes]),
                temporal: {
                    averageDuration: this.calculateAverageDuration([node, ...relatedNodes]),
                    variability: this.calculateDurationVariability([node, ...relatedNodes]),
                    timeWindows: this.getTimeWindows([node, ...relatedNodes])
                }
            });
        }

        return temporals;
    }

    private findDependencyPatterns(): Pattern[] {
        const dependencies: Pattern[] = [];
        const dependentNodes = this.nodes.filter(n =>
            this.relationships.some(r => 
                (r.sourceId === n.id || r.targetId === n.id) &&
                (r.type === 'depends_on' || r.type === 'blocks' || r.type === 'enables')
            )
        );

        for (const node of dependentNodes) {
            const relatedNodes = this.relationships
                .filter(r => 
                    (r.sourceId === node.id || r.targetId === node.id) &&
                    (r.type === 'depends_on' || r.type === 'blocks' || r.type === 'enables')
                )
                .map(r => this.nodes.find(n => n.id === (r.sourceId === node.id ? r.targetId : r.sourceId)))
                .filter((n): n is KnowledgeNode => n !== undefined);

            dependencies.push({
                type: 'dependency',
                description: `Dependency chain: ${node.content.title}`,
                confidence: this.calculateConfidence([node, ...relatedNodes]),
                relatedNodes: [node.id, ...relatedNodes.map(n => n.id)],
                frequency: this.calculateFrequency([node, ...relatedNodes]),
                impact: this.calculateImpact([node, ...relatedNodes])
            });
        }

        return dependencies;
    }

    private findOptimizationPatterns(): Pattern[] {
        const optimizations: Pattern[] = [];
        const improvementNodes = this.nodes.filter(n => n.type === 'improvement');

        for (const improvement of improvementNodes) {
            const targetNodes = this.relationships
                .filter(r => r.sourceId === improvement.id && r.type === 'improves')
                .map(r => this.nodes.find(n => n.id === r.targetId))
                .filter((n): n is KnowledgeNode => n !== undefined);

            if (targetNodes.length > 0) {
                optimizations.push({
                    type: 'optimization',
                    description: `Optimization opportunity: ${improvement.content.title}`,
                    confidence: this.calculateConfidence([improvement, ...targetNodes]),
                    relatedNodes: [improvement.id, ...targetNodes.map(n => n.id)],
                    frequency: this.calculateFrequency(targetNodes),
                    impact: this.calculateImpact([improvement, ...targetNodes]),
                    optimization: {
                        potentialGain: this.calculatePotentialGain(targetNodes),
                        riskLevel: this.calculateRiskLevel(targetNodes),
                        prerequisites: this.getPrerequisites(targetNodes)
                    }
                });
            }
        }

        return optimizations;
    }

    private findCycles(): string[][] {
        const visited = new Set<string>();
        const cycles: string[][] = [];

        const dfs = (nodeId: string, path: string[]) => {
            if (path.includes(nodeId)) {
                const cycle = path.slice(path.indexOf(nodeId));
                cycles.push(cycle);
                return;
            }

            if (visited.has(nodeId)) return;
            visited.add(nodeId);

            const outgoingRelationships = this.relationships.filter(r => r.sourceId === nodeId);
            for (const rel of outgoingRelationships) {
                dfs(rel.targetId, [...path, nodeId]);
            }
        };

        for (const node of this.nodes) {
            dfs(node.id, []);
        }

        return cycles;
    }

    private calculateConfidence(nodes: KnowledgeNode[]): number {
        if (nodes.length === 0) return 0;
        return nodes.reduce((sum, node) => sum + node.metadata.confidence, 0) / nodes.length;
    }

    private calculateFrequency(nodes: KnowledgeNode[]): number {
        if (nodes.length === 0) return 0;
        return nodes.reduce((sum, node) => sum + (node.metadata.frequency || 0), 0) / nodes.length;
    }

    private calculateImpact(nodes: KnowledgeNode[]): number {
        if (nodes.length === 0) return 0;
        return nodes.reduce((sum, node) => sum + (node.metadata.importance || 0), 0) / nodes.length;
    }

    private calculateAverageDuration(nodes: KnowledgeNode[]): number {
        const durations = nodes
            .map(n => n.content.workflow?.estimatedDuration)
            .filter((d): d is number => d !== undefined);
        
        if (durations.length === 0) return 0;
        return durations.reduce((sum, d) => sum + d, 0) / durations.length;
    }

    private calculateDurationVariability(nodes: KnowledgeNode[]): number {
        const durations = nodes
            .map(n => n.content.workflow?.estimatedDuration)
            .filter((d): d is number => d !== undefined);
        
        if (durations.length === 0) return 0;
        
        const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const squaredDiffs = durations.map(d => Math.pow(d - mean, 2));
        return Math.sqrt(squaredDiffs.reduce((sum, d) => sum + d, 0) / durations.length);
    }

    private getTimeWindows(nodes: KnowledgeNode[]) {
        return nodes
            .map(n => n.content.workflow?.timeWindow)
            .filter((w): w is NonNullable<typeof w> => w !== undefined);
    }

    private calculatePotentialGain(nodes: KnowledgeNode[]): number {
        return nodes.reduce((max, node) => {
            const improvement = node.metadata.importance || 0;
            return Math.max(max, improvement);
        }, 0);
    }

    private calculateRiskLevel(nodes: KnowledgeNode[]): number {
        if (nodes.length === 0) return 0;
        return 1 - (nodes.reduce((sum, node) => sum + (node.metadata.reliability || 0), 0) / nodes.length);
    }

    private getPrerequisites(nodes: KnowledgeNode[]): string[] {
        const prerequisites = new Set<string>();
        
        for (const node of nodes) {
            const deps = this.relationships
                .filter(r => r.targetId === node.id && r.type === 'depends_on')
                .map(r => r.sourceId);
            deps.forEach(d => prerequisites.add(d));
        }

        return Array.from(prerequisites);
    }
}
