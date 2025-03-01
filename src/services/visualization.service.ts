import {
    VisualizationOptions,
    VisualizationData,
    VisualizationNode,
    VisualizationLink,
    Renderer,
    Layout,
    InteractionHandler,
    GraphVisualization,
    AnalysisVisualization,
    VisualizationTheme,
    Theme,
    GraphChanges
} from '../types/visualization';
import { KnowledgeNode, Relationship, Analysis } from '../types/knowledge';

const DEFAULT_THEMES: Record<Theme, VisualizationTheme> = {
    light: {
        background: '#ffffff',
        nodeColors: {
            concept: '#4299e1',
            task: '#48bb78',
            learning: '#ed8936',
            pattern: '#9f7aea',
            improvement: '#f56565'
        },
        relationshipColors: {
            related: '#718096',
            depends_on: '#4a5568',
            improves: '#48bb78',
            implements: '#4299e1',
            derives_from: '#9f7aea'
        },
        text: {
            primary: '#1a202c',
            secondary: '#4a5568'
        },
        selection: {
            node: '#f6e05e',
            relationship: '#ecc94b'
        },
        confidence: {
            high: '#48bb78',
            medium: '#ed8936',
            low: '#f56565'
        }
    },
    dark: {
        background: '#1a202c',
        nodeColors: {
            concept: '#63b3ed',
            task: '#68d391',
            learning: '#f6ad55',
            pattern: '#b794f4',
            improvement: '#fc8181'
        },
        relationshipColors: {
            related: '#a0aec0',
            depends_on: '#cbd5e0',
            improves: '#68d391',
            implements: '#63b3ed',
            derives_from: '#b794f4'
        },
        text: {
            primary: '#f7fafc',
            secondary: '#e2e8f0'
        },
        selection: {
            node: '#ecc94b',
            relationship: '#d69e2e'
        },
        confidence: {
            high: '#68d391',
            medium: '#f6ad55',
            low: '#fc8181'
        }
    }
};

export class VisualizationService implements GraphVisualization, AnalysisVisualization {
    private renderer: Renderer;
    private layout: Layout;
    private interactionHandler: InteractionHandler;
    private options: VisualizationOptions;
    private data: VisualizationData = { nodes: [], links: [] };
    private container: HTMLElement | null = null;
    private theme: VisualizationTheme;

    constructor(
        renderer: Renderer,
        layout: Layout,
        interactionHandler: InteractionHandler,
        options: VisualizationOptions
    ) {
        this.renderer = renderer;
        this.layout = layout;
        this.interactionHandler = interactionHandler;
        this.options = options;
        this.theme = DEFAULT_THEMES[options.theme];
    }

    public initialize(container: HTMLElement): void {
        this.container = container;
        this.renderer.initialize(container, this.options);
        this.layout.initialize(this.options);
        this.interactionHandler.initialize(this.renderer, this.options);
    }

    public async render(nodes: KnowledgeNode[], relationships: Relationship[]): Promise<void> {
        const layoutResult = await this.layout.calculate(nodes, relationships);
        this.data = layoutResult;
        this.renderer.draw(this.data);
    }

    public update(changes: GraphChanges): void {
        // Update data structure
        if (changes.removed.nodeIds.length > 0) {
            this.data.nodes = this.data.nodes.filter(
                node => !changes.removed.nodeIds.includes(node.id)
            );
        }

        if (changes.removed.relationshipIds.length > 0) {
            this.data.links = this.data.links.filter(
                link => !changes.removed.relationshipIds.includes(link.id as string)
            );
        }

        // Transform and add new nodes
        const newNodes = this.transformNodes(changes.added.nodes);
        const updatedNodes = this.transformNodes(changes.updated.nodes);

        this.data.nodes = [
            ...this.data.nodes.filter(n => !updatedNodes.some(un => un.id === n.id)),
            ...newNodes,
            ...updatedNodes
        ];

        // Transform and add new relationships
        const newLinks = this.transformRelationships(changes.added.relationships);
        const updatedLinks = this.transformRelationships(changes.updated.relationships);

        this.data.links = [
            ...this.data.links.filter(l => !updatedLinks.some(ul => ul.id === l.id)),
            ...newLinks,
            ...updatedLinks
        ];

        // Update layout and redraw
        this.layout.updatePositions(
            this.data.nodes.map(node => ({
                nodeId: node.id,
                x: node.x || 0,
                y: node.y || 0
            }))
        );
        this.renderer.draw(this.data);
    }

    // GraphVisualization Implementation
    public onNodeAdded(node: KnowledgeNode): void {
        this.update({
            added: { nodes: [node], relationships: [] },
            updated: { nodes: [], relationships: [] },
            removed: { nodeIds: [], relationshipIds: [] }
        });
    }

    public onNodeUpdated(node: KnowledgeNode): void {
        this.update({
            added: { nodes: [], relationships: [] },
            updated: { nodes: [node], relationships: [] },
            removed: { nodeIds: [], relationshipIds: [] }
        });
    }

    public onRelationshipAdded(relationship: Relationship): void {
        this.update({
            added: { nodes: [], relationships: [relationship] },
            updated: { nodes: [], relationships: [] },
            removed: { nodeIds: [], relationshipIds: [] }
        });
    }

    public onPatternDetected(pattern: Analysis['patterns'][0]): void {
        this.highlightPattern(pattern);
    }

    // AnalysisVisualization Implementation
    public highlightPattern(pattern: Analysis['patterns'][0]): void {
        // Reset previous highlights
        this.data.nodes.forEach(node => {
            node.color = this.theme.nodeColors[node.type];
        });
        this.data.links.forEach(link => {
            link.color = this.theme.relationshipColors[link.type];
        });

        // Highlight nodes and relationships involved in the pattern
        pattern.relatedNodes.forEach(nodeId => {
            const node = this.data.nodes.find(n => n.id === nodeId);
            if (node) {
                node.color = this.theme.selection.node;
            }
        });

        this.renderer.draw(this.data);
    }

    public showMetrics(metrics: Analysis['metrics']): void {
        // Implementation will depend on how we want to display metrics
        console.log('Metrics:', metrics);
    }

    public displayInsights(insights: Analysis['insights']): void {
        // Implementation will depend on how we want to display insights
        console.log('Insights:', insights);
    }

    public enableDrag(): void {
        this.interactionHandler.enableDrag();
    }

    public disableDrag(): void {
        this.interactionHandler.disableDrag();
    }

    public destroy(): void {
        this.renderer.destroy();
        this.layout.destroy();
        this.interactionHandler.destroy();
        this.container = null;
    }

    private transformNodes(nodes: KnowledgeNode[]): VisualizationNode[] {
        return nodes.map(node => ({
            id: node.id,
            type: node.type,
            label: node.content.title,
            confidence: node.metadata.confidence,
            radius: 10 + (node.relationships.length * 2),
            color: this.theme.nodeColors[node.type],
            x: undefined,
            y: undefined
        }));
    }

    private transformRelationships(relationships: Relationship[]): VisualizationLink[] {
        return relationships.map(rel => ({
            id: `${rel.sourceId}-${rel.targetId}`,
            source: rel.sourceId,
            target: rel.targetId,
            type: rel.type,
            strength: rel.strength,
            color: this.theme.relationshipColors[rel.type],
            width: 1 + (rel.strength * 2)
        }));
    }
}
