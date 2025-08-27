-- Comprehensive fix for bidirectional connections and affirmation flow issues

-- 1. Check current state
SELECT 
    'Current persons data' as info,
    COUNT(*) as total_persons,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as without_user_id
FROM persons;

-- 2. Check affirmations status
SELECT 
    'Affirmations status' as info,
    COUNT(*) as total_affirmations,
    COUNT(CASE WHEN recipient_id IS NOT NULL THEN 1 END) as with_recipient_id,
    COUNT(CASE WHEN recipient_id IS NULL THEN 1 END) as without_recipient_id,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
FROM affirmations;

-- 3. Fix RLS policies for affirmations to ensure proper visibility
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view affirmations" ON affirmations;
DROP POLICY IF EXISTS "Users can view affirmations they sent or received" ON affirmations;
DROP POLICY IF EXISTS "Users can create affirmations" ON affirmations;
DROP POLICY IF EXISTS "Users can update their own affirmations" ON affirmations;
DROP POLICY IF EXISTS "Users can delete their own affirmations" ON affirmations;

-- Create the correct policies
CREATE POLICY "Users can view affirmations they sent or received" ON affirmations
  FOR SELECT USING (
    auth.uid()::text = created_by::text OR 
    auth.uid()::text = recipient_id::text
  );

CREATE POLICY "Users can create affirmations" ON affirmations
  FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);

CREATE POLICY "Users can update their own affirmations" ON affirmations
  FOR UPDATE USING (auth.uid()::text = created_by::text);

CREATE POLICY "Users can delete their own affirmations" ON affirmations
  FOR DELETE USING (auth.uid()::text = created_by::text);

-- 4. Update any existing pending affirmations to delivered status
-- when the recipient has signed up
UPDATE affirmations 
SET 
    recipient_id = up.id,
    status = 'delivered'
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE affirmations.recipient_email = au.email
    AND affirmations.status = 'pending'
    AND affirmations.recipient_id IS NULL;

-- 5. Create bidirectional connections for existing persons
-- This will ensure that when Person A has Person B in their list,
-- Person B also gets Person A in their list

-- First, let's see what connections we need to create
WITH missing_connections AS (
  SELECT DISTINCT
    p1.user_id as user_a_id,
    p1.name as user_a_name,
    p1.email as user_a_email,
    p2.user_id as user_b_id,
    p2.name as user_b_name,
    p2.email as user_b_email
  FROM persons p1
  JOIN persons p2 ON p1.email = p2.email AND p1.user_id != p2.user_id
  WHERE p1.user_id IS NOT NULL AND p2.user_id IS NOT NULL
    AND p1.email IS NOT NULL AND p1.email != ''
    AND NOT EXISTS (
      SELECT 1 FROM persons p3 
      WHERE p3.user_id = p2.user_id 
        AND p3.email = p1.email
    )
)
SELECT 
    'Missing bidirectional connections' as info,
    COUNT(*) as count
FROM missing_connections;

-- 6. Insert the missing bidirectional connections
INSERT INTO persons (user_id, name, email, created_at, updated_at)
SELECT DISTINCT
    p2.user_id,
    p1.name,
    p1.email,
    NOW(),
    NOW()
FROM persons p1
JOIN persons p2 ON p1.email = p2.email AND p1.user_id != p2.user_id
WHERE p1.user_id IS NOT NULL AND p2.user_id IS NOT NULL
    AND p1.email IS NOT NULL AND p1.email != ''
    AND NOT EXISTS (
        SELECT 1 FROM persons p3 
        WHERE p3.user_id = p2.user_id 
            AND p3.email = p1.email
    );

-- 7. Clean up any duplicate persons entries
DELETE FROM persons 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, email) id
    FROM persons 
    WHERE email IS NOT NULL
    ORDER BY user_id, email, id
);

-- 8. Final verification
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

-- 9. Show sample bidirectional connections
SELECT 
    'Sample bidirectional connections' as info,
    p1.user_id as user_a_id,
    p1.name as user_a_name,
    p1.email as shared_email,
    p2.user_id as user_b_id,
    p2.name as user_b_name
FROM persons p1
JOIN persons p2 ON p1.email = p2.email AND p1.user_id != p2.user_id
WHERE p1.user_id IS NOT NULL AND p2.user_id IS NOT NULL
    AND p1.email IS NOT NULL AND p1.email != ''
LIMIT 5;
