// List all bases accessible by this token
require('dotenv').config();

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

if (!AIRTABLE_TOKEN) {
  console.error('❌ Missing AIRTABLE_TOKEN environment variable!');
  process.exit(1);
}

async function listAllBases() {
  console.log('🔍 Listing all bases accessible by this token...\n');
  
  try {
    const response = await fetch('https://api.airtable.com/v0/meta/bases', {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.bases.length} accessible bases:\n`);
      
      data.bases.forEach((base, index) => {
        console.log(`${index + 1}. "${base.name}"`);
        console.log(`   Base ID: ${base.id}`);
        console.log(`   Permission level: ${base.permissionLevel}`);
        console.log('');
      });
      
      // Look specifically for our dictionary
      const flounderBase = data.bases.find(base => 
        base.name.toLowerCase().includes('flounder') || 
        base.name.toLowerCase().includes('dictionary')
      );
      
      if (flounderBase) {
        console.log(`🎯 Found Floundermode base!`);
        console.log(`   Correct Base ID: ${flounderBase.id}`);
      } else {
        console.log(`❌ No bases found with "flounder" or "dictionary" in the name`);
        console.log(`   Please check which base contains your dictionary tables`);
      }
      
    } else {
      console.log(`❌ Failed to list bases: ${response.status} - ${response.statusText}`);
      const errorData = await response.json();
      console.log('Error details:', errorData);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

listAllBases();
