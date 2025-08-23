-- Enable Row Level Security
ALTER TABLE affirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to affirmations table
ALTER TABLE affirmations ADD COLUMN IF NOT EXISTS viewed BOOLEAN DEFAULT FALSE;
ALTER TABLE affirmations ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE affirmations ADD COLUMN IF NOT EXISTS sender_photo_url TEXT;
ALTER TABLE affirmations ADD COLUMN IF NOT EXISTS created_by UUID;

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  inviter_name TEXT NOT NULL,
  inviter_email TEXT NOT NULL,
  invitee_email TEXT,
  invitee_name TEXT,
  status TEXT DEFAULT 'shared' CHECK (status IN ('shared', 'pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invitation_link TEXT,
  custom_message TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affirmations_created_by ON affirmations(created_by);
CREATE INDEX IF NOT EXISTS idx_affirmations_viewed ON affirmations(viewed);
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_id ON invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can view affirmations" ON affirmations;
DROP POLICY IF EXISTS "Users can create affirmations" ON affirmations;
DROP POLICY IF EXISTS "Users can update their own affirmations" ON affirmations;
DROP POLICY IF EXISTS "Users can delete their own affirmations" ON affirmations;

DROP POLICY IF EXISTS "Users can view their own invitations" ON invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON invitations;
DROP POLICY IF EXISTS "Users can update their own invitations" ON invitations;
DROP POLICY IF EXISTS "Users can delete their own invitations" ON invitations;

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Affirmations policies
CREATE POLICY "Users can view affirmations" ON affirmations
  FOR SELECT USING (true);

CREATE POLICY "Users can create affirmations" ON affirmations
  FOR INSERT WITH CHECK (auth.uid() = created_by::uuid);

CREATE POLICY "Users can update their own affirmations" ON affirmations
  FOR UPDATE USING (auth.uid() = created_by::uuid);

CREATE POLICY "Users can delete their own affirmations" ON affirmations
  FOR DELETE USING (auth.uid() = created_by::uuid);

-- Invitations policies
CREATE POLICY "Users can view their own invitations" ON invitations
  FOR SELECT USING (auth.uid() = inviter_id);

CREATE POLICY "Users can create invitations" ON invitations
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can update their own invitations" ON invitations
  FOR UPDATE USING (auth.uid() = inviter_id);

CREATE POLICY "Users can delete their own invitations" ON invitations
  FOR DELETE USING (auth.uid() = inviter_id);

-- Storage policies (simplified)
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
