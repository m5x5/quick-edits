#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// Regular expression to match console.log, console.debug, console.error, console.warn, console.info statements
const consoleRegex = /console\.(log|debug|error|warn|info)\s*\([^;]*\);?/g;

// Function to recursively process files in a directory
function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      // Skip node_modules and dist directories
      if (file !== 'node_modules' && file !== 'dist') {
        processDirectory(filePath);
      }
    } else if (stats.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js'))) {
      removeLogsFromFile(filePath);
    }
  }
}

// Function to remove console logs from a file
function removeLogsFromFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace console statements
    content = content.replace(consoleRegex, '');
    
    // Only write back if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Removed logs from: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

// Start processing from the src directory
const srcDirectory = path.join(__dirname, '..', 'src');
console.log(`Removing console logs from: ${srcDirectory}`);
processDirectory(srcDirectory);

console.log('All console logs have been removed!'); 