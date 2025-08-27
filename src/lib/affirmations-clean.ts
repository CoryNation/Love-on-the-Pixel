import { supabase } from './supabase';

// Clean types for the new affirmations design
export interface Affirmation {
  id: string;
  sender_id: string;
  recipient_id?: string | null;
  recipient_email?: string | null;
  message: string;
  category: string;
  status: 'pending' | 'delivered' | 'read';
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields from the view
  sender_name?: string;
  sender_photo_url?: string;
  recipient_name?: string;
  recipient_photo_url?: string;
}

export interface NewAffirmation {
  message: string;
  category: string;
  recipient_id?: string | null;
  recipient_email?: string | null;
}

export const affirmationsCleanService = {
  // Get all affirmations for current user (sent and received)
  async getAll(): Promise<Affirmation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_affirmations')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching affirmations:', error);
      throw error;
    }

    return data || [];
  },

  // Get affirmations sent by current user
  async getSent(): Promise<Affirmation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_affirmations')
      .select('*')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sent affirmations:', error);
      throw error;
    }

    return data || [];
  },

  // Get affirmations received by current user
  async getReceived(): Promise<Affirmation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_affirmations')
      .select('*')
      .eq('recipient_id', user.id)
      .eq('status', 'delivered')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching received affirmations:', error);
      throw error;
    }

    return data || [];
  },

  // Create a new affirmation
  async create(affirmation: NewAffirmation): Promise<Affirmation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Determine status based on whether recipient_id is provided
    const status = affirmation.recipient_id ? 'delivered' : 'pending';

    const { data, error } = await supabase
      .from('affirmations_new')
      .insert([{
        sender_id: user.id,
        recipient_id: affirmation.recipient_id,
        recipient_email: affirmation.recipient_email,
        message: affirmation.message,
        category: affirmation.category,
        status: status
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating affirmation:', error);
      throw error;
    }

    return data;
  },

  // Mark affirmation as read
  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('affirmations_new')
      .update({ status: 'read' })
      .eq('id', id);

    if (error) {
      console.error('Error marking affirmation as read:', error);
      throw error;
    }
  },

  // Toggle favorite status
  async toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    const { error } = await supabase
      .from('affirmations_new')
      .update({ is_favorite: isFavorite })
      .eq('id', id);

    if (error) {
      console.error('Error updating favorite status:', error);
      throw error;
    }
  },

  // Get pending affirmations for a specific email (for debugging)
  async getPendingByEmail(email: string): Promise<Affirmation[]> {
    const { data, error } = await supabase
      .from('affirmations_new')
      .select('*')
      .eq('recipient_email', email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending affirmations:', error);
      throw error;
    }

    return data || [];
  },

  // Manual trigger to process pending affirmations (for testing)
  async processPendingAffirmations(email: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('affirmations_new')
      .update({ 
        recipient_id: userId, 
        status: 'delivered',
        updated_at: new Date().toISOString()
      })
      .eq('recipient_email', email)
      .eq('status', 'pending');

    if (error) {
      console.error('Error processing pending affirmations:', error);
      throw error;
    }
  }
};
