#!/usr/bin/env node

/**
 * Term Validation Script
 * Validates JSON files in the terms/ directory and checks for duplicates
 */

const fs = require('fs');
const path = require('path');

function validateTerms() {
  console.log('🔍 Validating terms in terms/ directory...\n');
  
  const termsDir = 'terms';
  const errors = [];
  const terms = [];
  
  // Check if terms directory exists
  if (!fs.existsSync(termsDir)) {
    console.error('❌ Terms directory does not exist');
    process.exit(1);
  }
  
  // Read all JSON files
  const files = fs.readdirSync(termsDir).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.log('⚠️  No JSON files found in terms/ directory');
    return;
  }
  
  console.log(`Found ${files.length} term files:\n`);
  
  // Validate each file
  for (const file of files) {
    const filePath = path.join(termsDir, file);
    console.log(`📄 Validating ${file}...`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const term = JSON.parse(content);
      
      // Check required fields
      const requiredFields = ['term', 'definition', 'usage'];
      const missingFields = requiredFields.filter(field => !term[field]);
      
      if (missingFields.length > 0) {
        errors.push(`${file}: Missing required fields: ${missingFields.join(', ')}`);
        console.log(`  ❌ Missing fields: ${missingFields.join(', ')}`);
        continue;
      }
      
      // Check field types
      if (typeof term.term !== 'string') {
        errors.push(`${file}: 'term' must be a string`);
        console.log(`  ❌ 'term' field must be a string`);
        continue;
      }
      
      if (typeof term.definition !== 'string') {
        errors.push(`${file}: 'definition' must be a string`);
        console.log(`  ❌ 'definition' field must be a string`);
        continue;
      }
      
      if (typeof term.usage !== 'string') {
        errors.push(`${file}: 'usage' must be a string`);
        console.log(`  ❌ 'usage' field must be a string`);
        continue;
      }
      
      if (!Array.isArray(term.related)) {
        errors.push(`${file}: 'related' must be an array`);
        console.log(`  ❌ 'related' field must be an array`);
        continue;
      }
      
      // Check field lengths
      if (term.term.length > 50) {
        errors.push(`${file}: 'term' is too long (${term.term.length} chars, max 50)`);
        console.log(`  ❌ 'term' is too long (${term.term.length} chars, max 50)`);
        continue;
      }
      
      if (term.definition.length > 200) {
        errors.push(`${file}: 'definition' is too long (${term.definition.length} chars, max 200)`);
        console.log(`  ❌ 'definition' is too long (${term.definition.length} chars, max 200)`);
        continue;
      }
      
      if (term.usage.length > 150) {
        errors.push(`${file}: 'usage' is too long (${term.usage.length} chars, max 150)`);
        console.log(`  ❌ 'usage' is too long (${term.usage.length} chars, max 150)`);
        continue;
      }
      
      if (term.related.length > 4) {
        errors.push(`${file}: 'related' has too many tags (${term.related.length}, max 4)`);
        console.log(`  ❌ 'related' has too many tags (${term.related.length}, max 4)`);
        continue;
      }
      
      // Store term for duplicate checking
      terms.push({
        term: term.term.toLowerCase().trim(),
        originalTerm: term.term,
        file: file
      });
      
      console.log(`  ✅ Valid`);
      
    } catch (error) {
      errors.push(`${file}: Invalid JSON - ${error.message}`);
      console.log(`  ❌ Invalid JSON: ${error.message}`);
    }
  }
  
  // Check for duplicates
  console.log(`\n🔍 Checking for duplicate terms...\n`);
  
  const seen = new Set();
  const duplicates = [];
  
  for (const { term, originalTerm, file } of terms) {
    if (seen.has(term)) {
      duplicates.push({ term: originalTerm, file });
    } else {
      seen.add(term);
    }
  }
  
  if (duplicates.length > 0) {
    console.log('❌ Duplicate terms found:');
    duplicates.forEach(({ term, file }) => {
      console.log(`  - "${term}" in ${file}`);
    });
    errors.push(`Found ${duplicates.length} duplicate terms`);
  } else {
    console.log('✅ No duplicate terms found');
  }
  
  // Summary
  console.log(`\n📊 Validation Summary:`);
  console.log(`  Total files: ${files.length}`);
  console.log(`  Valid files: ${files.length - errors.length}`);
  console.log(`  Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Validation failed with ${errors.length} error(s):`);
    errors.forEach(error => console.log(`  - ${error}`));
    process.exit(1);
  } else {
    console.log(`\n✅ All terms are valid!`);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateTerms();
}

module.exports = { validateTerms };
