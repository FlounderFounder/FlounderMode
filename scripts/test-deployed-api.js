/**
 * Test script for deployed API endpoints
 * Usage: node scripts/test-deployed-api.js <your-vercel-url>
 */

async function testDeployedAPI(baseUrl) {
  console.log(`🧪 Testing deployed API at: ${baseUrl}\n`);

  const tests = [
    {
      name: '🔍 Health Check',
      url: `${baseUrl}/api/terms?health=true`,
      method: 'GET'
    },
    {
      name: '📋 Fetch All Terms',
      url: `${baseUrl}/api/terms`,
      method: 'GET'
    },
    {
      name: '🔎 Search Terms',
      url: `${baseUrl}/api/terms?search=mvp`,
      method: 'GET'
    },
    {
      name: '📖 Get Specific Term',
      url: `${baseUrl}/api/terms?slug=mvp-theater`,
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`${test.name}...`);
      const response = await fetch(test.url);
      const data = await response.json();
      
      if (response.ok) {
        if (test.name.includes('Health')) {
          console.log(`   ✅ Status: ${data.status}`);
          console.log(`   📊 Airtable: ${data.airtable}`);
        } else if (data.success) {
          console.log(`   ✅ Success! Found ${data.count} items`);
        } else {
          console.log(`   ⚠️  API returned: ${data.error}`);
        }
      } else {
        console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
    console.log('');
  }

  console.log('🎯 Test Complete!');
  console.log('\n📱 Next steps:');
  console.log(`   - Visit: ${baseUrl}`);
  console.log('   - Test search functionality');
  console.log('   - Try clicking on terms');
  console.log('   - Test voting (if available)');
}

// Get URL from command line argument
const url = process.argv[2];
if (!url) {
  console.log('❌ Please provide your Vercel URL:');
  console.log('   node scripts/test-deployed-api.js https://your-project.vercel.app');
  process.exit(1);
}

// Remove trailing slash
const cleanUrl = url.replace(/\/$/, '');

testDeployedAPI(cleanUrl).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
