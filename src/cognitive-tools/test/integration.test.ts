/**
 * Integration Test for Cognitive Tools Integration
 *
 * This file demonstrates how to use the Cognitive Tools Integration in a real-world scenario.
 */

import cognitiveTools from '../api';
import { KnowledgeType, MemoryType, PatternType, ImportanceLevel } from '../types';

/**
 * Memory Bank Integration Test
 */
async function memoryBankIntegrationTest() {
  try {
    console.log('Starting Memory Bank Integration Test...');

    // Initialize the Cognitive Tools
    await cognitiveTools.initialize({
      memory: {
        markdownPath: './' // Use the current directory for markdown files
      }
    });

    console.log('Cognitive Tools initialized successfully.');

    // Step 1: Store knowledge about the Memory Bank structure
    console.log('\nStep 1: Storing knowledge about Memory Bank structure...');

    const knowledgeId = await cognitiveTools.knowledge.store({
      content: `
        # Memory Bank Structure

        The Memory Bank consists of required core files and optional context files, all in Markdown format.
        Files build upon each other in a clear hierarchy:

        1. projectbrief.md - Foundation document that shapes all other files
        2. productContext.md - Why this project exists and problems it solves
        3. activeContext.md - Current work focus and recent changes
        4. systemPatterns.md - System architecture and key technical decisions
        5. techContext.md - Technologies used and technical constraints
        6. progress.md - What works and what's left to build
      `,
      type: KnowledgeType.DOCUMENTATION,
      metadata: {
        title: 'Memory Bank Structure',
        description: 'Documentation of the Memory Bank structure and hierarchy',
        tags: ['memory-bank', 'documentation', 'structure', 'hierarchy'],
        importance: ImportanceLevel.HIGH
      }
    });

    console.log(`Stored knowledge with ID: ${knowledgeId}`);

    // Step 2: Detect patterns in the knowledge
    console.log('\nStep 2: Detecting patterns in the knowledge...');

    const knowledge = await cognitiveTools.knowledge.getById(knowledgeId);
    const detectedPatterns = await cognitiveTools.pattern.detect(knowledge.content);

    console.log(`Detected ${detectedPatterns.length} patterns in the knowledge.`);

    // Step 3: Store a memory about implementing the Memory Bank
    console.log('\nStep 3: Storing memory about implementing the Memory Bank...');

    const memoryId = await cognitiveTools.memory.store({
      content: `
        # Memory Bank Implementation

        Today I implemented the Memory Bank system with a hierarchical structure of markdown files.
        The implementation follows the structure documented in the knowledge base.

        The following files were created:
        - projectbrief.md
        - productContext.md
        - systemPatterns.md
        - techContext.md
        - activeContext.md
        - progress.md

        Each file contains the appropriate content and follows the hierarchy.
      `,
      type: MemoryType.MILESTONE,
      metadata: {
        title: 'Memory Bank Implementation',
        description: 'Implementation milestone for the Memory Bank system',
        tags: ['memory-bank', 'implementation', 'milestone'],
        importance: ImportanceLevel.HIGH
      }
    });

    console.log(`Stored memory with ID: ${memoryId}`);

    // Step 4: Update the Memory Bank files
    console.log('\nStep 4: Updating Memory Bank files...');

    const memory = await cognitiveTools.memory.getById(memoryId);
    const updatedFiles = await cognitiveTools.memory.updateMemoryBank(memory);

    console.log(`Updated Memory Bank files: ${updatedFiles.join(', ')}`);

    // Step 5: Store a pattern for the Memory Bank hierarchy
    console.log('\nStep 5: Storing pattern for Memory Bank hierarchy...');

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

    // Step 6: Generate visualizations
    console.log('\nStep 6: Generating visualizations...');

    // Generate memory bank structure visualization
    const memoryBankStructure = cognitiveTools.visualization.generateMemoryBankStructure();
    console.log('Memory Bank Structure Visualization:');
    console.log(memoryBankStructure);

    // Generate knowledge graph
    const knowledgeGraph = cognitiveTools.visualization.generateKnowledgeGraph([knowledgeId]);
    console.log('\nKnowledge Graph:');
    console.log(knowledgeGraph);

    // Generate pattern relationships
    const patternRelationships = cognitiveTools.visualization.generatePatternRelationships([patternId]);
    console.log('\nPattern Relationships:');
    console.log(patternRelationships);

    // Generate memory timeline
    const memoryTimeline = cognitiveTools.visualization.generateMemoryTimeline([memoryId]);
    console.log('\nMemory Timeline:');
    console.log(memoryTimeline);

    // Step 7: Search for knowledge and memories
    console.log('\nStep 7: Searching for knowledge and memories...');

    const knowledgeResults = await cognitiveTools.knowledge.search('memory bank');
    console.log(`Found ${knowledgeResults.length} knowledge items matching 'memory bank'`);

    const memoryResults = await cognitiveTools.memory.retrieve('implementation');
    console.log(`Found ${memoryResults.length} memories matching 'implementation'`);

    console.log('\nMemory Bank Integration Test completed successfully.');
  } catch (error) {
    console.error('Error in Memory Bank Integration Test:', error);
  }
}

/**
 * Run the integration test
 */
async function runIntegrationTest() {
  await memoryBankIntegrationTest();
}

// Run the integration test if this file is executed directly
if (require.main === module) {
  runIntegrationTest();
}

// Export the integration test function for use in other files
export default runIntegrationTest;
