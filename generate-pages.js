#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Template for individual definitions
const definitionTemplate = `
            <div class="definition-item" id="{{DEF_ID}}">
              <div class="definition-content">
                <div class="definition-text">{{DEFINITION_TEXT}}</div>
                <div class="definition-example">"{{USAGE_TEXT}}"</div>
                <div class="definition-meta">— {{AUTHOR}}</div>
              </div>
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

// Term data
const terms = {
  'mvp-theater': {
    name: 'MVP Theater',
    shareFunction: 'shareMvpTheater',
    definitions: [{
      id: 'def-1',
      number: 'Definition 1',
      definition: "When a team pretends to validate a product by building the tiniest thing possible, but it still takes six months.",
      usage: "Our MVP was just a Figma prototype but took longer than building the whole app.",
      author: "Carter Wynn"
    }],
    relatedTags: [
      '<span class="related-tag">Lean</span>',
      '<span class="related-tag">Pretend Agile</span>',
      '<span class="related-tag">Stakeholder Pressure</span>'
    ]
  },
  'meta-investment': {
    name: 'A META investment',
    shareFunction: 'shareMetaInvestment',
    definitions: [{
      id: 'def-1',
      number: 'Definition 1',
      definition: "It's like real money but it's not.",
      usage: "Remember that guy that promised us the angel funding? Turns out it was a META investment.",
      author: "Carter Wynn"
    }],
    relatedTags: [
      '<span class="related-tag">Raising Funds</span>'
    ]
  },
  'dashboard-fatigue': {
    name: 'Dashboard Fatigue',
    shareFunction: 'shareDashboardFatigue',
    definitions: [{
      id: 'def-1',
      number: 'Definition 1',
      definition: "The emotional exhaustion from being shown yet another metrics dashboard no one understands or uses.",
      usage: "The team built a dashboard for the dashboard... we just nodded and moved on.",
      author: "Carter Wynn"
    }],
    relatedTags: [
      '<span class="related-tag">Analytics</span>',
      '<span class="related-tag">Overengineering</span>',
      '<span class="related-tag">Product Theater</span>'
    ]
  },
  'founder-gut': {
    name: 'Founder Gut',
    shareFunction: 'shareFounderGut',
    definitions: [{
      id: 'def-1',
      number: 'Definition 1',
      definition: "An internal signal that replaces research, ethics, and customer feedback with a low-grade serotonin burst and a vague sense of destiny.",
      usage: "We were going to A/B test the landing page but my Founder Gut said ship it in Comic Sans.",
      author: "Carter Wynn"
    }, {
      id: 'def-2',
      number: 'Definition 2',
      definition: "The entrepreneurial equivalent of 'trust me bro' but with more conviction and less data.",
      usage: "My Founder Gut says we should pivot to blockchain. No, I haven't talked to any users.",
      author: "Anonymous Contributor"
    }],
    relatedTags: [
      '<span class="related-tag">Instinct</span>',
      '<span class="related-tag">Decision Making</span>',
      '<span class="related-tag">Anti-Research</span>'
    ]
  },
  'vibe-driven-dev': {
    name: 'Vibe-Driven Dev',
    shareFunction: 'shareVibeDrivenDev',
    definitions: [{
      id: 'def-1',
      number: 'Definition 1',
      definition: "A product methodology where feelings override all measurable success criteria.",
      usage: "We don't test features — we ship on vibes.",
      author: "Carter Wynn"
    }],
    relatedTags: [
      '<span class="related-tag">Design Philosophy</span>',
      '<span class="related-tag">Non-Metric</span>',
      '<span class="related-tag">Product Culture</span>'
    ]
  }
};

// Read template
const templatePath = path.join(__dirname, 'templates', 'term-page-template.html');
const template = fs.readFileSync(templatePath, 'utf8');

// Generate pages
Object.entries(terms).forEach(([slug, termData]) => {
  // Generate definitions HTML
  const definitionsHtml = termData.definitions.map(def => {
    return definitionTemplate
      .replace(/{{DEF_ID}}/g, def.id)
      .replace(/{{DEF_NUMBER}}/g, def.number)
      .replace(/{{DEFINITION_TEXT}}/g, def.definition)
      .replace(/{{USAGE_TEXT}}/g, def.usage)
      .replace(/{{AUTHOR}}/g, def.author);
  }).join('\n');

  // Generate definitions data for JavaScript
  const definitionsData = JSON.stringify(termData.definitions.map(def => ({
    id: def.id,
    definition: def.definition,
    usage: def.usage,
    author: def.author,
    isPrimary: def.id === 'def-1',
    upvotes: 0,
    downvotes: 0,
    netScore: 0
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
