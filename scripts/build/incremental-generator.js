#!/usr/bin/env node

/**
 * Incremental HTML Page Generator for Floundermode Dictionary Terms
 * Only regenerates pages when term files have actually changed
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Template for individual definitions
const definitionTemplate = `
            <div class="definition-item" id="{{DEF_ID}}">
              <div class="definition-content">
                <div class="definition-text">{{DEFINITION_TEXT}}</div>
                <div class="definition-example">"{{USAGE_TEXT}}"</div>
              </div>
              <div class="definition-author">by {{AUTHOR}} {{DATE}}</div>
              <div class="definition-votes">
                <button class="vote-btn vote-up" onclick="submitVote('{{DEF_ID}}', 'up')" data-def-id="{{DEF_ID}}">
                  ▲
                </button>
                <div class="vote-count">0</div>
                <button class="vote-btn vote-down" onclick="submitVote('{{DEF_ID}}', 'down')" data-def-id="{{DEF_ID}}">
                  ▼
                </button>
                <button class="share-btn" onclick="shareDefinition('{{DEF_ID}}')" data-def-id="{{DEF_ID}}" title="Share this definition">
                  📤
                </button>
              </div>
            </div>`;

/**
 * Calculate SHA-256 hash of file content
 */
function calculateFileHash(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Load existing manifest with term hashes
 */
function loadManifest(manifestPath) {
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      // Ensure termHashes exists
      if (!manifest.termHashes) {
        manifest.termHashes = {};
      }
      return manifest;
    } catch (error) {
      console.warn('⚠️  Could not parse existing manifest, starting fresh');
    }
  }
  
  return {
    terms: [],
    termHashes: {},
    lastUpdated: null,
    version: "2.0"
  };
}

/**
 * Save manifest with updated term hashes
 */
function saveManifest(manifestPath, manifest) {
  manifest.lastUpdated = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

/**
 * Check if a term file has changed since last generation
 */
function hasTermChanged(termFile, currentHash, manifest) {
  const previousHash = manifest.termHashes[termFile];
  return previousHash !== currentHash;
}

/**
 * Process term data and generate definitions
 */
function processTermData(termData, slug) {
  // Handle both simple format (definition) and complex format (definitions array)
  let definitions;
  if (termData.definitions) {
    definitions = termData.definitions.map((def, index) => {
      // Ensure unique IDs for existing definitions
      if (def.id === 'def-1' || def.id === 'def-2') {
        const termSlug = termData.term.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return { ...def, id: `${termSlug}-def-${index + 1}` };
      }
      return def;
    });
  } else if (termData.definition) {
    // Convert simple format to complex format with unique ID
    const termSlug = termData.term.toLowerCase().replace(/[^a-z0-9]/g, '-');
    definitions = [{
      id: `${termSlug}-def-1`,
      definition: termData.definition,
      usage: termData.usage || '',
      author: termData.author || 'Anonymous',
      date: termData.date || new Date().toISOString().split('T')[0],
      isPrimary: true,
      upvotes: 0,
      downvotes: 0,
      netScore: 0
    }];
  } else {
    console.error(`Term ${slug} has no definitions or definition field`);
    return null;
  }

  // Process definitions to handle legacy 'votes' field and ensure voting properties
  const processedDefinitions = definitions.map(def => {
    const processedDef = { ...def };
    // Handle legacy 'votes' field from JSON files
    if (def.votes !== undefined && def.upvotes === undefined) {
      processedDef.upvotes = def.votes;
      processedDef.downvotes = 0;
      processedDef.netScore = def.votes;
    } else {
      if (def.upvotes === undefined) processedDef.upvotes = 0;
      if (def.downvotes === undefined) processedDef.downvotes = 0;
      if (def.netScore === undefined) processedDef.netScore = def.upvotes - def.downvotes;
    }
    return processedDef;
  });

  // Sort definitions by netScore (highest first), then by upvotes as tiebreaker
  const sortedDefinitions = [...processedDefinitions].sort((a, b) => {
    if (b.netScore !== a.netScore) {
      return b.netScore - a.netScore;
    }
    return b.upvotes - a.upvotes;
  });

  return {
    name: termData.term,
    shareFunction: `share${termData.term.replace(/\s+/g, '')}`,
    definitions: sortedDefinitions,
    relatedTags: termData.related.map(tag => 
      `<span class="related-tag">${tag}</span>`
    )
  };
}

/**
 * Generate HTML page for a term
 */
function generateTermPage(termData, template) {
  // Generate definitions HTML
  const definitionsHtml = termData.definitions.map(def => {
    return definitionTemplate
      .replace(/{{DEF_ID}}/g, def.id)
      .replace(/{{DEF_NUMBER}}/g, def.number)
      .replace(/{{DEFINITION_TEXT}}/g, def.definition)
      .replace(/{{USAGE_TEXT}}/g, def.usage)
      .replace(/{{AUTHOR}}/g, def.author)
      .replace(/{{DATE}}/g, def.date || 'Unknown Date');
  }).join('\n');

  // Generate definitions data for JavaScript
  const definitionsData = JSON.stringify(termData.definitions.map(def => ({
    id: def.id,
    definition: def.definition,
    usage: def.usage,
    author: def.author,
    isPrimary: def.isPrimary || false,
    upvotes: def.upvotes || 0,
    downvotes: def.downvotes || 0,
    netScore: def.netScore || 0
  })), null, 12);

  // Generate final HTML
  return template
    .replace(/{{TERM_NAME}}/g, termData.name)
    .replace(/{{DEFINITIONS}}/g, definitionsHtml)
    .replace(/{{RELATED_TAGS}}/g, termData.relatedTags.join('\n            '))
    .replace(/{{SHARE_FUNCTION}}/g, termData.shareFunction)
    .replace(/{{DEFINITIONS_DATA}}/g, definitionsData);
}

/**
 * Main generation function with incremental updates
 */
function generatePagesIncremental(options = {}) {
  const {
    forceRegenerate = false,
    verbose = false
  } = options;

  console.log('🔄 Starting incremental page generation...\n');

  // Set up paths
  const termsDir = path.join(__dirname, '../../terms');
  const pagesDir = path.join(__dirname, '../../pages');
  const templatePath = path.join(__dirname, '../../templates', 'term-page-template.html');
  const manifestPath = path.join(__dirname, 'terms-manifest.json');

  // Check if directories exist
  if (!fs.existsSync(termsDir)) {
    console.error(`❌ Terms directory '${termsDir}' does not exist`);
    return;
  }

  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template file '${templatePath}' does not exist`);
    return;
  }

  // Load template
  const template = fs.readFileSync(templatePath, 'utf8');

  // Load existing manifest
  const manifest = loadManifest(manifestPath);

  // Get all term files
  const termFiles = fs.readdirSync(termsDir).filter(file => file.endsWith('.json'));
  
  if (termFiles.length === 0) {
    console.log('⚠️  No JSON files found in terms directory');
    return;
  }

  // Ensure pages directory exists
  if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
  }

  let changedTerms = [];
  let newTerms = [];
  let unchangedTerms = [];

  // Process each term file
  for (const termFile of termFiles) {
    const slug = termFile.replace('.json', '');
    const filePath = path.join(termsDir, termFile);
    
    try {
      // Calculate current hash
      const currentHash = calculateFileHash(filePath);
      
      // Check if term has changed
      const hasChanged = forceRegenerate || hasTermChanged(termFile, currentHash, manifest);
      
      if (hasChanged) {
        // Load and process term data
        const termData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const processedData = processTermData(termData, slug);
        
        if (processedData) {
          // Generate HTML page
          const htmlContent = generateTermPage(processedData, template);
          const outputPath = path.join(pagesDir, `${slug}.html`);
          
          // Write HTML file
          fs.writeFileSync(outputPath, htmlContent);
          
          // Check if this is a new term or changed term
          const wasNewTerm = manifest.termHashes[termFile] === undefined;
          
          // Update manifest
          manifest.termHashes[termFile] = currentHash;
          
          if (wasNewTerm) {
            newTerms.push(slug);
            console.log(`✨ Generated new page: ${slug}.html`);
          } else {
            changedTerms.push(slug);
            console.log(`🔄 Regenerated changed page: ${slug}.html`);
          }
        }
      } else {
        unchangedTerms.push(slug);
        if (verbose) {
          console.log(`⏭️  Skipped unchanged page: ${slug}.html`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${termFile}:`, error.message);
    }
  }

  // Update manifest with all current terms and clean up deleted files
  manifest.terms = termFiles.sort();
  
  // Remove hashes for files that no longer exist
  const currentTermFiles = new Set(termFiles);
  Object.keys(manifest.termHashes).forEach(file => {
    if (!currentTermFiles.has(file)) {
      delete manifest.termHashes[file];
    }
  });
  
  saveManifest(manifestPath, manifest);

  // Print summary
  console.log('\n📊 Generation Summary:');
  console.log(`   ✨ New pages: ${newTerms.length}`);
  console.log(`   🔄 Changed pages: ${changedTerms.length}`);
  console.log(`   ⏭️  Unchanged pages: ${unchangedTerms.length}`);
  console.log(`   📝 Total pages: ${termFiles.length}`);
  
  if (verbose && unchangedTerms.length > 0) {
    console.log(`\n⏭️  Unchanged pages: ${unchangedTerms.join(', ')}`);
  }
  
  console.log('\n✅ Incremental generation complete!');
  
  return {
    newTerms,
    changedTerms,
    unchangedTerms,
    totalTerms: termFiles.length
  };
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    forceRegenerate: args.includes('--force') || args.includes('-f'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node incremental-generator.js [options]

Options:
  --force, -f     Force regeneration of all pages
  --verbose, -v   Show detailed output including unchanged pages
  --help, -h      Show this help message

Examples:
  node incremental-generator.js                    # Incremental update
  node incremental-generator.js --force            # Regenerate all pages
  node incremental-generator.js --verbose          # Show detailed output
    `);
    process.exit(0);
  }

  generatePagesIncremental(options);
}

module.exports = { generatePagesIncremental, calculateFileHash };
