#!/usr/bin/env node

/**
 * Smart Page Generator - Drop-in replacement for existing generation scripts
 * Automatically detects changes and only regenerates pages that need updates
 */

const { generatePagesIncremental } = require('./incremental-generator');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  forceRegenerate: args.includes('--force') || args.includes('-f'),
  verbose: args.includes('--verbose') || args.includes('-v')
};

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Smart Page Generator for Floundermode Dictionary

This script automatically detects which term files have changed and only
regenerates the corresponding HTML pages, making updates much faster.

Usage: node smart-generator.js [options]

Options:
  --force, -f     Force regeneration of all pages (like the old behavior)
  --verbose, -v   Show detailed output including unchanged pages
  --help, -h      Show this help message

Examples:
  node smart-generator.js                    # Smart incremental update
  node smart-generator.js --force            # Regenerate all pages
  node smart-generator.js --verbose          # Show detailed output

Migration from old scripts:
  - Replace 'node generate-pages.js' with 'node smart-generator.js'
  - Replace 'node scripts/generate-html.js' with 'node smart-generator.js'
  - Use --force flag to get the old behavior of regenerating everything
  `);
  process.exit(0);
}

// Run the incremental generator
console.log('🚀 Starting Smart Page Generator...\n');

if (options.forceRegenerate) {
  console.log('⚠️  Force mode enabled - regenerating all pages\n');
}

generatePagesIncremental(options);
