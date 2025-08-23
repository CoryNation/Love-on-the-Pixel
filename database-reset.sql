-- =====================================================
-- LOVE ON THE PIXEL - COMPLETE DATABASE RESET SCRIPT
-- =====================================================
-- This script will completely reset your database
-- WARNING: This will delete ALL existing data!

-- Disable RLS temporarily for cleanup
ALTER TABLE IF EXISTS affirmations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS persons DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invitations DISABLE ROW LEVEL SECURITY;

-- Drop all data from tables (in correct order due to foreign keys)
DELETE FROM invitations;
DELETE FROM persons;
DELETE FROM affirmations;
DELETE FROM user_profiles;

-- Drop existing tables
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS persons CASCADE;
DROP TABLE IF EXISTS affirmations CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Drop existing RLS policies (only if tables exist)
DO $$
BEGIN
  -- Drop user_profiles policies if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
  END IF;

  -- Drop affirmations policies if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'affirmations') THEN
    DROP POLICY IF EXISTS "Users can view affirmations they created" ON affirmations;
    DROP POLICY IF EXISTS "Users can create affirmations" ON affirmations;
    DROP POLICY IF EXISTS "Users can update affirmations they created" ON affirmations;
    DROP POLICY IF EXISTS "Users can delete affirmations they created" ON affirmations;
  END IF;

  -- Drop persons policies if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'persons') THEN
    DROP POLICY IF EXISTS "Users can view their own persons" ON persons;
    DROP POLICY IF EXISTS "Users can create persons" ON persons;
    DROP POLICY IF EXISTS "Users can update their own persons" ON persons;
    DROP POLICY IF EXISTS "Users can delete their own persons" ON persons;
  END IF;

  -- Drop invitations policies if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invitations') THEN
    DROP POLICY IF EXISTS "Users can view invitations they created" ON invitations;
    DROP POLICY IF EXISTS "Users can create invitations" ON invitations;
    DROP POLICY IF EXISTS "Users can update invitations they created" ON invitations;
    DROP POLICY IF EXISTS "Users can delete invitations they created" ON invitations;
  END IF;
END $$;

-- Drop existing storage bucket
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;

-- =====================================================
-- CREATE TABLES
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
-- CREATE INDEXES
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
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE affirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
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
-- CREATE STORAGE BUCKET
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
-- CREATE FUNCTIONS AND TRIGGERS
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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- INSERT SAMPLE DATA (OPTIONAL)
-- =====================================================

-- You can uncomment the following section if you want to add some sample affirmations
-- Note: These will only be visible to the user who creates them

/*
-- Sample affirmations (these will be created when a user signs up)
-- You can add these manually after creating your first user account
INSERT INTO affirmations (message, category, created_by) VALUES
('You are capable of amazing things', 'encouragement', 'YOUR_USER_ID_HERE'),
('Your kindness makes the world better', 'appreciation', 'YOUR_USER_ID_HERE'),
('You have the strength to overcome any challenge', 'motivation', 'YOUR_USER_ID_HERE'),
('Your presence brings joy to others', 'love', 'YOUR_USER_ID_HERE'),
('You are worthy of love and respect', 'self-worth', 'YOUR_USER_ID_HERE');
*/

-- =====================================================
-- VERIFICATION QUERIES
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
