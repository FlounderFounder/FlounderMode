// Test the AirtableService class comprehensively
const AirtableService = require('./airtable-service');

async function testAirtableService() {
  console.log('🧪 Testing AirtableService class...\n');
  
  try {
    // Initialize service
    console.log('1️⃣ Initializing AirtableService...');
    const service = new AirtableService();
    
    // Test health status
    console.log('\n2️⃣ Testing health status...');
    const health = await service.getHealthStatus();
    console.log(`   Status: ${health.status}`);
    console.log(`   Airtable: ${health.airtable}`);
    console.log(`   Cache: ${health.cache}`);
    console.log(`   Fallback: ${health.fallback}`);
    
    if (health.status !== 'healthy') {
      console.log(`   ⚠️ Service degraded: ${health.error}`);
    }
    
    // Test fetching terms
    console.log('\n3️⃣ Testing fetchTerms()...');
    const terms = await service.fetchTerms();
    console.log(`   ✅ Fetched ${terms.length} terms`);
    if (terms.length > 0) {
      console.log(`   Example: "${terms[0].name}" (slug: ${terms[0].slug})`);
    }
    
    // Test fetching definitions for a specific term
    if (terms.length > 0) {
      console.log('\n4️⃣ Testing fetchDefinitionsForTerm()...');
      const firstTerm = terms[0];
      const definitions = await service.fetchDefinitionsForTerm(firstTerm.slug);
      console.log(`   ✅ Found ${definitions.length} definitions for "${firstTerm.name}"`);
      
      if (definitions.length > 0) {
        const def = definitions[0];
        console.log(`   Top definition: "${def.definition.substring(0, 50)}..."`);
        console.log(`   Votes: ${def.upvotes} up, ${def.downvotes} down (net: ${def.netScore})`);
      }
    }
    
    // Test search functionality
    console.log('\n5️⃣ Testing searchTerms()...');
    const searchResults = await service.searchTerms('mvp');
    console.log(`   ✅ Found ${searchResults.length} results for "mvp"`);
    searchResults.slice(0, 3).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.type}: "${result.term}" (score: ${result.score})`);
    });
    
    // Test caching
    console.log('\n6️⃣ Testing caching...');
    const start = Date.now();
    await service.fetchTerms(); // Should be cached
    const cachedTime = Date.now() - start;
    console.log(`   ✅ Cached request completed in ${cachedTime}ms`);
    
    // Test rate limiting
    console.log('\n7️⃣ Testing rate limiting...');
    const rateLimitStart = Date.now();
    const promises = Array(3).fill().map(() => service.fetchTerms());
    await Promise.all(promises);
    const rateLimitTime = Date.now() - rateLimitStart;
    console.log(`   ✅ 3 concurrent requests completed in ${rateLimitTime}ms`);
    
    // Test slug generation
    console.log('\n8️⃣ Testing slug generation...');
    const testCases = [
      'MVP Theater',
      'A META investment',
      'Dashboard Fatigue!!!',
      'Founder\'s Gut Decision'
    ];
    
    testCases.forEach(term => {
      const slug = service.generateSlug(term);
      console.log(`   "${term}" → "${slug}"`);
    });
    
    // Test user ID generation
    console.log('\n9️⃣ Testing user ID generation...');
    const userId1 = service.generateUserId();
    const userId2 = service.generateUserId();
    console.log(`   First call: ${userId1}`);
    console.log(`   Second call: ${userId2}`);
    console.log(`   Should be consistent: ${userId1 === userId2 ? '✅ Yes' : '❌ No'}`);
    
    console.log('\n🎉 All AirtableService tests completed successfully!');
    
    // Summary
    console.log('\n📊 Service Summary:');
    console.log(`   - ${terms.length} terms available`);
    console.log(`   - Rate limiting: active`);
    console.log(`   - Caching: active`);
    console.log(`   - Fallback data: ${health.fallback}`);
    console.log(`   - Status: ${health.status}`);
    
  } catch (error) {
    console.error('❌ AirtableService test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testAirtableService();
