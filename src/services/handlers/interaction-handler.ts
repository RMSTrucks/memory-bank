import * as d3 from 'd3';
import {
    InteractionHandler,
    Renderer,
    VisualizationOptions,
    VisualizationNode,
    VisualizationLink
} from '../../types/visualization';

export class D3InteractionHandler implements InteractionHandler {
    private renderer!: Renderer;
    private options!: VisualizationOptions;
    private svg!: d3.Selection<SVGSVGElement, unknown, d3.BaseType, unknown>;
    private zoom!: d3.ZoomBehavior<SVGSVGElement, unknown>;
    private mainGroup!: d3.Selection<SVGGElement, unknown, d3.BaseType, unknown>;
    private selectedNode: string | null = null;

    constructor() {
        // Properties will be initialized in initialize()
    }

    private getNodeSelection(): d3.Selection<SVGGElement, VisualizationNode, d3.BaseType, unknown> {
        return this.mainGroup.selectAll<SVGGElement, VisualizationNode>('g.node');
    }

    private getLinkSelection(): d3.Selection<SVGLineElement, VisualizationLink, d3.BaseType, unknown> {
        return this.mainGroup.selectAll<SVGLineElement, VisualizationLink>('line');
    }

    public initialize(renderer: Renderer, options: VisualizationOptions): void {
        this.renderer = renderer;
        this.options = options;

        // Get SVG element from renderer
        this.svg = d3.select<SVGSVGElement, unknown>('svg');
        this.mainGroup = this.svg.select<SVGGElement>('g')
            .attr('class', 'main-group');

        // Initialize zoom behavior
        this.zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.mainGroup.attr('transform', event.transform);
            });

        // Initialize event listeners
        this.setupEventListeners();
    }

    public enableZoom(): void {
        this.svg.call(this.zoom);
    }

    public disableZoom(): void {
        this.svg.on('.zoom', null);
    }

    public enableDrag(): void {
        const dragBehavior = d3.drag<SVGGElement, VisualizationNode>()
            .on('start', this.dragStarted.bind(this))
            .on('drag', this.dragged.bind(this))
            .on('end', this.dragEnded.bind(this));

        this.getNodeSelection().call(dragBehavior);
    }

    public disableDrag(): void {
        this.mainGroup.selectAll('g.node')
            .on('.drag', null);
    }

    public selectNode(nodeId: string): void {
        // Reset previous selection
        this.mainGroup.selectAll('circle')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        this.mainGroup.selectAll('line')
            .attr('stroke-opacity', 0.6);

        // Highlight selected node
        const selectedNode = this.mainGroup.selectAll<SVGGElement, VisualizationNode>('g')
            .filter(d => d.id === nodeId);

        selectedNode.select('circle')
            .attr('stroke', this.options.theme === 'light' ? '#f6e05e' : '#ecc94b')
            .attr('stroke-width', 4);

        this.selectedNode = nodeId;
        this.highlightRelationships(nodeId);
    }

    public highlightRelationships(nodeId: string): void {
        // Reset all relationships
        const linkSelection = this.getLinkSelection();

        linkSelection
            .attr('stroke-opacity', 0.2)
            .attr('stroke-width', d => d.width);

        // Highlight connected relationships
        linkSelection
            .filter(d => d.source === nodeId || d.target === nodeId)
            .attr('stroke-opacity', 1)
            .attr('stroke-width', d => d.width * 2);
    }

    public clearSelection(): void {
        this.selectedNode = null;

        // Reset node styles
        this.mainGroup.selectAll('circle')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        // Reset relationship styles
        this.getLinkSelection()
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', d => d.width);
    }

    public destroy(): void {
        // Remove event listeners
        this.svg.on('.zoom', null);
        this.getNodeSelection()
            .on('.drag', null)
            .on('click', null)
            .on('mouseover', null)
            .on('mouseout', null);
    }

    private setupEventListeners(): void {
        const nodeSelection = this.getNodeSelection();

        // Node click handler
        nodeSelection.on('click', (event: MouseEvent, d: VisualizationNode) => {
            event.stopPropagation();
            if (this.selectedNode === d.id) {
                this.clearSelection();
            } else {
                this.selectNode(d.id);
            }
        });

        // Node hover effects
        nodeSelection.on('mouseover', (event: MouseEvent, d: VisualizationNode) => {
            if (this.selectedNode !== d.id) {
                this.highlightRelationships(d.id);
            }
        });

        nodeSelection.on('mouseout', (event: MouseEvent, d: VisualizationNode) => {
            if (this.selectedNode !== d.id) {
                this.clearSelection();
                if (this.selectedNode) {
                    this.selectNode(this.selectedNode);
                }
            }
        });

        // Background click handler
        this.svg.on('click', () => {
            this.clearSelection();
        });
    }

    private dragStarted(event: d3.D3DragEvent<SVGGElement, VisualizationNode, unknown>): void {
        if (!event.active) {
            // Notify renderer to restart force simulation
            this.renderer.draw({
                nodes: this.getNodeSelection().data(),
                links: this.getLinkSelection().data()
            });
        }
    }

    private dragged(event: d3.D3DragEvent<SVGGElement, VisualizationNode, unknown>, d: VisualizationNode): void {
        d.x = event.x;
        d.y = event.y;
        d3.select<SVGGElement, VisualizationNode>(event.sourceEvent.target.parentNode)
            .attr('transform', `translate(${event.x},${event.y})`);
    }

    private dragEnded(event: d3.D3DragEvent<SVGGElement, VisualizationNode, unknown>): void {
        if (!event.active) {
            // Notify renderer to stop force simulation
            this.renderer.draw({
                nodes: this.getNodeSelection().data(),
                links: this.getLinkSelection().data()
            });
        }
    }
}
