import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Affirmation {
  id: string;
  message: string;
  category: string;
  is_favorite: boolean;
  viewed: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  sender_name?: string;
  sender_photo_url?: string;
}

export interface NewAffirmation {
  message: string;
  category: string;
  sender_name?: string;
  sender_photo_url?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface NewUserProfile {
  full_name?: string;
  photo_url?: string;
}
