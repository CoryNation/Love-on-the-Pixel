-- =====================================================
-- ADD SAMPLE AFFIRMATIONS FOR TESTING
-- =====================================================
-- Run this script after creating your first user account
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID

-- To find your user ID, run this query first:
-- SELECT id, email FROM auth.users;

-- Then replace 'YOUR_USER_ID_HERE' below with your actual user ID

-- Sample affirmations for testing
INSERT INTO affirmations (message, category, created_by) VALUES
('You are capable of amazing things', 'encouragement', 'YOUR_USER_ID_HERE'),
('Your kindness makes the world better', 'appreciation', 'YOUR_USER_ID_HERE'),
('You have the strength to overcome any challenge', 'motivation', 'YOUR_USER_ID_HERE'),
('Your presence brings joy to others', 'love', 'YOUR_USER_ID_HERE'),
('You are worthy of love and respect', 'self-worth', 'YOUR_USER_ID_HERE'),
('Every day you grow stronger and more beautiful', 'encouragement', 'YOUR_USER_ID_HERE'),
('Your smile brightens my world', 'appreciation', 'YOUR_USER_ID_HERE'),
('You inspire me to be a better person', 'motivation', 'YOUR_USER_ID_HERE'),
('You are loved beyond measure', 'love', 'YOUR_USER_ID_HERE'),
('Your heart is pure and beautiful', 'self-worth', 'YOUR_USER_ID_HERE');

-- Verify the affirmations were added
SELECT 'Sample affirmations added' as status, COUNT(*) as count FROM affirmations WHERE created_by = 'YOUR_USER_ID_HERE';
