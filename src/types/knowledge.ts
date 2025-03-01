/**
 * Types for the Knowledge Graph system
 */

export type NodeType =
    | 'concept'
    | 'task'
    | 'learning'
    | 'pattern'
    | 'improvement'
    | 'workflow'    // New: Represents a complete workflow
    | 'step'        // New: Represents a step in a workflow
    | 'trigger'     // New: Represents an event that starts a workflow
    | 'condition'   // New: Represents a decision point
    | 'outcome';    // New: Represents a workflow result

export type RelationType =
    | 'related'
    | 'depends_on'
    | 'improves'
    | 'implements'
    | 'derives_from'
    | 'follows'     // New: Temporal relationship (A follows B)
    | 'triggers'    // New: Causal relationship (A triggers B)
    | 'blocks'      // New: Blocking relationship (A blocks B)
    | 'enables'     // New: Enabling relationship (A enables B)
    | 'part_of';    // New: Compositional relationship (A is part of B)

export type PatternType =
    | 'sequence'    // Ordered steps in a workflow
    | 'parallel'    // Steps that can run in parallel
    | 'choice'      // Decision points in workflow
    | 'iteration'   // Repeated patterns
    | 'temporal'    // Time-based patterns
    | 'dependency'  // Resource/state dependencies
    | 'optimization'; // Performance patterns

export interface TimeWindow {
    start?: Date;
    end?: Date;
    duration?: number;  // in milliseconds
    recurring?: {
        frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
        interval: number;  // e.g., every 2 weeks
        customPattern?: string;  // cron expression for custom patterns
    };
}

export interface Relationship {
    sourceId: string;
    targetId: string;
    type: RelationType;
    strength: number;  // 0-1 indicating relationship strength
    metadata: Record<string, unknown>;
    created: Date;
    updated: Date;
    temporal?: {
        order: number;  // Position in sequence
        timeWindow?: TimeWindow;
        maxDuration?: number;  // Maximum allowed duration
        dependencies?: string[];  // IDs of nodes that must complete first
    };
}

export interface KnowledgeNode {
    id: string;
    type: NodeType;
    content: {
        title: string;
        description: string;
        data: Record<string, unknown>;
        workflow?: {
            timeWindow?: TimeWindow;
            estimatedDuration?: number;
            requiredResources?: string[];
            successCriteria?: string[];
            errorHandling?: string[];
        };
    };
    metadata: {
        created: Date;
        updated: Date;
        version: number;
        confidence: number;  // 0-1 indicating confidence in this knowledge
        source: string;
        tags: string[];
        frequency?: number;  // How often this node is involved in workflows
        importance?: number;  // 0-1 indicating critical path significance
        reliability?: number;  // 0-1 indicating success rate
    };
    relationships: Relationship[];
    vector?: number[];  // Optional embedding vector
}

export interface QueryParams {
    type?: NodeType[];
    tags?: string[];
    dateRange?: {
        start: Date;
        end: Date;
    };
    confidence?: {
        min: number;
        max: number;
    };
    relationshipType?: RelationType;
    patternType?: PatternType;
    timeWindow?: TimeWindow;
    limit?: number;
    offset?: number;
}

export interface GraphStats {
    totalNodes: number;
    nodesByType: Record<NodeType, number>;
    totalRelationships: number;
    relationshipsByType: Record<RelationType, number>;
    averageConfidence: number;
    lastUpdated: Date;
    workflowMetrics: {
        averageDuration: number;
        successRate: number;
        bottlenecks: string[];  // Node IDs of common bottlenecks
        criticalPaths: Array<{
            path: string[];  // Node IDs in the critical path
            frequency: number;
        }>;
    };
}

export interface Pattern {
    type: PatternType;
    description: string;
    confidence: number;
    relatedNodes: string[];
    frequency: number;
    impact: number;  // 0-1 indicating pattern's impact on workflow
    temporal?: {
        averageDuration: number;
        variability: number;  // Standard deviation of duration
        timeWindows: TimeWindow[];
    };
    optimization?: {
        potentialGain: number;  // Estimated improvement
        riskLevel: number;  // 0-1 risk assessment
        prerequisites: string[];  // Required changes
    };
}

export interface Analysis {
    patterns: Pattern[];
    insights: {
        type: string;
        description: string;
        importance: number;
        actionable: boolean;
        suggestedActions?: string[];
        impact?: {
            timeReduction?: number;
            qualityImprovement?: number;
            resourceOptimization?: number;
        };
    }[];
    metrics: {
        name: string;
        value: number;
        trend: 'increasing' | 'decreasing' | 'stable';
        context?: {
            historical: number[];
            benchmark?: number;
            goal?: number;
        };
    }[];
    workflowAnalysis?: {
        efficiency: number;
        bottlenecks: string[];
        suggestions: string[];
        timeline: {
            optimal: number;
            actual: number;
            variance: number;
        };
    };
}

export interface GraphValidation {
    isValid: boolean;
    errors: {
        type: string;
        message: string;
        nodeId?: string;
        relationshipIds?: string[];
        severity: 'critical' | 'major' | 'minor';
        impact?: string[];
    }[];
    warnings: {
        type: string;
        message: string;
        suggestion?: string;
        affectedNodes?: string[];
    }[];
}

export interface GraphOperation<T> {
    validate(): Promise<GraphValidation>;
    execute(): Promise<T>;
    rollback(): Promise<void>;
}

export interface GraphService {
    // Node operations
    addNode(node: KnowledgeNode): Promise<void>;
    updateNode(id: string, updates: Partial<KnowledgeNode>): Promise<void>;
    deleteNode(id: string): Promise<void>;
    getNode(id: string): Promise<KnowledgeNode>;

    // Relationship operations
    addRelationship(relationship: Relationship): Promise<void>;
    updateRelationship(sourceId: string, targetId: string, updates: Partial<Relationship>): Promise<void>;
    deleteRelationship(sourceId: string, targetId: string): Promise<void>;

    // Query operations
    query(params: QueryParams): Promise<KnowledgeNode[]>;
    findRelated(nodeId: string, params?: QueryParams): Promise<KnowledgeNode[]>;
    findPatterns(params?: QueryParams): Promise<Analysis>;

    // Analysis operations
    analyze(nodeId: string): Promise<Analysis>;
    validateGraph(): Promise<GraphValidation>;
    getStats(): Promise<GraphStats>;

    // Batch operations
    batchAddNodes(nodes: KnowledgeNode[]): Promise<void>;
    batchAddRelationships(relationships: Relationship[]): Promise<void>;

    // Learning operations
    learn(analysis: Analysis): Promise<void>;
    improveNode(nodeId: string, improvements: Partial<KnowledgeNode>): Promise<void>;
    suggestImprovements(nodeId: string): Promise<Analysis>;

    // Workflow operations
    findWorkflowPatterns(nodeId: string): Promise<Pattern[]>;
    analyzeWorkflowEfficiency(nodeId: string): Promise<Analysis>;
    optimizeWorkflow(nodeId: string): Promise<Analysis>;
    predictWorkflowOutcome(nodeId: string): Promise<Analysis>;
}
