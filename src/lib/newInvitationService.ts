import { supabase } from './supabase';

export interface Invitation {
  id: string;
  inviter_id: string;
  inviter_email: string;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  accepted_at?: string;
  inviter_name?: string;
}

export interface Connection {
  id: string;
  user_id: string;
  connected_user_id: string;
  connected_at: string;
  connected_user_email?: string;
  connected_user_name?: string;
}

export const newInvitationService = {
  // Create invitation and add to persons list immediately
  async addPerson(email: string): Promise<{ invitation: Invitation; shareUrl: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert([{
        inviter_id: user.id,
        inviter_email: user.email!,
        invitee_email: email,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create invitation: ${error.message}`);

    // Add to persons list immediately
    await supabase
      .from('persons')
      .insert([{
        user_id: user.id,
        name: email.split('@')[0],
        email: email
      }]);

    // Generate share URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://love-on-the-pixel.vercel.app' 
      : window.location.origin;
    const shareUrl = `${baseUrl}/sign-up?inviter=${user.id}&invitee=${email}`;

    return { invitation, shareUrl };
  },

  // Send affirmation with proper connection checking
  async sendAffirmation(recipientEmail: string, message: string, theme: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if there's an active connection
    const { data: connection } = await supabase
      .from('user_connections')
      .select('*')
      .or(`and(user_id.eq.${user.id},connected_user_id.eq.(select id from auth.users where email = '${recipientEmail}')),and(user_id.eq.(select id from auth.users where email = '${recipientEmail}'),connected_user_id.eq.${user.id})`)
      .single();

    // If connected, send as delivered. If not connected, send as pending
    const isConnected = !!connection;
    const recipientId = isConnected ? connection.connected_user_id : null;

    await supabase
      .from('affirmations')
      .insert([{
        message,
        theme,
        created_by: user.id,
        sender_email: user.email!,
        recipient_email: recipientEmail,
        recipient_id: recipientId,
        is_pending: !isConnected,
        status: isConnected ? 'delivered' : 'pending'
      }]);
  },

  // Accept invitation and create bidirectional connection
  async acceptInvitation(invitationId: string): Promise<void> {
    console.log('Accepting invitation:', invitationId);
    
    try {
      const { error } = await supabase.rpc('accept_invitation_simple', {
        p_invitation_id: invitationId
      });

      if (error) {
        console.error('RPC error:', error);
        throw new Error(`Failed to accept invitation: ${error.message}`);
      }
      
      console.log('Invitation accepted successfully');
    } catch (error) {
      console.error('Error in acceptInvitation:', error);
      throw error;
    }
  },

  // Get pending invitations for current user
  async getPendingInvitations(): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('my_pending_invitations')
      .select('*');

    if (error) throw new Error(`Failed to fetch invitations: ${error.message}`);
    return data || [];
  },

  // Get sent invitations
  async getSentInvitations(): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('my_sent_invitations')
      .select('*');

    if (error) throw new Error(`Failed to fetch sent invitations: ${error.message}`);
    return data || [];
  },

  // Get user connections
  async getConnections(): Promise<Connection[]> {
    const { data, error } = await supabase
      .from('my_connections')
      .select('*');

    if (error) throw new Error(`Failed to fetch connections: ${error.message}`);
    return data || [];
  },

  // Remove bidirectional connection
  async removeConnection(personEmail: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the other user's ID
    const { data: otherUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', personEmail)
      .single();

    if (!otherUser) throw new Error('User not found');

    // Delete both directions of the connection
    const { error } = await supabase
      .from('user_connections')
      .delete()
      .or(`and(user_id.eq.${user.id},connected_user_id.eq.${otherUser.id}),and(user_id.eq.${otherUser.id},connected_user_id.eq.${user.id})`);

    if (error) throw new Error(`Failed to remove connection: ${error.message}`);
  },

  // Decline invitation
  async declineInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'declined' })
      .eq('id', invitationId)
      .eq('invitee_email', (await supabase.auth.getUser()).data.user?.email);

    if (error) throw new Error(`Failed to decline invitation: ${error.message}`);
  },

  // Share invitation (with mobile support)
  async shareInvitation(shareUrl: string, recipientEmail: string): Promise<void> {
    const shareData = {
      title: 'Join me on Love on the Pixel!',
      text: `I'd love to connect with you on Love on the Pixel. Join me!`,
      url: shareUrl
    };

    // Try native sharing (mobile)
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        // Fall back to clipboard
      }
    }

    // Fallback: Copy to clipboard (desktop)
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Invitation link copied to clipboard!');
    } catch (error) {
      // Final fallback: Show link
      prompt('Copy this invitation link:', shareUrl);
    }
  }
};