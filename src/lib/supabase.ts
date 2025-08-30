import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Only throw error in development if variables are missing
if (process.env.NODE_ENV === 'development' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  console.warn('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Affirmation {
  id: string;
  message: string;
  category: string;
  created_by: string;
  recipient_id?: string | null;
  recipient_email?: string | null;
  recipient_name?: string | null;
  status: 'pending' | 'delivered';
  is_favorite: boolean;
  viewed: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewAffirmation {
  message: string;
  category: string;
  recipient_id?: string | null;
  recipient_email?: string | null;
  recipient_name?: string | null;
}

export interface UserProfile {
  id: string;
  full_name?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface NewUserProfile {
  full_name?: string;
  photo_url?: string;
}
