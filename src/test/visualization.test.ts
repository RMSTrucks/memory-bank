import { VisualizationService } from '../services/visualization.service';
import { SVGRenderer } from '../services/renderers/svg-renderer';
import { ForceLayout } from '../services/layouts/force-layout';
import { D3InteractionHandler } from '../services/handlers/interaction-handler';
import { KnowledgeNode, Relationship } from '../types/knowledge';
import { VisualizationOptions } from '../types/visualization';

describe('Visualization System', () => {
    let container: HTMLElement;
    let service: VisualizationService;
    let options: VisualizationOptions;

    beforeEach(() => {
        // Create container
        container = document.createElement('div');
        container.style.width = '900px';
        container.style.height = '600px';
        document.body.appendChild(container);

        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        container.appendChild(svg);

        // Create main group
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        svg.appendChild(group);

        // Initialize options
        options = {
            layout: 'force',
            renderer: 'svg',
            theme: 'light',
            dimensions: {
                width: 900,
                height: 600
            }
        };

        // Initialize service
        service = new VisualizationService(
            new SVGRenderer(),
            new ForceLayout(),
            new D3InteractionHandler(),
            options
        );
        service.initialize(container);
    });

    afterEach(() => {
        service.destroy();
        document.body.removeChild(container);
    });

    it('should render nodes and relationships', async () => {
        // Sample data
        const nodes: KnowledgeNode[] = [
            {
                id: '1',
                type: 'concept',
                content: {
                    title: 'Node 1',
                    description: 'Test node 1',
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
            },
            {
                id: '2',
                type: 'task',
                content: {
                    title: 'Node 2',
                    description: 'Test node 2',
                    data: {}
                },
                metadata: {
                    created: new Date(),
                    updated: new Date(),
                    version: 1,
                    confidence: 0.9,
                    source: 'test',
                    tags: ['test']
                },
                relationships: []
            }
        ];

        const relationships: Relationship[] = [
            {
                sourceId: '1',
                targetId: '2',
                type: 'related',
                strength: 0.8,
                metadata: {},
                created: new Date(),
                updated: new Date()
            }
        ];

        // Render graph
        await service.render(nodes, relationships);

        // Verify nodes are rendered
        const renderedNodes = container.querySelectorAll('g.node');
        expect(renderedNodes.length).toBe(2);

        // Verify relationships are rendered
        const renderedLinks = container.querySelectorAll('line');
        expect(renderedLinks.length).toBe(1);
    });

    it('should handle node selection', async () => {
        // Sample data
        const node: KnowledgeNode = {
            id: '1',
            type: 'concept',
            content: {
                title: 'Test Node',
                description: 'Test description',
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

        // Add node
        service.onNodeAdded(node);

        // Select node
        const nodeElement = container.querySelector('g.node');
        nodeElement?.dispatchEvent(new MouseEvent('click'));

        // Verify node is selected
        const circle = nodeElement?.querySelector('circle');
        expect(circle?.getAttribute('stroke')).toBe('#f6e05e');
    });

    it('should handle node dragging', async () => {
        // Sample data
        const node: KnowledgeNode = {
            id: '1',
            type: 'concept',
            content: {
                title: 'Test Node',
                description: 'Test description',
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

        // Add node
        service.onNodeAdded(node);

        // Enable drag
        service.enableDrag();

        // Simulate drag
        const nodeElement = container.querySelector('g.node');
        const dragStart = new MouseEvent('mousedown', { clientX: 0, clientY: 0 });
        const drag = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
        const dragEnd = new MouseEvent('mouseup');

        nodeElement?.dispatchEvent(dragStart);
        document.dispatchEvent(drag);
        document.dispatchEvent(dragEnd);

        // Verify node position
        const transform = nodeElement?.getAttribute('transform');
        expect(transform).toContain('translate');
    });
});
