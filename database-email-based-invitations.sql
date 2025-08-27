-- Email-Based Invitation System
-- This provides a simpler, more reliable way to handle invitations and connections

-- 1. Update the invitations table to be more comprehensive
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  inviter_name TEXT NOT NULL,
  inviter_email TEXT NOT NULL,
  invitee_name TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  custom_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(inviter_id, invitee_email)
);

-- 2. Create a user_connections table for accepted connections
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connected_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id)
);

-- 3. Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies
DROP POLICY IF EXISTS "Users can view their own invitations" ON invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON invitations;
DROP POLICY IF EXISTS "Users can update their own invitations" ON invitations;
DROP POLICY IF EXISTS "Users can delete their own invitations" ON invitations;

DROP POLICY IF EXISTS "Users can view their connections" ON user_connections;
DROP POLICY IF EXISTS "Users can create connections" ON user_connections;
DROP POLICY IF EXISTS "Users can delete their connections" ON user_connections;

-- 5. Create RLS policies for invitations
CREATE POLICY "Users can view their own invitations" ON invitations
  FOR SELECT USING (auth.uid()::text = inviter_id::text);

CREATE POLICY "Users can create invitations" ON invitations
  FOR INSERT WITH CHECK (auth.uid()::text = inviter_id::text);

CREATE POLICY "Users can update their own invitations" ON invitations
  FOR UPDATE USING (auth.uid()::text = inviter_id::text);

CREATE POLICY "Users can delete their own invitations" ON invitations
  FOR DELETE USING (auth.uid()::text = inviter_id::text);

-- 6. Create RLS policies for user_connections
CREATE POLICY "Users can view their connections" ON user_connections
  FOR SELECT USING (auth.uid()::text = user_id::text OR auth.uid()::text = connected_user_id::text);

CREATE POLICY "Users can create connections" ON user_connections
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their connections" ON user_connections
  FOR DELETE USING (auth.uid()::text = user_id::text OR auth.uid()::text = connected_user_id::text);

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_id ON invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_email ON invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_connected_user_id ON user_connections(connected_user_id);

-- 8. Function to create bidirectional connection
CREATE OR REPLACE FUNCTION create_bidirectional_connection(
  p_user_id UUID,
  p_connected_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Insert connection from user to connected user
  INSERT INTO user_connections (user_id, connected_user_id)
  VALUES (p_user_id, p_connected_user_id)
  ON CONFLICT (user_id, connected_user_id) DO NOTHING;
  
  -- Insert reverse connection from connected user to user
  INSERT INTO user_connections (user_id, connected_user_id)
  VALUES (p_connected_user_id, p_user_id)
  ON CONFLICT (user_id, connected_user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Function to process invitation acceptance
CREATE OR REPLACE FUNCTION accept_invitation(
  p_invitation_id UUID,
  p_accepter_id UUID
)
RETURNS VOID AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Get invitation details
  SELECT * INTO invitation_record 
  FROM invitations 
  WHERE id = p_invitation_id AND invitee_email = (
    SELECT email FROM auth.users WHERE id = p_accepter_id
  );
  
  IF invitation_record.id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or email mismatch';
  END IF;
  
  -- Create bidirectional connection
  PERFORM create_bidirectional_connection(invitation_record.inviter_id, p_accepter_id);
  
  -- Update invitation status
  UPDATE invitations 
  SET status = 'accepted', 
      accepted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Function to sync persons with connections
CREATE OR REPLACE FUNCTION sync_persons_with_connections()
RETURNS VOID AS $$
DECLARE
  connection_record RECORD;
BEGIN
  -- For each connection, ensure both users have each other in their persons list
  FOR connection_record IN 
    SELECT uc.user_id, uc.connected_user_id, up1.full_name as user_name, up2.full_name as connected_user_name
    FROM user_connections uc
    LEFT JOIN user_profiles up1 ON uc.user_id = up1.id
    LEFT JOIN user_profiles up2 ON uc.connected_user_id = up2.id
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

-- 11. Trigger to sync persons when connections are created
CREATE OR REPLACE FUNCTION trigger_sync_persons()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM sync_persons_with_connections();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_connection_created ON user_connections;
CREATE TRIGGER on_connection_created
  AFTER INSERT ON user_connections
  FOR EACH ROW EXECUTE FUNCTION trigger_sync_persons();

-- 12. Views for easier querying
CREATE OR REPLACE VIEW pending_invitations AS
SELECT 
  i.*,
  up.full_name as inviter_full_name,
  up.photo_url as inviter_photo_url
FROM invitations i
LEFT JOIN user_profiles up ON i.inviter_id = up.id
WHERE i.status = 'pending'
ORDER BY i.created_at DESC;

CREATE OR REPLACE VIEW user_connections_with_profiles AS
SELECT 
  uc.*,
  up1.full_name as user_name,
  up1.photo_url as user_photo_url,
  up2.full_name as connected_user_name,
  up2.photo_url as connected_user_photo_url
FROM user_connections uc
LEFT JOIN user_profiles up1 ON uc.user_id = up1.id
LEFT JOIN user_profiles up2 ON uc.connected_user_id = up2.id;

-- 13. Show current state
SELECT 
    'Email-based invitation system created' as status,
    COUNT(*) as total_invitations
FROM invitations;

SELECT 
    'User connections created' as status,
    COUNT(*) as total_connections
FROM user_connections;
