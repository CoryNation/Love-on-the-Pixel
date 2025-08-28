import { supabase } from './supabase';

export interface Invitation {
  id: string;
  inviter_id: string;
  inviter_name: string;
  inviter_email: string;
  invitee_name: string;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  custom_message?: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  inviter_full_name?: string;
  inviter_photo_url?: string;
}

export interface NewInvitation {
  invitee_name: string;
  invitee_email: string;
  custom_message?: string;
}

export interface UserConnection {
  id: string;
  user_id: string;
  connected_user_id: string;
  connection_date: string;
  user_name?: string;
  user_photo_url?: string;
  connected_user_name?: string;
  connected_user_photo_url?: string;
}

export const emailInvitationService = {
  // Create a new invitation
  async createInvitation(invitation: NewInvitation): Promise<Invitation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get current user's profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('invitations')
      .insert([{
        inviter_id: user.id,
        inviter_name: userProfile?.full_name || user.email || 'A friend',
        inviter_email: user.email || '',
        invitee_name: invitation.invitee_name,
        invitee_email: invitation.invitee_email,
        custom_message: invitation.custom_message
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      throw new Error('Failed to create invitation');
    }

    return data;
  },

  // Get all invitations for current user
  async getInvitations(): Promise<Invitation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('inviter_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      throw new Error('Failed to fetch invitations');
    }

    return data || [];
  },

  // Get pending invitations for current user (invitations they've received)
  async getPendingInvitations(): Promise<Invitation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Use the user's email directly from auth
    const userEmail = user.email;

    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('invitee_email', userEmail)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending invitations:', error);
      throw new Error('Failed to fetch pending invitations');
    }

    return data || [];
  },

  // Accept an invitation
  async acceptInvitation(invitationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('Accepting invitation:', invitationId, 'for user:', user.email);

    // First, get the invitation details
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !invitation) {
      console.error('Error fetching invitation:', fetchError);
      throw new Error('Invitation not found or already processed');
    }

    console.log('Found invitation:', invitation);

    // Verify the invitation is for the current user
    if (invitation.invitee_email !== user.email) {
      console.error('Email mismatch:', invitation.invitee_email, 'vs', user.email);
      throw new Error('This invitation is not for you');
    }

    // Create bidirectional connection
    const { error: connectionError } = await supabase
      .from('user_connections')
      .insert([
        {
          user_id: invitation.inviter_id,
          connected_user_id: user.id
        },
        {
          user_id: user.id,
          connected_user_id: invitation.inviter_id
        }
      ]);

    if (connectionError) {
      console.error('Error creating connections:', connectionError);
      throw new Error('Failed to create connection');
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      throw new Error('Failed to update invitation status');
    }
  },

  // Decline an invitation
  async declineInvitation(invitationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('invitations')
      .update({ 
        status: 'declined',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId)
      .eq('invitee_email', user.email);

    if (error) {
      console.error('Error declining invitation:', error);
      throw new Error('Failed to decline invitation');
    }
  },

  // Get user connections
  async getUserConnections(): Promise<UserConnection[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_connections_with_profiles')
      .select('*')
      .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
      .order('connection_date', { ascending: false });

    if (error) {
      console.error('Error fetching user connections:', error);
      throw new Error('Failed to fetch user connections');
    }

    return data || [];
  },

  // Check if two users are connected
  async areUsersConnected(userId1: string, userId2: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_connections')
      .select('id')
      .or(`and(user_id.eq.${userId1},connected_user_id.eq.${userId2}),and(user_id.eq.${userId2},connected_user_id.eq.${userId1})`)
      .limit(1);

    if (error) {
      console.error('Error checking user connection:', error);
      return false;
    }

    return data && data.length > 0;
  },

  // Remove a connection
  async removeConnection(connectedUserId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_connections')
      .delete()
      .or(`and(user_id.eq.${user.id},connected_user_id.eq.${connectedUserId}),and(user_id.eq.${connectedUserId},connected_user_id.eq.${user.id})`);

    if (error) {
      console.error('Error removing connection:', error);
      throw new Error('Failed to remove connection');
    }
  },

  // Check for pending invitations for current user's email
  async checkForPendingInvitations(): Promise<Invitation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('invitee_email', user.email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error checking for pending invitations:', error);
      throw new Error('Failed to check for pending invitations');
    }

    return data || [];
  },

  // Auto-accept pending invitations for current user
  async autoAcceptPendingInvitations(): Promise<void> {
    const pendingInvitations = await this.checkForPendingInvitations();
    
    for (const invitation of pendingInvitations) {
      try {
        await this.acceptInvitation(invitation.id);
        console.log(`Auto-accepted invitation from ${invitation.inviter_name}`);
      } catch (error) {
        console.error(`Failed to auto-accept invitation ${invitation.id}:`, error);
      }
    }
  }
};
