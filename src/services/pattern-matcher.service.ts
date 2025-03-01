import {
    Pattern,
    PatternMatcher,
    WorkflowPattern,
    CommandPattern,
    DocumentPattern,
    AutomationPattern,
    InteractionPattern,
    LearningPattern
} from '../types/patterns';

export class PatternMatcherService implements PatternMatcher {
    constructor() {}

    public async match(data: unknown, patterns: Pattern[]): Promise<Pattern[]> {
        try {
            const matches: Pattern[] = [];

            // Group patterns by type for specialized matching
            const patternsByType = this.groupPatternsByType(patterns);

            // Try each matcher based on data type
            if (Array.isArray(data)) {
                // Could be a workflow pattern
                const workflowPatterns = (patternsByType.workflow || []).filter(
                    (p): p is WorkflowPattern => p.type === 'workflow'
                );
                const workflowMatches = await this.matchWorkflowPatterns(
                    data,
                    workflowPatterns
                );
                matches.push(...workflowMatches);
            }

            if (typeof data === 'string') {
                // Could be a command or document pattern
                const commandPatterns = (patternsByType.command || []).filter(
                    (p): p is CommandPattern => p.type === 'command'
                );
                const documentPatterns = (patternsByType.document || []).filter(
                    (p): p is DocumentPattern => p.type === 'document'
                );
                const commandMatches = await this.matchCommandPatterns(
                    data,
                    commandPatterns
                );
                const documentMatches = await this.matchDocumentPatterns(
                    data,
                    documentPatterns
                );
                matches.push(...commandMatches, ...documentMatches);
            }

            if (typeof data === 'object' && data !== null) {
                // Could be an automation or interaction pattern
                const automationPatterns = (patternsByType.automation || []).filter(
                    (p): p is AutomationPattern => p.type === 'automation'
                );
                const interactionPatterns = (patternsByType.interaction || []).filter(
                    (p): p is InteractionPattern => p.type === 'interaction'
                );
                const automationMatches = await this.matchAutomationPatterns(
                    data,
                    automationPatterns
                );
                const interactionMatches = await this.matchInteractionPatterns(
                    data,
                    interactionPatterns
                );
                matches.push(...automationMatches, ...interactionMatches);
            }

            // Always check for learning patterns
            const learningPatterns = (patternsByType.learning || []).filter(
                (p): p is LearningPattern => p.type === 'learning'
            );
            const learningMatches = await this.matchLearningPatterns(
                data,
                learningPatterns
            );
            matches.push(...learningMatches);

            return matches;
        } catch (error) {
            console.error('Pattern matching error:', error);
            return [];
        }
    }

    public async score(data: unknown, pattern: Pattern): Promise<number> {
        try {
            switch (pattern.type) {
                case 'workflow':
                    return await this.scoreWorkflowPattern(data, pattern as WorkflowPattern);
                case 'command':
                    return await this.scoreCommandPattern(data, pattern as CommandPattern);
                case 'document':
                    return await this.scoreDocumentPattern(data, pattern as DocumentPattern);
                case 'automation':
                    return await this.scoreAutomationPattern(data, pattern as AutomationPattern);
                case 'interaction':
                    return await this.scoreInteractionPattern(data, pattern as InteractionPattern);
                case 'learning':
                    return await this.scoreLearningPattern(data, pattern as LearningPattern);
                default:
                    return 0;
            }
        } catch (error) {
            console.error('Pattern scoring error:', error);
            return 0;
        }
    }

    public async validate(pattern: Pattern): Promise<boolean> {
        try {
            // Basic validation
            if (!pattern.id || !pattern.type || !pattern.name) {
                return false;
            }

            // Validate confidence and impact ranges
            if (pattern.confidence < 0 || pattern.confidence > 1) {
                return false;
            }
            if (pattern.impact < 0 || pattern.impact > 1) {
                return false;
            }

            // Type-specific validation
            switch (pattern.type) {
                case 'workflow':
                    return this.validateWorkflowPattern(pattern as WorkflowPattern);
                case 'command':
                    return this.validateCommandPattern(pattern as CommandPattern);
                case 'document':
                    return this.validateDocumentPattern(pattern as DocumentPattern);
                case 'automation':
                    return this.validateAutomationPattern(pattern as AutomationPattern);
                case 'interaction':
                    return this.validateInteractionPattern(pattern as InteractionPattern);
                case 'learning':
                    return this.validateLearningPattern(pattern as LearningPattern);
                default:
                    return false;
            }
        } catch (error) {
            console.error('Pattern validation error:', error);
            return false;
        }
    }

    private groupPatternsByType(patterns: Pattern[]): Record<string, Pattern[]> {
        return patterns.reduce((groups, pattern) => {
            const type = pattern.type;
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(pattern);
            return groups;
        }, {} as Record<string, Pattern[]>);
    }

    private async matchWorkflowPatterns(data: unknown[], patterns: WorkflowPattern[]): Promise<Pattern[]> {
        const matches: Pattern[] = [];
        for (const pattern of patterns || []) {
            if (pattern.steps.length === data.length) {
                const score = await this.scoreWorkflowPattern(data, pattern);
                if (score > 0.7) {
                    matches.push({
                        ...pattern,
                        confidence: score
                    });
                }
            }
        }
        return matches;
    }

    private async matchCommandPatterns(data: string, patterns: CommandPattern[]): Promise<Pattern[]> {
        const matches: Pattern[] = [];
        for (const pattern of patterns || []) {
            if (data.includes(pattern.command)) {
                const score = await this.scoreCommandPattern(data, pattern);
                if (score > 0.7) {
                    matches.push({
                        ...pattern,
                        confidence: score
                    });
                }
            }
        }
        return matches;
    }

    private async matchDocumentPatterns(data: string, patterns: DocumentPattern[]): Promise<Pattern[]> {
        const matches: Pattern[] = [];
        for (const pattern of patterns || []) {
            const score = await this.scoreDocumentPattern(data, pattern);
            if (score > 0.7) {
                matches.push({
                    ...pattern,
                    confidence: score
                });
            }
        }
        return matches;
    }

    private async matchAutomationPatterns(data: unknown, patterns: AutomationPattern[]): Promise<Pattern[]> {
        const matches: Pattern[] = [];
        for (const pattern of patterns || []) {
            const score = await this.scoreAutomationPattern(data, pattern);
            if (score > 0.7) {
                matches.push({
                    ...pattern,
                    confidence: score
                });
            }
        }
        return matches;
    }

    private async matchInteractionPatterns(data: unknown, patterns: InteractionPattern[]): Promise<Pattern[]> {
        const matches: Pattern[] = [];
        for (const pattern of patterns || []) {
            const score = await this.scoreInteractionPattern(data, pattern);
            if (score > 0.7) {
                matches.push({
                    ...pattern,
                    confidence: score
                });
            }
        }
        return matches;
    }

    private async matchLearningPatterns(data: unknown, patterns: LearningPattern[]): Promise<Pattern[]> {
        const matches: Pattern[] = [];
        for (const pattern of patterns || []) {
            const score = await this.scoreLearningPattern(data, pattern);
            if (score > 0.7) {
                matches.push({
                    ...pattern,
                    confidence: score
                });
            }
        }
        return matches;
    }

    private async scoreWorkflowPattern(data: unknown, pattern: WorkflowPattern): Promise<number> {
        if (!Array.isArray(data)) return 0;

        // Compare steps
        const stepMatches = pattern.steps.reduce((count, step, index) => {
            const dataStep = data[index];
            if (typeof dataStep === 'object' && dataStep !== null) {
                if (
                    'id' in dataStep &&
                    'type' in dataStep &&
                    dataStep.id === step.id &&
                    dataStep.type === step.type
                ) {
                    return count + 1;
                }
            }
            return count;
        }, 0);

        return stepMatches / pattern.steps.length;
    }

    private async scoreCommandPattern(data: unknown, pattern: CommandPattern): Promise<number> {
        if (typeof data !== 'string') return 0;

        // Check command match
        if (!data.includes(pattern.command)) return 0;

        // Check args and options
        const argMatches = pattern.args.filter(arg => data.includes(arg)).length;
        const argScore = argMatches / pattern.args.length;

        // Check context
        const contextScore = data.includes(pattern.context) ? 1 : 0;

        return (argScore + contextScore) / 2;
    }

    private async scoreDocumentPattern(data: unknown, pattern: DocumentPattern): Promise<number> {
        if (typeof data !== 'string') return 0;

        // Check sections
        const sectionMatches = pattern.sections.filter(section =>
            data.includes(section)
        ).length;
        const sectionScore = sectionMatches / pattern.sections.length;

        // Check template match
        const templateScore = data.includes(pattern.template) ? 1 : 0;

        return (sectionScore + templateScore) / 2;
    }

    private async scoreAutomationPattern(data: unknown, pattern: AutomationPattern): Promise<number> {
        if (typeof data !== 'object' || data === null) return 0;

        // Check trigger
        const triggerScore = 'trigger' in data && data.trigger === pattern.trigger ? 1 : 0;

        // Check actions
        const actionMatches = pattern.actions.filter(action =>
            'actions' in data && Array.isArray(data.actions) &&
            data.actions.includes(action)
        ).length;
        const actionScore = actionMatches / pattern.actions.length;

        return (triggerScore + actionScore) / 2;
    }

    private async scoreInteractionPattern(data: unknown, pattern: InteractionPattern): Promise<number> {
        if (typeof data !== 'object' || data === null) return 0;

        // Check intent
        const intentScore = 'intent' in data && data.intent === pattern.intent ? 1 : 0;

        // Check flow
        const flowMatches = pattern.flow.filter(step =>
            'flow' in data && Array.isArray(data.flow) &&
            data.flow.includes(step)
        ).length;
        const flowScore = flowMatches / pattern.flow.length;

        return (intentScore + flowScore) / 2;
    }

    private async scoreLearningPattern(data: unknown, pattern: LearningPattern): Promise<number> {
        // Learning patterns can match any data type
        // Score based on insights and applications

        const insights = typeof data === 'object' && data !== null && 'insights' in data ?
            (data.insights as string[]) : [];

        const applications = typeof data === 'object' && data !== null && 'applications' in data ?
            (data.applications as string[]) : [];

        const insightMatches = pattern.insights.filter(insight =>
            insights.includes(insight)
        ).length;
        const insightScore = insightMatches / pattern.insights.length;

        const applicationMatches = pattern.applications.filter(app =>
            applications.includes(app)
        ).length;
        const applicationScore = applicationMatches / pattern.applications.length;

        return (insightScore + applicationScore) / 2;
    }

    private validateWorkflowPattern(pattern: WorkflowPattern): boolean {
        return (
            Array.isArray(pattern.steps) &&
            pattern.steps.length > 0 &&
            pattern.steps.every(step =>
                step.id &&
                step.name &&
                step.type &&
                Array.isArray(step.dependencies)
            )
        );
    }

    private validateCommandPattern(pattern: CommandPattern): boolean {
        return (
            typeof pattern.command === 'string' &&
            pattern.command.length > 0 &&
            Array.isArray(pattern.args) &&
            typeof pattern.context === 'string'
        );
    }

    private validateDocumentPattern(pattern: DocumentPattern): boolean {
        return (
            typeof pattern.template === 'string' &&
            Array.isArray(pattern.sections) &&
            pattern.sections.length > 0 &&
            Array.isArray(pattern.relationships)
        );
    }

    private validateAutomationPattern(pattern: AutomationPattern): boolean {
        return (
            typeof pattern.trigger === 'string' &&
            Array.isArray(pattern.actions) &&
            pattern.actions.length > 0 &&
            Array.isArray(pattern.conditions)
        );
    }

    private validateInteractionPattern(pattern: InteractionPattern): boolean {
        return (
            typeof pattern.intent === 'string' &&
            Array.isArray(pattern.flow) &&
            pattern.flow.length > 0 &&
            Array.isArray(pattern.outcomes)
        );
    }

    private validateLearningPattern(pattern: LearningPattern): boolean {
        return (
            typeof pattern.source === 'string' &&
            Array.isArray(pattern.insights) &&
            pattern.insights.length > 0 &&
            Array.isArray(pattern.applications)
        );
    }
}
