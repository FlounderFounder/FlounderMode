/* Floundermode Dictionary - Main JavaScript with Airtable Integration */

// Global variables
let flounderTerms = [];
let airtableService = null;
let termDefinitionsCache = new Map();

// Main initialization function
async function init() {
  const searchInput = document.getElementById("searchInput");
  const autocompleteList = document.getElementById("autocompleteList");
  const carousel = document.getElementById("carousel");
  const termModal = document.getElementById("termModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalContent");
  const wotdContainer = document.querySelector(".wotd-container");

  console.log('🚀 Initializing Floundermode Dictionary...');

  // Try API first, fallback to individual JSON files
  const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '/api'  // Local development
    : '/api'; // Production (same path for Vercel)

  // Custom API service that replaces AirtableService
  const apiService = {
    async fetchTerms() {
      try {
        const response = await fetch(`${API_BASE}/terms`);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'API returned error');
        return result.data;
      } catch (error) {
        console.warn('API fetchTerms failed, using fallback:', error.message);
        return this.getFallbackTerms();
      }
    },

    async fetchDefinitionsForTerm(slug) {
      try {
        const response = await fetch(`${API_BASE}/terms?slug=${encodeURIComponent(slug)}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'API returned error');
        return result.data;
      } catch (error) {
        console.warn('API fetchDefinitionsForTerm failed, using fallback:', error.message);
        return this.getFallbackDefinitions(slug);
      }
    },

    async searchTerms(query) {
      try {
        const response = await fetch(`${API_BASE}/terms?search=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'API returned error');
        return result.data;
      } catch (error) {
        console.warn('API searchTerms failed, using fallback:', error.message);
        // Fallback to local search
        const terms = await this.fetchTerms();
        return terms.filter(term => 
          term.name && term.name.toLowerCase().includes(query.toLowerCase())
        ).map(term => ({
          type: 'term',
          term: term.name,
          slug: term.slug
        }));
      }
    },

    async submitVote(definitionId, voteType, userId) {
      try {
        const response = await fetch(`${API_BASE}/terms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'vote', definitionId, voteType, userId })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Vote submission failed:', error.message);
        return { success: false, error: error.message };
      }
    },

    // Utility functions
    generateSlug(text) {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    },

    generateUserId() {
      let userId = localStorage.getItem('flounder-user-id');
      if (!userId) {
        userId = 'user-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
        localStorage.setItem('flounder-user-id', userId);
      }
      return userId;
    },

    // Fallback methods for when API is unavailable
    async getFallbackTerms() {
      try {
        // Try individual JSON files first (our new structure)
        const termFiles = [
          'mvp-theater.json',
          'dashboard-fatigue.json', 
          'founder-gut.json',
          'vibe-driven-dev.json',
          'meta-investment.json'
        ];
        
        const terms = [];
        for (const file of termFiles) {
          try {
            const response = await fetch(`/terms/${file}`);
            const term = await response.json();
            terms.push({
              id: `fallback-${this.generateSlug(term.term)}`,
              name: term.term,
              slug: this.generateSlug(term.term),
              totalDefinitions: 1
            });
          } catch (error) {
            console.error(`Failed to load term from ${file}:`, error);
          }
        }
        
        if (terms.length > 0) {
          return terms;
        }
        
        // Fallback to old terms.json if individual files don't exist
        const response = await fetch('/terms/terms.json');
        const jsonData = await response.json();
        return jsonData.map(term => ({
          id: `fallback-${this.generateSlug(term.term)}`,
          name: term.term,
          slug: this.generateSlug(term.term),
          totalDefinitions: 1
        }));
      } catch (error) {
        console.error('Fallback terms failed:', error.message);
        return [];
      }
    },

    async getFallbackDefinitions(slug) {
      try {
        // Try individual JSON files first
        const termFiles = [
          'mvp-theater.json',
          'dashboard-fatigue.json', 
          'founder-gut.json',
          'vibe-driven-dev.json',
          'meta-investment.json'
        ];
        
        for (const file of termFiles) {
          try {
            const response = await fetch(`/terms/${file}`);
            const term = await response.json();
            const termSlug = this.generateSlug(term.term);
            if (termSlug === slug) {
              return [{
                id: `fallback-def-${termSlug}`,
                term: term.term,
                definition: term.definition,
                usage: term.usage,
                related: term.related || [],
                votes: { up: 0, down: 0 },
                createdAt: new Date().toISOString()
              }];
            }
          } catch (error) {
            console.error(`Failed to load term from ${file}:`, error);
          }
        }
        
        // Fallback to old terms.json if individual files don't exist
        const response = await fetch('/terms/terms.json');
        const jsonData = await response.json();
        const term = jsonData.find(t => this.generateSlug(t.term) === slug);
        if (term) {
          return [{
            id: `fallback-def-${slug}`,
            definition: term.definition,
            usage: term.usage,
            upvotes: 10,
            downvotes: 0,
            netScore: 10,
            termName: term.term
          }];
        }
        return [];
      } catch (error) {
        console.error('Fallback definitions failed:', error.message);
        return [];
      }
    }
  };

  // Replace airtableService with apiService
  airtableService = apiService;
  
  console.log('📊 API service initialized');

  // Fetch terms data (from API or JSON fallback)
  await loadTermsData();

  // Search functionality
  searchInput.addEventListener("input", async () => {
    const value = searchInput.value.toLowerCase();
    autocompleteList.innerHTML = "";
    wotdContainer.classList.add("hide");

    if (!value) {
      autocompleteList.classList.add("hidden");
      hideWotd();
      return;
    }

    let matches = [];
    
    // Use AirtableService search if available, otherwise fallback to simple filter
    if (airtableService) {
      try {
        const searchResults = await airtableService.searchTerms(value);
        matches = searchResults.map(result => ({
          term: result.term,
          slug: result.slug,
          type: result.type
        }));
      } catch (error) {
        console.warn('Search failed, using fallback:', error.message);
        matches = flounderTerms.filter((term) =>
          term.term.toLowerCase().includes(value)
        );
      }
    } else {
      matches = flounderTerms.filter((term) =>
        term.term.toLowerCase().includes(value)
      );
    }

    if (matches.length == 0) {
      autocompleteList.classList.add("hidden");
      return;
    }

    autocompleteList.classList.remove("hidden");
    
    // Show up to 8 results
    matches.slice(0, 8).forEach((match) => {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      item.textContent = match.term;
      item.onclick = async () => {
        searchInput.value = "";
        autocompleteList.innerHTML = "";
        autocompleteList.classList.add("hidden");
        
        // For Airtable terms, load full definitions
        if (match.slug && airtableService) {
          await openModalForTerm(match.slug);
        } else {
          // Fallback to original term format
          const fullTerm = flounderTerms.find(t => t.term === match.term);
          if (fullTerm) {
            openModal(fullTerm);
          }
        }
      };
      autocompleteList.appendChild(item);
    });
  });

  // Modal functionality for single definitions (backwards compatibility)
  function openModal(term) {
    modalTitle.textContent = term.term;

    const relatedTerms = (term.related || [])
      .map((tag) => `<span class='badge'>${tag}</span>`)
      .join(" ");

    const relatedSection =
      !term.related || term.related.length == 0
        ? ``
        : `<p>
            <strong>Related to:</strong> ${relatedTerms}
          </p>`;

    // Check if this is a contributing modal (no "View Full Page" needed)
    const isContributingModal = term.term === "Contributing to Floundermode";
    
    // Create filename for individual page (only for actual terms)
    let termFilename = '';
    if (!isContributingModal) {
      // Handle special cases with custom mappings
      const termMappings = {
        'A META investment': 'meta-investment',
        'Vibe-Driven Dev': 'vibe-driven-dev'
      };
      
      if (termMappings[term.term]) {
        termFilename = termMappings[term.term];
      } else {
        termFilename = term.term.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-');
      }
    }
    
    const viewFullPageButton = !isContributingModal ? `
      <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
        <a href="/pages/${termFilename}.html" class="term-page-link">
          View Full Page →
        </a>
        <button class="share-button" data-term="${term.term}" data-definition="${term.definition}" data-usage="${term.usage}">
          📤 Share
        </button>
      </div>` : '';
    
    const newContent = `
      <p class="definition-content">
        <strong>Definition:</strong> ${term.definition}
      </p>

      <p class="usage-content"><strong>Example:</strong> ${term.usage}</p>

      ${relatedSection}
      
      ${viewFullPageButton}`;

    modalContent.innerHTML = newContent;
    termModal.classList.remove("hide");
    termModal.classList.add("show");
    
    // Add event listener for share button
    const shareButton = modalContent.querySelector('.share-button');
    if (shareButton) {
      shareButton.addEventListener('click', function() {
        const term = this.getAttribute('data-term');
        const definition = this.getAttribute('data-definition');
        const usage = this.getAttribute('data-usage');
        shareTerm(term, definition, usage);
      });
    }
  }

// Share functionality
window.shareTerm = function(term, definition, usage) {
  console.log('shareTerm called with:', { term, definition, usage });
  
  // Create the URL for the specific term page
  const termMappings = {
    'A META investment': 'meta-investment'
  };
  
  let termFilename = '';
  if (termMappings[term]) {
    termFilename = termMappings[term];
  } else {
    termFilename = term.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
  }
  
  const termUrl = `${window.location.origin}/pages/${termFilename}.html`;
  const shareText = `Check out "${term}" from Floundermode Dictionary: ${termUrl}`;
  
  console.log('Generated share text:', shareText);

  // Always use clipboard for now to debug
  fallbackShare(shareText);
};

window.fallbackShare = function(text) {
  console.log('fallbackShare called with:', text);
  
  // Try the modern clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    console.log('Using modern clipboard API');
    navigator.clipboard.writeText(text).then(() => {
      console.log('Clipboard write successful');
      showToast('Copied to clipboard!');
    }).catch(err => {
      console.log('Clipboard API failed:', err);
      // Try fallback method
      tryFallbackCopy(text);
    });
  } else {
    console.log('Clipboard API not available, using fallback');
    tryFallbackCopy(text);
  }
};

function tryFallbackCopy(text) {
  try {
    console.log('Trying fallback copy method');
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      console.log('Fallback copy successful');
      showToast('Copied to clipboard!');
    } else {
      console.log('Fallback copy failed');
      showToast('Unable to copy. Please try again.', 'error');
    }
  } catch (err) {
    console.log('Fallback copy error:', err);
    showToast('Unable to copy. Please try again.', 'error');
  }
}

window.showToast = function(message, type = 'success') {
  console.log('showToast called with:', message, type);
  
  // Remove any existing toast
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create new toast
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  
  const icon = type === 'success' ? '✅' : '❌';
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  console.log('Toast element created and added to DOM');
  
  // Trigger animation
  setTimeout(() => {
    toast.classList.add('show');
    console.log('Toast show class added');
  }, 10);
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
        console.log('Toast removed from DOM');
      }
    }, 400);
  }, 3000);
};

// Enhanced modal functionality for multiple definitions with voting
async function openModalForTerm(termSlug) {
    try {
      const definitions = await airtableService.fetchDefinitionsForTerm(termSlug);
      
      if (definitions.length === 0) {
        console.warn('No definitions found for term:', termSlug);
        return;
      }

      // Sort by net score (highest first)
      definitions.sort((a, b) => b.netScore - a.netScore);
      
      const termName = definitions[0].termName;
      modalTitle.textContent = termName;
      
      // Get term data to access categories/tags
      let termCategories = [];
      try {
        const allTerms = await airtableService.fetchTerms();
        const currentTerm = allTerms.find(term => term.slug === termSlug);
        if (currentTerm && currentTerm.categories) {
          termCategories = currentTerm.categories;
        }
      } catch (error) {
        console.warn('Could not fetch term categories:', error.message);
        // Fallback: try to get from flounderTerms
        const fallbackTerm = flounderTerms.find(t => t.slug === termSlug);
        if (fallbackTerm && fallbackTerm.related) {
          termCategories = fallbackTerm.related;
        }
      }

      // Generate tags section
      const tagsSection = termCategories.length > 0 
        ? `<p><strong>Related to:</strong> ${termCategories.map(tag => `<span class='badge'>${tag}</span>`).join(' ')}</p>`
        : '';

      let content = '';
      
      if (definitions.length === 1) {
        // Single definition - use same layout as multiple definitions for consistency
        const def = definitions[0];
        const userVote = getUserVoteForDefinition(def.id);
        const upVoted = userVote === 'up' ? ' voted' : '';
        const downVoted = userVote === 'down' ? ' voted' : '';
        
        content = `
          <div class="definitions-multiple">
            <div class="definition-item primary">
              <div class="definition-header">
                <span class="definition-rank">${termName}</span>
              </div>
              <p class="definition-text">${def.definition}</p>
              <p class="definition-usage"><strong>Example:</strong> ${def.usage}</p>
              <div class="definition-votes">
                <button class="vote-btn vote-up${upVoted}" onclick="submitVote('${def.id}', 'up')">
                  ↑ ${def.upvotes}
                </button>
                <button class="vote-btn vote-down${downVoted}" onclick="submitVote('${def.id}', 'down')">
                  ↓ ${def.downvotes}
                </button>
              </div>
            </div>
            ${tagsSection}
          </div>
        `;
      } else {
        // Multiple definitions - show all with voting
        content = `
          <div class="definitions-multiple">
        `;
        
        definitions.forEach((def, index) => {
          const userVote = getUserVoteForDefinition(def.id);
          const upVoted = userVote === 'up' ? ' voted' : '';
          const downVoted = userVote === 'down' ? ' voted' : '';
          
          content += `
            <div class="definition-item ${index === 0 ? 'primary' : 'secondary'}">
              <div class="definition-header">
                <span class="definition-rank">${termName}</span>
              </div>
              <p class="definition-text">${def.definition}</p>
              <p class="definition-usage"><strong>Example:</strong> ${def.usage}</p>
              <div class="definition-votes">
                <button class="vote-btn vote-up${upVoted}" onclick="submitVote('${def.id}', 'up')">
                  ↑ ${def.upvotes}
                </button>
                <button class="vote-btn vote-down${downVoted}" onclick="submitVote('${def.id}', 'down')">
                  ↓ ${def.downvotes}
                </button>
              </div>
            </div>
          `;
        });
        
        content += `${tagsSection}</div>`;
      }

      modalContent.innerHTML = content;
      termModal.classList.remove("hide");
      termModal.classList.add("show");
      
    } catch (error) {
      console.error('Failed to load definitions:', error);
      
      // Fallback to original term if available
      const fallbackTerm = flounderTerms.find(t => airtableService.generateSlug(t.term) === termSlug);
      if (fallbackTerm) {
        openModal(fallbackTerm);
      }
    }
  }

  // Vote tracking functions
  function getUserVotes() {
    const votes = localStorage.getItem('flounder-votes');
    return votes ? JSON.parse(votes) : {};
  }

  function saveUserVotes(votes) {
    localStorage.setItem('flounder-votes', JSON.stringify(votes));
  }

  function getUserVoteForDefinition(definitionId) {
    const votes = getUserVotes();
    return votes[definitionId] || null; // returns 'up', 'down', or null
  }

  function setUserVoteForDefinition(definitionId, voteType) {
    const votes = getUserVotes();
    if (voteType === null) {
      delete votes[definitionId];
    } else {
      votes[definitionId] = voteType;
    }
    saveUserVotes(votes);
  }

  // Vote submission function
  window.submitVote = async function(definitionId, voteType) {
    if (!airtableService) {
      console.warn('Voting requires Airtable connection');
      return;
    }

    try {
      const currentVote = getUserVoteForDefinition(definitionId);
      
      // Determine the action based on current vote state
      let actionVoteType = null;
      let newVoteState = null;
      
      if (currentVote === null) {
        // No previous vote - add new vote
        actionVoteType = voteType;
        newVoteState = voteType;
      } else if (currentVote === voteType) {
        // Clicking same vote - remove vote
        actionVoteType = 'remove_' + voteType;
        newVoteState = null;
      } else {
        // Switching from one vote to another
        actionVoteType = 'switch_to_' + voteType;
        newVoteState = voteType;
      }
      
      const userId = airtableService.generateUserId();
      const result = await airtableService.submitVote(definitionId, actionVoteType, userId, currentVote);
      
      if (result.success) {
        // Update local vote tracking
        setUserVoteForDefinition(definitionId, newVoteState);
        
        // Refresh the current modal to show updated state
        const currentTermSlug = getCurrentModalTermSlug();
        if (currentTermSlug) {
          await openModalForTerm(currentTermSlug);
        }
      } else {
        console.error('Vote failed:', result.error);
      }
    } catch (error) {
      console.error('Vote submission error:', error);
    }
  };

  // Helper to get current modal term slug
  function getCurrentModalTermSlug() {
    const modalTitle = document.getElementById("modalTitle");
    if (modalTitle && airtableService) {
      return airtableService.generateSlug(modalTitle.textContent);
    }
    return null;
  }

  // Expose functions to global scope
  window.openModal = openModal;
  window.openModalForTerm = openModalForTerm;

  // Initialize components
  populateCarousel();
  populateWotd();
}

// Load terms data from Airtable or fallback to JSON
async function loadTermsData() {
  console.log('📊 Loading terms data...');
  
  try {
    if (airtableService) {
      // Try Airtable first
      const airtableTerms = await airtableService.fetchTerms();
      console.log(`✅ Loaded ${airtableTerms.length} terms from Airtable`);
      
      // Transform to original format for backwards compatibility
      flounderTerms = await Promise.all(airtableTerms.map(async (term) => {
        try {
          // Get the first definition for backwards compatibility
          const definitions = await airtableService.fetchDefinitionsForTerm(term.slug);
          if (definitions.length > 0) {
            const firstDef = definitions[0];
            return {
              term: term.name,
              slug: term.slug,
              definition: firstDef.definition,
              usage: firstDef.usage,
              related: term.categories || [], // Use categories from Airtable
              multipleDefinitions: definitions.length > 1
            };
          }
        } catch (error) {
          console.warn(`Failed to load definitions for ${term.name}:`, error.message);
        }
        
        // Fallback term structure
        return {
          term: term.name,
          slug: term.slug,
          definition: "Definition loading...",
          usage: "",
          related: term.categories || [], // Use categories from Airtable
          multipleDefinitions: false
        };
      }));
      
      // Filter out any undefined/null terms that might result from failed definition loading
      flounderTerms = flounderTerms.filter(term => term && term.term);
      
      // Remove any duplicate terms by slug (extra safety measure)
      const seen = new Set();
      flounderTerms = flounderTerms.filter(term => {
        if (seen.has(term.slug)) {
          return false;
        }
        seen.add(term.slug);
        return true;
      });
      
    } else {
      throw new Error('AirtableService not available');
    }
    
  } catch (error) {
    console.warn('⚠️ Falling back to JSON data:', error.message);
    
    // Fallback to original JSON
    try {
      const fetchResult = await fetch("/terms/terms.json");
      const jsonTerms = await fetchResult.json();
      flounderTerms = jsonTerms.map(term => ({
        ...term,
        slug: airtableService ? airtableService.generateSlug(term.term) : term.term.toLowerCase().replace(/\s+/g, '-'),
        multipleDefinitions: false,
        related: term.related || [] // Preserve the related tags from JSON
      }));
      console.log(`✅ Loaded ${flounderTerms.length} terms from JSON fallback`);
    } catch (fallbackError) {
      console.error('❌ Failed to load fallback data:', fallbackError);
      flounderTerms = [];
    }
  }
}

// Carousel functionality
function populateCarousel() {
  const carousel = document.getElementById("carousel");
  const shuffled = [...flounderTerms].sort(() => 0.5 - Math.random());
  
  shuffled.forEach((term) => {
    const btn = document.createElement("button");
    btn.textContent = term.term;
    btn.onclick = async () => {
      // Use new modal for Airtable terms, old modal for JSON fallback
      if (term.slug && airtableService) {
        await openModalForTerm(term.slug);
      } else {
        openModal(term);
      }
    };
    carousel.appendChild(btn);
  });
}

// Word of the Day functionality
function getWotd() {
  if (flounderTerms.length === 0) return null;
  
  // Get UTC midnight timestamp for today
  const now = new Date();
  const utcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const daysSinceEpoch = Math.floor(
    utcMidnight.getTime() / (1000 * 60 * 60 * 24)
  );

  // Simple hash function to distribute selection
  let hash = daysSinceEpoch;
  hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
  hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
  hash = (hash >>> 16) ^ hash;

  return flounderTerms[Math.abs(hash) % flounderTerms.length];
}

function populateWotd() {
  const wotd = getWotd();
  if (!wotd) return;
  
  const speechBubble = document.querySelector(".speech-bubble");
  speechBubble.innerHTML = `
    <div style="text-align: center; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: .5rem; font-size: 1.2rem;">WORD OF THE DAY</div>
    <span class="wotd-term">${wotd.term}</span><br/>${wotd.definition}
  `;
}

// Global utility functions
window.closeModal = function () {
  const termModal = document.getElementById("termModal");
  termModal.classList.remove("show");
  termModal.classList.add("hide");
};

window.selectRandomTerm = async function () {
  if (flounderTerms.length === 0) return;
  
  const randomIndex = Math.floor(Math.random() * flounderTerms.length);
  const term = flounderTerms[randomIndex];
  
  if (term.slug && airtableService) {
    await openModalForTerm(term.slug);
  } else {
    window.openModal(term);
  }
};

// Navigation functions
window.scrollToTop = function () {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.showAbout = function () {
  const aboutModal = {
    term: "About Floundermode Dictionary",
    definition:
      "A comprehensive dictionary of internet slang, memes, and digital culture terminology. Floundermode captures the evolving language of online communities.",
    usage:
      "Navigate through terms using the search bar, browse randomly, or click through the carousel below.",
    related: [],
  };
  window.openModal(aboutModal);
};

window.showContributing = function () {
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalContent");
  const termModal = document.getElementById("termModal");
  
  modalTitle.textContent = "Contributing to Floundermode";
  
  modalContent.innerHTML = `
    <div style="text-align: center; padding: 1rem 0;">
      <h3 style="margin-bottom: 1.5rem; font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; letter-spacing: 1px;">How to Contribute</h3>
      <p style="margin-bottom: 2rem; line-height: 1.7;">
        Help expand the Floundermode Dictionary by submitting new terms, definitions, and examples. 
        All contributions are reviewed for accuracy and relevance.
      </p>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;">
        <button onclick="window.open('https://github.com/FlounderFounder/default_website', '_blank')" 
                class="contribute-button github-button">
          GitHub
        </button>
        <button onclick="openEasyModeModal()" 
                class="contribute-button easy-mode-button">
          Easy Mode
        </button>
      </div>
    </div>
  `;
  
  termModal.classList.remove("hide");
  termModal.classList.add("show");
};

window.toggleWotd = function () {
  const wotdContainer = document.querySelector(".wotd-container");
  
  // Use the proper show/hide functions to maintain thought bubble state
  if (wotdContainer.classList.contains("hide")) {
    showWotd();
  } else {
    hideWotd();
  }
};

window.showWotd = function () {
  const wotdContainer = document.querySelector(".wotd-container");
  const thoughtBubble = document.querySelector(".thought-bubble");
  
  // Show the fish
  wotdContainer.classList.remove("hide");
  
  // Change thought bubble to dismissal message
  const dismissalMessages = ["Go Away!", "Thanks, Carter!"];
  const randomMessage = dismissalMessages[Math.floor(Math.random() * dismissalMessages.length)];
  thoughtBubble.textContent = randomMessage;
  
  // Update click handler to hide fish
  thoughtBubble.onclick = hideWotd;
};

window.hideWotd = function () {
  const wotdContainer = document.querySelector(".wotd-container");
  const thoughtBubble = document.querySelector(".thought-bubble");
  
  // Hide the fish
  wotdContainer.classList.add("hide");
  
  // Reset thought bubble to original message
  thoughtBubble.textContent = "💭 Word of the day";
  
  // Reset click handler to show fish
  thoughtBubble.onclick = showWotd;
};

window.toggleDarkMode = function () {
  const wotdContainer = document.querySelector('.wotd-container');
  const darkModeButton = document.querySelector('.dark-mode-toggle');
  const carterImg = document.querySelector('.wotd-container img');
  const isDarkMode = document.body.classList.contains('dark-mode');
  
  // Check if we're on an individual term page (no wotd-container)
  if (!wotdContainer) {
    // Simple toggle for individual pages
    document.body.classList.toggle('dark-mode');
    const buttonText = document.body.classList.contains('dark-mode') ? '☀️ Light' : '🌙 Dark';
    if (darkModeButton) {
      darkModeButton.textContent = buttonText;
    }
    return;
  }
  
  // Disable button during animation
  darkModeButton.disabled = true;
  
  // Determine target state
  const targetFish = isDarkMode ? '/assets/carter-wynn.png' : '/assets/dark_carter_wynn.png';
  const targetButtonText = isDarkMode ? '🌙 Dark' : '☀️ Light';
  
  // Start Carter's run animation (always the same - right then left)
  document.body.classList.add('carter-running');
  wotdContainer.classList.add('running');
  
  // At 1 second (midpoint), swap the fish and toggle dark mode
  setTimeout(() => {
    // Toggle dark mode when Carter is off-screen
    document.body.classList.toggle('dark-mode');
    carterImg.src = targetFish;
    darkModeButton.innerHTML = targetButtonText;
    
    // Save preference to localStorage
    const newDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', newDarkMode);
  }, 1000);
  
  // After animation completes, clean up and re-enable button
  setTimeout(() => {
    wotdContainer.classList.remove('running');
    document.body.classList.remove('carter-running');
    darkModeButton.disabled = false;
  }, 2000);
};

// Initialize dark mode from saved preference
function initDarkMode() {
  const savedDarkMode = localStorage.getItem('darkMode') === 'true';
  if (savedDarkMode) {
    document.body.classList.add('dark-mode');
    const darkModeButton = document.querySelector('.dark-mode-toggle');
    const carterImg = document.querySelector('.wotd-container img');
    if (darkModeButton) {
      darkModeButton.innerHTML = '☀️ Light';
    }
    if (carterImg) {
      carterImg.src = '/assets/dark_carter_wynn.png';
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  init();
  initDarkMode();
});
