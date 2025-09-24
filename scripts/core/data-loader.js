/* Floundermode Dictionary - Data Loading Module */

// Private variable for data management
let flounderTerms = [];

// Dynamic term loading function
async function loadAllTerms() {
  try {
    // First, try to get the list of term files from a manifest or API
    // For now, we'll use a fallback approach that tries to load common patterns
    const possibleTerms = await discoverTermFiles();
    const terms = [];
    
    for (const file of possibleTerms) {
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
          
          terms.push(term);
        }
      } catch (error) {
        console.warn(`Failed to load term file ${file}:`, error);
      }
    }
    
    flounderTerms = terms;
    console.log(`Loaded ${terms.length} terms`);
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

// Export functions for use by other modules
window.DataLoader = {
  loadAllTerms,
  getAllTerms,
  getTermByName,
  getDefinitionById,
  discoverTermFiles
};
