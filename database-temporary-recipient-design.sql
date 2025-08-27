-- Temporary Recipient ID Design for Pending Affirmations
-- This solves the problem of linking affirmations to recipients who haven't accepted invitations yet

-- 1. First, let's understand the current state
SELECT 
    'Current affirmations by status' as info,
    status,
    COUNT(*) as count,
    COUNT(CASE WHEN recipient_id IS NOT NULL THEN 1 END) as with_recipient_id,
    COUNT(CASE WHEN recipient_id IS NULL THEN 1 END) as without_recipient_id
FROM affirmations 
GROUP BY status;

-- 2. Create a temporary recipients table to track pending invitations
CREATE TABLE IF NOT EXISTS temporary_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id UUID REFERENCES invitations(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  temp_recipient_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL, -- This will be used as recipient_id in affirmations
  invitee_name TEXT NOT NULL,
  invitee_email TEXT, -- Optional, for existing users
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_temp_recipients_invitation_id ON temporary_recipients(invitation_id);
CREATE INDEX IF NOT EXISTS idx_temp_recipients_temp_id ON temporary_recipients(temp_recipient_id);
CREATE INDEX IF NOT EXISTS idx_temp_recipients_inviter_id ON temporary_recipients(inviter_id);
CREATE INDEX IF NOT EXISTS idx_temp_recipients_status ON temporary_recipients(status);

-- 4. Enable RLS
ALTER TABLE temporary_recipients ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for temporary_recipients
CREATE POLICY "Users can view their own temporary recipients" ON temporary_recipients
  FOR SELECT USING (auth.uid()::text = inviter_id::text);

CREATE POLICY "Users can create temporary recipients" ON temporary_recipients
  FOR INSERT WITH CHECK (auth.uid()::text = inviter_id::text);

CREATE POLICY "Users can update their own temporary recipients" ON temporary_recipients
  FOR UPDATE USING (auth.uid()::text = inviter_id::text);

-- 6. Create a new affirmations table with temporary recipient support
CREATE TABLE IF NOT EXISTS affirmations_temp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID, -- Can be either a real user_id or a temp_recipient_id
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'read')),
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create indexes for affirmations_temp
CREATE INDEX IF NOT EXISTS idx_affirmations_temp_sender_id ON affirmations_temp(sender_id);
CREATE INDEX IF NOT EXISTS idx_affirmations_temp_recipient_id ON affirmations_temp(recipient_id);
CREATE INDEX IF NOT EXISTS idx_affirmations_temp_status ON affirmations_temp(status);

-- 8. Enable RLS
ALTER TABLE affirmations_temp ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for affirmations_temp
CREATE POLICY "Users can view affirmations they sent or received" ON affirmations_temp
  FOR SELECT USING (
    auth.uid()::text = sender_id::text OR 
    auth.uid()::text = recipient_id::text OR
    recipient_id IN (
      SELECT temp_recipient_id FROM temporary_recipients 
      WHERE inviter_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create affirmations" ON affirmations_temp
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);

CREATE POLICY "Users can update their own affirmations" ON affirmations_temp
  FOR UPDATE USING (auth.uid()::text = sender_id::text);

CREATE POLICY "Users can delete their own affirmations" ON affirmations_temp
  FOR DELETE USING (auth.uid()::text = sender_id::text);

-- 10. Create a function to process temporary recipients when invitations are accepted
CREATE OR REPLACE FUNCTION process_temp_recipient_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- When a temporary recipient is accepted, update all related affirmations
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Update all affirmations that use this temp_recipient_id
    UPDATE affirmations_temp 
    SET 
      recipient_id = NEW.invitee_id, -- This will be set when the invitation is accepted
      status = 'delivered',
      updated_at = NOW()
    WHERE recipient_id = NEW.temp_recipient_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create trigger to automatically process affirmations when temp recipients are accepted
DROP TRIGGER IF EXISTS on_temp_recipient_accepted ON temporary_recipients;
CREATE TRIGGER on_temp_recipient_accepted
  AFTER UPDATE ON temporary_recipients
  FOR EACH ROW EXECUTE FUNCTION process_temp_recipient_acceptance();

-- 12. Add invitee_id column to temporary_recipients for when the invitation is accepted
ALTER TABLE temporary_recipients ADD COLUMN IF NOT EXISTS invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 13. Create a view for easier querying of affirmations with recipient info
CREATE OR REPLACE VIEW affirmations_with_recipients AS
SELECT 
  a.*,
  sender.full_name as sender_name,
  sender.photo_url as sender_photo_url,
  CASE 
    WHEN tr.temp_recipient_id IS NOT NULL THEN tr.invitee_name
    ELSE recipient.full_name
  END as recipient_name,
  CASE 
    WHEN tr.temp_recipient_id IS NOT NULL THEN NULL
    ELSE recipient.photo_url
  END as recipient_photo_url,
  CASE 
    WHEN tr.temp_recipient_id IS NOT NULL THEN 'pending_acceptance'
    ELSE 'user'
  END as recipient_type
FROM affirmations_temp a
LEFT JOIN user_profiles sender ON a.sender_id = sender.id
LEFT JOIN user_profiles recipient ON a.recipient_id = recipient.id
LEFT JOIN temporary_recipients tr ON a.recipient_id = tr.temp_recipient_id;

-- 14. Create a function to create a temporary recipient when adding a person
CREATE OR REPLACE FUNCTION create_temp_recipient_for_person(
  p_inviter_id UUID,
  p_invitee_name TEXT,
  p_invitee_email TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_temp_id UUID;
BEGIN
  -- Generate a new temporary recipient
  INSERT INTO temporary_recipients (
    inviter_id, 
    invitee_name, 
    invitee_email
  ) VALUES (
    p_inviter_id, 
    p_invitee_name, 
    p_invitee_email
  ) RETURNING temp_recipient_id INTO v_temp_id;
  
  RETURN v_temp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Show the structure
SELECT 
    'Temporary recipients table structure' as info,
    'temporary_recipients' as table_name,
    'temp_recipient_id' as key_field,
    'Used as recipient_id in affirmations for pending invitations' as description;

-- 16. Test the view
SELECT 
    'Affirmations with recipients view test' as info,
    sender_name,
    recipient_name,
    recipient_type,
    status,
    message
FROM affirmations_with_recipients 
ORDER BY created_at DESC 
LIMIT 3;
