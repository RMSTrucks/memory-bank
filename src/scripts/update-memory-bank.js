/**
 * Update Memory Bank
 *
 * This script updates the memory bank files to reflect the successful storage
 * of the tensor operations milestone in Pinecone. It adds a note to the activeContext.md
 * file about the milestone being stored in the memory system.
 */

const fs = require('fs');
const path = require('path');

// Path to activeContext.md
const activeContextPath = path.join(process.cwd(), 'activeContext.md');

// Read the current content of activeContext.md
function updateActiveContext() {
  console.log('Updating activeContext.md...');

  try {
    const content = fs.readFileSync(activeContextPath, 'utf8');

    // Check if the file already mentions the milestone storage
    if (content.includes('Tensor operations milestone stored in memory system')) {
      console.log('activeContext.md already mentions the tensor operations milestone storage.');
      return;
    }

    // Find the Neural Computation Framework section
    const ncfSectionRegex = /### Neural Computation Framework 🔄([\s\S]*?)### Pattern Evolution System/;
    const match = content.match(ncfSectionRegex);

    if (!match) {
      console.error('Could not find Neural Computation Framework section in activeContext.md');
      return;
    }

    // Current NCF section content
    const ncfSection = match[1];

    // Add the milestone storage information
    const updatedNcfSection = ncfSection.replace(
      '- ✅ Tensor operations (Completed February 26, 2025)',
      '- ✅ Tensor operations (Completed February 26, 2025)\n  - ✅ Tensor operations milestone stored in memory system (ID: mem_1740604289704)'
    );

    // Replace the old section with the updated one
    const updatedContent = content.replace(ncfSectionRegex, `### Neural Computation Framework 🔄${updatedNcfSection}### Pattern Evolution System`);

    // Write the updated content back to the file
    fs.writeFileSync(activeContextPath, updatedContent, 'utf8');

    console.log('Successfully updated activeContext.md with tensor operations milestone storage information.');
  } catch (error) {
    console.error('Error updating activeContext.md:', error.message || error);
  }
}

// Execute the update
updateActiveContext();
