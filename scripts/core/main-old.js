/* Floundermode Dictionary - Main JavaScript */

// Global variables
let flounderTerms = [];
let userVotes = new Map(); // Track user votes per definition
let allVotes = {}; // Store all vote counts from Supabase
// USE_SUPABASE is declared in individual pages to avoid conflicts

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
                if (def.upvotes === undefined) def.upvotes = 0;
                if (def.downvotes === undefined) def.downvotes = 0;
                if (def.netScore === undefined) def.netScore = def.upvotes - def.downvotes;
              }
              
              // Ensure unique IDs - if multiple definitions have same ID, make them unique
              if (def.id === 'def-1' || def.id === 'def-2') {
                const termSlug = term.term.toLowerCase().replace(/[^a-z0-9]/g, '-');
                def.id = `${termSlug}-def-${index + 1}`;
              }
            });
          }
          
          terms.push(term);
        }
      } catch (error) {
        console.error(`Error loading ${file}:`, error);
      }
    }
    
    return terms;
  } catch (error) {
    console.error('Error loading terms:', error);
    return [];
  }
}

// Discover available term files
async function discoverTermFiles() {
  try {
    // Try to load from the terms manifest first
    const response = await fetch('/terms-manifest.json');
    if (response.ok) {
      const manifest = await response.json();
      return manifest.terms || [];
    }
  } catch (error) {
    console.log('Could not load terms manifest, falling back to hardcoded list');
  }
  
  // Fallback to hardcoded list if manifest fails
  const knownTerms = [
    'mvp-theater.json',
    'dashboard-fatigue.json', 
    'founder-gut.json',
    'vibe-driven-dev.json',
    'meta-investment.json'
  ];
  
  return knownTerms;
}

// Main initialization function
async function init() {
  const searchInput = document.getElementById("searchInput");
  const autocompleteList = document.getElementById("autocompleteList");
  const carousel = document.getElementById("carousel");
  const termModal = document.getElementById("termModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalContent");
  const wotdContainer = document.querySelector(".wotd-container");

  // Fetch terms data from individual JSON files dynamically
  flounderTerms = await loadAllTerms();

  // Search functionality
  searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase();
    autocompleteList.innerHTML = "";
    wotdContainer.classList.add("hide");

    if (!value) {
      autocompleteList.classList.add("hidden");
      // Reset to initial state when search is cleared
      hideWotd();
      return;
    }

    const matches = flounderTerms.filter((term) =>
      term.term.toLowerCase().includes(value)
    );

    if (matches.length == 0) {
      autocompleteList.classList.add("hidden");
      return;
    }

    autocompleteList.classList.remove("hidden");
    matches.forEach((match) => {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      item.textContent = match.term;
      item.onclick = () => {
        searchInput.value = "";
        autocompleteList.innerHTML = "";
        autocompleteList.classList.add("hidden");
        openModal(match);
      };
      autocompleteList.appendChild(item);
    });
  });

  // Modal functionality
  function openModal(term) {
    modalTitle.textContent = term.term;

    const relatedTerms = term.related
      .map((tag) => `<span class='badge'>${tag}</span>`)
      .join(" ");

    const relatedSection =
      term.related.length == 0
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
        <button class="share-button" onclick="shareCurrentTerm()">
          📤 Share
        </button>
      </div>` : '';
    
    // Generate definitions HTML
    const definitionsHtml = generateDefinitionsHtml(term.definitions);
    
    const newContent = `
      ${definitionsHtml}
      ${relatedSection}
      ${viewFullPageButton}`;

    modalContent.innerHTML = newContent;
    termModal.classList.remove("hide");
    termModal.classList.add("show");
    
    // Store current term data for sharing
    window.currentTermData = { term: term.term, definitions: term.definitions };
    
    // Add event listeners for definition navigation
    setupDefinitionNavigation();
  }

  // Generate HTML for multiple definitions
  function generateDefinitionsHtml(definitions) {
    // Sort definitions by netScore from backend (highest first), then by upvotes as tiebreaker
    const sortedDefinitions = [...definitions].sort((a, b) => {
      const aVotes = allVotes[a.id] || { netScore: 0, upvotes: 0 };
      const bVotes = allVotes[b.id] || { netScore: 0, upvotes: 0 };
      
      if (bVotes.netScore !== aVotes.netScore) {
        return bVotes.netScore - aVotes.netScore;
      }
      return bVotes.upvotes - aVotes.upvotes;
    });

    if (sortedDefinitions.length === 1) {
      // Single definition - Urban Dictionary style
      const def = sortedDefinitions[0];
      return `
        <div class="definitions-container">
          <h2 class="definitions-title">DEFINITIONS</h2>
          <div class="definitions-list">
            <div class="definition-item" id="${def.id}">
              <div class="definition-content">
                <div class="definition-text">${def.definition}</div>
                <div class="definition-example">"${def.usage}"</div>
              </div>
              ${def.author ? `<div class="definition-author">by ${def.author} ${def.date}</div>` : ''}
              <div class="definition-votes">
                <button class="vote-btn vote-up" onclick="submitVote('${def.id}', 'up')" data-def-id="${def.id}">
                  ▲
                </button>
                <div class="vote-count">${allVotes[def.id]?.netScore || 0}</div>
                <button class="vote-btn vote-down" onclick="submitVote('${def.id}', 'down')" data-def-id="${def.id}">
                  ▼
                </button>
                <button class="share-btn" onclick="shareDefinition('${def.id}')" data-def-id="${def.id}" title="Share this definition">
                  📤
                </button>
              </div>
            </div>
          </div>
        </div>`;
    } else {
      // Multiple definitions - Urban Dictionary style
      return `
        <div class="definitions-container">
          <h2 class="definitions-title">DEFINITIONS</h2>
          <div class="definitions-list">
            ${sortedDefinitions.map((def, index) => `
              <div class="definition-item" id="${def.id}">
                <div class="definition-content">
                  <div class="definition-text">${def.definition}</div>
                  <div class="definition-example">"${def.usage}"</div>
                </div>
                ${def.author ? `<div class="definition-author">by ${def.author} ${def.date}</div>` : ''}
                <div class="definition-votes">
                  <button class="vote-btn vote-up" onclick="submitVote('${def.id}', 'up')" data-def-id="${def.id}">
                    ▲
                  </button>
                  <div class="vote-count">${allVotes[def.id]?.netScore || 0}</div>
                  <button class="vote-btn vote-down" onclick="submitVote('${def.id}', 'down')" data-def-id="${def.id}">
                    ▼
                  </button>
                  <button class="share-btn" onclick="shareDefinition('${def.id}')" data-def-id="${def.id}" title="Share this definition">
                    📤
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>`;
    }
  }

  // Setup definition navigation
  function setupDefinitionNavigation() {
    // Store current definition index for arrow navigation
    window.currentDefinitionIndex = 0;
    const allDefinitionElements = document.querySelectorAll('.definition-content-wrapper');
    
    window.allDefinitions = Array.from(allDefinitionElements).map(wrapper => ({
      id: wrapper.getAttribute('data-def-id'),
      element: wrapper
    }));
  }

  // Switch to a specific definition
  function switchToDefinition(defId) {
    // Show/hide definition content wrappers
    document.querySelectorAll('.definition-content-wrapper').forEach(wrapper => {
      if (wrapper.getAttribute('data-def-id') === defId) {
        wrapper.style.display = '';
      } else {
        wrapper.style.display = 'none';
      }
    });
    
    // Update arrow navigation
    updateArrowNavigation();
  }

  // Update arrow navigation state
  function updateArrowNavigation() {
    const currentIndex = window.currentDefinitionIndex;
    const totalDefinitions = window.allDefinitions.length;
    
    const prevArrow = document.querySelector('.prev-arrow');
    const nextArrow = document.querySelector('.next-arrow');
    const counter = document.querySelector('.definition-counter');
    
    if (prevArrow) prevArrow.disabled = currentIndex === 0;
    if (nextArrow) nextArrow.disabled = currentIndex === totalDefinitions - 1;
    if (counter) counter.textContent = `${currentIndex + 1} of ${totalDefinitions}`;
  }

  // Navigate between definitions with arrows
  window.navigateDefinition = function(direction) {
    const currentIndex = window.currentDefinitionIndex;
    const totalDefinitions = window.allDefinitions.length;
    const newIndex = currentIndex + direction;
    
    if (newIndex >= 0 && newIndex < totalDefinitions) {
      window.currentDefinitionIndex = newIndex;
      const targetDef = window.allDefinitions[newIndex];
      switchToDefinition(targetDef.id);
    }
  };

// Share functionality
window.shareCurrentTerm = function() {
  if (window.currentTermData) {
    // Find the currently visible definition
    const visibleWrapper = document.querySelector('.definition-content-wrapper:not([style*="display: none"])');
    const currentDefinitionId = visibleWrapper ? visibleWrapper.getAttribute('data-def-id') : null;
    
    shareTerm(window.currentTermData.term, window.currentTermData.definitions, currentDefinitionId);
  }
};

window.shareTerm = function(term, definitions, definitionId = null) {
  console.log('shareTerm called with:', { term, definitions, definitionId });
  
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
  
  // Build URL with optional definition anchor
  let termUrl = `${window.location.origin}/pages/${termFilename}.html`;
  if (definitionId) {
    termUrl += `#${definitionId}`;
  }
  
  // Use specific definition if provided, otherwise primary or first definition
  let targetDef;
  if (definitionId) {
    targetDef = definitions.find(d => d.id === definitionId);
  }
  if (!targetDef) {
    targetDef = definitions.find(d => d.isPrimary) || definitions[0];
  }
  
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

// Expose functions to global scope
  window.openModal = openModal;

  // Carousel functionality
  function populateCarousel() {
    const shuffled = [...flounderTerms].sort(() => 0.5 - Math.random());
    shuffled.forEach((term) => {
      const btn = document.createElement("button");
      btn.textContent = term.term;
      btn.onclick = () => openModal(term);
      carousel.appendChild(btn);
    });
  }

  // Initialize components
  populateCarousel();
  populateWotd();
  
  // Load vote data from Supabase or localStorage
  if (USE_SUPABASE && window.supabaseVoting) {
    // Initialize all definitions in Supabase first
    await window.supabaseVoting.batchInitializeTerms(flounderTerms);
    
    allVotes = await window.supabaseVoting.loadVoteData();
    // Subscribe to real-time changes
    window.supabaseVoting.subscribeToChanges((newVotes) => {
      allVotes = newVotes;
      // Update UI for all visible definitions
      document.querySelectorAll('[data-def-id]').forEach(button => {
        const defId = button.getAttribute('data-def-id');
        updateVoteButtons(defId);
      });
    });
  } else {
    await loadVoteData();
  }
  
  // Fish starts hidden - users can tap thought bubble to show

  // Word of the Day functionality
  function getWotd() {
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
    const speechBubble = document.querySelector(".speech-bubble");
    
    // Get the primary definition or first definition
    const primaryDef = wotd.definitions.find(d => d.isPrimary) || wotd.definitions[0];
    
    speechBubble.innerHTML = `
      <div style="text-align: center; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: .5rem; font-size: 1.2rem;">WORD OF THE DAY</div>
      <span class="wotd-term">${wotd.term}</span><br/>${primaryDef.definition}
    `;
  }
}

// Global utility functions
window.closeModal = function () {
  const termModal = document.getElementById("termModal");
  termModal.classList.remove("show");
  termModal.classList.add("hide");
};

window.selectRandomTerm = function () {
  const randomIndex = Math.floor(Math.random() * flounderTerms.length);
  const term = flounderTerms[randomIndex];
  window.openModal(term);
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
    // Save preference to localStorage
    const newDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', newDarkMode);
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

console.log('toggleDarkMode function defined:', typeof window.toggleDarkMode);

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

// Make functions globally available for individual pages
window.loadUserVotes = loadUserVotes;
window.saveUserVotes = saveUserVotes;
window.updateVoteButtons = updateVoteButtons;

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  init();
  initDarkMode();
});

// ===== LOCALSTORAGE FALLBACK FUNCTIONS =====

// Load vote data from localStorage (fallback when Supabase is unavailable)
async function loadVoteData() {
  try {
    const savedVotes = localStorage.getItem('flounderVotes');
    if (savedVotes) {
      const votesData = JSON.parse(savedVotes);
      // Convert localStorage format to match Supabase format
      allVotes = {};
      Object.entries(votesData).forEach(([defId, voteType]) => {
        if (!allVotes[defId]) {
          allVotes[defId] = { upvotes: 0, downvotes: 0, netScore: 0 };
        }
        if (voteType === 'up') {
          allVotes[defId].upvotes++;
          allVotes[defId].netScore++;
        } else if (voteType === 'down') {
          allVotes[defId].downvotes++;
          allVotes[defId].netScore--;
        }
      });
    }
  } catch (error) {
    console.warn('Failed to load vote data from localStorage:', error);
    allVotes = {};
  }
}

// ===== VOTING SYSTEM =====

// Load user votes from localStorage (for UI state only)
function loadUserVotes() {
  try {
    const savedVotes = localStorage.getItem('flounderVotes');
    if (savedVotes) {
      const votesData = JSON.parse(savedVotes);
      userVotes = new Map(Object.entries(votesData));
    }
  } catch (error) {
    console.warn('Failed to load user votes:', error);
    userVotes = new Map();
  }
}

// Save user votes to localStorage
function saveUserVotes() {
  try {
    const votesData = Object.fromEntries(userVotes);
    localStorage.setItem('flounderVotes', JSON.stringify(votesData));
  } catch (error) {
    console.warn('Failed to save user votes:', error);
  }
}

// Submit a vote for a definition
window.submitVote = async function(definitionId, voteType) {
  console.log('submitVote called:', definitionId, voteType);
  console.log('USE_SUPABASE:', USE_SUPABASE);
  console.log('window.supabaseVoting:', window.supabaseVoting);
  
  // Check if user already voted on this definition
  const existingVote = userVotes.get(definitionId);
  
  // Calculate the optimistic vote change
  let voteChange = 0;
  if (existingVote === voteType) {
    // User is trying to vote the same way again - remove the vote
    userVotes.delete(definitionId);
    voteChange = voteType === 'up' ? -1 : 1; // Remove the vote
  } else {
    // User is voting (or changing their vote)
    userVotes.set(definitionId, voteType);
    if (existingVote) {
      // Changing vote: remove old vote, add new vote
      voteChange = voteType === 'up' ? 2 : -2; // +1 for new vote, -1 for removing old vote
    } else {
      // First time voting
      voteChange = voteType === 'up' ? 1 : -1;
    }
  }
  
  console.log('Vote change:', voteChange);
  
  // Update UI immediately for instant feedback
  updateVoteCountOptimistically(definitionId, voteChange);
  updateVoteButtons(definitionId);
  
  // Save to localStorage for UI state
  saveUserVotes();
  
  // Submit to Supabase or fallback to localStorage
  if (USE_SUPABASE && window.supabaseVoting) {
    console.log('Submitting to Supabase...');
    const result = await window.supabaseVoting.submitVote(definitionId, voteType);
    console.log('Supabase result:', result);
    if (result) {
      allVotes = result;
      // Update with real data from server
      updateVoteButtons(definitionId);
    } else {
      console.log('Supabase failed, reverting optimistic change');
      // Fallback: revert the optimistic change if Supabase failed
      updateVoteCountOptimistically(definitionId, -voteChange);
      if (existingVote === voteType) {
        userVotes.set(definitionId, voteType);
      } else {
        userVotes.delete(definitionId);
      }
      saveUserVotes();
      updateVoteButtons(definitionId);
    }
  } else {
    console.log('Using localStorage fallback');
    // Use localStorage fallback - update allVotes for consistency
    if (!allVotes[definitionId]) {
      allVotes[definitionId] = { upvotes: 0, downvotes: 0, netScore: 0 };
    }
    allVotes[definitionId].netScore += voteChange;
    if (voteType === 'up') {
      allVotes[definitionId].upvotes += (voteChange > 0 ? 1 : -1);
    } else {
      allVotes[definitionId].downvotes += (voteChange < 0 ? 1 : -1);
    }
  }
};


// Update vote count optimistically (immediately for instant feedback)
function updateVoteCountOptimistically(definitionId, voteChange) {
  const voteCount = document.querySelector(`button[data-def-id="${definitionId}"].vote-up`).parentElement.querySelector('.vote-count');
  
  if (voteCount) {
    // Get current displayed count
    const currentCount = parseInt(voteCount.textContent) || 0;
    // Update immediately
    voteCount.textContent = currentCount + voteChange;
    
    // Add a subtle animation class for visual feedback
    voteCount.classList.add('vote-updated');
    setTimeout(() => {
      voteCount.classList.remove('vote-updated');
    }, 200);
  }
}

// Update the vote button UI
function updateVoteButtons(definitionId) {
  const upButton = document.querySelector(`button[data-def-id="${definitionId}"].vote-up`);
  const downButton = document.querySelector(`button[data-def-id="${definitionId}"].vote-down`);
  const voteCount = document.querySelector(`button[data-def-id="${definitionId}"].vote-up`).parentElement.querySelector('.vote-count');
  
  if (upButton && downButton && voteCount) {
    const userVote = userVotes.get(definitionId);
    
    // Reset all button states
    upButton.classList.remove('voted');
    downButton.classList.remove('voted');
    
    // Apply voted state
    if (userVote === 'up') {
      upButton.classList.add('voted');
    } else if (userVote === 'down') {
      downButton.classList.add('voted');
    }
    
    // Update vote count from backend data
    const voteData = allVotes[definitionId];
    if (voteData) {
      voteCount.textContent = voteData.netScore;
    } else {
      voteCount.textContent = '0';
    }
  }
}


// Share definition function
function shareDefinition(definitionId) {
  // Find the definition in our data
  let definition = null;
  let termName = '';
  
  for (const term of flounderTerms) {
    if (term.definitions) {
      const def = term.definitions.find(d => d.id === definitionId);
      if (def) {
        definition = def;
        termName = term.term;
        break;
      }
    }
  }
  
  if (!definition) return;

  const shareText = `${termName}: ${definition.definition}\n\n"${definition.usage}"\n\n— ${definition.author || 'Anonymous'}\n\nFrom Floundermode Dictionary`;
  
  if (navigator.share) {
    navigator.share({
      title: `${termName} - Floundermode Dictionary`,
      text: shareText,
      url: window.location.href
    }).catch(err => console.log('Error sharing:', err));
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(shareText).then(() => {
      // Show a brief success message
      const shareBtn = document.querySelector(`[data-def-id="${definitionId}"]`);
      const originalText = shareBtn.innerHTML;
      shareBtn.innerHTML = '✓';
      shareBtn.style.background = '#22c55e';
      shareBtn.style.color = 'white';
      
      setTimeout(() => {
        shareBtn.innerHTML = originalText;
        shareBtn.style.background = '';
        shareBtn.style.color = '';
      }, 1000);
    }).catch(err => {
      console.log('Error copying to clipboard:', err);
      alert('Share text copied to clipboard!');
    });
  }
}
