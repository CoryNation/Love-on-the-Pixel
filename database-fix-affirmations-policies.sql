-- Fix affirmations RLS policies to properly allow users to see affirmations they've sent or received

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view affirmations" ON affirmations;

-- Create more specific policies
CREATE POLICY "Users can view affirmations they sent or received" ON affirmations
  FOR SELECT USING (
    auth.uid() = created_by::uuid OR 
    auth.uid() = recipient_id::uuid
  );

-- Keep the existing policies for create, update, delete
-- (These should already exist from the main setup)
