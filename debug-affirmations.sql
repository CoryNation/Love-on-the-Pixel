-- Debug queries to investigate affirmation flow issues

-- 1. Check the affirmations table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'affirmations' 
ORDER BY ordinal_position;

-- 2. Check all affirmations in the system
SELECT 
    id,
    message,
    category,
    created_by,
    recipient_id,
    recipient_email,
    status,
    viewed,
    created_at,
    updated_at
FROM affirmations 
ORDER BY created_at DESC;

-- 3. Check RLS policies on affirmations table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'affirmations';

-- 4. Check if RLS is enabled on affirmations table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'affirmations';

-- 5. Check specific user's affirmations (replace USER_ID with actual user ID)
-- Replace 'your-user-id-here' with the actual user ID from the test
SELECT 
    id,
    message,
    category,
    created_by,
    recipient_id,
    recipient_email,
    status,
    viewed,
    created_at
FROM affirmations 
WHERE created_by = 'your-user-id-here' OR recipient_id = 'your-user-id-here'
ORDER BY created_at DESC;

-- 6. Check for any affirmations with NULL recipient_id
SELECT 
    id,
    message,
    category,
    created_by,
    recipient_id,
    recipient_email,
    status,
    created_at
FROM affirmations 
WHERE recipient_id IS NULL;

-- 7. Check for pending affirmations
SELECT 
    id,
    message,
    category,
    created_by,
    recipient_id,
    recipient_email,
    status,
    created_at
FROM affirmations 
WHERE status = 'pending';

-- 8. Check for delivered affirmations
SELECT 
    id,
    message,
    category,
    created_by,
    recipient_id,
    recipient_email,
    status,
    created_at
FROM affirmations 
WHERE status = 'delivered';

-- 9. Check persons table to see user connections
SELECT 
    id,
    user_id,
    name,
    email,
    created_at
FROM persons 
ORDER BY created_at DESC;

-- 10. Check if there are any foreign key constraint issues
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'affirmations';

-- 11. Test the RLS policy manually (replace with actual user IDs)
-- This simulates what the app is trying to do
SELECT 
    id,
    message,
    category,
    created_by,
    recipient_id,
    recipient_email,
    status,
    created_at
FROM affirmations 
WHERE created_by::uuid = 'your-sender-id-here'::uuid 
   OR recipient_id::uuid = 'your-receiver-id-here'::uuid
ORDER BY created_at DESC;
