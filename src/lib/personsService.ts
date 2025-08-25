import { supabase } from './supabase';

export interface Person {
  id: string;
  name: string;
  user_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface NewPerson {
  name: string;
}

export const personsService = {
  // Get all persons for the current user
  async getAll(): Promise<Person[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('persons')
      .select('*')
      .eq('created_by', user.id) // Get persons created by the current user
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching persons:', error);
      throw new Error('Failed to fetch persons');
    }

    return data || [];
  },

  // Create a new person
  async create(person: NewPerson): Promise<Person> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('persons')
      .insert([{
        user_id: null, // Set to null for people who haven't signed up yet
        name: person.name,
        created_by: user.id, // This should be the current user who is adding the person
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating person:', error);
      throw new Error('Failed to create person');
    }

    return data;
  },

  // Update a person
  async update(id: string, updates: Partial<NewPerson>): Promise<Person> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('persons')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('created_by', user.id) // Changed from user_id to created_by
      .select()
      .single();

    if (error) {
      console.error('Error updating person:', error);
      throw new Error('Failed to update person');
    }

    return data;
  },

  // Delete a person
  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('persons')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id); // Delete persons created by the current user

    if (error) {
      console.error('Error deleting person:', error);
      throw new Error('Failed to delete person');
    }
  }
};
