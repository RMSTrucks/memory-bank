import * as d3 from 'd3';
import {
    Layout,
    VisualizationOptions,
    VisualizationNode,
    VisualizationLink,
    LayoutResult,
    PositionChanges
} from '../../types/visualization';
import { KnowledgeNode, Relationship } from '../../types/knowledge';

export class ForceLayout implements Layout {
    private options!: VisualizationOptions;
    private simulation!: d3.Simulation<VisualizationNode, VisualizationLink>;

    constructor() {
        // Properties will be initialized in initialize()
    }

    public initialize(options: VisualizationOptions): void {
        this.options = options;

        // Initialize force simulation
        this.simulation = d3.forceSimulation<VisualizationNode, VisualizationLink>()
            .force('link', d3.forceLink<VisualizationNode, VisualizationLink>()
                .id(d => d.id)
                .distance(d => 100 + (1 - d.strength) * 100))
            .force('charge', d3.forceManyBody()
                .strength(d => -300 - ((d as VisualizationNode).radius * 10)))
            .force('center', d3.forceCenter(
                options.dimensions.width / 2,
                options.dimensions.height / 2
            ))
            .force('collision', d3.forceCollide()
                .radius(d => (d as VisualizationNode).radius + 10))
            .force('x', d3.forceX(options.dimensions.width / 2)
                .strength(0.1))
            .force('y', d3.forceY(options.dimensions.height / 2)
                .strength(0.1));
    }

    public async calculate(
        nodes: KnowledgeNode[],
        relationships: Relationship[]
    ): Promise<LayoutResult> {
        // Transform knowledge nodes to visualization nodes
        const visualNodes = this.transformNodes(nodes);
        const visualLinks = this.transformRelationships(relationships, visualNodes);

        return new Promise((resolve) => {
            // Configure simulation
            this.simulation
                .nodes(visualNodes)
                .force('link', d3.forceLink<VisualizationNode, VisualizationLink>(visualLinks)
                    .id(d => d.id)
                    .distance(d => 100 + (1 - d.strength) * 100));

            // Run simulation
            this.simulation
                .alpha(1)
                .restart();

            // Resolve when simulation has cooled down
            this.simulation.on('end', () => {
                resolve({
                    nodes: visualNodes,
                    links: visualLinks
                });
            });
        });
    }

    public updatePositions(changes: PositionChanges[]): void {
        // Update node positions in the simulation
        const nodes = this.simulation.nodes();
        changes.forEach(change => {
            const node = nodes.find(n => n.id === change.nodeId);
            if (node) {
                node.x = change.x;
                node.y = change.y;
                node.fx = change.x; // Fix position temporarily
                node.fy = change.y;

                // Release fixed position after a short delay
                setTimeout(() => {
                    node.fx = null;
                    node.fy = null;
                }, 2000);
            }
        });

        // Restart simulation with low alpha
        this.simulation.alpha(0.3).restart();
    }

    public destroy(): void {
        if (this.simulation) {
            this.simulation.stop();
        }
    }

    private transformNodes(nodes: KnowledgeNode[]): VisualizationNode[] {
        return nodes.map(node => ({
            id: node.id,
            type: node.type,
            label: node.content.title,
            confidence: node.metadata.confidence,
            radius: this.calculateNodeRadius(node),
            color: this.getNodeColor(node),
            x: undefined,
            y: undefined
        }));
    }

    private transformRelationships(
        relationships: Relationship[],
        nodes: VisualizationNode[]
    ): VisualizationLink[] {
        return relationships.map(rel => ({
            id: `${rel.sourceId}-${rel.targetId}`,
            source: rel.sourceId,
            target: rel.targetId,
            type: rel.type,
            strength: rel.strength,
            color: this.getRelationshipColor(rel),
            width: this.calculateLinkWidth(rel)
        }));
    }

    private calculateNodeRadius(node: KnowledgeNode): number {
        // Base size on number of relationships and confidence
        const baseSize = 10;
        const relationshipFactor = Math.sqrt(node.relationships.length) * 2;
        const confidenceFactor = node.metadata.confidence * 5;
        return baseSize + relationshipFactor + confidenceFactor;
    }

    private calculateLinkWidth(relationship: Relationship): number {
        // Base width on relationship strength
        return 1 + (relationship.strength * 3);
    }

    private getNodeColor(node: KnowledgeNode): string {
        // This would normally come from a theme service
        const colors: { [key: string]: string } = {
            concept: '#4299e1',
            task: '#48bb78',
            learning: '#ed8936',
            pattern: '#9f7aea',
            improvement: '#f56565'
        };
        return colors[node.type] || '#718096';
    }

    private getRelationshipColor(relationship: Relationship): string {
        // This would normally come from a theme service
        const colors: { [key: string]: string } = {
            related: '#718096',
            depends_on: '#4a5568',
            improves: '#48bb78',
            implements: '#4299e1',
            derives_from: '#9f7aea'
        };
        return colors[relationship.type] || '#cbd5e0';
    }
}
