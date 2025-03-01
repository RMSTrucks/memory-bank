/**
 * Store User Preference Patterns in Pinecone
 *
 * This script stores the user preference patterns in the Pinecone vector database
 * using the memory system. This ensures the patterns are accessible through
 * semantic search and integrated with our AI systems.
 */

const fs = require('fs');
const path = require('path');
const MemorySystem = require('./memory-system');
const ClimeMemoryIntegration = require('./cline-memory-integration');

// Define namespaces since MemorySystem.CONFIG is undefined
const NAMESPACES = {
  coreKnowledge: 'cline-core-knowledge',
  patterns: 'cline-patterns',
  interactions: 'cline-interactions',
  documentation: 'cline-documentation'
};

// Debug logging
console.log('Debug: Script started');
console.log('Debug: MemorySystem loaded:', !!MemorySystem);
console.log('Debug: Using custom namespaces:', NAMESPACES);

async function storeUserPreferencePatterns() {
  try {
    console.log('Reading user preference patterns file...');
    const filePath = path.join(process.cwd(), 'patterns', 'workflow', 'user-preference-patterns.md');
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract key sections for better embedding
    const sections = extractSections(content);

    console.log('Storing user preference patterns in Pinecone...');

    // Start the server
    const server = MemorySystem.startServer();

    // Wait for server to initialize
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Store the complete document as a high-level concept
    await MemorySystem.storeMemory(
      server,
      content,
      {
        type: 'concept',
        category: 'workflow',
        title: 'User Preference Patterns',
        importance: 'high',
        tags: ['workflow', 'patterns', 'preferences', 'development'],
        source: 'user-preference-patterns.md',
        created: new Date().toISOString(),
        version: '1.0'
      },
      NAMESPACES.coreKnowledge
    );

    // Store each core pattern as a separate pattern entry
    for (const section of sections) {
      if (section.type === 'pattern') {
        await MemorySystem.storeMemory(
          server,
          section.content,
          {
            type: 'pattern',
            category: 'workflow',
            title: section.title,
            importance: 'medium',
            tags: ['workflow', 'pattern', 'preference', ...section.tags],
            source: 'user-preference-patterns.md',
            patternType: 'preference',
            created: new Date().toISOString(),
            version: '1.0'
          },
          NAMESPACES.patterns
        );

        console.log(`Stored pattern: ${section.title}`);
      }
    }

    // Shutdown the server
    console.log('Shutting down server...');
    server.kill();

    console.log('Successfully stored user preference patterns in Pinecone');
    return true;
  } catch (error) {
    console.error('Error storing user preference patterns:', error);
    return false;
  }
}

/**
 * Extract sections from the markdown content
 * @param {string} content - Markdown content
 * @returns {Array} - Array of section objects
 */
function extractSections(content) {
  const sections = [];
  const lines = content.split('\n');

  let currentSection = null;
  let sectionContent = [];
  let inSection = false;

  for (const line of lines) {
    // Detect core pattern sections (level 3 headers starting with a number)
    if (line.match(/^### \d+\./)) {
      // If we were already in a section, save it
      if (inSection && currentSection) {
        sections.push({
          type: 'pattern',
          title: currentSection,
          content: sectionContent.join('\n'),
          tags: extractTags(sectionContent.join('\n'))
        });
      }

      // Start a new section
      currentSection = line.replace(/^### \d+\.\s*/, '');
      sectionContent = [line];
      inSection = true;
    }
    // If we hit a new level 2 header, we're out of the core patterns section
    else if (line.match(/^## /) && inSection) {
      // Save the last section
      if (currentSection) {
        sections.push({
          type: 'pattern',
          title: currentSection,
          content: sectionContent.join('\n'),
          tags: extractTags(sectionContent.join('\n'))
        });
      }

      // Reset section tracking
      currentSection = line.replace(/^## /, '');
      sectionContent = [line];
      inSection = false;
    }
    // Otherwise, if we're in a section, add the line to the current section
    else if (inSection) {
      sectionContent.push(line);
    }
  }

  // Don't forget to add the last section if we were in one
  if (inSection && currentSection) {
    sections.push({
      type: 'pattern',
      title: currentSection,
      content: sectionContent.join('\n'),
      tags: extractTags(sectionContent.join('\n'))
    });
  }

  return sections;
}

/**
 * Extract relevant tags from section content
 * @param {string} content - Section content
 * @returns {Array} - Array of tags
 */
function extractTags(content) {
  const tags = [];

  // Extract key principles as tags
  const principlesMatch = content.match(/\*\*Key Principles:\*\*\s*\n([\s\S]*?)(?=\n\n\*\*Implementation)/);
  if (principlesMatch && principlesMatch[1]) {
    const principles = principlesMatch[1].split('\n')
      .filter(line => line.trim().startsWith('- '))
      .map(line => line.trim().replace(/^- /, '').toLowerCase())
      .map(principle => principle.split(' ').slice(0, 3).join('-')); // Create tag from first 3 words

    tags.push(...principles);
  }

  return tags;
}

// Execute if run directly
if (require.main === module) {
  storeUserPreferencePatterns()
    .then(success => {
      if (success) {
        console.log('User preference patterns successfully stored in Pinecone');
        process.exit(0);
      } else {
        console.error('Failed to store user preference patterns');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { storeUserPreferencePatterns };
