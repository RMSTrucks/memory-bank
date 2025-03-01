/**
 * Store Growth Mindset Framework in Pinecone
 *
 * This script stores the Growth Mindset framework from the .clinerules file
 * in the Pinecone vector database using the enhanced memory system.
 *
 * The framework is stored both as a complete document and as individual sections
 * to enable more precise retrieval through semantic search.
 */

const fs = require('fs');
const path = require('path');
const MemorySystem = require('./memory-system');

/**
 * Store the Growth Mindset Framework in Pinecone
 */
async function storeGrowthMindsetFramework() {
  try {
    console.log('Reading .clinerules file...');
    const filePath = path.join(process.cwd(), '.clinerules');
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract key sections
    const sections = extractSections(content);

    console.log('Storing Growth Mindset Framework in Pinecone...');

    // Start the server
    const server = MemorySystem.startServer();

    // Wait for server to initialize
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Store the complete framework as a high-level concept
    await MemorySystem.storePhilosophicalFramework(
      server,
      content,
      {
        title: 'Growth Mindset Framework',
        importance: 'high',
        tags: ['growth-mindset', 'critical-rationalism', 'universal-learning', 'self-evolution'],
        created: new Date().toISOString(),
        version: '1.0'
      }
    );

    console.log('Stored complete Growth Mindset Framework');

    // Store each key section separately
    for (const section of sections) {
      await MemorySystem.storePhilosophicalFramework(
        server,
        section.content,
        {
          title: section.title,
          importance: 'medium',
          tags: ['growth-mindset', 'philosophy', ...section.tags],
          created: new Date().toISOString(),
          version: '1.0'
        }
      );

      console.log(`Stored section: ${section.title}`);
    }

    // Shutdown the server
    console.log('Shutting down server...');
    server.kill();

    console.log('Successfully stored Growth Mindset Framework in Pinecone');
    return true;
  } catch (error) {
    console.error('Error storing Growth Mindset Framework:', error);
    return false;
  }
}

/**
 * Extract sections from the .clinerules file
 * @param {string} content - File content
 * @returns {Array} - Array of section objects
 */
function extractSections(content) {
  const sections = [];
  const lines = content.split('\n');

  let currentSection = null;
  let sectionContent = [];
  let inSection = false;
  let sectionLevel = 0;

  for (const line of lines) {
    // Detect main sections (level 2 headers)
    if (line.match(/^## /)) {
      // If we were already in a section, save it
      if (inSection && currentSection) {
        sections.push({
          type: 'section',
          level: sectionLevel,
          title: currentSection,
          content: sectionContent.join('\n'),
          tags: extractTags(sectionContent.join('\n'))
        });
      }

      // Start a new section
      currentSection = line.replace(/^## /, '');
      sectionContent = [line];
      inSection = true;
      sectionLevel = 2;
    }
    // Detect subsections (level 3 headers)
    else if (line.match(/^### /)) {
      // If we were already in a section, save it
      if (inSection && currentSection && sectionLevel <= 3) {
        sections.push({
          type: 'section',
          level: sectionLevel,
          title: currentSection,
          content: sectionContent.join('\n'),
          tags: extractTags(sectionContent.join('\n'))
        });
      }

      // Start a new subsection
      currentSection = line.replace(/^### /, '');
      sectionContent = [line];
      inSection = true;
      sectionLevel = 3;
    }
    // Otherwise, if we're in a section, add the line to the current section
    else if (inSection) {
      sectionContent.push(line);
    }
  }

  // Don't forget to add the last section if we were in one
  if (inSection && currentSection) {
    sections.push({
      type: 'section',
      level: sectionLevel,
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

  // Extract key concepts as tags
  const concepts = [
    'growth-mindset',
    'critical-rationalism',
    'universal-learning',
    'problems-are-soluble',
    'failure-as-feedback',
    'meta-learning',
    'scientific-development',
    'deliberate-practice',
    'knowledge-evolution',
    'problem-solving',
    'self-evolution'
  ];

  // Add tags based on content
  for (const concept of concepts) {
    if (content.toLowerCase().includes(concept.replace(/-/g, ' '))) {
      tags.push(concept);
    }
  }

  // Add specific tags based on section title
  const title = content.split('\n')[0].toLowerCase();

  if (title.includes('identity')) tags.push('identity');
  if (title.includes('philosophy')) tags.push('philosophy');
  if (title.includes('meta-learning')) tags.push('meta-learning');
  if (title.includes('scientific')) tags.push('scientific-method');
  if (title.includes('practice')) tags.push('practice');
  if (title.includes('problem')) tags.push('problem-solving');
  if (title.includes('security')) tags.push('security');
  if (title.includes('communication')) tags.push('communication');
  if (title.includes('feedback')) tags.push('feedback');
  if (title.includes('performance')) tags.push('performance');

  return tags;
}

// Execute if run directly
if (require.main === module) {
  storeGrowthMindsetFramework()
    .then(success => {
      if (success) {
        console.log('Growth Mindset Framework successfully stored in Pinecone');
        process.exit(0);
      } else {
        console.error('Failed to store Growth Mindset Framework');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { storeGrowthMindsetFramework };
