/**
 * AirtableService - Production-ready API layer for Floundermode Dictionary
 * 
 * Features:
 * - Rate limiting (5 req/sec per Airtable limits)
 * - Smart caching with TTL
 * - Fallback to static data on API failures
 * - Multi-definition support with voting
 * - Browser-compatible (can be used in frontend)
 */

// Environment setup (Node.js only - frontend will use different config)
if (typeof require !== 'undefined') {
  require('dotenv').config();
}

class RateLimiter {
  constructor(maxRequests = 5, timeWindow = 1000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  async execute(fn) {
    await this.waitIfNeeded();
    this.requests.push(Date.now());
    return fn();
  }

  async waitIfNeeded() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest) + 100; // +100ms buffer
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

class AirtableCache {
  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    return this.get(key) !== null;
  }
}

class AirtableService {
  constructor(config = {}) {
    // Configuration
    this.token = config.token || process.env?.AIRTABLE_TOKEN;
    this.baseId = config.baseId || process.env?.AIRTABLE_BASE_ID;
    this.baseUrl = `https://api.airtable.com/v0/${this.baseId}`;
    
    // Components
    this.rateLimiter = new RateLimiter(5, 1000); // 5 requests per second
    this.cache = new AirtableCache();
    
    // Headers
    this.headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
    
    // Fallback data
    this.fallbackData = null;
    this.loadFallbackData();
  }

  /**
   * Load fallback data (static JSON) for offline/error scenarios
   */
  async loadFallbackData() {
    try {
      // In browser environment, fetch from static file
      if (typeof window !== 'undefined') {
        const response = await fetch('/terms/terms.json');
        const jsonData = await response.json();
        this.fallbackData = this.transformJsonToAirtableFormat(jsonData);
      }
      // In Node.js environment, read from file
      else if (typeof require !== 'undefined') {
        const fs = require('fs');
        const jsonData = JSON.parse(fs.readFileSync('./terms/terms.json', 'utf8'));
        this.fallbackData = this.transformJsonToAirtableFormat(jsonData);
      }
    } catch (error) {
      console.warn('Could not load fallback data:', error.message);
    }
  }

  /**
   * Transform original JSON format to match Airtable structure
   */
  transformJsonToAirtableFormat(jsonData) {
    const terms = [];
    const definitions = [];
    const categories = new Set();

    jsonData.forEach((item, index) => {
      // Extract categories
      item.related.forEach(cat => categories.add(cat));

      // Create term
      const termSlug = this.generateSlug(item.term);
      terms.push({
        id: `fallback-term-${index}`,
        fields: {
          'Term Name': item.term,
          'Slug': termSlug
        }
      });

      // Create definition
      definitions.push({
        id: `fallback-def-${index}`,
        fields: {
          'Definition Text': item.definition,
          'Usage Example': item.usage,
          'Term Name (from Term)': item.term,
          'Upvotes': 10,
          'Downvotes': 0,
          'Net Score': 10,
          'Status': 'Published'
        }
      });
    });

    return {
      terms,
      definitions,
      categories: Array.from(categories).map((cat, index) => ({
        id: `fallback-cat-${index}`,
        fields: {
          'Category Name': cat,
          'Status': 'Active'
        }
      }))
    };
  }

  /**
   * Generate URL-friendly slug from term name
   */
  generateSlug(text) {
    if (!text || typeof text !== 'string') {
      return 'untitled-term';
    }
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Make rate-limited request to Airtable API
   */
  async makeRequest(endpoint, options = {}) {
    if (!this.token || !this.baseId) {
      throw new Error('Airtable credentials not configured');
    }

    return this.rateLimiter.execute(async () => {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint}`;
      
      const response = await fetch(url, {
        headers: this.headers,
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      return response.json();
    });
  }

  /**
   * Fetch all terms with caching
   */
  async fetchTerms() {
    const cacheKey = 'all-terms';
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const data = await this.makeRequest('Terms?sort%5B0%5D%5Bfield%5D=Term%20Name');
      const formatted = this.formatTermsData(data.records);
      
      // Cache for 5 minutes
      this.cache.set(cacheKey, formatted, 5 * 60 * 1000);
      
      return formatted;
    } catch (error) {
      console.warn('Failed to fetch terms from Airtable:', error.message);
      
      // Fallback to static data
      if (this.fallbackData) {
        return this.formatTermsData(this.fallbackData.terms);
      }
      
      throw error;
    }
  }

  /**
   * Fetch definitions for a specific term
   */
  async fetchDefinitionsForTerm(termSlug) {
    const cacheKey = `definitions-${termSlug}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // First, find the term to get its ID
      const terms = await this.fetchTerms();
      const term = terms.find(t => t.slug === termSlug);
      
      if (!term) {
        throw new Error(`Term not found: ${termSlug}`);
      }

      // Fetch definitions linked to this term
      const filterFormula = `{Term Name (from Term)} = "${term.name}"`;
      const url = `Definitions?filterByFormula=${encodeURIComponent(filterFormula)}&sort%5B0%5D%5Bfield%5D=Net%20Score&sort%5B0%5D%5Bdirection%5D=desc`;
      
      const data = await this.makeRequest(url);
      const formatted = this.formatDefinitionsData(data.records);
      
      // Cache for 2 minutes (shorter for dynamic voting data)
      this.cache.set(cacheKey, formatted, 2 * 60 * 1000);
      
      return formatted;
    } catch (error) {
      console.warn('Failed to fetch definitions from Airtable:', error.message);
      
      // Fallback to static data
      if (this.fallbackData) {
        const fallbackDefs = this.fallbackData.definitions.filter(
          def => this.generateSlug(def.fields['Term Name (from Term)']) === termSlug
        );
        return this.formatDefinitionsData(fallbackDefs);
      }
      
      return [];
    }
  }

  /**
   * Search terms and definitions
   */
  async searchTerms(query) {
    const terms = await this.fetchTerms();
    const results = [];

    // Search term names
    terms.forEach(term => {
      if (term.name && term.name.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          type: 'term',
          term: term.name,
          slug: term.slug,
          score: term.name.toLowerCase() === query.toLowerCase() ? 100 : 50
        });
      }
    });

    // Search definition content (load definitions for matching terms)
    const searchPromises = terms.map(async term => {
      try {
        const definitions = await this.fetchDefinitionsForTerm(term.slug);
        definitions.forEach(def => {
          if ((def.definition && def.definition.toLowerCase().includes(query.toLowerCase())) ||
              (def.usage && def.usage.toLowerCase().includes(query.toLowerCase()))) {
            results.push({
              type: 'definition',
              term: term.name,
              slug: term.slug,
              definition: def.definition,
              score: 25
            });
          }
        });
      } catch (error) {
        // Skip terms that fail to load
      }
    });

    await Promise.allSettled(searchPromises);

    // Sort by relevance score and remove duplicates
    return results
      .sort((a, b) => b.score - a.score)
      .filter((result, index, self) => 
        index === self.findIndex(r => r.slug === result.slug && r.type === result.type)
      );
  }

  /**
   * Submit a vote for a definition
   */
  async submitVote(definitionId, voteType, userId) {
    try {
      // In a real implementation, you'd track individual votes
      // For now, we'll directly update the upvote/downvote counts
      
      const currentDef = await this.makeRequest(`Definitions/${definitionId}`);
      const currentUpvotes = currentDef.fields.Upvotes || 0;
      const currentDownvotes = currentDef.fields.Downvotes || 0;
      
      const updates = {};
      if (voteType === 'up') {
        updates.Upvotes = currentUpvotes + 1;
      } else if (voteType === 'down') {
        updates.Downvotes = currentDownvotes + 1;
      }
      
      await this.makeRequest(`Definitions/${definitionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ fields: updates })
      });
      
      // Clear relevant caches
      this.cache.clear();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to submit vote:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit a new definition
   */
  async submitDefinition(termName, definitionData) {
    try {
      // Find or create the term
      const terms = await this.fetchTerms();
      let term = terms.find(t => t.name.toLowerCase() === termName.toLowerCase());
      
      let termId;
      if (term) {
        termId = term.id;
      } else {
        // Create new term
        const newTerm = await this.makeRequest('Terms', {
          method: 'POST',
          body: JSON.stringify({
            fields: {
              'Term Name': termName
            }
          })
        });
        termId = newTerm.id;
      }
      
      // Create the definition
      const payload = {
        fields: {
          'Definition Text': definitionData.definition,
          'Term': [termId],
          'Usage Example': definitionData.usage || '',
          'Upvotes': 0,
          'Downvotes': 0,
          'Status': 'Pending' // Requires moderation
        }
      };
      
      const result = await this.makeRequest('Definitions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      // Clear caches
      this.cache.clear();
      
      return { success: true, id: result.id };
    } catch (error) {
      console.error('Failed to submit definition:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate a unique user ID for voting (browser fingerprint)
   */
  generateUserId() {
    if (typeof localStorage !== 'undefined') {
      let userId = localStorage.getItem('flounder-user-id');
      if (!userId) {
        userId = 'user-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
        localStorage.setItem('flounder-user-id', userId);
      }
      return userId;
    }
    
    // Fallback for non-browser environments
    return 'anonymous-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Format terms data for frontend consumption
   */
  formatTermsData(records) {
    return records
      .filter(record => record.fields && record.fields['Term Name']) // Filter out records without names
      .map(record => ({
        id: record.id,
        name: record.fields['Term Name'],
        slug: record.fields['Slug'] || this.generateSlug(record.fields['Term Name']),
        totalDefinitions: record.fields['Total Definitions'] || 0,
        categories: record.fields['Categories'] || []
      }));
  }

  /**
   * Format definitions data for frontend consumption
   */
  formatDefinitionsData(records) {
    return records.map(record => ({
      id: record.id,
      definition: record.fields['Definition Text'],
      usage: record.fields['Usage Example'] || '',
      upvotes: record.fields['Upvotes'] || 0,
      downvotes: record.fields['Downvotes'] || 0,
      netScore: record.fields['Net Score'] || 0,
      status: record.fields['Status'] || 'Published',
      termName: record.fields['Term Name (from Term)']
    }));
  }

  /**
   * Get health status of the service
   */
  async getHealthStatus() {
    try {
      await this.makeRequest('Terms?maxRecords=1');
      return {
        status: 'healthy',
        airtable: 'connected',
        cache: `${this.cache.cache.size} items`,
        fallback: this.fallbackData ? 'available' : 'unavailable'
      };
    } catch (error) {
      return {
        status: 'degraded',
        airtable: 'disconnected',
        error: error.message,
        fallback: this.fallbackData ? 'active' : 'unavailable'
      };
    }
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AirtableService;
} else if (typeof window !== 'undefined') {
  window.AirtableService = AirtableService;
}
