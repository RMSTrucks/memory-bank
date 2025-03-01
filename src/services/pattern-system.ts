import {
    Pattern,
    PatternType,
    PatternQuery,
    PatternAnalysis,
    PatternResult
} from '../types/patterns';

import { PatternDetectionService } from './pattern-detection.service';
import { PatternMatcherService } from './pattern-matcher.service';
import { PatternLearnerService } from './pattern-learner.service';
import { PatternOptimizerService } from './pattern-optimizer.service';
import { PatternRepositoryService } from './pattern-repository.service';

export class PatternSystem {
    private detector: PatternDetectionService;
    private matcher: PatternMatcherService;
    private learner: PatternLearnerService;
    private optimizer: PatternOptimizerService;
    private repository: PatternRepositoryService;

    constructor() {
        this.matcher = new PatternMatcherService();
        this.learner = new PatternLearnerService();
        this.optimizer = new PatternOptimizerService();
        this.repository = new PatternRepositoryService();
        this.detector = new PatternDetectionService(
            this.matcher,
            this.learner,
            this.optimizer,
            this.repository
        );
    }

    // Pattern Detection
    public async detectPatterns(data: unknown): Promise<Pattern[]> {
        return this.detector.detect(data);
    }

    public async analyzePattern(pattern: Pattern): Promise<PatternAnalysis> {
        return this.detector.analyze(pattern);
    }

    public async learnFromResult(result: PatternResult): Promise<void> {
        await this.detector.learn(result);
    }

    public async suggestPatterns(context: unknown): Promise<Pattern[]> {
        return this.detector.suggest(context);
    }

    // Pattern Storage
    public async savePattern(pattern: Pattern): Promise<void> {
        await this.repository.save(pattern);
    }

    public async getPattern(id: string): Promise<Pattern> {
        return this.repository.get(id);
    }

    public async findPatterns(query: PatternQuery): Promise<Pattern[]> {
        return this.repository.find(query);
    }

    public async deletePattern(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    // Pattern Analysis
    public async findRelatedPatterns(pattern: Pattern): Promise<Pattern[]> {
        return this.repository.findRelated(pattern);
    }

    public async findSimilarPatterns(pattern: Pattern): Promise<Pattern[]> {
        return this.repository.findSimilar(pattern);
    }

    public async findPatternsByType(type: PatternType): Promise<Pattern[]> {
        return this.repository.findByType(type);
    }

    public async findPatternsByTags(tags: string[]): Promise<Pattern[]> {
        return this.repository.findByTags(tags);
    }

    public async findPatternsByDateRange(start: Date, end: Date): Promise<Pattern[]> {
        return this.repository.findByDateRange(start, end);
    }

    public async findPatternsByConfidence(min: number, max: number): Promise<Pattern[]> {
        return this.repository.findByConfidence(min, max);
    }

    public async findPatternsByImpact(min: number, max: number): Promise<Pattern[]> {
        return this.repository.findByImpact(min, max);
    }

    public async findPatternsByFrequency(min: number, max: number): Promise<Pattern[]> {
        return this.repository.findByFrequency(min, max);
    }

    public async findPatternsByEvolution(trend: 'improving' | 'declining'): Promise<Pattern[]> {
        return this.repository.findByEvolution(trend);
    }

    public async findTopPatterns(limit?: number): Promise<Pattern[]> {
        return this.repository.findTopPatterns(limit);
    }

    public async findRecentPatterns(days?: number): Promise<Pattern[]> {
        return this.repository.findRecentPatterns(days);
    }

    // Pattern Optimization
    public async optimizePattern(pattern: Pattern): Promise<Pattern> {
        return this.optimizer.optimize(pattern);
    }

    public async validatePattern(pattern: Pattern): Promise<boolean> {
        return this.optimizer.validate(pattern);
    }

    public async getPatternSuggestions(pattern: Pattern): Promise<string[]> {
        return this.optimizer.suggest(pattern);
    }

    // Pattern Learning
    public async improvePattern(pattern: Pattern): Promise<Pattern> {
        return this.learner.improve(pattern);
    }

    public async evolvePattern(pattern: Pattern): Promise<Pattern> {
        return this.learner.evolve(pattern);
    }

    // System Stats
    public async getSystemStats(): Promise<{
        total: number;
        byType: Record<PatternType, number>;
        averageConfidence: number;
        averageImpact: number;
    }> {
        return this.repository.getStats();
    }
}

// Export individual services for direct access if needed
export {
    PatternDetectionService,
    PatternMatcherService,
    PatternLearnerService,
    PatternOptimizerService,
    PatternRepositoryService
};
