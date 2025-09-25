/* Floundermode Dictionary - Data Loading Module */

// Private variable for data management
let flounderTerms = [];

// Dynamic term loading function with parallel fetching
async function loadAllTerms() {
  try {
    // Check cache first
    const cachedTerms = getCachedTerms();
    if (cachedTerms && cachedTerms.length > 0) {
      console.log(`Using cached terms (${cachedTerms.length} terms)`);
      flounderTerms = cachedTerms;
      return cachedTerms;
    }

    // First, try to get the list of term files from a manifest or API
    const possibleTerms = await discoverTermFiles();
    
    // Load all terms in parallel instead of sequentially
    const termPromises = possibleTerms.map(async (file) => {
      try {
        const response = await fetch(`/terms/${file}`);
        if (response.ok) {
          const term = await response.json();
          
          // Handle backward compatibility - convert old format to new format
          if (term.definition && !term.definitions) {
            // Generate unique ID based on term name and file
            const termSlug = term.term.toLowerCase().replace(/[^a-z0-9]/g, '-');
            term.definitions = [{
              id: `${termSlug}-def-1`,
              definition: term.definition,
              usage: term.usage,
              author: 'Carter Wynn',
              date: '2024-01-15',
              isPrimary: true,
              upvotes: 0,
              downvotes: 0,
              netScore: 0
            }];
            delete term.definition;
            delete term.usage;
          }
          
          // Ensure all definitions have voting properties and unique IDs
          if (term.definitions) {
            term.definitions.forEach((def, index) => {
              // Handle legacy 'votes' field from JSON files
              if (def.votes !== undefined && def.upvotes === undefined) {
                def.upvotes = def.votes;
                def.downvotes = 0;
                def.netScore = def.votes;
              } else {
                // Ensure voting properties exist
                def.upvotes = def.upvotes || 0;
                def.downvotes = def.downvotes || 0;
                def.netScore = def.netScore || (def.upvotes - def.downvotes);
              }
              
              // Ensure unique IDs for definitions
              if (def.id === 'def-1' || def.id === 'def-2') {
                const termSlug = term.term.toLowerCase().replace(/[^a-z0-9]/g, '-');
                def.id = `${termSlug}-def-${index + 1}`;
              }
            });
          }
          
          return term;
        }
        return null;
      } catch (error) {
        console.warn(`Failed to load term file ${file}:`, error);
        return null;
      }
    });

    // Wait for all terms to load in parallel
    const termResults = await Promise.all(termPromises);
    const terms = termResults.filter(term => term !== null);
    
    flounderTerms = terms;
    
    // Cache the terms for future loads
    cacheTerms(terms);
    
    console.log(`Loaded ${terms.length} terms in parallel`);
    return terms;
  } catch (error) {
    console.error('Error loading terms:', error);
    return [];
  }
}

// Discover available term files
async function discoverTermFiles() {
  try {
    // Try to load from terms-manifest.json first
    const response = await fetch('/terms-manifest.json');
    if (response.ok) {
      const manifest = await response.json();
      return manifest.terms || [];
    }
  } catch (error) {
    console.warn('Could not load terms manifest, using fallback discovery');
  }
  
  // Fallback: try to discover terms by attempting common patterns
  const fallbackTerms = [
    'dashboard-fatigue.json',
    'founder-gut.json',
    'meta-investment.json',
    'mvp-theater.json',
    'vibe-driven-dev.json'
  ];
  
  return fallbackTerms;
}

// Get all loaded terms
function getAllTerms() {
  return flounderTerms;
}

// Get a specific term by name
function getTermByName(termName) {
  return flounderTerms.find(term => 
    term.term.toLowerCase() === termName.toLowerCase()
  );
}

// Get a specific definition by ID
function getDefinitionById(definitionId) {
  for (const term of flounderTerms) {
    if (term.definitions) {
      const def = term.definitions.find(d => d.id === definitionId);
      if (def) return { term, definition: def };
    }
  }
  return null;
}

// Caching functions for performance
function cacheTerms(terms) {
  try {
    const cacheData = {
      terms: terms,
      timestamp: Date.now(),
      version: '1.0'
    };
    localStorage.setItem('flounderTermsCache', JSON.stringify(cacheData));
    console.log('Terms cached successfully');
  } catch (error) {
    console.warn('Failed to cache terms:', error);
  }
}

function getCachedTerms() {
  try {
    const cached = localStorage.getItem('flounderTermsCache');
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    const cacheAge = Date.now() - cacheData.timestamp;
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    if (cacheAge > maxAge) {
      console.log('Cache expired, clearing');
      localStorage.removeItem('flounderTermsCache');
      return null;
    }
    
    return cacheData.terms;
  } catch (error) {
    console.warn('Failed to read cached terms:', error);
    return null;
  }
}

// Export functions for use by other modules
window.DataLoader = {
  loadAllTerms,
  getAllTerms,
  getTermByName,
  getDefinitionById,
  discoverTermFiles,
  cacheTerms,
  getCachedTerms
};
