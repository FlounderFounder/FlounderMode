// Fix definitions migration - remove Author field issue
const fs = require('fs');
require('dotenv').config();

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_TOKEN || !BASE_ID) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

async function fixDefinitions() {
  console.log('🔧 Creating definitions (without Author field)...\n');
  
  const headers = {
    'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
    'Content-Type': 'application/json'
  };

  // Load JSON data
  const jsonData = fs.readFileSync('./terms/terms.json', 'utf8');
  const termsData = JSON.parse(jsonData);

  // Get existing terms to link to
  const termsResponse = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Terms`, {
    headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
  });
  const termsAirtableData = await termsResponse.json();
  
  // Create a map of term names to IDs
  const termMap = new Map();
  termsAirtableData.records.forEach(record => {
    const termName = record.fields['Term Name'];
    termMap.set(termName, record.id);
  });

  console.log(`📋 Found ${termMap.size} existing terms in Airtable\n`);

  // Create definitions
  for (const termData of termsData) {
    try {
      const termId = termMap.get(termData.term);
      if (!termId) {
        console.error(`   ❌ No term ID found for "${termData.term}"`);
        continue;
      }
      
      const payload = {
        fields: {
          'Definition Text': termData.definition,
          'Term': [termId], // Link to term record
          'Usage Example': termData.usage,
          // Remove 'Author' field - it's computed
          'Upvotes': 10, // Give original definitions baseline votes
          'Downvotes': 0,
          'Status': 'Published'
        }
      };
      
      const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Definitions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ Created definition for: "${termData.term}" (${result.id})`);
      } else {
        const errorData = await response.json();
        console.error(`   ❌ Failed to create definition for "${termData.term}":`, errorData.error?.message);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`   ❌ Failed to create definition for "${termData.term}":`, error.message);
    }
  }
  
  console.log('\n🎉 Definitions creation completed!');
}

fixDefinitions();
