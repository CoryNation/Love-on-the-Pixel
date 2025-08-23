-- =====================================================
-- LOVE ON THE PIXEL - SIMPLIFIED DATABASE RESET SCRIPT
-- =====================================================
-- This script will completely reset your database
-- WARNING: This will delete ALL existing data!

-- =====================================================
-- STEP 1: CLEAN UP EXISTING DATA AND STRUCTURES
-- =====================================================

-- Drop triggers first (if they exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions (if they exist)
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Drop all storage policies (if they exist)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;

-- Drop all tables with CASCADE (this will also drop all policies)
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS persons CASCADE;
DROP TABLE IF EXISTS affirmations CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- =====================================================
-- STEP 2: CREATE TABLES
-- =====================================================

-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create affirmations table
CREATE TABLE affirmations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  viewed BOOLEAN DEFAULT FALSE,
  favorited BOOLEAN DEFAULT FALSE,
  sender_name TEXT,
  sender_photo_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create persons table for user connections
CREATE TABLE persons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  relationship TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invitations table
CREATE TABLE invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  inviter_name TEXT NOT NULL,
  inviter_email TEXT NOT NULL,
  invitee_name TEXT,
  invitee_email TEXT,
  status TEXT DEFAULT 'shared' CHECK (status IN ('shared', 'accepted', 'expired')),
  invitation_link TEXT,
  custom_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: CREATE INDEXES
-- =====================================================

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affirmations_created_by ON affirmations(created_by);
CREATE INDEX IF NOT EXISTS idx_affirmations_viewed ON affirmations(viewed);
CREATE INDEX IF NOT EXISTS idx_affirmations_favorited ON affirmations(favorited);
CREATE INDEX IF NOT EXISTS idx_affirmations_category ON affirmations(category);
CREATE INDEX IF NOT EXISTS idx_persons_user_id ON persons(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_id ON invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_email ON invitations(invitee_email);

-- =====================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE affirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: CREATE RLS POLICIES
-- =====================================================

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Affirmations policies
CREATE POLICY "Users can view affirmations they created" ON affirmations
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create affirmations" ON affirmations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update affirmations they created" ON affirmations
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete affirmations they created" ON affirmations
  FOR DELETE USING (auth.uid() = created_by);

-- Persons policies
CREATE POLICY "Users can view their own persons" ON persons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create persons" ON persons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own persons" ON persons
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own persons" ON persons
  FOR DELETE USING (auth.uid() = user_id);

-- Invitations policies
CREATE POLICY "Users can view invitations they created" ON invitations
  FOR SELECT USING (auth.uid() = inviter_id);

CREATE POLICY "Users can create invitations" ON invitations
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can update invitations they created" ON invitations
  FOR UPDATE USING (auth.uid() = inviter_id);

CREATE POLICY "Users can delete invitations they created" ON invitations
  FOR DELETE USING (auth.uid() = inviter_id);

-- =====================================================
-- STEP 6: CREATE STORAGE BUCKET
-- =====================================================

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- STEP 7: CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile with error handling
  BEGIN
    INSERT INTO user_profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- STEP 8: VERIFICATION
-- =====================================================

-- Verify tables were created
SELECT 'user_profiles' as table_name, COUNT(*) as row_count FROM user_profiles
UNION ALL
SELECT 'affirmations' as table_name, COUNT(*) as row_count FROM affirmations
UNION ALL
SELECT 'persons' as table_name, COUNT(*) as row_count FROM persons
UNION ALL
SELECT 'invitations' as table_name, COUNT(*) as row_count FROM invitations;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'affirmations', 'persons', 'invitations');

-- Verify policies were created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'affirmations', 'persons', 'invitations');

-- =====================================================
-- RESET COMPLETE!
-- =====================================================

-- Your database has been completely reset and is ready for use.
-- All existing data has been removed and the schema has been recreated.
-- You can now start fresh with your Love on the Pixel app!
