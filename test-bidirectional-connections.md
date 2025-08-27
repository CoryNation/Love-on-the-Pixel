# 🔗 Test Bidirectional Connections

## **Step 1: Run the Database Migration**

First, run the migration to fix any existing issues:

```sql
-- Run this in your Supabase SQL Editor
-- Copy and paste the contents of database-fix-bidirectional-connections.sql
```

## **Step 2: Test the Connection Flow**

### **Test Scenario:**
1. **User A** invites **User B** via email
2. **User B** signs up and accepts the invitation
3. Both users should appear in each other's "Persons" list
4. **User A** should be able to send affirmations to **User B**
5. **User B** should see the affirmations in their "Wave" page

### **Step-by-Step Test:**

#### **Step 2a: Create Test Users**
1. **Create User A** (inviter):
   - Sign up with email: `testuserA@example.com`
   - Complete profile setup

2. **Create User B** (invitee):
   - Sign up with email: `testuserB@example.com`
   - Complete profile setup

#### **Step 2b: Send Invitation**
1. **Log in as User A**
2. **Go to Persons page**
3. **Add User B** to your persons list:
   - Name: "Test User B"
   - Email: `testuserB@example.com`
4. **Send an invitation** to User B

#### **Step 2c: Accept Invitation**
1. **Log in as User B**
2. **Check if User A appears** in your Persons list
3. **If not, manually add User A**:
   - Name: "Test User A"
   - Email: `testuserA@example.com`

#### **Step 2d: Test Affirmation Flow**
1. **Log in as User A**
2. **Go to Persons page**
3. **Select User B** from your persons list
4. **Send an affirmation** to User B
5. **Note the timestamp** of when you sent it

#### **Step 2e: Verify Affirmation Received**
1. **Log in as User B**
2. **Go to Wave page**
3. **Check if the affirmation appears**
4. **Check browser console** for debug messages

## **Step 3: Database Verification**

Run these queries to verify the connections:

### **Check Persons Table:**
```sql
-- Check all persons in the system
SELECT 
    p.id,
    p.user_id,
    p.name,
    p.email,
    up.full_name as user_full_name,
    p.created_at
FROM persons p
LEFT JOIN user_profiles up ON p.user_id = up.id
ORDER BY p.created_at DESC;
```

### **Check Affirmations:**
```sql
-- Check all affirmations
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
ORDER BY created_at DESC;
```

### **Check Bidirectional Connections:**
```sql
-- Check if User A and User B are in each other's lists
-- Replace 'user-a-id' and 'user-b-id' with actual user IDs

-- User A's persons list
SELECT 
    'User A persons list' as info,
    p.name,
    p.email,
    p.user_id
FROM persons p
WHERE p.user_id = 'user-a-id';

-- User B's persons list  
SELECT 
    'User B persons list' as info,
    p.name,
    p.email,
    p.user_id
FROM persons p
WHERE p.user_id = 'user-b-id';
```

## **Step 4: Expected Results**

### **After Running Migration:**
- ✅ No orphaned persons records
- ✅ All affirmations have proper recipient_id values
- ✅ RLS policies are correctly configured

### **After Test Flow:**
- ✅ User A sees User B in their Persons list
- ✅ User B sees User A in their Persons list
- ✅ User A can send affirmations to User B
- ✅ User B sees affirmations in their Wave page
- ✅ Console shows proper debug messages

## **Step 5: Troubleshooting**

### **If Bidirectional Connections Don't Work:**

1. **Check the trigger function:**
```sql
-- Verify the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'persons';
```

2. **Manually create connections:**
```sql
-- If automatic connections fail, manually add them
-- Replace with actual user IDs and emails

-- Add User B to User A's list
INSERT INTO persons (user_id, name, email, relationship)
VALUES ('user-a-id', 'Test User B', 'testuserB@example.com', 'Connection');

-- Add User A to User B's list  
INSERT INTO persons (user_id, name, email, relationship)
VALUES ('user-b-id', 'Test User A', 'testuserA@example.com', 'Connection');
```

3. **Check for RLS policy issues:**
```sql
-- Verify RLS policies
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'persons';
```

### **If Affirmations Don't Show:**

1. **Check affirmation creation:**
```sql
-- Look for recently created affirmations
SELECT 
    id,
    message,
    created_by,
    recipient_id,
    recipient_email,
    status,
    created_at
FROM affirmations 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

2. **Check RLS policies for affirmations:**
```sql
-- Verify affirmations RLS
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'affirmations';
```

## **Step 6: Report Results**

Please provide:

1. **Migration Results:**
   - Any errors from running the migration
   - Output from verification queries

2. **Test Results:**
   - Did bidirectional connections work?
   - Did affirmations appear for the receiver?
   - Any console errors or debug messages

3. **Database State:**
   - Persons table contents
   - Affirmations table contents
   - Any error messages

This will help us identify and fix any remaining issues with the bidirectional connection system.
