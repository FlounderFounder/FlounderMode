// Test Airtable API connection for Floundermode Dictionary
require('dotenv').config();

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_TOKEN || !BASE_ID) {
  console.error('❌ Missing environment variables!');
  console.error('   Please create a .env file with AIRTABLE_TOKEN and AIRTABLE_BASE_ID');
  console.error('   See .env.example for reference');
  process.exit(1);
}

async function testAirtableConnection() {
  console.log('🧪 Testing Airtable connection...\n');
  
  try {
    // Test 1: Fetch Terms
    console.log('📝 Fetching Terms...');
    const termsResponse = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Terms`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });
    
    if (!termsResponse.ok) {
      throw new Error(`Terms API error: ${termsResponse.status} - ${termsResponse.statusText}`);
    }
    
    const termsData = await termsResponse.json();
    console.log(`✅ Found ${termsData.records.length} terms`);
    if (termsData.records.length > 0) {
      console.log(`   Example: "${termsData.records[0]?.fields['Term Name'] || 'No name'}"`);
      console.log(`   Slug: "${termsData.records[0]?.fields['Slug'] || 'No slug'}"`);
    }
    console.log('');
    
    // Test 2: Fetch Definitions
    console.log('📖 Fetching Definitions...');
    const defsResponse = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Definitions`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });
    
    if (!defsResponse.ok) {
      throw new Error(`Definitions API error: ${defsResponse.status} - ${defsResponse.statusText}`);
    }
    
    const defsData = await defsResponse.json();
    console.log(`✅ Found ${defsData.records.length} definitions`);
    if (defsData.records.length > 0) {
      const firstDef = defsData.records[0]?.fields['Definition Text'] || 'No definition';
      console.log(`   Example: "${firstDef.substring(0, 60)}..."`);
      console.log(`   Upvotes: ${defsData.records[0]?.fields['Upvotes'] || 0}`);
      console.log(`   Net Score: ${defsData.records[0]?.fields['Net Score'] || 0}`);
    }
    console.log('');
    
    // Test 3: Fetch Categories
    console.log('🏷️ Fetching Categories...');
    const catsResponse = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Categories`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });
    
    if (!catsResponse.ok) {
      throw new Error(`Categories API error: ${catsResponse.status} - ${catsResponse.statusText}`);
    }
    
    const catsData = await catsResponse.json();
    console.log(`✅ Found ${catsData.records.length} categories`);
    if (catsData.records.length > 0) {
      console.log(`   Example: "${catsData.records[0]?.fields['Category Name'] || 'No name'}"`);
      console.log(`   Status: ${catsData.records[0]?.fields['Status'] || 'No status'}`);
    }
    console.log('');
    
    // Test 4: Check linking
    console.log('🔗 Testing record linking...');
    if (termsData.records.length > 0 && defsData.records.length > 0) {
      const termWithDefs = termsData.records[0];
      const totalDefs = termWithDefs.fields['Total Definitions'];
      console.log(`✅ Term "${termWithDefs.fields['Term Name']}" has ${totalDefs || 0} linked definitions`);
    }
    console.log('');
    
    console.log('🎉 All tests passed! Airtable is connected properly.');
    console.log('📋 Summary:');
    console.log(`   - ${termsData.records.length} Terms`);
    console.log(`   - ${defsData.records.length} Definitions`);
    console.log(`   - ${catsData.records.length} Categories`);
    console.log('');
    console.log('✨ Ready for migration from terms.json!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   - Check that your Airtable token has read/write permissions');
    console.error('   - Verify the Base ID is correct');
    console.error('   - Make sure the table names match exactly (Terms, Definitions, Categories)');
  }
}

// Run the test
testAirtableConnection();
