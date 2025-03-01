import * as d3 from 'd3';
import {
    Renderer,
    VisualizationOptions,
    VisualizationData,
    VisualizationNode,
    VisualizationLink,
    Dimensions
} from '../../types/visualization';

export class SVGRenderer implements Renderer {
    private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    private container!: HTMLElement;
    private options!: VisualizationOptions;
    private simulation!: d3.Simulation<VisualizationNode, VisualizationLink>;
    private zoom!: d3.ZoomBehavior<SVGSVGElement, unknown>;
    private mainGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;

    constructor() {
        // Properties will be initialized in initialize()
    }

    public initialize(container: HTMLElement, options: VisualizationOptions): void {
        this.container = container;
        this.options = options;

        // Create SVG element
        this.svg = d3.select(container)
            .append('svg')
            .attr('width', options.dimensions.width)
            .attr('height', options.dimensions.height)
            .style('background-color', options.theme === 'light' ? '#ffffff' : '#1a202c');

        // Create main group for zoom/pan
        this.mainGroup = this.svg.append('g');

        // Initialize zoom behavior
        this.zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.mainGroup.attr('transform', event.transform);
            });

        this.svg.call(this.zoom);

        // Initialize force simulation
        this.simulation = d3.forceSimulation<VisualizationNode, VisualizationLink>()
            .force('link', d3.forceLink<VisualizationNode, VisualizationLink>()
                .id(d => d.id)
                .distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(options.dimensions.width / 2, options.dimensions.height / 2))
            .force('collision', d3.forceCollide().radius(d => (d as VisualizationNode).radius + 5));
    }

    public draw(data: VisualizationData): void {
        // Clear previous content
        this.mainGroup.selectAll('*').remove();

        // Create arrow marker for relationships
        this.svg.append('defs').selectAll('marker')
            .data(['end'])
            .enter().append('marker')
            .attr('id', String)
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 25)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#999');

        // Draw relationships
        const links = this.mainGroup.append('g')
            .selectAll('line')
            .data(data.links)
            .enter().append('line')
            .attr('stroke', d => d.color)
            .attr('stroke-width', d => d.width)
            .attr('marker-end', 'url(#end)');

        // Draw nodes
        const nodes = this.mainGroup.append('g')
            .selectAll('g')
            .data(data.nodes)
            .enter().append('g')
            .call(d3.drag<SVGGElement, VisualizationNode>()
                .on('start', this.dragStarted.bind(this))
                .on('drag', this.dragged.bind(this))
                .on('end', this.dragEnded.bind(this)));

        // Add circles for nodes
        nodes.append('circle')
            .attr('r', d => d.radius)
            .attr('fill', d => d.color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        // Add labels
        nodes.append('text')
            .attr('dy', 4)
            .attr('text-anchor', 'middle')
            .text(d => d.label)
            .attr('fill', this.options.theme === 'light' ? '#1a202c' : '#f7fafc')
            .style('font-size', '12px')
            .style('pointer-events', 'none');

        // Update simulation
        this.simulation
            .nodes(data.nodes)
            .on('tick', () => {
                links
                    .attr('x1', d => {
                        const source = typeof d.source === 'string' ? data.nodes.find(n => n.id === d.source) : d.source as VisualizationNode;
                        return source?.x || 0;
                    })
                    .attr('y1', d => {
                        const source = typeof d.source === 'string' ? data.nodes.find(n => n.id === d.source) : d.source as VisualizationNode;
                        return source?.y || 0;
                    })
                    .attr('x2', d => {
                        const target = typeof d.target === 'string' ? data.nodes.find(n => n.id === d.target) : d.target as VisualizationNode;
                        return target?.x || 0;
                    })
                    .attr('y2', d => {
                        const target = typeof d.target === 'string' ? data.nodes.find(n => n.id === d.target) : d.target as VisualizationNode;
                        return target?.y || 0;
                    });

                nodes
                    .attr('transform', d => `translate(${d.x},${d.y})`);
            });

        (this.simulation.force('link') as d3.ForceLink<VisualizationNode, VisualizationLink>)
            .links(data.links);

        this.simulation.alpha(1).restart();
    }

    public clear(): void {
        this.mainGroup.selectAll('*').remove();
    }

    public resize(dimensions: Dimensions): void {
        this.svg
            .attr('width', dimensions.width)
            .attr('height', dimensions.height);

        (this.simulation.force('center') as d3.ForceCenter<VisualizationNode>)
            .x(dimensions.width / 2)
            .y(dimensions.height / 2);

        this.simulation.alpha(1).restart();
    }

    public destroy(): void {
        this.simulation.stop();
        this.svg.remove();
    }

    private dragStarted(event: d3.D3DragEvent<SVGGElement, VisualizationNode, unknown>, d: VisualizationNode): void {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    private dragged(event: d3.D3DragEvent<SVGGElement, VisualizationNode, unknown>, d: VisualizationNode): void {
        d.fx = event.x;
        d.fy = event.y;
    }

    private dragEnded(event: d3.D3DragEvent<SVGGElement, VisualizationNode, unknown>, d: VisualizationNode): void {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}
