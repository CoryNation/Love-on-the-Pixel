import { supabase, type Affirmation, type NewAffirmation } from './supabase';

// Re-export the types so they can be imported from this file
export type { Affirmation, NewAffirmation };

export const affirmationsService = {
  // Get all affirmations
  async getAll(): Promise<Affirmation[]> {
    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching affirmations:', error);
      throw error;
    }

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
    const { data, error } = await supabase
      .from('affirmations')
      .insert([affirmation])
      .select()
      .single();

    if (error) {
      console.error('Error creating affirmation:', error);
      throw error;
    }

    return data;
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
    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .eq('viewed', false)
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
    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .eq('viewed', true)
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
  }
};
