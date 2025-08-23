-- Database setup for Love on the Pixel app
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
ALTER TABLE IF EXISTS affirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns to affirmations table if they don't exist
ALTER TABLE affirmations 
ADD COLUMN IF NOT EXISTS viewed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS sender_photo_url TEXT;

-- Ensure created_by column exists and is the right type
ALTER TABLE affirmations 
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affirmations_viewed ON affirmations(viewed);
CREATE INDEX IF NOT EXISTS idx_affirmations_created_by ON affirmations(created_by);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Row Level Security Policies

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can view all affirmations" ON affirmations;
DROP POLICY IF EXISTS "Users can update their own affirmations" ON affirmations;
DROP POLICY IF EXISTS "Users can insert affirmations" ON affirmations;
DROP POLICY IF EXISTS "Users can delete their own affirmations" ON affirmations;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Affirmations policies
CREATE POLICY "Users can view all affirmations" ON affirmations
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own affirmations" ON affirmations
  FOR UPDATE USING (auth.uid() = created_by::uuid);

CREATE POLICY "Users can insert affirmations" ON affirmations
  FOR INSERT WITH CHECK (auth.uid() = created_by::uuid);

CREATE POLICY "Users can delete their own affirmations" ON affirmations
  FOR DELETE USING (auth.uid() = created_by::uuid);

-- Storage policies for avatars
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
  );

CREATE POLICY "Users can view all avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
  );

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
