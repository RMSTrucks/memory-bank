import { KnowledgeNode, Relationship, Analysis } from './knowledge';
import * as d3 from 'd3';

export type Theme = 'light' | 'dark';
export type LayoutType = 'force' | 'hierarchical';
export type RendererType = 'svg' | 'canvas';

export interface Dimensions {
    width: number;
    height: number;
}

export interface VisualizationOptions {
    layout: LayoutType;
    renderer: RendererType;
    theme: Theme;
    dimensions: Dimensions;
}

export interface VisualizationNode extends d3.SimulationNodeDatum {
    id: string;
    type: string;
    label: string;
    confidence: number;
    radius: number;
    color: string;
    x?: number;
    y?: number;
}

export interface VisualizationLink extends d3.SimulationLinkDatum<VisualizationNode> {
    id: string;
    source: string;
    target: string;
    type: string;
    strength: number;
    color: string;
    width: number;
}

export interface VisualizationData {
    nodes: VisualizationNode[];
    links: VisualizationLink[];
}

export interface LayoutResult {
    nodes: VisualizationNode[];
    links: VisualizationLink[];
}

export interface PositionChanges {
    nodeId: string;
    x: number;
    y: number;
}

export interface GraphChanges {
    added: {
        nodes: KnowledgeNode[];
        relationships: Relationship[];
    };
    updated: {
        nodes: KnowledgeNode[];
        relationships: Relationship[];
    };
    removed: {
        nodeIds: string[];
        relationshipIds: string[];
    };
}

export interface Renderer {
    initialize(container: HTMLElement, options: VisualizationOptions): void;
    draw(data: VisualizationData): void;
    clear(): void;
    resize(dimensions: Dimensions): void;
    destroy(): void;
}

export interface Layout {
    initialize(options: VisualizationOptions): void;
    calculate(nodes: KnowledgeNode[], relationships: Relationship[]): Promise<LayoutResult>;
    updatePositions(changes: PositionChanges[]): void;
    destroy(): void;
}

export interface InteractionHandler {
    initialize(renderer: Renderer, options: VisualizationOptions): void;
    enableZoom(): void;
    disableZoom(): void;
    enableDrag(): void;
    disableDrag(): void;
    selectNode(nodeId: string): void;
    highlightRelationships(nodeId: string): void;
    clearSelection(): void;
    destroy(): void;
}

export interface GraphVisualization {
    onNodeAdded(node: KnowledgeNode): void;
    onNodeUpdated(node: KnowledgeNode): void;
    onRelationshipAdded(relationship: Relationship): void;
    onPatternDetected(pattern: Analysis['patterns'][0]): void;
}

export interface AnalysisVisualization {
    highlightPattern(pattern: Analysis['patterns'][0]): void;
    showMetrics(metrics: Analysis['metrics']): void;
    displayInsights(insights: Analysis['insights']): void;
}

export interface VisualizationTheme {
    background: string;
    nodeColors: {
        [key: string]: string;
    };
    relationshipColors: {
        [key: string]: string;
    };
    text: {
        primary: string;
        secondary: string;
    };
    selection: {
        node: string;
        relationship: string;
    };
    confidence: {
        high: string;
        medium: string;
        low: string;
    };
}
