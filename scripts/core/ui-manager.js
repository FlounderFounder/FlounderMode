/* Floundermode Dictionary - UI Manager Module */

// Initialize UI components
async function initUI() {
  const searchInput = document.getElementById("searchInput");
  const autocompleteList = document.getElementById("autocompleteList");
  const carousel = document.getElementById("carousel");
  const termModal = document.getElementById("termModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalContent");
  const wotdContainer = document.querySelector(".wotd-container");

  // Get terms from DataLoader module
  const flounderTerms = window.DataLoader ? window.DataLoader.getAllTerms() : [];
  
  if (flounderTerms.length === 0) {
    console.warn('No terms loaded yet, UI initialization may be incomplete');
    return; // Exit early if no terms
  }

  // Search functionality
  searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase();
    autocompleteList.innerHTML = "";
    wotdContainer.classList.add("hide");

    if (!value) {
      autocompleteList.classList.add("hidden");
      // Reset to initial state when search is cleared
      window.Navigation?.hideWotd();
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

  // Initialize components
  populateCarousel();
  populateWotd();
}

// Modal functionality
function openModal(term) {
  if (!term) {
    console.warn('No term provided to openModal');
    return;
  }
  
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalContent");
  const termModal = document.getElementById("termModal");

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
  
  // Update vote buttons after modal opens to ensure sync
  setTimeout(() => {
    term.definitions.forEach(def => {
      if (window.VotingSystem && window.VotingSystem.updateVoteButtons) {
        window.VotingSystem.updateVoteButtons(def.id);
      }
    });
  }, 100);
  
  // Add prominent term name within the content (Urban Dictionary style)
  const termNameDisplay = `
    <div class="modal-term-name">
      <h2 class="term-name-title">${term.term}</h2>
    </div>
  `;
  
  const newContent = `
    ${termNameDisplay}
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

// Close modal
function closeModal() {
  const termModal = document.getElementById("termModal");
  termModal.classList.remove("show");
  termModal.classList.add("hide");
}

// Generate HTML for multiple definitions
function generateDefinitionsHtml(definitions) {
  // Check if definitions is valid
  if (!definitions || !Array.isArray(definitions) || definitions.length === 0) {
    console.warn('No valid definitions provided to generateDefinitionsHtml');
    return '<div class="definitions-container"><h2 class="definitions-title">DEFINITIONS</h2><div class="definitions-list"><p>No definitions available</p></div></div>';
  }
  
  // Get vote data from VotingSystem module
  const allVotes = window.VotingSystem ? window.VotingSystem.getAllVotes() : {};
  
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
function navigateDefinition(direction) {
  const currentIndex = window.currentDefinitionIndex;
  const totalDefinitions = window.allDefinitions.length;
  const newIndex = currentIndex + direction;
  
  if (newIndex >= 0 && newIndex < totalDefinitions) {
    window.currentDefinitionIndex = newIndex;
    const targetDef = window.allDefinitions[newIndex];
    switchToDefinition(targetDef.id);
  }
}

// Carousel functionality
function populateCarousel() {
  const carousel = document.getElementById("carousel");
  const flounderTerms = window.DataLoader ? window.DataLoader.getAllTerms() : [];
  
  if (flounderTerms.length === 0) {
    console.warn('No terms available for carousel');
    return;
  }
  
  const shuffled = [...flounderTerms].sort(() => 0.5 - Math.random());
  
  shuffled.forEach((term) => {
    const btn = document.createElement("button");
    btn.textContent = term.term;
    btn.onclick = () => openModal(term);
    carousel.appendChild(btn);
  });
}

// Word of the Day functionality
function getWotd() {
  const flounderTerms = window.DataLoader ? window.DataLoader.getAllTerms() : [];
  
  if (flounderTerms.length === 0) {
    console.warn('No terms available for WOTD');
    return null;
  }
  
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
  if (!wotd) {
    console.warn('No WOTD available');
    return;
  }
  
  const speechBubble = document.querySelector(".speech-bubble");
  
  // Get the primary definition or first definition
  const primaryDef = wotd.definitions.find(d => d.isPrimary) || wotd.definitions[0];
  
  speechBubble.innerHTML = `
    <div class="wotd-title">WORD OF THE DAY</div>
    <span class="wotd-term">${wotd.term}</span><br/>${primaryDef.definition}
  `;
}

// Share current term functionality
function shareCurrentTerm() {
  if (window.currentTermData) {
    // Find the currently visible definition
    const visibleWrapper = document.querySelector('.definition-content-wrapper:not([style*="display: none"])');
    const currentDefinitionId = visibleWrapper ? visibleWrapper.getAttribute('data-def-id') : null;
    
    window.ShareUtils?.shareTerm(window.currentTermData.term, window.currentTermData.definitions, currentDefinitionId);
  }
}

// Export functions for use by other modules
window.UIManager = {
  initUI,
  openModal,
  closeModal,
  generateDefinitionsHtml,
  setupDefinitionNavigation,
  switchToDefinition,
  updateArrowNavigation,
  navigateDefinition,
  populateCarousel,
  getWotd,
  populateWotd,
  shareCurrentTerm
};

// Make functions globally available for HTML onclick handlers
window.openModal = openModal;
window.closeModal = closeModal;
window.navigateDefinition = navigateDefinition;
window.shareCurrentTerm = shareCurrentTerm;
