/* Floundermode Dictionary - Main Coordinator */

// Main initialization function with progressive loading
async function init() {
  console.log('Initializing Floundermode Dictionary...');
  
  // Check if required modules are loaded
  console.log('DataLoader available:', !!window.DataLoader);
  console.log('VotingSystem available:', !!window.VotingSystem);
  console.log('UIManager available:', !!window.UIManager);
  console.log('Navigation available:', !!window.Navigation);
  
  // Start loading terms immediately (this will use cache if available)
  const termsPromise = window.DataLoader.loadAllTerms();
  
  // Initialize UI components with loading state
  if (window.UIManager && window.UIManager.initUI) {
    await window.UIManager.initUI();
  } else {
    console.error('UIManager not available!');
  }
  
  // Initialize dark mode immediately (no dependencies)
  window.Navigation.initDarkMode();
  
  // Wait for terms to load
  const flounderTerms = await termsPromise;
  
  // Populate UI with loaded terms
  if (window.UIManager && window.UIManager.populateUI) {
    window.UIManager.hideLoadingState();
    window.UIManager.populateUI(flounderTerms);
  }
  
  // Initialize voting system in parallel with Supabase operations
  const votingPromise = window.VotingSystem.initVotingSystem();
  
  // Initialize Supabase operations in parallel
  let supabasePromise = Promise.resolve();
  if (window.USE_SUPABASE && window.supabaseVoting) {
    console.log('Using Supabase for voting...');
    supabasePromise = Promise.all([
      // Initialize all definitions in Supabase (optimized batch operation)
      window.supabaseVoting.batchInitializeTerms(flounderTerms),
      // Load vote data through VotingSystem (which will use Supabase)
      window.VotingSystem.loadVoteData()
    ]);
  } else {
    console.log('Using localStorage fallback for voting...');
    supabasePromise = window.VotingSystem.loadVoteData();
  }
  
  // Wait for all voting operations to complete
  await Promise.all([votingPromise, supabasePromise]);
  
  // Set up real-time subscriptions after everything is loaded
  if (window.USE_SUPABASE && window.supabaseVoting) {
    // Subscribe to real-time changes
    window.supabaseVoting.subscribeToChanges((newVotes) => {
      console.log('Real-time vote update received:', newVotes);
      
      // Update the centralized vote data
      window.VotingSystem.setAllVotes(newVotes);
      
      // Use the global update function to update all vote displays
      window.VotingSystem.updateAllVoteDisplays();
    });
  }
  
  console.log('Floundermode Dictionary initialized successfully!');
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  // Add a small delay to ensure all scripts are loaded
  setTimeout(() => {
    init();
  }, 100);
});

// Legacy fallback functions for backward compatibility
window.tryFallbackCopy = function(text) {
  console.log('tryFallbackCopy called with:', text);
  
  // Try the modern clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Successfully copied to clipboard');
      window.ShareUtils?.showToast('Copied to clipboard!');
    }).catch(err => {
      console.log('Clipboard API failed:', err);
      fallbackCopy(text);
    });
  } else {
    console.log('Clipboard API not available, using fallback');
    fallbackCopy(text);
  }
};

window.fallbackCopy = function(text) {
  console.log('fallbackCopy called with:', text);
  
  // Create a temporary textarea element
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  
  try {
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    
    if (successful) {
      console.log('Fallback copy successful');
      window.ShareUtils?.showToast('Copied to clipboard!');
    } else {
      console.log('Fallback copy failed');
      window.ShareUtils?.showToast('Copy failed - please copy manually');
    }
  } catch (err) {
    console.log('Fallback copy error:', err);
    window.ShareUtils?.showToast('Copy failed - please copy manually');
  } finally {
    document.body.removeChild(textArea);
  }
};

// Legacy share function for backward compatibility
window.shareTerm = function(term, definitions, definitionId = null) {
  console.log('Legacy shareTerm called with:', { term, definitions, definitionId });
  window.ShareUtils?.shareTerm(term, definitions, definitionId);
};

console.log('Main coordinator loaded successfully');
