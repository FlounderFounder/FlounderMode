-- Supabase database schema for phrase submissions
-- Run this in your Supabase SQL editor

-- Create phrase_submissions table
CREATE TABLE IF NOT EXISTS phrase_submissions (
  id SERIAL PRIMARY KEY,
  phrase TEXT NOT NULL,
  author TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_phrase_submissions_status ON phrase_submissions(status);
CREATE INDEX IF NOT EXISTS idx_phrase_submissions_submitted_at ON phrase_submissions(submitted_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE phrase_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow anyone to insert submissions (for public form)
CREATE POLICY "Anyone can submit phrases" ON phrase_submissions
  FOR INSERT WITH CHECK (true);

-- Only authenticated users (you) can read submissions
-- Anonymous users cannot SELECT at all

-- Grant access to anon users (insert only)
GRANT INSERT ON phrase_submissions TO anon;

