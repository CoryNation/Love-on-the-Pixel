import { supabase } from './supabase';
import { notificationService } from './notificationService';

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

    // Check if there's an active connection by getting connections and checking email
    
    // Get all connections for the current user
    const { data: connections, error: connectionsError } = await supabase
      .from('my_connections')
      .select('*');

    if (connectionsError) {
      console.error('Error fetching connections:', connectionsError);
      throw new Error(`Failed to fetch connections: ${connectionsError.message}`);
    }

    // Check if the recipient email is in our connections (same logic as PersonsPage.tsx)
    const isConnected = connections?.some(conn => conn.connected_user_email === recipientEmail);

    if (isConnected) {
      // Find the connection to get the recipient's user ID
      const connection = connections.find(conn => conn.connected_user_email === recipientEmail);
      const recipientId = connection?.connected_user_id;
      
      // Insert into affirmations_clean for connected users
      
      const affirmationData = {
        sender_id: user.id,
        recipient_id: recipientId,
        message,
        category: theme,
        status: 'delivered'
      };

      const { data: insertResult, error: insertError } = await supabase
        .from('affirmations_clean')
        .insert([affirmationData])
        .select();
      
      if (insertError) {
        console.error('INSERT ERROR DETAILS:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw new Error(`Failed to insert affirmation: ${insertError.message}`);
      }
    } else {
      // Insert into affirmations table for pending affirmations
      
      const affirmationData = {
        message,
        category: theme,
        created_by: user.id,
        recipient_email: recipientEmail,
        status: 'pending'
      };

      const { data: insertResult, error: insertError } = await supabase
        .from('affirmations')
        .insert([affirmationData])
        .select();
      
      if (insertError) {
        console.error('INSERT ERROR DETAILS:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw new Error(`Failed to insert affirmation: ${insertError.message}`);
      }
    }
  },

  // Accept invitation and create bidirectional connection
  async acceptInvitation(invitationId: string): Promise<void> {
    try {
      // Get invitation details before accepting
      const { data: invitation } = await supabase
        .from('invitations')
        .select('inviter_id, inviter_email, invitee_email')
        .eq('id', invitationId)
        .single();

      const { error } = await supabase.rpc('accept_invitation_simple', {
        p_invitation_id: invitationId
      });

      if (error) {
        console.error('RPC error:', error);
        throw new Error(`Failed to accept invitation: ${error.message}`);
      }

      // Send notification to inviter when invitation is accepted
      if (invitation) {
        try {
          await notificationService.sendNotificationToUser(
            invitation.inviter_id,
            {
              title: 'Invitation Accepted! 🎉',
              body: `${invitation.invitee_email} accepted your invitation to connect`,
              icon: '/people-icon.png',
              tag: 'invitation-accepted',
              data: { 
                invitationId: invitationId,
                inviteeEmail: invitation.invitee_email
              },
              actions: [
                { action: 'view', title: 'View' },
                { action: 'dismiss', title: 'Dismiss' }
              ]
            }
          );
        } catch (notificationError) {
          console.error('Failed to send invitation accepted notification:', notificationError);
          // Don't throw - notification failure shouldn't break invitation acceptance
        }
      }

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