import { supabase } from './supabase';

export interface Person {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  relationship?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface NewPerson {
  name: string;
  email?: string;
  relationship?: string;
  avatar?: string;
}

export const personsService = {
  // Get all persons for the current user
  async getAll(): Promise<Person[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('persons')
      .select('*')
      .eq('user_id', user.id)
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
        user_id: user.id,
        name: person.name,
        email: person.email,
        relationship: person.relationship,
        avatar: person.avatar
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
      .eq('user_id', user.id)
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
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting person:', error);
      throw new Error('Failed to delete person');
    }
  }
};
