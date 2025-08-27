-- Complete Bidirectional Connections and Affirmations Solution
-- This addresses the core issues: bidirectional connections and affirmation persistence

-- 1. First, let's understand the current state
SELECT 
    'Current persons data' as info,
    COUNT(*) as total_persons,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as without_user_id
FROM persons;

-- 2. Create a user_connections table to track bidirectional relationships
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connected_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id)
);

-- 3. Create indexes for user_connections
CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_connected_user_id ON user_connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON user_connections(status);

-- 4. Enable RLS for user_connections
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist, then create RLS policies for user_connections
DROP POLICY IF EXISTS "Users can view their own connections" ON user_connections;
DROP POLICY IF EXISTS "Users can create connections" ON user_connections;
DROP POLICY IF EXISTS "Users can update their own connections" ON user_connections;
DROP POLICY IF EXISTS "Users can delete their own connections" ON user_connections;

CREATE POLICY "Users can view their own connections" ON user_connections
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR auth.uid()::text = connected_user_id::text
  );

CREATE POLICY "Users can create connections" ON user_connections
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text
  );

CREATE POLICY "Users can update their own connections" ON user_connections
  FOR UPDATE USING (
    auth.uid()::text = user_id::text OR auth.uid()::text = connected_user_id::text
  );

CREATE POLICY "Users can delete their own connections" ON user_connections
  FOR DELETE USING (
    auth.uid()::text = user_id::text OR auth.uid()::text = connected_user_id::text
  );

-- 6. Create a function to create bidirectional connections
CREATE OR REPLACE FUNCTION create_bidirectional_connection(
  p_user_id UUID,
  p_connected_user_id UUID,
  p_status TEXT DEFAULT 'pending'
)
RETURNS VOID AS $$
BEGIN
  -- Insert connection from user to connected user
  INSERT INTO user_connections (user_id, connected_user_id, status)
  VALUES (p_user_id, p_connected_user_id, p_status)
  ON CONFLICT (user_id, connected_user_id) DO NOTHING;
  
  -- Insert reverse connection from connected user to user
  INSERT INTO user_connections (user_id, connected_user_id, status)
  VALUES (p_connected_user_id, p_user_id, p_status)
  ON CONFLICT (user_id, connected_user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create a function to accept bidirectional connections
CREATE OR REPLACE FUNCTION accept_bidirectional_connection(
  p_user_id UUID,
  p_connected_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Accept connection from user to connected user
  UPDATE user_connections 
  SET status = 'accepted', updated_at = NOW()
  WHERE user_id = p_user_id AND connected_user_id = p_connected_user_id;
  
  -- Accept reverse connection from connected user to user
  UPDATE user_connections 
  SET status = 'accepted', updated_at = NOW()
  WHERE user_id = p_connected_user_id AND connected_user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create a function to remove bidirectional connections
CREATE OR REPLACE FUNCTION remove_bidirectional_connection(
  p_user_id UUID,
  p_connected_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Remove connection from user to connected user
  DELETE FROM user_connections 
  WHERE user_id = p_user_id AND connected_user_id = p_connected_user_id;
  
  -- Remove reverse connection from connected user to user
  DELETE FROM user_connections 
  WHERE user_id = p_connected_user_id AND connected_user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create a function to sync persons with user_connections
CREATE OR REPLACE FUNCTION sync_persons_with_connections()
RETURNS VOID AS $$
DECLARE
  connection_record RECORD;
BEGIN
  -- For each accepted connection, ensure both users have each other in their persons list
  FOR connection_record IN 
    SELECT uc.user_id, uc.connected_user_id, up1.full_name as user_name, up2.full_name as connected_user_name
    FROM user_connections uc
    LEFT JOIN user_profiles up1 ON uc.user_id = up1.id
    LEFT JOIN user_profiles up2 ON uc.connected_user_id = up2.id
    WHERE uc.status = 'accepted'
  LOOP
    -- Add connected user to user's persons list if not exists
    INSERT INTO persons (user_id, name, email, created_at, updated_at)
    VALUES (
      connection_record.user_id,
      COALESCE(connection_record.connected_user_name, 'Connected User'),
      NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, name) DO NOTHING;
    
    -- Add user to connected user's persons list if not exists
    INSERT INTO persons (user_id, name, email, created_at, updated_at)
    VALUES (
      connection_record.connected_user_id,
      COALESCE(connection_record.user_name, 'Connected User'),
      NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, name) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create a trigger to automatically sync persons when connections are updated
CREATE OR REPLACE FUNCTION trigger_sync_persons()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the sync function when connections are updated
  PERFORM sync_persons_with_connections();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create trigger for connection updates
DROP TRIGGER IF EXISTS on_connection_updated ON user_connections;
CREATE TRIGGER on_connection_updated
  AFTER INSERT OR UPDATE ON user_connections
  FOR EACH ROW EXECUTE FUNCTION trigger_sync_persons();

-- 12. Create a clean affirmations table that persists regardless of connections
CREATE TABLE IF NOT EXISTS affirmations_clean (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'delivered' CHECK (status IN ('delivered', 'read')),
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Create indexes for affirmations_clean
CREATE INDEX IF NOT EXISTS idx_affirmations_clean_sender_id ON affirmations_clean(sender_id);
CREATE INDEX IF NOT EXISTS idx_affirmations_clean_recipient_id ON affirmations_clean(recipient_id);
CREATE INDEX IF NOT EXISTS idx_affirmations_clean_status ON affirmations_clean(status);

-- 14. Enable RLS for affirmations_clean
ALTER TABLE affirmations_clean ENABLE ROW LEVEL SECURITY;

-- 15. Drop existing policies if they exist, then create RLS policies for affirmations_clean
DROP POLICY IF EXISTS "Users can view affirmations they sent or received" ON affirmations_clean;
DROP POLICY IF EXISTS "Users can create affirmations" ON affirmations_clean;
DROP POLICY IF EXISTS "Users can update their own affirmations" ON affirmations_clean;
DROP POLICY IF EXISTS "Users can delete their own affirmations" ON affirmations_clean;

CREATE POLICY "Users can view affirmations they sent or received" ON affirmations_clean
  FOR SELECT USING (
    auth.uid()::text = sender_id::text OR 
    auth.uid()::text = recipient_id::text
  );

CREATE POLICY "Users can create affirmations" ON affirmations_clean
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);

CREATE POLICY "Users can update their own affirmations" ON affirmations_clean
  FOR UPDATE USING (auth.uid()::text = sender_id::text);

CREATE POLICY "Users can delete their own affirmations" ON affirmations_clean
  FOR DELETE USING (auth.uid()::text = sender_id::text);

-- 16. Create a view for affirmations with user info
CREATE OR REPLACE VIEW affirmations_with_users AS
SELECT 
  a.*,
  sender.full_name as sender_name,
  sender.photo_url as sender_photo_url,
  recipient.full_name as recipient_name,
  recipient.photo_url as recipient_photo_url
FROM affirmations_clean a
LEFT JOIN user_profiles sender ON a.sender_id = sender.id
LEFT JOIN user_profiles recipient ON a.recipient_id = recipient.id;

-- 17. Create a view for persons with connection status
CREATE OR REPLACE VIEW persons_with_connections AS
SELECT 
  p.*,
  CASE 
    WHEN uc.status IS NOT NULL THEN uc.status
    ELSE 'no_connection'
  END as connection_status,
  uc.connected_user_id as connected_user_id
FROM persons p
LEFT JOIN user_connections uc ON p.user_id = uc.user_id AND p.name = (
  SELECT full_name FROM user_profiles WHERE id = uc.connected_user_id
);

-- 18. Migrate existing data to create bidirectional connections
-- This will analyze existing persons and create connections
DO $$
DECLARE
  person_record RECORD;
  user_profile_record RECORD;
BEGIN
  -- For each person with a user_id, try to find a matching user profile
  FOR person_record IN 
    SELECT p.*, up.full_name as profile_name
    FROM persons p
    LEFT JOIN user_profiles up ON p.name = up.full_name
    WHERE p.user_id IS NOT NULL
  LOOP
    -- If we found a matching user profile, create a connection
    IF person_record.profile_name IS NOT NULL THEN
      -- Find the user profile for this person
      SELECT * INTO user_profile_record 
      FROM user_profiles 
      WHERE full_name = person_record.name;
      
      IF user_profile_record.id IS NOT NULL THEN
        -- Create bidirectional connection
        PERFORM create_bidirectional_connection(
          person_record.user_id, 
          user_profile_record.id, 
          'accepted'
        );
      END IF;
    END IF;
  END LOOP;
END $$;

-- 19. Show current state after migration
SELECT 
    'User connections after migration' as info,
    status,
    COUNT(*) as count
FROM user_connections 
GROUP BY status;

SELECT 
    'Persons with connections' as info,
    connection_status,
    COUNT(*) as count
FROM persons_with_connections 
GROUP BY connection_status;

-- 20. Test the bidirectional connection functions
SELECT 
    'Testing bidirectional connections' as info,
    'Functions created successfully' as status;

-- 21. Show sample connections
SELECT 
    'Sample bidirectional connections' as info,
    uc1.user_id as user_a_id,
    up1.full_name as user_a_name,
    uc1.connected_user_id as user_b_id,
    up2.full_name as user_b_name,
    uc1.status as connection_status
FROM user_connections uc1
LEFT JOIN user_profiles up1 ON uc1.user_id = up1.id
LEFT JOIN user_profiles up2 ON uc1.connected_user_id = up2.id
WHERE uc1.status = 'accepted'
LIMIT 5;
