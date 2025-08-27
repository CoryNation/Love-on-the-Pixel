-- Fix RLS policies for persons table
-- This addresses the 403 error when trying to add persons

-- First, ensure the persons table exists and has the correct structure
CREATE TABLE IF NOT EXISTS persons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on persons table
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own persons" ON persons;
DROP POLICY IF EXISTS "Users can create persons" ON persons;
DROP POLICY IF EXISTS "Users can update their own persons" ON persons;
DROP POLICY IF EXISTS "Users can delete their own persons" ON persons;

-- Create new policies with proper type casting
CREATE POLICY "Users can view their own persons" ON persons
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create persons" ON persons
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own persons" ON persons
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own persons" ON persons
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_persons_user_id ON persons(user_id);

-- Test the policies
SELECT 
    'RLS policies updated for persons table' as status,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'persons';

-- Show current persons table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'persons' 
ORDER BY ordinal_position;
