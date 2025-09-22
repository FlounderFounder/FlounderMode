// Test table access directly
require('dotenv').config();

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_TOKEN || !BASE_ID) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

async function testTablesDirectly() {
  console.log('🔍 Testing table access directly...\n');
  
  const tablesToTest = ['Terms', 'Definitions', 'Categories'];
  
  for (const tableName of tablesToTest) {
    console.log(`📋 Testing table: "${tableName}"`);
    
    try {
      const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableName}?maxRecords=3`, {
        headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS! Found ${data.records.length} records`);
        
        if (data.records.length > 0) {
          const firstRecord = data.records[0];
          console.log(`   📄 Sample record fields:`);
          Object.keys(firstRecord.fields).forEach(field => {
            const value = firstRecord.fields[field];
            const displayValue = typeof value === 'string' && value.length > 50 
              ? value.substring(0, 50) + '...' 
              : value;
            console.log(`     - ${field}: ${displayValue}`);
          });
        }
        console.log('');
        
      } else {
        const errorData = await response.json();
        console.log(`   ❌ FAILED: ${response.status} - ${response.statusText}`);
        console.log(`   Error: ${errorData.error?.message || 'Unknown error'}`);
        console.log('');
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      console.log('');
    }
  }
}

testTablesDirectly();
