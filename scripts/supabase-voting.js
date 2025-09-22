// Supabase voting system for GitHub Pages
// This replaces the Node.js backend with Supabase's hosted database

// Supabase configuration
const SUPABASE_URL = 'https://tsnehoknvrxouphrtpik.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzbmVob2tudnJ4b3VwaHJ0cGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1Nzg5MTEsImV4cCI6MjA3NDE1NDkxMX0._405Oa6iDtazAsy6TBrfG_vMHfEIFqW7M4GNKmd2Dxk'; // Replace with your anon key

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database schema for votes table:
// CREATE TABLE votes (
//   id SERIAL PRIMARY KEY,
//   definition_id TEXT NOT NULL,
//   user_id TEXT NOT NULL,
//   vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   UNIQUE(definition_id, user_id)
// );

// Load vote data from Supabase
async function loadVoteDataFromSupabase() {
  try {
    // Get all votes
    const { data: votes, error } = await supabaseClient
      .from('votes')
      .select('*');

    if (error) {
      console.error('Error loading votes:', error);
      return {};
    }

    // Aggregate votes by definition
    const aggregatedVotes = {};
    
    votes.forEach(vote => {
      const defId = vote.definition_id;
      
      if (!aggregatedVotes[defId]) {
        aggregatedVotes[defId] = {
          upvotes: 0,
          downvotes: 0,
          netScore: 0,
          userVotes: {}
        };
      }
      
      // Count votes
      if (vote.vote_type === 'up') {
        aggregatedVotes[defId].upvotes++;
      } else {
        aggregatedVotes[defId].downvotes++;
      }
      
      // Track user votes
      aggregatedVotes[defId].userVotes[vote.user_id] = vote.vote_type;
    });
    
    // Calculate net scores
    Object.keys(aggregatedVotes).forEach(defId => {
      aggregatedVotes[defId].netScore = 
        aggregatedVotes[defId].upvotes - aggregatedVotes[defId].downvotes;
    });
    
    return aggregatedVotes;
  } catch (error) {
    console.error('Error loading vote data:', error);
    return {};
  }
}

// Submit vote to Supabase
async function submitVoteToSupabase(definitionId, voteType) {
  try {
    const userId = getUserId();
    
    // First, check if user already voted
    const { data: existingVote, error: fetchError } = await supabaseClient
      .from('votes')
      .select('*')
      .eq('definition_id', definitionId)
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing vote:', fetchError);
      return null;
    }

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // User is trying to vote the same way again - remove the vote
        const { error: deleteError } = await supabaseClient
          .from('votes')
          .delete()
          .eq('definition_id', definitionId)
          .eq('user_id', userId);
          
        if (deleteError) {
          console.error('Error deleting vote:', deleteError);
          return null;
        }
      } else {
        // User is changing their vote - update it
        const { error: updateError } = await supabaseClient
          .from('votes')
          .update({ vote_type: voteType })
          .eq('definition_id', definitionId)
          .eq('user_id', userId);
          
        if (updateError) {
          console.error('Error updating vote:', updateError);
          return null;
        }
      }
    } else {
      // User is voting for the first time - insert new vote
      const { error: insertError } = await supabaseClient
        .from('votes')
        .insert({
          definition_id: definitionId,
          user_id: userId,
          vote_type: voteType
        });
        
      if (insertError) {
        console.error('Error inserting vote:', insertError);
        return null;
      }
    }
    
    // Return updated vote data
    return await loadVoteDataFromSupabase();
  } catch (error) {
    console.error('Error submitting vote:', error);
    return null;
  }
}

// Get user ID (same as before)
function getUserId() {
  let userId = localStorage.getItem('flounderUserId');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('flounderUserId', userId);
  }
  return userId;
}

// Real-time subscription to vote changes
function subscribeToVoteChanges(callback) {
  const subscription = supabaseClient
    .channel('votes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'votes' 
      }, 
      (payload) => {
        console.log('Vote change detected:', payload);
        // Reload vote data when changes occur
        loadVoteDataFromSupabase().then(callback);
      }
    )
    .subscribe();

  return subscription;
}

// Export functions for use in main.js
window.supabaseVoting = {
  loadVoteData: loadVoteDataFromSupabase,
  submitVote: submitVoteToSupabase,
  subscribeToChanges: subscribeToVoteChanges,
  getUserId: getUserId
};
