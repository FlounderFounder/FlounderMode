/**
 * Test script to verify API setup and functionality
 */
const fs = require('fs');
const path = require('path');

async function testApiSetup() {
  console.log('🧪 Testing API Setup...\n');

  // Check required files exist
  console.log('📁 Checking file structure...');
  const requiredFiles = [
    'api/terms.js',
    'scripts/airtable-service.js',
    '.env.example',
    'vercel.json'
  ];

  let allFilesExist = true;
  for (const file of requiredFiles) {
    const exists = fs.existsSync(file);
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
  }

  if (!allFilesExist) {
    console.log('\n❌ Some required files are missing!');
    return;
  }

  // Check environment configuration
  console.log('\n🔧 Checking environment configuration...');
  const hasEnvExample = fs.existsSync('.env.example');
  const hasEnv = fs.existsSync('.env');
  
  console.log(`   ${hasEnvExample ? '✅' : '❌'} .env.example exists`);
  console.log(`   ${hasEnv ? '✅' : '⚠️ '} .env exists ${!hasEnv ? '(will use fallback data)' : ''}`);

  if (hasEnv) {
    require('dotenv').config();
    const hasToken = !!process.env.AIRTABLE_TOKEN;
    const hasBaseId = !!process.env.AIRTABLE_BASE_ID;
    console.log(`   ${hasToken ? '✅' : '❌'} AIRTABLE_TOKEN configured`);
    console.log(`   ${hasBaseId ? '✅' : '❌'} AIRTABLE_BASE_ID configured`);
  }

  // Test AirtableService
  console.log('\n📊 Testing AirtableService...');
  try {
    const AirtableService = require('./airtable-service');
    const service = new AirtableService({
      token: process.env.AIRTABLE_TOKEN,
      baseId: process.env.AIRTABLE_BASE_ID
    });

    console.log('   ✅ AirtableService instantiated');

    // Test slug generation
    const testSlug = service.generateSlug('Test Term 123!');
    console.log(`   ✅ Slug generation: "${testSlug}"`);

    // Test health status
    const health = await service.getHealthStatus();
    console.log(`   ${health.status === 'healthy' ? '✅' : '⚠️ '} Health status: ${health.status}`);
    
    if (health.airtable === 'connected') {
      console.log('   ✅ Airtable connection successful');
      
      // Test basic data fetch
      try {
        const terms = await service.fetchTerms();
        console.log(`   ✅ Fetched ${terms.length} terms from Airtable`);
      } catch (error) {
        console.log(`   ⚠️  Terms fetch failed: ${error.message}`);
      }
    } else {
      console.log(`   ⚠️  Airtable disconnected: ${health.error || 'No credentials'}`);
      console.log('   📋 Will use fallback JSON data');
    }

  } catch (error) {
    console.log(`   ❌ AirtableService test failed: ${error.message}`);
  }

  // Check frontend integration files
  console.log('\n🌐 Checking frontend integration...');
  try {
    const mainJs = fs.readFileSync('scripts/main.js', 'utf8');
    const hasApiService = mainJs.includes('apiService');
    const hasApiBase = mainJs.includes('API_BASE');
    const hasFallback = mainJs.includes('getFallbackTerms');
    
    console.log(`   ${hasApiService ? '✅' : '❌'} API service integration`);
    console.log(`   ${hasApiBase ? '✅' : '❌'} API base URL configuration`);
    console.log(`   ${hasFallback ? '✅' : '❌'} Fallback methods`);
  } catch (error) {
    console.log(`   ❌ Frontend check failed: ${error.message}`);
  }

  // Display next steps
  console.log('\n🚀 Next Steps:');
  if (!hasEnv) {
    console.log('   1. Copy .env.example to .env and fill in your Airtable credentials');
  }
  console.log('   2. Install Vercel CLI: npm install -g vercel');
  console.log('   3. Test locally: npm run dev:vercel');
  console.log('   4. Deploy: npm run deploy');
  console.log('\n📚 Documentation:');
  console.log('   - Airtable tokens: https://airtable.com/create/tokens');
  console.log('   - Vercel deployment: https://vercel.com/docs');

  console.log('\n✅ API setup test completed!');
}

// Run the test
if (require.main === module) {
  testApiSetup().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = testApiSetup;
