# 🔍 Affirmation Flow Debug Guide

## **Step 1: Get User IDs**
First, we need to identify the user IDs involved in the test:

1. **Open your app in the browser**
2. **Open Developer Tools (F12)**
3. **Go to Console tab**
4. **Run this command to get the current user ID:**
   ```javascript
   // In the browser console, run:
   console.log('Current user ID:', window.supabase?.auth?.user()?.id);
   ```

5. **Note down both user IDs:**
   - Sender User ID: `[from sender account]`
   - Receiver User ID: `[from receiver account]`

## **Step 2: Check Database State**
Run these queries in your Supabase SQL Editor:

### **Query 1: Check all affirmations**
```sql
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
ORDER BY created_at DESC;
```

### **Query 2: Check persons table**
```sql
SELECT 
    id,
    user_id,
    name,
    email,
    created_at
FROM persons 
ORDER BY created_at DESC;
```

### **Query 3: Check RLS policies**
```sql
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'affirmations';
```

## **Step 3: Test the Affirmation Flow**

### **Test 1: Send an affirmation**
1. **Log into the sender account**
2. **Go to Persons page**
3. **Send an affirmation to the receiver**
4. **Check the browser console for any errors**
5. **Note the timestamp of when you sent it**

### **Test 2: Check if affirmation was created**
Run this query immediately after sending:
```sql
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
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

### **Test 3: Check receiver's view**
1. **Log into the receiver account**
2. **Go to Wave page**
3. **Check browser console for debugging output**
4. **Look for these console messages:**
   - `Loading affirmations for user: [user-id]`
   - `Received affirmations: [array]`
   - `Query conditions: recipient_id = [user-id] status = delivered`

## **Step 4: Manual Database Test**

### **Test the RLS policy manually**
Replace `[SENDER_ID]` and `[RECEIVER_ID]` with actual user IDs:

```sql
-- Test what the sender can see
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
WHERE created_by::uuid = '[SENDER_ID]'::uuid 
   OR recipient_id::uuid = '[SENDER_ID]'::uuid
ORDER BY created_at DESC;

-- Test what the receiver can see
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
WHERE created_by::uuid = '[RECEIVER_ID]'::uuid 
   OR recipient_id::uuid = '[RECEIVER_ID]'::uuid
ORDER BY created_at DESC;
```

## **Step 5: Common Issues to Check**

### **Issue 1: RLS Policy Problem**
If the manual queries return different results than the app:
- The RLS policy might be too restrictive
- Run the database-fix-affirmations-policies.sql migration

### **Issue 2: Status Field Problem**
Check if affirmations have the correct status:
```sql
SELECT 
    status,
    COUNT(*) as count
FROM affirmations 
GROUP BY status;
```

### **Issue 3: User ID Mismatch**
Check if the recipient_id in affirmations matches the receiver's user ID:
```sql
SELECT 
    a.id,
    a.message,
    a.recipient_id,
    p.user_id as person_user_id,
    p.name,
    p.email
FROM affirmations a
LEFT JOIN persons p ON a.recipient_email = p.email
WHERE a.recipient_id IS NOT NULL;
```

## **Step 6: Report Results**

Please provide:

1. **User IDs:**
   - Sender: `[ID]`
   - Receiver: `[ID]`

2. **Query Results:**
   - All affirmations in system
   - Persons table contents
   - RLS policies

3. **Console Output:**
   - Any errors in browser console
   - Debug messages from the app

4. **Timeline:**
   - When you sent the affirmation
   - When you checked the receiver account

## **Expected Behavior**

After sending an affirmation:
1. **Affirmation should be created** with `status = 'delivered'`
2. **recipient_id should match** the receiver's user ID
3. **Receiver should see it** in their Wave page
4. **Console should show** the affirmation in the received list

## **Quick Fix Attempt**

If you want to try a quick fix, run this migration:
```sql
-- Apply the RLS policy fix
DROP POLICY IF EXISTS "Users can view affirmations" ON affirmations;

CREATE POLICY "Users can view affirmations they sent or received" ON affirmations
  FOR SELECT USING (
    auth.uid() = created_by::uuid OR 
    auth.uid() = recipient_id::uuid
  );
```

Then test the flow again.
