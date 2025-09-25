/* Floundermode Dictionary - Navigation Module */

// Select a random term
function selectRandomTerm() {
  const flounderTerms = window.DataLoader ? window.DataLoader.getAllTerms() : [];
  if (flounderTerms.length === 0) {
    console.warn('No terms loaded yet');
    return;
  }
  const randomIndex = Math.floor(Math.random() * flounderTerms.length);
  const term = flounderTerms[randomIndex];
  window.openModal(term);
}

// Scroll to top of page
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Show about modal
function showAbout() {
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalContent");
  const termModal = document.getElementById("termModal");
  
  modalTitle.textContent = "About Floundermode Dictionary";
  
  modalContent.innerHTML = `
    <div style="text-align: left; padding: 1rem 0; line-height: 1.7;">
      <p style="margin-bottom: 1.5rem;">
        The Floundermode Dictionary is like Urban Dictionary for Silicon Valley. We define all the terms that make you nod knowingly in meetings while secretly wondering what the hell anyone is actually talking about.
      </p>
      <p style="margin-bottom: 1.5rem;">
        From "stealth mode" (we have no product) to "pivoting" (our original idea was terrible), we're building the honest translation guide for startup speak.
      </p>
      <p style="margin-bottom: 2rem;">
        Because sometimes you need to know that "thought leadership" just means posting obvious insights on LinkedIn.
      </p>
      <p style="margin-bottom: 2rem; font-style: italic; color: #666;">
      </p>
      <div style="text-align: center;">
        <button onclick="window.open('https://github.com/FlounderFounder/default_website', '_blank')" 
                class="contribute-button github-button">
          Check out our GitHub
        </button>
      </div>
    </div>
  `;
  
  termModal.classList.remove("hide");
  termModal.classList.add("show");
}

// Show contributing modal
function showContributing() {
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
}

// Toggle WOTD (Word of the Day) visibility
function toggleWotd() {
  const wotdContainer = document.querySelector(".wotd-container");
  
  // Use the proper show/hide functions to maintain thought bubble state
  if (wotdContainer.classList.contains("hide")) {
    showWotd();
  } else {
    hideWotd();
  }
}

// Show WOTD fish
function showWotd() {
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
}

// Hide WOTD fish
function hideWotd() {
  const wotdContainer = document.querySelector(".wotd-container");
  const thoughtBubble = document.querySelector(".thought-bubble");
  
  // Hide the fish
  wotdContainer.classList.add("hide");
  
  // Reset thought bubble to original message
  thoughtBubble.textContent = "💭 Word of the day";
  
  // Reset click handler to show fish
  thoughtBubble.onclick = showWotd;
}

// Toggle dark mode with Carter animation
function toggleDarkMode() {
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
}

// Initialize dark mode from saved preference
function initDarkMode() {
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode === 'true') {
    document.body.classList.add('dark-mode');
    const darkModeButton = document.querySelector('.dark-mode-toggle');
    if (darkModeButton) {
      darkModeButton.textContent = '☀️ Light';
    }
  }
}

// Export functions for use by other modules
window.Navigation = {
  selectRandomTerm,
  scrollToTop,
  showAbout,
  showContributing,
  toggleWotd,
  showWotd,
  hideWotd,
  toggleDarkMode,
  initDarkMode
};

// Make functions globally available for HTML onclick handlers
window.selectRandomTerm = selectRandomTerm;
window.scrollToTop = scrollToTop;
window.showAbout = showAbout;
window.showContributing = showContributing;
window.toggleWotd = toggleWotd;
window.showWotd = showWotd;
window.hideWotd = hideWotd;
window.toggleDarkMode = toggleDarkMode;
