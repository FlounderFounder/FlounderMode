-- Supabase database schema for Floundermode voting system
-- Run this in your Supabase SQL editor

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  definition_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(definition_id, user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_votes_definition_id ON votes(definition_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow anyone to read votes (for public vote counts)
CREATE POLICY "Anyone can read votes" ON votes
  FOR SELECT USING (true);

-- Allow anyone to insert votes (for voting)
CREATE POLICY "Anyone can insert votes" ON votes
  FOR INSERT WITH CHECK (true);

-- Allow users to update their own votes
CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id LIKE 'user_%');

-- Allow users to delete their own votes
CREATE POLICY "Users can delete own votes" ON votes
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id LIKE 'user_%');

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_votes_updated_at 
  BEFORE UPDATE ON votes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for aggregated vote counts
CREATE OR REPLACE VIEW vote_counts AS
SELECT 
  definition_id,
  COUNT(CASE WHEN vote_type = 'up' THEN 1 END) as upvotes,
  COUNT(CASE WHEN vote_type = 'down' THEN 1 END) as downvotes,
  COUNT(CASE WHEN vote_type = 'up' THEN 1 END) - COUNT(CASE WHEN vote_type = 'down' THEN 1 END) as net_score,
  COUNT(*) as total_votes
FROM votes
GROUP BY definition_id;

-- Grant access to the view
GRANT SELECT ON vote_counts TO anon, authenticated;
