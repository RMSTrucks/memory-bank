/**
 * Basic Usage Example for Cognitive Tools Integration
 *
 * This example demonstrates how to use the Cognitive Tools Integration API.
 */

import cognitiveTools from '../api';
import { KnowledgeType, MemoryType, PatternType, DiagramType, ImportanceLevel } from '../types';

/**
 * Run the example
 */
async function runExample() {
  try {
    // Initialize the Cognitive Tools
    console.log('Initializing Cognitive Tools...');
    await cognitiveTools.initialize();
    console.log('Cognitive Tools initialized successfully.');

    // Knowledge API examples
    console.log('\n--- Knowledge API Examples ---');

    // Store knowledge
    const knowledgeId = await cognitiveTools.knowledge.store({
      content: 'The Memory Bank is a structured documentation system that helps Cline maintain context between sessions.',
      type: KnowledgeType.CONCEPT,
      metadata: {
        title: 'Memory Bank Concept',
        description: 'Core concept of the Memory Bank system',
        tags: ['memory-bank', 'documentation', 'context'],
        importance: ImportanceLevel.HIGH
      }
    });
    console.log(`Stored knowledge with ID: ${knowledgeId}`);

    // Get knowledge by ID
    const knowledge = await cognitiveTools.knowledge.getById(knowledgeId);
    console.log('Retrieved knowledge:', knowledge);

    // Search knowledge
    const searchResults = await cognitiveTools.knowledge.search('memory bank');
    console.log(`Found ${searchResults.length} knowledge items matching 'memory bank'`);

    // Memory API examples
    console.log('\n--- Memory API Examples ---');

    // Store memory
    const memoryId = await cognitiveTools.memory.store({
      content: 'Implemented the Memory Bank system with a hierarchical structure of markdown files.',
      type: MemoryType.MILESTONE,
      metadata: {
        title: 'Memory Bank Implementation',
        description: 'Implementation milestone for the Memory Bank system',
        tags: ['memory-bank', 'implementation', 'milestone'],
        importance: ImportanceLevel.HIGH
      }
    });
    console.log(`Stored memory with ID: ${memoryId}`);

    // Get memory by ID
    const memory = await cognitiveTools.memory.getById(memoryId);
    console.log('Retrieved memory:', memory);

    // Update memory bank
    const updatedFiles = await cognitiveTools.memory.updateMemoryBank(memory);
    console.log('Updated memory bank files:', updatedFiles);

    // Pattern API examples
    console.log('\n--- Pattern API Examples ---');

    // Detect patterns
    const content = `
    # Memory Bank Structure

    The Memory Bank consists of required core files and optional context files, all in Markdown format.
    Files build upon each other in a clear hierarchy:

    1. projectbrief.md - Foundation document that shapes all other files
    2. productContext.md - Why this project exists and problems it solves
    3. activeContext.md - Current work focus and recent changes
    4. systemPatterns.md - System architecture and key technical decisions
    5. techContext.md - Technologies used and technical constraints
    6. progress.md - What works and what's left to build
    `;

    const detectedPatterns = await cognitiveTools.pattern.detect(content);
    console.log(`Detected ${detectedPatterns.length} patterns in the content`);

    // Store a pattern
    const patternId = await cognitiveTools.pattern.store({
      name: 'Memory Bank Hierarchy',
      description: 'The hierarchical structure of Memory Bank files',
      type: PatternType.STRUCTURAL,
      content: 'projectbrief.md → productContext.md/systemPatterns.md/techContext.md → activeContext.md → progress.md',
      examples: [
        'Memory Bank documentation follows a strict hierarchy with projectbrief.md as the root.',
        'Changes flow through the hierarchy: projectbrief → productContext/systemPatterns/techContext → activeContext → progress'
      ],
      metadata: {
        effectiveness: 0.95,
        confidence: 0.98,
        usageCount: 1,
        tags: ['memory-bank', 'documentation', 'hierarchy']
      }
    });
    console.log(`Stored pattern with ID: ${patternId}`);

    // Optimize content with patterns
    const { optimizedContent, appliedPatterns } = await cognitiveTools.pattern.optimize(
      'The Memory Bank documentation needs to be organized.',
      [await cognitiveTools.pattern.getById(patternId)]
    );
    console.log(`Optimized content with ${appliedPatterns.length} patterns:`, optimizedContent);

    // Visualization API examples
    console.log('\n--- Visualization API Examples ---');

    // Generate memory bank structure visualization
    const memoryBankStructure = cognitiveTools.visualization.generateMemoryBankStructure();
    console.log('Memory Bank Structure Visualization:');
    console.log(memoryBankStructure);

    // Generate knowledge graph
    const knowledgeGraph = cognitiveTools.visualization.generateKnowledgeGraph([knowledgeId]);
    console.log('Knowledge Graph:');
    console.log(knowledgeGraph);

    // Generate pattern relationships
    const patternRelationships = cognitiveTools.visualization.generatePatternRelationships([patternId]);
    console.log('Pattern Relationships:');
    console.log(patternRelationships);

    // Generate memory timeline
    const memoryTimeline = cognitiveTools.visualization.generateMemoryTimeline([memoryId]);
    console.log('Memory Timeline:');
    console.log(memoryTimeline);

    // Utility API examples
    console.log('\n--- Utility API Examples ---');

    // Get configuration
    const config = cognitiveTools.utils.getConfig();
    console.log('Current configuration:', config);

    // Update configuration
    cognitiveTools.utils.updateConfig({
      visualization: {
        maxDiagramSize: 10000
      }
    });
    console.log('Updated configuration');

    console.log('\nExample completed successfully.');
  } catch (error) {
    console.error('Error running example:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runExample();
}

// Export the example function for use in other files
export default runExample;
