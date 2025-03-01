import { Pattern } from '../types/patterns';
import { EventBus } from './event-bus.service';

export class PatternRepository {
  private static instance: PatternRepository;
  private patterns: Map<string, Pattern[]>;
  private eventBus: EventBus;

  private constructor() {
    this.patterns = new Map();
    this.eventBus = EventBus.getInstance();
  }

  public static getInstance(): PatternRepository {
    if (!PatternRepository.instance) {
      PatternRepository.instance = new PatternRepository();
    }
    return PatternRepository.instance;
  }

  public async savePattern(pattern: Pattern): Promise<void> {
    const history = this.patterns.get(pattern.id) || [];
    history.push({ ...pattern, timestamp: new Date() });
    this.patterns.set(pattern.id, history);
    await this.eventBus.emit('pattern:saved', pattern);
  }

  public async getPattern(id: string): Promise<Pattern | null> {
    const history = this.patterns.get(id);
    return history ? history[history.length - 1] : null;
  }

  public async getPatternHistory(id: string): Promise<Pattern[]> {
    return this.patterns.get(id) || [];
  }

  public async getAllPatterns(): Promise<Pattern[]> {
    const allPatterns: Pattern[] = [];
    for (const history of this.patterns.values()) {
      if (history.length > 0) {
        allPatterns.push(history[history.length - 1]);
      }
    }
    return allPatterns;
  }

  public async searchPatterns(query: {
    type?: string;
    confidence?: number;
    impact?: number;
    tags?: string[];
  }): Promise<Pattern[]> {
    const patterns = await this.getAllPatterns();
    return patterns.filter(pattern => {
      if (query.type && pattern.type !== query.type) return false;
      if (query.confidence && pattern.confidence < query.confidence) return false;
      if (query.impact && pattern.impact < query.impact) return false;
      if (query.tags && !query.tags.every(tag => pattern.tags?.includes(tag))) return false;
      return true;
    });
  }

  public async deletePattern(id: string): Promise<void> {
    const pattern = await this.getPattern(id);
    if (pattern) {
      this.patterns.delete(id);
      await this.eventBus.emit('pattern:deleted', pattern);
    }
  }

  public async clearPatterns(): Promise<void> {
    this.patterns.clear();
    await this.eventBus.emit('patterns:cleared', null);
  }

  public async getPatternsByType(type: string): Promise<Pattern[]> {
    const patterns = await this.getAllPatterns();
    return patterns.filter(pattern => pattern.type === type);
  }

  public async getPatternsByConfidence(minConfidence: number): Promise<Pattern[]> {
    const patterns = await this.getAllPatterns();
    return patterns.filter(pattern => pattern.confidence >= minConfidence);
  }

  public async getPatternsByImpact(minImpact: number): Promise<Pattern[]> {
    const patterns = await this.getAllPatterns();
    return patterns.filter(pattern => pattern.impact >= minImpact);
  }

  public async getPatternsByTags(tags: string[]): Promise<Pattern[]> {
    const patterns = await this.getAllPatterns();
    return patterns.filter(pattern =>
      tags.every(tag => pattern.tags?.includes(tag))
    );
  }

  public async getRelatedPatterns(pattern: Pattern): Promise<Pattern[]> {
    const patterns = await this.getAllPatterns();
    return patterns.filter(p =>
      p.id !== pattern.id &&
      (
        p.type === pattern.type ||
        p.tags?.some(tag => pattern.tags?.includes(tag)) ||
        Math.abs(p.confidence - pattern.confidence) < 0.2
      )
    );
  }

  public async getPatternStats(): Promise<{
    total: number;
    byType: { [key: string]: number };
    averageConfidence: number;
    averageImpact: number;
  }> {
    const patterns = await this.getAllPatterns();
    const byType: { [key: string]: number } = {};
    let totalConfidence = 0;
    let totalImpact = 0;

    patterns.forEach(pattern => {
      byType[pattern.type] = (byType[pattern.type] || 0) + 1;
      totalConfidence += pattern.confidence;
      totalImpact += pattern.impact;
    });

    return {
      total: patterns.length,
      byType,
      averageConfidence: patterns.length ? totalConfidence / patterns.length : 0,
      averageImpact: patterns.length ? totalImpact / patterns.length : 0,
    };
  }
}
