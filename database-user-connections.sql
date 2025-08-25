-- Add user_connections table for bidirectional relationships
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connected_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_connected_user_id ON user_connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON user_connections(status);

-- Enable Row Level Security
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_connections
CREATE POLICY "Users can view their own connections" ON user_connections
  FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = connected_user_id
  );

CREATE POLICY "Users can create connections" ON user_connections
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update their own connections" ON user_connections
  FOR UPDATE USING (
    auth.uid() = user_id OR auth.uid() = connected_user_id
  );

CREATE POLICY "Users can delete their own connections" ON user_connections
  FOR DELETE USING (
    auth.uid() = user_id OR auth.uid() = connected_user_id
  );

-- Add recipient_id column to affirmations if it doesn't exist
ALTER TABLE affirmations ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for recipient_id
CREATE INDEX IF NOT EXISTS idx_affirmations_recipient_id ON affirmations(recipient_id);

-- Update RLS policies for affirmations to include recipient_id
DROP POLICY IF EXISTS "Users can view affirmations" ON affirmations;
CREATE POLICY "Users can view affirmations" ON affirmations
  FOR SELECT USING (
    auth.uid() = created_by OR auth.uid() = recipient_id
  );
