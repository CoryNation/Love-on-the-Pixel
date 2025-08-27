import { supabase } from './supabase';

// Types for bidirectional connections
export interface UserConnection {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface PersonWithConnection {
  id: string;
  user_id?: string | null;
  name: string;
  email?: string | null;
  avatar?: string | null;
  created_at: string;
  updated_at: string;
  connection_status: 'pending' | 'accepted' | 'blocked' | 'no_connection';
  connected_user_id?: string | null;
}

export interface Affirmation {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  category: string;
  status: 'delivered' | 'read';
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
  recipient_id: string;
}

export interface PendingAffirmation {
  id: string;
  sender_id: string;
  recipient_email: string;
  message: string;
  category: string;
  status: 'pending';
  created_at: string;
  updated_at: string;
}

export const bidirectionalConnectionsService = {
  // Get all persons for current user with connection status
  async getPersonsWithConnections(): Promise<PersonWithConnection[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('persons_with_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching persons with connections:', error);
      throw error;
    }

    return data || [];
  },

  // Get all connections for current user
  async getConnections(): Promise<UserConnection[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_connections')
      .select('*')
      .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching connections:', error);
      throw error;
    }

    return data || [];
  },

  // Get accepted connections for current user
  async getAcceptedConnections(): Promise<UserConnection[]> {
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
      throw error;
    }

    return data || [];
  },

  // Create a bidirectional connection (when adding a person)
  async createBidirectionalConnection(connectedUserId: string, status: 'pending' | 'accepted' = 'pending'): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .rpc('create_bidirectional_connection', {
        p_user_id: user.id,
        p_connected_user_id: connectedUserId,
        p_status: status
      });

    if (error) {
      console.error('Error creating bidirectional connection:', error);
      throw error;
    }
  },

  // Create a bidirectional connection between two specific users (for invitation acceptance)
  async createBidirectionalConnectionBetweenUsers(userId1: string, userId2: string, status: 'pending' | 'accepted' = 'accepted'): Promise<void> {
    const { error } = await supabase
      .rpc('create_bidirectional_connection', {
        p_user_id: userId1,
        p_connected_user_id: userId2,
        p_status: status
      });

    if (error) {
      console.error('Error creating bidirectional connection between users:', error);
      throw error;
    }
  },

  // Accept a bidirectional connection
  async acceptBidirectionalConnection(connectedUserId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .rpc('accept_bidirectional_connection', {
        p_user_id: user.id,
        p_connected_user_id: connectedUserId
      });

    if (error) {
      console.error('Error accepting bidirectional connection:', error);
      throw error;
    }
  },

  // Remove a bidirectional connection
  async removeBidirectionalConnection(connectedUserId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .rpc('remove_bidirectional_connection', {
        p_user_id: user.id,
        p_connected_user_id: connectedUserId
      });

    if (error) {
      console.error('Error removing bidirectional connection:', error);
      throw error;
    }
  },

  // Add a person and create bidirectional connection
  async addPersonWithConnection(personName: string, connectedUserId?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // First, add the person to the persons table
    const { error: personError } = await supabase
      .from('persons')
      .insert([{
        user_id: user.id,
        name: personName,
        email: null
      }]);

    if (personError) {
      console.error('Error adding person:', personError);
      throw personError;
    }

    // If we have a connected user ID, create the bidirectional connection
    if (connectedUserId) {
      await this.createBidirectionalConnection(connectedUserId, 'accepted');
    }
  },

  // Get all affirmations for current user (sent and received)
  async getAllAffirmations(): Promise<Affirmation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('affirmations_with_users')
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
  async getSentAffirmations(): Promise<Affirmation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('affirmations_with_users')
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
  async getReceivedAffirmations(): Promise<Affirmation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('affirmations_with_users')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching received affirmations:', error);
      throw error;
    }

    return data || [];
  },

  // Create a new affirmation (affirmations persist regardless of connections)
  async createAffirmation(affirmation: NewAffirmation): Promise<Affirmation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('affirmations_clean')
      .insert([{
        sender_id: user.id,
        recipient_id: affirmation.recipient_id,
        message: affirmation.message,
        category: affirmation.category,
        status: 'delivered'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating affirmation:', error);
      throw error;
    }

    return data;
  },

  // Create a pending affirmation for someone who hasn't accepted an invitation yet
  async createPendingAffirmation(message: string, category: string, recipientEmail: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Store the pending affirmation in the old affirmations table with recipient_email
    const { error } = await supabase
      .from('affirmations')
      .insert([{
        created_by: user.id,
        recipient_email: recipientEmail,
        message: message,
        category: category,
        status: 'pending'
      }]);

    if (error) {
      console.error('Error creating pending affirmation:', error);
      throw error;
    }
  },

  // Process pending affirmations when a user signs up (called from invitation acceptance)
  async processPendingAffirmationsForUser(userId: string, userEmail: string): Promise<void> {
    // Find all pending affirmations for this email
    const { data: pendingAffirmations, error: fetchError } = await supabase
      .from('affirmations')
      .select('*')
      .eq('recipient_email', userEmail)
      .eq('status', 'pending');

    if (fetchError) {
      console.error('Error fetching pending affirmations:', fetchError);
      return;
    }

    if (!pendingAffirmations || pendingAffirmations.length === 0) {
      return;
    }

    // Convert pending affirmations to delivered affirmations
    for (const pending of pendingAffirmations) {
      try {
        // Create the affirmation in the new table
        await this.createAffirmation({
          message: pending.message,
          category: pending.category,
          recipient_id: userId
        });

        // Mark the old affirmation as processed
        await supabase
          .from('affirmations')
          .update({ status: 'processed' })
          .eq('id', pending.id);

        console.log(`Processed pending affirmation ${pending.id} for user ${userId}`);
      } catch (error) {
        console.error(`Error processing pending affirmation ${pending.id}:`, error);
      }
    }
  },

  // Mark affirmation as read
  async markAffirmationAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('affirmations_clean')
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
      .from('affirmations_clean')
      .update({ is_favorite: isFavorite })
      .eq('id', id);

    if (error) {
      console.error('Error updating favorite status:', error);
      throw error;
    }
  },

  // Get user profile by ID
  async getUserProfile(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }

    return data;
  },

  // Find user by name (for connecting with existing users)
  async findUserByName(name: string): Promise<any> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('full_name', name)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error finding user by name:', error);
      throw error;
    }

    return data;
  },

  // Find user by email (for invitation processing)
  async findUserByEmail(email: string): Promise<any> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error finding user by email:', error);
      throw error;
    }

    return data;
  }
};
