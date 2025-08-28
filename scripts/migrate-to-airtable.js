// Migration script: JSON to Airtable
const fs = require('fs');
require('dotenv').config();

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_TOKEN || !BASE_ID) {
  console.error('❌ Missing environment variables!');
  console.error('   Please create a .env file with AIRTABLE_TOKEN and AIRTABLE_BASE_ID');
  console.error('   See .env.example for reference');
  process.exit(1);
}

class AirtableMigrator {
  constructor() {
    this.baseUrl = `https://api.airtable.com/v0/${BASE_ID}`;
    this.headers = {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    };
    this.createdCategories = new Map(); // name -> record ID
    this.createdTerms = new Map(); // term name -> record ID
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(url, method = 'GET', body = null) {
    const options = {
      method,
      headers: this.headers
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
    }
    
    // Rate limiting: wait a bit between requests
    await this.sleep(200);
    
    return response.json();
  }

  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async createCategories(termsData) {
    console.log('📁 Creating categories...');
    
    // Extract all unique categories
    const allCategories = new Set();
    termsData.forEach(term => {
      term.related.forEach(category => allCategories.add(category));
    });
    
    console.log(`   Found ${allCategories.size} unique categories: ${Array.from(allCategories).join(', ')}`);
    
    // Create category records
    for (const categoryName of allCategories) {
      try {
        const payload = {
          fields: {
            'Category Name': categoryName,
            'Description': `Auto-generated category for ${categoryName}-related terms`,
            'Status': 'Active'
          }
        };
        
        const result = await this.makeRequest(`${this.baseUrl}/Categories`, 'POST', payload);
        this.createdCategories.set(categoryName, result.id);
        console.log(`   ✅ Created category: "${categoryName}" (${result.id})`);
        
      } catch (error) {
        console.error(`   ❌ Failed to create category "${categoryName}":`, error.message);
      }
    }
    
    console.log(`✅ Created ${this.createdCategories.size} categories\n`);
  }

  async createTerms(termsData) {
    console.log('📝 Creating terms...');
    
    for (const termData of termsData) {
      try {
        // Get category IDs for this term
        const categoryIds = termData.related
          .map(catName => this.createdCategories.get(catName))
          .filter(id => id); // Remove any undefined IDs
        
        const payload = {
          fields: {
            'Term Name': termData.term,
            'Categories': categoryIds // Link to category records
          }
        };
        
        const result = await this.makeRequest(`${this.baseUrl}/Terms`, 'POST', payload);
        this.createdTerms.set(termData.term, result.id);
        console.log(`   ✅ Created term: "${termData.term}" (${result.id})`);
        
      } catch (error) {
        console.error(`   ❌ Failed to create term "${termData.term}":`, error.message);
      }
    }
    
    console.log(`✅ Created ${this.createdTerms.size} terms\n`);
  }

  async createDefinitions(termsData) {
    console.log('📖 Creating definitions...');
    
    for (const termData of termsData) {
      try {
        const termId = this.createdTerms.get(termData.term);
        if (!termId) {
          console.error(`   ❌ No term ID found for "${termData.term}"`);
          continue;
        }
        
        const payload = {
          fields: {
            'Definition Text': termData.definition,
            'Term': [termId], // Link to term record
            'Usage Example': termData.usage,
            'Author': 'original',
            'Upvotes': 10, // Give original definitions baseline votes
            'Downvotes': 0,
            'Status': 'Published'
          }
        };
        
        const result = await this.makeRequest(`${this.baseUrl}/Definitions`, 'POST', payload);
        console.log(`   ✅ Created definition for: "${termData.term}" (${result.id})`);
        
      } catch (error) {
        console.error(`   ❌ Failed to create definition for "${termData.term}":`, error.message);
      }
    }
    
    console.log(`✅ Created definitions for all terms\n`);
  }

  async migrate() {
    console.log('🚀 Starting migration from terms.json to Airtable...\n');
    
    try {
      // Load JSON data
      const jsonData = fs.readFileSync('./terms/terms.json', 'utf8');
      const termsData = JSON.parse(jsonData);
      
      console.log(`📊 Loaded ${termsData.length} terms from JSON\n`);
      
      // Step 1: Create categories
      await this.createCategories(termsData);
      
      // Step 2: Create terms (linked to categories)
      await this.createTerms(termsData);
      
      // Step 3: Create definitions (linked to terms)
      await this.createDefinitions(termsData);
      
      console.log('🎉 Migration completed successfully!');
      console.log('\n📋 Migration Summary:');
      console.log(`   - ${this.createdCategories.size} categories created`);
      console.log(`   - ${this.createdTerms.size} terms created`);
      console.log(`   - ${termsData.length} definitions created`);
      console.log('\n✨ Your Airtable dictionary is ready!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the migration
const migrator = new AirtableMigrator();
migrator.migrate();
