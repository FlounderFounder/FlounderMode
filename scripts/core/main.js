/* Floundermode Dictionary - Main Coordinator */

// Main initialization function
async function init() {
  console.log('Initializing Floundermode Dictionary...');
  
  // Load all terms first
  await window.DataLoader.loadAllTerms();
  
  // Initialize voting system
  await window.VotingSystem.initVotingSystem();
  
  // Initialize UI components
  await window.UIManager.initUI();
  
  // Initialize dark mode
  window.Navigation.initDarkMode();
  
  // Load vote data from Supabase or localStorage
  const flounderTerms = window.DataLoader.getAllTerms();
  
  if (window.USE_SUPABASE && window.supabaseVoting) {
    console.log('Using Supabase for voting...');
    // Initialize all definitions in Supabase first
    await window.supabaseVoting.batchInitializeTerms(flounderTerms);
    
    const allVotes = await window.supabaseVoting.loadVoteData();
    // Subscribe to real-time changes
    window.supabaseVoting.subscribeToChanges((newVotes) => {
      // Update UI for all visible definitions
      document.querySelectorAll('[data-def-id]').forEach(button => {
        const defId = button.getAttribute('data-def-id');
        window.VotingSystem.updateVoteButtons(defId);
      });
    });
  } else {
    console.log('Using localStorage fallback for voting...');
    await window.VotingSystem.loadVoteData();
  }
  
  console.log('Floundermode Dictionary initialized successfully!');
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  init();
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
