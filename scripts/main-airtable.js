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

  console.log('🚀 Initializing Floundermode Dictionary with Airtable...');

  // Initialize AirtableService (browser mode - will use fallback data)
  try {
    // In browser mode, initialize without credentials to use fallback data only
    airtableService = new AirtableService({
      // No credentials in browser for security
      // This will automatically fallback to JSON data
    });
    
    console.log('📊 AirtableService initialized in fallback mode (browser)');
    
  } catch (error) {
    console.warn('⚠️ AirtableService initialization failed, using JSON fallback:', error.message);
  }

  // Fetch terms data (from Airtable or JSON fallback)
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

    const newContent = `
      <p>
        <strong>Definition:</strong> ${term.definition}
      </p>
      <p><strong>Example:</strong> ${term.usage}</p>
      ${relatedSection}`;

    modalContent.innerHTML = newContent;
    termModal.classList.remove("hide");
    termModal.classList.add("show");
  }

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

      let content = '';
      
      if (definitions.length === 1) {
        // Single definition - use simple layout
        const def = definitions[0];
        content = `
          <div class="definition-single">
            <p><strong>Definition:</strong> ${def.definition}</p>
            <p><strong>Example:</strong> ${def.usage}</p>
            <div class="definition-votes">
              <button class="vote-btn vote-up" onclick="submitVote('${def.id}', 'up')">
                👍 ${def.upvotes}
              </button>
              <button class="vote-btn vote-down" onclick="submitVote('${def.id}', 'down')">
                👎 ${def.downvotes}
              </button>
              <span class="net-score">Net: ${def.netScore}</span>
            </div>
          </div>
        `;
      } else {
        // Multiple definitions - show all with voting
        content = `
          <div class="definitions-multiple">
            <p class="definition-count">${definitions.length} definitions available</p>
        `;
        
        definitions.forEach((def, index) => {
          content += `
            <div class="definition-item ${index === 0 ? 'primary' : 'secondary'}">
              <div class="definition-header">
                <span class="definition-rank">#${index + 1}</span>
                <div class="definition-votes">
                  <button class="vote-btn vote-up" onclick="submitVote('${def.id}', 'up')">
                    👍 ${def.upvotes}
                  </button>
                  <button class="vote-btn vote-down" onclick="submitVote('${def.id}', 'down')">
                    👎 ${def.downvotes}
                  </button>
                  <span class="net-score">Net: ${def.netScore}</span>
                </div>
              </div>
              <p class="definition-text">${def.definition}</p>
              <p class="definition-usage"><strong>Example:</strong> ${def.usage}</p>
            </div>
          `;
        });
        
        content += '</div>';
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

  // Vote submission function
  window.submitVote = async function(definitionId, voteType) {
    if (!airtableService) {
      console.warn('Voting requires Airtable connection');
      return;
    }

    try {
      const userId = airtableService.generateUserId();
      const result = await airtableService.submitVote(definitionId, voteType, userId);
      
      if (result.success) {
        // Refresh the current modal
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
              related: [], // Will populate from categories later
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
          related: [],
          multipleDefinitions: false
        };
      }));
      
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
        multipleDefinitions: false
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
  const contributingModal = {
    term: "Contributing to Floundermode",
    definition:
      "Help expand the dictionary by submitting new terms, definitions, and examples. All contributions are reviewed for accuracy and relevance.",
    usage:
      "Check the CONTRIBUTING.md file in the repository for detailed guidelines on how to add new terms and improve existing definitions.",
    related: [],
  };
  
  // Use openModal but then customize the content to add buttons
  window.openModal(contributingModal);
  
  // Add the contribution buttons after modal opens
  setTimeout(() => {
    const modalContent = document.getElementById("modalContent");
    modalContent.innerHTML += `
      <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button onclick="window.open('https://github.com/FlounderFounder/default_website', '_blank')" 
                class="contribute-button github-button">
          GitHub
        </button>
        <button onclick="openEasyModeModal()" 
                class="contribute-button easy-mode-button">
          Easy Mode
        </button>
      </div>
    `;
  }, 100);
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
