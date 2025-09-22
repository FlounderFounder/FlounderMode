// Debug Airtable connection step by step
require('dotenv').config();

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_TOKEN || !BASE_ID) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

async function debugAirtable() {
  console.log('🔍 Debugging Airtable connection...\n');
  
  // Test 1: Check base metadata
  console.log('1️⃣ Testing base access...');
  try {
    const baseResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });
    
    if (baseResponse.ok) {
      const baseData = await baseResponse.json();
      console.log('✅ Base access works!');
      console.log(`   Base name: "${baseData.name}"`);
      console.log(`   Tables found:`);
      baseData.tables.forEach(table => {
        console.log(`     - "${table.name}" (ID: ${table.id})`);
      });
      console.log('');
      
      // Test 2: Try each table
      for (const table of baseData.tables) {
        console.log(`2️⃣ Testing table: "${table.name}"`);
        try {
          const tableResponse = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${table.name}?maxRecords=1`, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
          });
          
          if (tableResponse.ok) {
            const tableData = await tableResponse.json();
            console.log(`   ✅ Table "${table.name}" accessible - ${tableData.records.length} records found`);
          } else {
            console.log(`   ❌ Table "${table.name}" error: ${tableResponse.status}`);
          }
        } catch (error) {
          console.log(`   ❌ Table "${table.name}" error: ${error.message}`);
        }
      }
      
    } else {
      console.log(`❌ Base access failed: ${baseResponse.status} - ${baseResponse.statusText}`);
      const errorData = await baseResponse.json();
      console.log('Error details:', errorData);
    }
    
  } catch (error) {
    console.log(`❌ Base test failed: ${error.message}`);
  }
}

debugAirtable();
