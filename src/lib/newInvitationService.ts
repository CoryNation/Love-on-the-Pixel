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
    console.log('=== AFFIRMATION SENDING DEBUG ===');
    console.log('Inputs:', { recipientEmail, message, theme });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    console.log('Current user:', { id: user.id, email: user.email });

    // Check if there's an active connection by getting connections and checking email
    console.log('Checking for connection with:', recipientEmail);
    
    // Get all connections for the current user
    const { data: connections, error: connectionsError } = await supabase
      .from('my_connections')
      .select('*');

    if (connectionsError) {
      console.error('Error fetching connections:', connectionsError);
      throw new Error(`Failed to fetch connections: ${connectionsError.message}`);
    }

    console.log('All connections:', connections);

    // Check if the recipient email is in our connections (same logic as PersonsPage.tsx)
    const isConnected = connections?.some(conn => conn.connected_user_email === recipientEmail);
    
    console.log('Connection status:', { isConnected, recipientEmail });

    if (isConnected) {
      // Find the connection to get the recipient's user ID
      const connection = connections.find(conn => conn.connected_user_email === recipientEmail);
      const recipientId = connection?.connected_user_id;
      
      console.log('Found connection:', connection);
      
      // Insert into affirmations_clean for connected users
      console.log('Inserting into affirmations_clean...');
      
      const affirmationData = {
        sender_id: user.id,
        recipient_id: recipientId,
        message,
        category: theme,
        status: 'delivered'
      };
      
      console.log('Affirmation data to insert:', affirmationData);

      const { data: insertResult, error: insertError } = await supabase
        .from('affirmations_clean')
        .insert([affirmationData])
        .select();

      console.log('Insert result:', { insertResult, insertError });
      
      if (insertError) {
        console.error('INSERT ERROR DETAILS:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw new Error(`Failed to insert affirmation: ${insertError.message}`);
      }
      
      console.log('=== AFFIRMATION SENT SUCCESSFULLY ===');
      console.log('Inserted affirmation:', insertResult);
    } else {
      // Insert into affirmations table for pending affirmations
      console.log('No connection found, treating as pending...');
      console.log('Inserting into affirmations (pending)...');
      
      const affirmationData = {
        message,
        category: theme,
        created_by: user.id,
        recipient_email: recipientEmail,
        status: 'pending'
      };
      
      console.log('Affirmation data to insert:', affirmationData);

      const { data: insertResult, error: insertError } = await supabase
        .from('affirmations')
        .insert([affirmationData])
        .select();

      console.log('Insert result:', { insertResult, insertError });
      
      if (insertError) {
        console.error('INSERT ERROR DETAILS:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw new Error(`Failed to insert affirmation: ${insertError.message}`);
      }
      
      console.log('=== AFFIRMATION SENT SUCCESSFULLY (PENDING) ===');
      console.log('Inserted affirmation:', insertResult);
    }
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