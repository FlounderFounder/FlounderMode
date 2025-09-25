/* Floundermode Dictionary - Voting System Module */

// Global variables for voting
let userVotes = new Map(); // Track user votes per definition
let allVotes = {}; // Store all vote counts from Supabase

// Load vote data from Supabase or localStorage fallback with caching
async function loadVoteData() {
  try {
    // First, try to load cached vote data for immediate display
    const cachedVotes = getCachedVoteData();
    if (cachedVotes && Object.keys(cachedVotes).length > 0) {
      console.log('Using cached vote data for immediate display');
      allVotes = cachedVotes;
      // Update UI immediately with cached data
      updateAllVoteDisplays();
    }

    if (window.USE_SUPABASE && window.supabaseVoting) {
      console.log('Loading fresh vote data from Supabase...');
      const supabaseVotes = await window.supabaseVoting.loadVoteData();
      if (supabaseVotes) {
        allVotes = supabaseVotes;
        // Cache the fresh data
        cacheVoteData(supabaseVotes);
        console.log('Loaded fresh Supabase vote data:', allVotes);
        // Update UI with fresh data
        updateAllVoteDisplays();
        return;
      }
    }
    
    // Fallback to localStorage
    console.log('Falling back to localStorage vote data...');
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
      // Cache the processed data
      cacheVoteData(allVotes);
    }
  } catch (error) {
    console.warn('Failed to load vote data:', error);
    allVotes = {};
  }
}

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
async function submitVote(definitionId, voteType) {
  console.log('submitVote called:', definitionId, voteType);
  console.log('USE_SUPABASE:', window.USE_SUPABASE);
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
  if (window.USE_SUPABASE && window.supabaseVoting) {
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
}

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

// Vote data caching functions
function cacheVoteData(voteData) {
  try {
    const cacheData = {
      votes: voteData,
      timestamp: Date.now(),
      version: '1.0'
    };
    localStorage.setItem('flounderVoteCache', JSON.stringify(cacheData));
    console.log('Vote data cached successfully');
  } catch (error) {
    console.warn('Failed to cache vote data:', error);
  }
}

function getCachedVoteData() {
  try {
    const cached = localStorage.getItem('flounderVoteCache');
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    const cacheAge = Date.now() - cacheData.timestamp;
    const maxAge = 2 * 60 * 1000; // 2 minutes for vote data (shorter than terms)
    
    if (cacheAge > maxAge) {
      console.log('Vote cache expired, clearing');
      localStorage.removeItem('flounderVoteCache');
      return null;
    }
    
    return cacheData.votes;
  } catch (error) {
    console.warn('Failed to read cached vote data:', error);
    return null;
  }
}

// Initialize voting system with immediate cached data
async function initVotingSystem() {
  // Load cached vote data immediately for instant UI
  const cachedVotes = getCachedVoteData();
  if (cachedVotes && Object.keys(cachedVotes).length > 0) {
    console.log('Initializing with cached vote data for instant display');
    allVotes = cachedVotes;
    updateAllVoteDisplays();
  }
  
  // Load fresh data in background
  await loadVoteData();
  loadUserVotes();
}

// Global function to update all vote displays across the entire site
function updateAllVoteDisplays() {
  console.log('Updating all vote displays across the site');
  
  // Update all vote buttons
  document.querySelectorAll('[data-def-id]').forEach(button => {
    const defId = button.getAttribute('data-def-id');
    updateVoteButtons(defId);
  });
  
  // Update all vote counts
  document.querySelectorAll('.vote-count').forEach(voteCount => {
    const definitionId = voteCount.closest('.definition-item')?.id;
    if (definitionId && allVotes[definitionId]) {
      voteCount.textContent = allVotes[definitionId].netScore;
    }
  });
  
  // Call any page-specific update functions
  if (window.updateAllVoteCounts && typeof window.updateAllVoteCounts === 'function') {
    window.updateAllVoteCounts();
  }
}

// Export functions for use by other modules
window.VotingSystem = {
  submitVote,
  loadVoteData,
  loadUserVotes,
  saveUserVotes,
  updateVoteButtons,
  updateVoteCountOptimistically,
  initVotingSystem,
  getUserVotes: () => userVotes,
  getAllVotes: () => allVotes,
  setAllVotes: (votes) => { allVotes = votes; }, // Setter for allVotes
  updateAllVoteDisplays, // Global update function
  cacheVoteData,
  getCachedVoteData
};

// Make submitVote globally available for HTML onclick handlers
window.submitVote = submitVote;
