-- Clean Affirmations Design with Proper Relational Structure
-- This script implements a cleaner approach to handle affirmations between users

-- 1. First, let's understand the current state
SELECT 
    'Current affirmations by status' as info,
    status,
    COUNT(*) as count,
    COUNT(CASE WHEN recipient_id IS NOT NULL THEN 1 END) as with_recipient_id,
    COUNT(CASE WHEN recipient_id IS NULL THEN 1 END) as without_recipient_id
FROM affirmations 
GROUP BY status;

-- 2. Create a new affirmations table with cleaner design
CREATE TABLE IF NOT EXISTS affirmations_new (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT, -- For pending affirmations to non-users
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'read')),
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_affirmations_new_sender_id ON affirmations_new(sender_id);
CREATE INDEX IF NOT EXISTS idx_affirmations_new_recipient_id ON affirmations_new(recipient_id);
CREATE INDEX IF NOT EXISTS idx_affirmations_new_recipient_email ON affirmations_new(recipient_email);
CREATE INDEX IF NOT EXISTS idx_affirmations_new_status ON affirmations_new(status);

-- 4. Enable RLS
ALTER TABLE affirmations_new ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for the new table
CREATE POLICY "Users can view affirmations they sent or received" ON affirmations_new
  FOR SELECT USING (
    auth.uid()::text = sender_id::text OR 
    auth.uid()::text = recipient_id::text
  );

CREATE POLICY "Users can create affirmations" ON affirmations_new
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);

CREATE POLICY "Users can update their own affirmations" ON affirmations_new
  FOR UPDATE USING (auth.uid()::text = sender_id::text);

CREATE POLICY "Users can delete their own affirmations" ON affirmations_new
  FOR DELETE USING (auth.uid()::text = sender_id::text);

-- 6. Migrate existing data to the new structure
INSERT INTO affirmations_new (
  id,
  sender_id,
  recipient_id,
  recipient_email,
  message,
  category,
  status,
  is_favorite,
  created_at,
  updated_at
)
SELECT 
  a.id,
  a.created_by as sender_id,
  a.recipient_id,
  a.recipient_email,
  a.message,
  a.category,
  CASE 
    WHEN a.recipient_id IS NOT NULL THEN 'delivered'
    ELSE 'pending'
  END as status,
  a.is_favorite,
  a.created_at,
  a.updated_at
FROM affirmations a
WHERE a.created_by IS NOT NULL;

-- 7. Create a function to process pending affirmations when users sign up
CREATE OR REPLACE FUNCTION process_pending_affirmations()
RETURNS TRIGGER AS $$
BEGIN
  -- Update any pending affirmations for this user's email
  UPDATE affirmations_new 
  SET 
    recipient_id = NEW.id,
    status = 'delivered',
    updated_at = NOW()
  WHERE recipient_email = NEW.email 
    AND recipient_id IS NULL 
    AND status = 'pending';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger to automatically process pending affirmations
DROP TRIGGER IF EXISTS on_user_signup_process_affirmations ON auth.users;
CREATE TRIGGER on_user_signup_process_affirmations
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION process_pending_affirmations();

-- 9. Show migration results
SELECT 
    'Migration results - New affirmations table' as info,
    status,
    COUNT(*) as count
FROM affirmations_new 
GROUP BY status;

-- 10. Show sample data structure
SELECT 
    'Sample affirmations structure' as info,
    sender_id,
    recipient_id,
    recipient_email,
    status,
    message,
    created_at
FROM affirmations_new 
ORDER BY created_at DESC 
LIMIT 5;

-- 11. Create a view for easier querying
CREATE OR REPLACE VIEW user_affirmations AS
SELECT 
  a.*,
  sender.full_name as sender_name,
  sender.photo_url as sender_photo_url,
  recipient.full_name as recipient_name,
  recipient.photo_url as recipient_photo_url
FROM affirmations_new a
LEFT JOIN user_profiles sender ON a.sender_id = sender.id
LEFT JOIN user_profiles recipient ON a.recipient_id = recipient.id;

-- 12. Test the view
SELECT 
    'User affirmations view test' as info,
    sender_name,
    recipient_name,
    recipient_email,
    status,
    message
FROM user_affirmations 
ORDER BY created_at DESC 
LIMIT 3;

-- 13. Optional: Drop old table (uncomment when ready)
-- DROP TABLE IF EXISTS affirmations;

-- 14. Optional: Rename new table to replace old one (uncomment when ready)
-- ALTER TABLE affirmations_new RENAME TO affirmations;
