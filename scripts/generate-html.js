#!/usr/bin/env node

/**
 * HTML Page Generator for Floundermode Dictionary Terms
 * Generates individual HTML pages from JSON term files
 */

const fs = require('fs');
const path = require('path');

function generateHtmlPage(termData, filename) {
  const termName = termData.term;
  const definition = termData.definition;
  const usage = termData.usage;
  const relatedTags = termData.related || [];
  
  // Generate related tags HTML
  const relatedTagsHtml = relatedTags.map(tag => 
    `<span class="related-tag">${tag}</span>`
  ).join('\n            ');
  
  // Generate share function call
  const shareFunctionCall = `shareTerm('${termName.replace(/'/g, "\\'")}', '${definition.replace(/'/g, "\\'")}', '${usage.replace(/'/g, "\\'")}')`;
  
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${termName} - Floundermode Dictionary</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/x-icon" href="../favicon.ico" />
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap" rel="stylesheet">
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="../styles/main.css">
    <link rel="stylesheet" href="../styles/easy-mode.css">
  </head>
  <body>
    <header class="main-header">
      <div class="header-content">
        <h1 class="page-title">Floundermode Dictionary</h1>
        <nav class="header-nav">
          <a href="../" class="nav-button">← Back to Dictionary</a>
          <button class="nav-button dark-mode-toggle" onclick="toggleDarkMode()">
            🌙 Dark
          </button>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <div class="term-page">
        <h1 class="term-title">${termName}</h1>
        <div class="modal-definition-section">
          <h3 class="modal-section-title">DEFINITION</h3>
          <div class="modal-content-block definition-block">
            <div class="modal-accent-bar definition-accent"></div>
            <div class="modal-text-content">${definition}</div>
          </div>
        </div>

        <div class="modal-usage-section">
          <h3 class="modal-section-title">USAGE EXAMPLE</h3>
          <div class="modal-content-block usage-block">
            <div class="modal-accent-bar usage-accent"></div>
            <div class="modal-text-content">"${usage}"</div>
          </div>
        </div>
        
        <div class="term-related">
          <h2>Related Terms</h2>
          <div class="related-tags">
            ${relatedTagsHtml}
          </div>
        </div>
        
        <div class="term-actions">
          <button onclick="${shareFunctionCall}" class="share-button">
            📤 Share This Term
          </button>
        </div>
      </div>
    </main>

    <!-- JavaScript Files -->
    <script src="../scripts/simple-profanity-filter.js"></script>
    <script src="../scripts/main.js"></script>
  </body>
</html>`;
}

function generateHtmlFromJson(jsonFilePath, outputDir = 'pages') {
  try {
    // Read the JSON file
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
    const termData = JSON.parse(jsonContent);
    
    // Generate filename for HTML (same as JSON but with .html extension)
    const jsonFilename = path.basename(jsonFilePath, '.json');
    const htmlFilename = `${jsonFilename}.html`;
    const htmlPath = path.join(outputDir, htmlFilename);
    
    // Generate HTML content
    const htmlContent = generateHtmlPage(termData, jsonFilename);
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write HTML file
    fs.writeFileSync(htmlPath, htmlContent);
    
    console.log(`✅ Generated HTML page: ${htmlPath}`);
    return htmlPath;
    
  } catch (error) {
    console.error(`❌ Error generating HTML for ${jsonFilePath}:`, error.message);
    throw error;
  }
}

function generateAllHtmlPages(termsDir = 'terms', pagesDir = 'pages') {
  console.log('🔄 Generating HTML pages for all terms...\n');
  
  if (!fs.existsSync(termsDir)) {
    console.error(`❌ Terms directory '${termsDir}' does not exist`);
    return;
  }
  
  const jsonFiles = fs.readdirSync(termsDir).filter(f => f.endsWith('.json'));
  
  if (jsonFiles.length === 0) {
    console.log('⚠️  No JSON files found in terms directory');
    return;
  }
  
  const generatedFiles = [];
  
  for (const jsonFile of jsonFiles) {
    const jsonPath = path.join(termsDir, jsonFile);
    try {
      const htmlPath = generateHtmlFromJson(jsonPath, pagesDir);
      generatedFiles.push(htmlPath);
    } catch (error) {
      console.error(`Failed to generate HTML for ${jsonFile}`);
    }
  }
  
  console.log(`\n📊 Generated ${generatedFiles.length} HTML pages`);
  return generatedFiles;
}

// Run if this script is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Generate all HTML pages
    generateAllHtmlPages();
  } else if (args.length === 1) {
    // Generate HTML for specific JSON file
    const jsonFile = args[0];
    if (!fs.existsSync(jsonFile)) {
      console.error(`❌ File '${jsonFile}' does not exist`);
      process.exit(1);
    }
    generateHtmlFromJson(jsonFile);
  } else {
    console.log('Usage:');
    console.log('  node generate-html.js                    # Generate all HTML pages');
    console.log('  node generate-html.js <json-file>         # Generate HTML for specific JSON file');
    process.exit(1);
  }
}

module.exports = { generateHtmlPage, generateHtmlFromJson, generateAllHtmlPages };
