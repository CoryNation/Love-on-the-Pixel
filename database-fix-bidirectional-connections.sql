-- Fix bidirectional connections and affirmation flow issues

-- 1. First, let's check the current state of the persons table
-- This will help us understand what data we have
SELECT 
    'Current persons data' as info,
    COUNT(*) as total_persons,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as without_user_id
FROM persons;

-- 2. Check for any orphaned persons (persons without proper user_id)
SELECT 
    'Orphaned persons' as info,
    id,
    user_id,
    name,
    email,
    created_at
FROM persons 
WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM auth.users);

-- 3. Check affirmations to see if they have proper recipient_id values
SELECT 
    'Affirmations status' as info,
    COUNT(*) as total_affirmations,
    COUNT(CASE WHEN recipient_id IS NOT NULL THEN 1 END) as with_recipient_id,
    COUNT(CASE WHEN recipient_id IS NULL THEN 1 END) as without_recipient_id,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
FROM affirmations;

-- 4. Check if there are any affirmations with recipient_id that don't match actual users
SELECT 
    'Invalid recipient_ids' as info,
    a.id,
    a.message,
    a.recipient_id,
    a.recipient_email,
    a.status,
    a.created_at
FROM affirmations a
WHERE a.recipient_id IS NOT NULL 
    AND a.recipient_id NOT IN (SELECT id FROM auth.users);

-- 5. Fix the RLS policy for affirmations to ensure proper access
-- Drop all existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view affirmations" ON affirmations;
DROP POLICY IF EXISTS "Users can view affirmations they sent or received" ON affirmations;
DROP POLICY IF EXISTS "Users can create affirmations" ON affirmations;
DROP POLICY IF EXISTS "Users can update their own affirmations" ON affirmations;
DROP POLICY IF EXISTS "Users can delete their own affirmations" ON affirmations;

-- Create the correct policies
CREATE POLICY "Users can view affirmations they sent or received" ON affirmations
  FOR SELECT USING (
    auth.uid() = created_by::uuid OR 
    auth.uid() = recipient_id::uuid
  );

CREATE POLICY "Users can create affirmations" ON affirmations
  FOR INSERT WITH CHECK (auth.uid() = created_by::uuid);

CREATE POLICY "Users can update their own affirmations" ON affirmations
  FOR UPDATE USING (auth.uid() = created_by::uuid);

CREATE POLICY "Users can delete their own affirmations" ON affirmations
  FOR DELETE USING (auth.uid() = created_by::uuid);

-- 6. Create a function to ensure bidirectional connections
-- This function will be called when a user accepts an invitation
CREATE OR REPLACE FUNCTION ensure_bidirectional_connection(
    inviter_id UUID,
    invitee_id UUID,
    invitee_name TEXT,
    invitee_email TEXT
) RETURNS VOID AS $$
BEGIN
    -- Check if inviter already has invitee in their persons list
    IF NOT EXISTS (
        SELECT 1 FROM persons 
        WHERE user_id = inviter_id 
        AND email = invitee_email
    ) THEN
        -- Add invitee to inviter's persons list
        INSERT INTO persons (user_id, name, email, relationship)
        VALUES (inviter_id, invitee_name, invitee_email, 'Connection');
    END IF;

    -- Check if invitee already has inviter in their persons list
    IF NOT EXISTS (
        SELECT 1 FROM persons 
        WHERE user_id = invitee_id 
        AND email = (
            SELECT email FROM user_profiles WHERE id = inviter_id
        )
    ) THEN
        -- Add inviter to invitee's persons list
        INSERT INTO persons (user_id, name, email, relationship)
        VALUES (
            invitee_id, 
            (SELECT full_name FROM user_profiles WHERE id = inviter_id),
            (SELECT email FROM user_profiles WHERE id = inviter_id),
            'Connection'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. Update any existing pending affirmations to delivered status
-- when the recipient has signed up
UPDATE affirmations 
SET 
    recipient_id = up.id,
    status = 'delivered'
FROM user_profiles up
WHERE affirmations.recipient_email = up.email
    AND affirmations.status = 'pending'
    AND affirmations.recipient_id IS NULL;

-- 8. Clean up any duplicate persons entries
-- Remove duplicates based on user_id and email combination
DELETE FROM persons 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM persons 
    GROUP BY user_id, email
    HAVING email IS NOT NULL
);

-- 9. Add a trigger to automatically create bidirectional connections
-- when a person is added to someone's persons list
CREATE OR REPLACE FUNCTION create_bidirectional_connection()
RETURNS TRIGGER AS $$
BEGIN
    -- If this person has an email and we can find their user profile,
    -- automatically add the current user to their persons list
    IF NEW.email IS NOT NULL THEN
        INSERT INTO persons (user_id, name, email, relationship)
        SELECT 
            up.id,
            up.full_name,
            up.email,
            'Connection'
        FROM user_profiles up
        WHERE up.email = NEW.email
        AND up.id != NEW.user_id  -- Don't add self
        AND NOT EXISTS (
            SELECT 1 FROM persons p2 
            WHERE p2.user_id = up.id 
            AND p2.email = NEW.email
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_create_bidirectional_connection ON persons;
CREATE TRIGGER trigger_create_bidirectional_connection
    AFTER INSERT ON persons
    FOR EACH ROW
    EXECUTE FUNCTION create_bidirectional_connection();

-- 10. Final verification queries
SELECT 
    'Final verification - Persons count by user' as info,
    user_id,
    COUNT(*) as person_count
FROM persons 
GROUP BY user_id 
ORDER BY person_count DESC;

SELECT 
    'Final verification - Affirmations by status' as info,
    status,
    COUNT(*) as count
FROM affirmations 
GROUP BY status;
