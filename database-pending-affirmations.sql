-- Add new columns to affirmations table for pending affirmations
ALTER TABLE affirmations 
ADD COLUMN IF NOT EXISTS recipient_email TEXT,
ADD COLUMN IF NOT EXISTS recipient_name TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'delivered';

-- Create index for efficient querying of pending affirmations
CREATE INDEX IF NOT EXISTS idx_affirmations_pending 
ON affirmations(recipient_email, status) 
WHERE status = 'pending';

-- Create index for efficient querying by recipient_id
CREATE INDEX IF NOT EXISTS idx_affirmations_recipient 
ON affirmations(recipient_id) 
WHERE recipient_id IS NOT NULL;

-- Create index for efficient querying by created_by
CREATE INDEX IF NOT EXISTS idx_affirmations_created_by 
ON affirmations(created_by);
