// ===== TERM PAGE FUNCTIONALITY =====
// Consolidated JavaScript for individual term pages

// Share term function for individual pages
window.shareTerm = function(term, definitions, definitionId = null) {
  console.log('shareTerm called with:', { term, definitions, definitionId });
  
  // Build URL for the current page
  let termUrl = window.location.href;
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

  // Try native share first, then clipboard
  if (navigator.share) {
    navigator.share({
      title: `${term} - Floundermode Dictionary`,
      text: shareText,
      url: termUrl
    }).catch(err => {
      console.log('Native share failed:', err);
      fallbackShare(shareText);
    });
  } else {
    fallbackShare(shareText);
  }
};

// Fallback share function
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

// Fallback copy function
function tryFallbackCopy(text) {
  try {
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
      showToast('Copied to clipboard!');
    } else {
      alert('Share text copied to clipboard!');
    }
  } catch (err) {
    console.log('Fallback copy failed:', err);
    alert('Share text copied to clipboard!');
  }
}

// Simple toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #22c55e;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-family: inherit;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    document.body.removeChild(toast);
  }, 2000);
}

// ===== SUPABASE VOTING SYSTEM FOR HTML PAGES =====
// Note: userVotes and allVotes are declared in main.js
const USE_SUPABASE = true;

// Initialize Supabase voting with optimistic loading
async function initSupabaseVoting() {
  if (USE_SUPABASE && window.supabaseVoting) {
    try {
      console.log('Initializing Supabase voting...');
      // Load fresh data from Supabase (this will also cache it)
      allVotes = await window.supabaseVoting.loadVoteData();
      console.log('Loaded vote data:', allVotes);
      
      // Update all vote counts on the page
      updateAllVoteCounts();
      
      // Subscribe to real-time changes
      window.supabaseVoting.subscribeToChanges((updatedVotes) => {
        allVotes = updatedVotes;
        updateAllVoteCounts();
      });
    } catch (error) {
      console.error('Failed to initialize Supabase voting:', error);
      // Fallback: try to load from localStorage or use default values
      console.log('Using fallback vote data');
      allVotes = {};
      updateAllVoteCounts();
    }
  } else {
    console.log('Supabase voting not available, using fallback');
    allVotes = {};
    updateAllVoteCounts();
  }
}

// Update all vote counts on the page
function updateAllVoteCounts() {
  console.log('Updating all vote counts with data:', allVotes);
  document.querySelectorAll('.vote-count').forEach(voteCount => {
    const definitionId = voteCount.closest('.definition-item').id;
    const votes = allVotes[definitionId] || { netScore: 0 };
    console.log(`Updating ${definitionId}: ${votes.netScore}`);
    voteCount.textContent = votes.netScore;
  });
}

// Update vote count optimistically
function updateVoteCountOptimistically(definitionId, voteChange) {
  const voteCount = document.querySelector(`#${definitionId} .vote-count`);
  if (voteCount) {
    const currentCount = parseInt(voteCount.textContent) || 0;
    voteCount.textContent = currentCount + voteChange;
    
    // Add animation class
    voteCount.classList.add('vote-updated');
    setTimeout(() => {
      voteCount.classList.remove('vote-updated');
    }, 300);
  }
}

// Submit a vote for a definition - use centralized voting system
window.submitVote = async function(definitionId, voteType) {
  console.log('Individual page voting:', definitionId, voteType);
  
  // Use the centralized voting system from VotingSystem module
  if (window.VotingSystem && window.VotingSystem.submitVote) {
    await window.VotingSystem.submitVote(definitionId, voteType);
  } else {
    console.warn('VotingSystem not available, falling back to local implementation');
    // Fallback to local implementation if VotingSystem not available
    const existingVote = userVotes.get(definitionId);
    
    let voteChange = 0;
    if (existingVote === voteType) {
      userVotes.delete(definitionId);
      voteChange = voteType === 'up' ? -1 : 1;
    } else {
      userVotes.set(definitionId, voteType);
      if (existingVote) {
        voteChange = voteType === 'up' ? 2 : -2;
      } else {
        voteChange = voteType === 'up' ? 1 : -1;
      }
    }
    
    updateVoteCountOptimistically(definitionId, voteChange);
    updateVoteButtons(definitionId);
    
    // Use the saveUserVotes function from main.js
    if (window.saveUserVotes) {
      window.saveUserVotes();
    }
    
    if (USE_SUPABASE && window.supabaseVoting) {
      const result = await window.supabaseVoting.submitVote(definitionId, voteType);
      if (result) {
        allVotes = result;
        updateVoteButtons(definitionId);
      } else {
        // Revert optimistic update on failure
        updateVoteCountOptimistically(definitionId, -voteChange);
        if (existingVote === voteType) {
          userVotes.set(definitionId, voteType);
        } else {
          userVotes.delete(definitionId);
        }
        if (window.saveUserVotes) {
          window.saveUserVotes();
        }
        updateVoteButtons(definitionId);
      }
    } else {
      // Fallback to local counting
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
  }
};

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
    
    // Update vote count (simple local count for demo)
    const upVotes = Array.from(userVotes.values()).filter(v => v === 'up').length;
    const downVotes = Array.from(userVotes.values()).filter(v => v === 'down').length;
    const netScore = upVotes - downVotes;
    voteCount.textContent = netScore;
  }
}

// Share definition function
window.shareDefinition = function(definitionId) {
  const definitions = window.termDefinitions || [];
  const definition = definitions.find(d => d.id === definitionId);
  if (!definition) return;

  const shareText = `${window.termName || 'Term'}: ${definition.definition}\n\n"${definition.usage}"\n\n— ${definition.author || 'Anonymous'}\n\nFrom Floundermode Dictionary`;
  
  if (navigator.share) {
    navigator.share({
      title: `${window.termName || 'Term'} - Floundermode Dictionary`,
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
};

// Handle deep linking to specific definitions
function handleDefinitionDeepLink() {
  const hash = window.location.hash;
  if (hash) {
    const definitionId = hash.substring(1); // Remove the #
    const targetElement = document.getElementById(definitionId);
    if (targetElement) {
      // Scroll to the definition
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Add a subtle highlight effect
      targetElement.style.transition = 'box-shadow 0.3s ease';
      targetElement.style.boxShadow = '0 0 20px rgba(0, 123, 255, 0.5)';
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        targetElement.style.boxShadow = '';
      }, 3000);
    }
  }
}

// Initialize voting on page load with optimistic loading
document.addEventListener('DOMContentLoaded', async function() {
  // Show cached votes immediately for instant display
  if (window.VotingSystem && window.VotingSystem.getCachedVoteData) {
    const cachedVotes = window.VotingSystem.getCachedVoteData();
    if (cachedVotes && Object.keys(cachedVotes).length > 0) {
      console.log('Term page: Using cached votes for immediate display');
      allVotes = cachedVotes;
      updateAllVoteCounts();
    }
  }
  
  // Wait a bit to ensure all scripts are loaded
  setTimeout(async () => {
    // Use centralized voting system if available
    if (window.VotingSystem && window.VotingSystem.loadUserVotes) {
      window.VotingSystem.loadUserVotes();
    } else if (window.loadUserVotes) {
      window.loadUserVotes();
    }
    
    // Initialize Supabase voting (this will update with fresh data)
    await initSupabaseVoting();
    
    // Update all vote buttons with current state using centralized system
    document.querySelectorAll('[data-def-id]').forEach(button => {
      const defId = button.getAttribute('data-def-id');
      if (window.VotingSystem && window.VotingSystem.updateVoteButtons) {
        window.VotingSystem.updateVoteButtons(defId);
      } else {
        updateVoteButtons(defId);
      }
    });
  }, 100);
  
  // Handle deep linking
  handleDefinitionDeepLink();
});

// Also run if hash changes (for single-page navigation)
window.addEventListener('hashchange', handleDefinitionDeepLink);

