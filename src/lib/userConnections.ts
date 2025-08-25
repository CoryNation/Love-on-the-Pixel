import { supabase } from './supabase';

export interface UserConnection {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface NewUserConnection {
  connected_user_id: string;
  status?: 'pending' | 'accepted' | 'blocked';
}

export const userConnectionsService = {
  // Get all connections for the current user
  async getAll(): Promise<UserConnection[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_connections')
      .select('*')
      .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user connections:', error);
      throw new Error('Failed to fetch user connections');
    }

    return data || [];
  },

  // Get accepted connections for the current user
  async getAccepted(): Promise<UserConnection[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_connections')
      .select('*')
      .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching accepted connections:', error);
      throw new Error('Failed to fetch accepted connections');
    }

    return data || [];
  },

  // Create a new connection
  async create(connection: NewUserConnection): Promise<UserConnection> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_connections')
      .insert([{
        user_id: user.id,
        connected_user_id: connection.connected_user_id,
        status: connection.status || 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating user connection:', error);
      throw new Error('Failed to create user connection');
    }

    return data;
  },

  // Accept a connection request
  async accept(connectionId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_connections')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId)
      .eq('connected_user_id', user.id);

    if (error) {
      console.error('Error accepting connection:', error);
      throw new Error('Failed to accept connection');
    }
  },

  // Delete a connection
  async delete(connectionId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_connections')
      .delete()
      .eq('id', connectionId)
      .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`);

    if (error) {
      console.error('Error deleting connection:', error);
      throw new Error('Failed to delete connection');
    }
  }
};
