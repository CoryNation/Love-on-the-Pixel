import { supabase, type Affirmation, type NewAffirmation } from './supabase';

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
  }
};
