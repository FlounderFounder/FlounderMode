#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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
                <div class="vote-count">{{NET_SCORE}}</div>
                <button class="vote-btn vote-down" onclick="submitVote('{{DEF_ID}}', 'down')" data-def-id="{{DEF_ID}}">
                  ▼
                </button>
                <button class="share-btn" onclick="shareDefinition('{{DEF_ID}}')" data-def-id="{{DEF_ID}}" title="Share this definition">
                  📤
                </button>
              </div>
            </div>`;

// Load term data from JSON files
const termsDir = path.join(__dirname, 'terms');
const termFiles = fs.readdirSync(termsDir).filter(file => file.endsWith('.json'));

const terms = {};

termFiles.forEach(file => {
  const slug = file.replace('.json', '');
  const filePath = path.join(termsDir, file);
  const termData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Convert related array to HTML tags
  const relatedTags = termData.related.map(tag => 
    `<span class="related-tag">${tag}</span>`
  );
  
  // Generate share function name
  const shareFunction = `share${termData.term.replace(/\s+/g, '')}`;
  
  terms[slug] = {
    name: termData.term,
    shareFunction: shareFunction,
    definitions: termData.definitions,
    relatedTags: relatedTags
  };
});

// Read template
const templatePath = path.join(__dirname, 'templates', 'term-page-template.html');
const template = fs.readFileSync(templatePath, 'utf8');

// Generate pages
Object.entries(terms).forEach(([slug, termData]) => {
  // Process definitions to handle legacy 'votes' field and ensure voting properties
  const processedDefinitions = termData.definitions.map(def => {
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

  // Generate definitions HTML
  const definitionsHtml = sortedDefinitions.map(def => {
    return definitionTemplate
      .replace(/{{DEF_ID}}/g, def.id)
      .replace(/{{DEF_NUMBER}}/g, def.number)
      .replace(/{{DEFINITION_TEXT}}/g, def.definition)
      .replace(/{{USAGE_TEXT}}/g, def.usage)
      .replace(/{{AUTHOR}}/g, def.author)
      .replace(/{{DATE}}/g, def.date || 'Unknown Date')
      .replace(/{{NET_SCORE}}/g, def.netScore || 0);
  }).join('\n');

  // Generate definitions data for JavaScript
  const definitionsData = JSON.stringify(sortedDefinitions.map(def => ({
    id: def.id,
    definition: def.definition,
    usage: def.usage,
    author: def.author,
    isPrimary: def.id === 'def-1',
    upvotes: def.upvotes || 0,
    downvotes: def.downvotes || 0,
    netScore: def.netScore || 0
  })), null, 12);

  // Generate final HTML
  const finalHtml = template
    .replace(/{{TERM_NAME}}/g, termData.name)
    .replace(/{{DEFINITIONS}}/g, definitionsHtml)
    .replace(/{{RELATED_TAGS}}/g, termData.relatedTags.join('\n            '))
    .replace(/{{SHARE_FUNCTION}}/g, termData.shareFunction)
    .replace(/{{DEFINITIONS_DATA}}/g, definitionsData);

  // Write file
  const outputPath = path.join(__dirname, 'pages', `${slug}.html`);
  fs.writeFileSync(outputPath, finalHtml);
  console.log(`Generated ${slug}.html`);
});

console.log('All pages generated successfully!');
