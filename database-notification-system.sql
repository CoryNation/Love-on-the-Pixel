-- Notification System Database Schema
-- Run this in your Supabase SQL editor

-- 1. Create notification settings table
CREATE TABLE IF NOT EXISTS user_notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  notifications_enabled BOOLEAN DEFAULT true,
  invitation_received BOOLEAN DEFAULT true,
  affirmation_received BOOLEAN DEFAULT true,
  affirmation_treasured BOOLEAN DEFAULT false,
  frequency TEXT DEFAULT 'every_time' CHECK (frequency IN ('every_time', 'once_daily')),
  fcm_token TEXT,
  web_push_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create notification logs table for frequency limiting
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view their own notification settings" 
  ON user_notification_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" 
  ON user_notification_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
  ON user_notification_settings FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notification logs" 
  ON notification_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification logs" 
  ON notification_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id 
  ON user_notification_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id_tag 
  ON notification_logs(user_id, tag);

CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at 
  ON notification_logs(created_at);

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create trigger for updated_at
CREATE TRIGGER update_user_notification_settings_updated_at 
  BEFORE UPDATE ON user_notification_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Create function to send notifications (for database triggers)
CREATE OR REPLACE FUNCTION notify_new_affirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be handled by your application logic
  -- The function exists for potential future database-level notifications
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to check notification frequency
CREATE OR REPLACE FUNCTION can_send_notification(
  p_user_id UUID,
  p_tag TEXT,
  p_frequency TEXT DEFAULT 'every_time'
)
RETURNS BOOLEAN AS $$
DECLARE
  last_notification TIMESTAMP WITH TIME ZONE;
BEGIN
  IF p_frequency = 'every_time' THEN
    RETURN TRUE;
  END IF;
  
  SELECT created_at INTO last_notification
  FROM notification_logs
  WHERE user_id = p_user_id AND tag = p_tag
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF last_notification IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if 24 hours have passed
  RETURN (NOW() - last_notification) > INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- 10. Insert default settings for existing users (optional)
-- Uncomment if you want to create default settings for existing users
/*
INSERT INTO user_notification_settings (user_id, notifications_enabled, invitation_received, affirmation_received, affirmation_treasured, frequency)
SELECT 
  id,
  true,
  true,
  true,
  false,
  'every_time'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_notification_settings);
*/
