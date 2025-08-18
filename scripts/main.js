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

  // Fetch terms data
  const fetchResult = await fetch("/terms/terms.json");
  flounderTerms = await fetchResult.json();

  // Search functionality
  searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase();
    autocompleteList.innerHTML = "";
    wotdContainer.classList.add("hide");

    if (!value) {
      autocompleteList.classList.add("hidden");
      wotdContainer.classList.remove("hide");
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

  // Expose functions to global scope
  window.openModal = openModal;

  // Initialize components
  populateCarousel();
  populateWotd();
  
  // Show the fish after everything is loaded
  setTimeout(() => {
    wotdContainer.classList.remove("hide");
  }, 500);

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
      <strong>${wotd.term}</strong> ${wotd.definition}
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
  wotdContainer.classList.toggle("hide");
};

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
