/**
 * Script to store the Implementation Partnership Vision in Pinecone
 *
 * This script stores three key entries in the Pinecone database:
 * 1. The implementation partnership vision
 * 2. The strategic roadmap
 * 3. Identified red herrings and misaligned goals
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

// Import the direct access utility
const mcpDirectAccess = require('../utils/mcp-direct-access');

// Configuration
const VISION_FILE_PATH = path.join(__dirname, '../../docs/implementation-partnership-vision.md');

/**
 * Extract sections from the vision document
 * @param {string} content - The content of the vision document
 * @returns {Object} - Object containing extracted sections
 */
function extractSections(content) {
  // Helper function to extract content between headings
  const extractBetweenHeadings = (content, startHeading, endHeading = null) => {
    const startPattern = new RegExp(`## ${startHeading}\\s*\\n`);
    const startMatch = content.match(startPattern);

    if (!startMatch) return '';

    const startIndex = startMatch.index + startMatch[0].length;

    let endIndex;
    if (endHeading) {
      const endPattern = new RegExp(`## ${endHeading}\\s*\\n`);
      const endMatch = content.match(endPattern);
      endIndex = endMatch ? endMatch.index : content.length;
    } else {
      endIndex = content.length;
    }

    return content.substring(startIndex, endIndex).trim();
  };

  return {
    corePurpose: extractBetweenHeadings(content, 'Core Purpose', 'Key Capabilities Required'),
    keyCapabilities: extractBetweenHeadings(content, 'Key Capabilities Required', 'Strategic Roadmap'),
    strategicRoadmap: extractBetweenHeadings(content, 'Strategic Roadmap', 'Success Metrics'),
    successMetrics: extractBetweenHeadings(content, 'Success Metrics', 'Relationship to Existing Systems'),
    relationshipToExistingSystems: extractBetweenHeadings(content, 'Relationship to Existing Systems', 'Red Herrings and Misaligned Goals'),
    redHerrings: extractBetweenHeadings(content, 'Red Herrings and Misaligned Goals', 'Next Steps'),
    nextSteps: extractBetweenHeadings(content, 'Next Steps')
  };
}

/**
 * Create the vision entry for Pinecone
 * @param {Object} sections - Extracted sections from the vision document
 * @returns {Object} - Vision entry for Pinecone
 */
function createVisionEntry(sections) {
  return {
    id: `vision_implementation_partnership_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}`,
    content: `# Implementation Partnership Vision\n\n${sections.corePurpose}\n\n${sections.keyCapabilities}`,
    metadata: {
      type: 'vision',
      importance: 'critical',
      date: new Date().toISOString(),
      author: 'user',
      tags: ['vision', 'implementation', 'partnership', 'core_purpose']
    }
  };
}

/**
 * Create the roadmap entry for Pinecone
 * @param {Object} sections - Extracted sections from the vision document
 * @returns {Object} - Roadmap entry for Pinecone
 */
function createRoadmapEntry(sections) {
  return {
    id: `roadmap_implementation_partnership_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}`,
    content: `# Strategic Roadmap for Implementation Partnership\n\n${sections.strategicRoadmap}`,
    metadata: {
      type: 'roadmap',
      importance: 'high',
      date: new Date().toISOString(),
      author: 'cline',
      tags: ['roadmap', 'strategy', 'implementation', 'partnership']
    }
  };
}

/**
 * Create the red herrings entry for Pinecone
 * @param {Object} sections - Extracted sections from the vision document
 * @returns {Object} - Red herrings entry for Pinecone
 */
function createRedHerringsEntry(sections) {
  return {
    id: `red_herrings_implementation_partnership_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}`,
    content: `# Identified Red Herrings and Misaligned Goals\n\n${sections.redHerrings}`,
    metadata: {
      type: 'clarification',
      importance: 'medium',
      date: new Date().toISOString(),
      author: 'cline',
      tags: ['clarification', 'alignment', 'focus']
    }
  };
}

/**
 * Store entries using the knowledge system server
 * @param {Array} entries - Array of entries to store
 */
async function storeEntries(entries) {
  try {
    console.log('Starting knowledge system server...');
    const server = mcpDirectAccess.startServer('knowledge-system', true);

    console.log('Storing entries...');
    for (const entry of entries) {
      console.log(`Processing entry: ${entry.id}`);
      await mcpDirectAccess.storeMemory(server, entry.content, entry.metadata);
      console.log(`Successfully stored entry: ${entry.id}`);
    }

    console.log('All entries successfully stored!');
    process.exit(0);
  } catch (error) {
    console.error('Error storing entries:', error);
    process.exit(1);
  }
}

/**
 * Main function to execute the script
 */
async function main() {
  try {
    console.log('Reading vision document...');
    const content = await readFile(VISION_FILE_PATH, 'utf8');

    console.log('Extracting sections...');
    const sections = extractSections(content);

    console.log('Creating entries...');
    const visionEntry = createVisionEntry(sections);
    const roadmapEntry = createRoadmapEntry(sections);
    const redHerringsEntry = createRedHerringsEntry(sections);

    console.log('Storing entries...');
    await storeEntries([visionEntry, roadmapEntry, redHerringsEntry]);

    console.log('Implementation Partnership Vision successfully stored!');
  } catch (error) {
    console.error('Error executing script:', error);
    process.exit(1);
  }
}

// Execute the script
if (require.main === module) {
  main();
}

module.exports = {
  extractSections,
  createVisionEntry,
  createRoadmapEntry,
  createRedHerringsEntry,
  storeEntries,
  main
};
