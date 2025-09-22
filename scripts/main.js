/* Floundermode Dictionary - Main JavaScript */

// Global variables
let flounderTerms = [];

// Main initialization function
async function init() {
  const searchInput = document.getElementById("searchInput");
  const autocompleteList = document.getElementById("autocompleteList");
  const carousel = document.getElementById("carousel");
  const termModal = document.getElementById("termModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalContent");
  const wotdContainer = document.querySelector(".wotd-container");

  // Fetch terms data from individual JSON files
  const termFiles = [
    'mvp-theater.json',
    'dashboard-fatigue.json', 
    'founder-gut.json',
    'vibe-driven-dev.json',
    'meta-investment.json'
  ];
  
  flounderTerms = [];
  for (const file of termFiles) {
    try {
      const response = await fetch(`/terms/${file}`);
      const term = await response.json();
      flounderTerms.push(term);
    } catch (error) {
      console.error(`Failed to load term from ${file}:`, error);
    }
  }

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

// Expose functions to global scope
  window.openModal = openModal;

  // Initialize components
  populateCarousel();
  populateWotd();
  
  // Fish starts hidden - users can tap thought bubble to show

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
    speechBubble.innerHTML = `
      <div style="text-align: center; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: .5rem; font-size: 1.2rem;">WORD OF THE DAY</div>
      <span class="wotd-term">${wotd.term}</span><br/>${wotd.definition}
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
