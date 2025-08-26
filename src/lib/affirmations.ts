import { supabase, type Affirmation, type NewAffirmation } from './supabase';

// Re-export the types so they can be imported from this file
export type { Affirmation, NewAffirmation };

export const affirmationsService = {
  // Get all affirmations for current user (sent and received)
  async getAll(): Promise<Affirmation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .or(`created_by.eq.${user.id},recipient_id.eq.${user.id}`)
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

    console.log('Getting sent affirmations for user:', user.id);

    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sent affirmations:', error);
      throw error;
    }

    console.log('Sent affirmations:', data);
    return data || [];
  },

  // Get affirmations received by current user
  async getReceived(): Promise<Affirmation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('Getting received affirmations for user:', user.id);

    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .eq('recipient_id', user.id)
      .eq('status', 'delivered') // Only show delivered affirmations
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching received affirmations:', error);
      throw error;
    }

    console.log('Received affirmations:', data);
    console.log('Query conditions: recipient_id =', user.id, 'status = delivered');
    return data || [];
  },

  // Get affirmations by category
  async getByCategory(category: string): Promise<Affirmation[]> {
    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching affirmations by category:', error);
      throw error;
    }

    return data || [];
  },

  // Add new affirmation
  async create(affirmation: NewAffirmation): Promise<Affirmation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('affirmations')
      .insert([{
        ...affirmation,
        created_by: user.id,
        status: affirmation.recipient_id ? 'delivered' : 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating affirmation:', error);
      throw error;
    }

    return data;
  },

  // Process pending affirmations when a user signs up
  async processPendingAffirmations(userEmail: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('affirmations')
      .update({ 
        recipient_id: userId, 
        status: 'delivered' 
      })
      .eq('recipient_email', userEmail)
      .eq('status', 'pending');

    if (error) {
      console.error('Error processing pending affirmations:', error);
      throw error;
    }
  },

  // Toggle favorite status
  async toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    const { error } = await supabase
      .from('affirmations')
      .update({ is_favorite: isFavorite })
      .eq('id', id);

    if (error) {
      console.error('Error updating favorite status:', error);
      throw error;
    }
  },

  // Delete affirmation
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('affirmations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting affirmation:', error);
      throw error;
    }
  },

  // Mark affirmation as viewed
  async markAsViewed(id: string): Promise<void> {
    const { error } = await supabase
      .from('affirmations')
      .update({ viewed: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking affirmation as viewed:', error);
      throw error;
    }
  },

  // Get random unviewed affirmation
  async getRandomUnviewed(): Promise<Affirmation | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .eq('recipient_id', user.id)
      .eq('viewed', false)
      .eq('status', 'delivered')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching unviewed affirmations:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Return a random unviewed affirmation
    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex];
  },

  // Get random viewed affirmation
  async getRandomViewed(): Promise<Affirmation | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .eq('recipient_id', user.id)
      .eq('viewed', true)
      .eq('status', 'delivered')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching viewed affirmations:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Return a random viewed affirmation
    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex];
  },

  // Update affirmation
  async update(id: string, updates: Partial<Affirmation>): Promise<Affirmation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('affirmations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('created_by', user.id) // Only allow updating affirmations created by the current user
      .select()
      .single();

    if (error) {
      console.error('Error updating affirmation:', error);
      throw error;
    }

    return data;
  }
};
