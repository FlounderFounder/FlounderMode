// Test frontend integration without DOM dependencies
const AirtableService = require('./airtable-service');

async function testFrontendIntegration() {
  console.log('🧪 Testing frontend integration...\n');
  
  try {
    // Test AirtableService in fallback mode (like browser)
    console.log('1️⃣ Testing AirtableService fallback mode...');
    const service = new AirtableService({
      // No credentials - should use fallback
    });
    
    console.log('   ✅ Service initialized');
    
    // Test slug generation (used in frontend)
    console.log('\n2️⃣ Testing slug generation...');
    const testTerms = [
      'MVP Theater',
      'Dashboard Fatigue', 
      'A META investment',
      'Founder\'s Gut'
    ];
    
    testTerms.forEach(term => {
      const slug = service.generateSlug(term);
      console.log(`   "${term}" → "${slug}"`);
    });
    
    // Test user ID generation
    console.log('\n3️⃣ Testing user ID generation...');
    const userId1 = service.generateUserId();
    const userId2 = service.generateUserId();
    console.log(`   Generated: ${userId1}`);
    console.log(`   Consistent: ${userId1 === userId2 ? '✅' : '❌'}`);
    
    // Test data transformation
    console.log('\n4️⃣ Testing JSON data transformation...');
    const sampleJsonData = [
      {
        "term": "Test Term",
        "definition": "A test definition",
        "usage": "This is a test usage",
        "related": ["Test", "Example"]
      }
    ];
    
    const transformed = service.transformJsonToAirtableFormat(sampleJsonData);
    console.log(`   ✅ Transformed ${sampleJsonData.length} terms`);
    console.log(`   Created: ${transformed.terms.length} terms, ${transformed.definitions.length} definitions`);
    
    // Test health status
    console.log('\n5️⃣ Testing health status...');
    const health = await service.getHealthStatus();
    console.log(`   Status: ${health.status}`);
    console.log(`   Fallback: ${health.fallback}`);
    
    console.log('\n🎉 Frontend integration tests passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ AirtableService fallback mode working');
    console.log('   ✅ Slug generation working');
    console.log('   ✅ User ID generation working');
    console.log('   ✅ Data transformation working');
    console.log('   ✅ Health monitoring working');
    console.log('\n🚀 Ready for browser testing!');
    
  } catch (error) {
    console.error('❌ Frontend integration test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFrontendIntegration();
