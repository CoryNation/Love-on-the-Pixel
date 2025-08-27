import { supabase } from './supabase';

// Types for the temporary recipient design
export interface Affirmation {
  id: string;
  sender_id: string;
  recipient_id?: string | null;
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
  recipient_type?: 'user' | 'pending_acceptance';
}

export interface NewAffirmation {
  message: string;
  category: string;
  recipient_id?: string | null; // Can be either a real user_id or temp_recipient_id
}

export interface TemporaryRecipient {
  id: string;
  invitation_id?: string | null;
  inviter_id: string;
  temp_recipient_id: string;
  invitee_name: string;
  invitee_email?: string | null;
  status: 'pending' | 'accepted' | 'declined';
  invitee_id?: string | null;
  created_at: string;
  updated_at: string;
}

export const affirmationsTempRecipientService = {
  // Get all affirmations for current user (sent and received)
  async getAll(): Promise<Affirmation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('affirmations_with_recipients')
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
      .from('affirmations_with_recipients')
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
      .from('affirmations_with_recipients')
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

    // Determine status based on whether recipient_id is a real user or temp recipient
    const status = await this.isRealUser(affirmation.recipient_id) ? 'delivered' : 'pending';

    const { data, error } = await supabase
      .from('affirmations_temp')
      .insert([{
        sender_id: user.id,
        recipient_id: affirmation.recipient_id,
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

  // Create a temporary recipient when adding a person
  async createTemporaryRecipient(inviteeName: string, inviteeEmail?: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Call the database function to create a temporary recipient
    const { data, error } = await supabase
      .rpc('create_temp_recipient_for_person', {
        p_inviter_id: user.id,
        p_invitee_name: inviteeName,
        p_invitee_email: inviteeEmail
      });

    if (error) {
      console.error('Error creating temporary recipient:', error);
      throw error;
    }

    return data;
  },

  // Get temporary recipients for current user
  async getTemporaryRecipients(): Promise<TemporaryRecipient[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('temporary_recipients')
      .select('*')
      .eq('inviter_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching temporary recipients:', error);
      throw error;
    }

    return data || [];
  },

  // Accept a temporary recipient (when invitation is accepted)
  async acceptTemporaryRecipient(tempRecipientId: string, inviteeId: string): Promise<void> {
    const { error } = await supabase
      .from('temporary_recipients')
      .update({ 
        status: 'accepted',
        invitee_id: inviteeId,
        updated_at: new Date().toISOString()
      })
      .eq('temp_recipient_id', tempRecipientId);

    if (error) {
      console.error('Error accepting temporary recipient:', error);
      throw error;
    }
  },

  // Mark affirmation as read
  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('affirmations_temp')
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
      .from('affirmations_temp')
      .update({ is_favorite: isFavorite })
      .eq('id', id);

    if (error) {
      console.error('Error updating favorite status:', error);
      throw error;
    }
  },

  // Helper function to check if a recipient_id is a real user
  private async isRealUser(recipientId?: string | null): Promise<boolean> {
    if (!recipientId) return false;
    
    // Check if it's a real user by looking in user_profiles
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', recipientId)
      .single();

    if (error) {
      // If not found in user_profiles, it's likely a temp_recipient_id
      return false;
    }

    return !!data;
  },

  // Get pending affirmations for a specific temporary recipient (for debugging)
  async getPendingByTempRecipient(tempRecipientId: string): Promise<Affirmation[]> {
    const { data, error } = await supabase
      .from('affirmations_temp')
      .select('*')
      .eq('recipient_id', tempRecipientId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending affirmations:', error);
      throw error;
    }

    return data || [];
  }
};
