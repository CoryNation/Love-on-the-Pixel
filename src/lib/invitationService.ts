import { supabase } from './supabase';
import { bidirectionalConnectionsService } from './bidirectional-connections';

export interface InvitationAcceptanceData {
  inviterId: string;
  inviteeId: string;
  inviteeName?: string;
  inviteeEmail: string;
}

export const invitationService = {
  // Accept an invitation and create bidirectional connection
  async acceptInvitation(data: InvitationAcceptanceData): Promise<void> {
    const { inviterId, inviteeId, inviteeName, inviteeEmail } = data;

    console.log('Accepting invitation:', { inviterId, inviteeId, inviteeName, inviteeEmail });

    // Get inviter's profile (don't fail if not found)
    const { data: inviterProfile, error: inviterError } = await supabase
      .from('user_profiles')
      .select('full_name, photo_url')
      .eq('id', inviterId)
      .single();

    if (inviterError) {
      console.warn('Inviter profile not found, using default name:', inviterError);
    }

    // Get invitee's profile (don't fail if not found)
    const { data: inviteeProfile, error: inviteeError } = await supabase
      .from('user_profiles')
      .select('full_name, photo_url')
      .eq('id', inviteeId)
      .single();

    if (inviteeError) {
      console.warn('Invitee profile not found, using default name:', inviteeError);
    }

    // Create bidirectional connection using the new system
    try {
      await bidirectionalConnectionsService.createBidirectionalConnectionBetweenUsers(
        inviterId, 
        inviteeId, 
        'accepted'
      );
      console.log('Bidirectional connection created successfully');
    } catch (error) {
      console.error('Error creating bidirectional connection:', error);
      throw new Error('Failed to create bidirectional connection');
    }

    // Also add both users to each other's persons list for backward compatibility
    const connections = [
      // Inviter adds invitee to their persons list
      {
        user_id: inviterId,
        name: inviteeName || inviteeProfile?.full_name || 'New User',
        email: inviteeEmail,
        avatar: inviteeProfile?.photo_url
      },
      // Invitee adds inviter to their persons list
      {
        user_id: inviteeId,
        name: inviterProfile?.full_name || 'Inviter',
        email: '', // We don't have inviter's email in this context
        avatar: inviterProfile?.photo_url
      }
    ];

    console.log('Creating persons entries:', connections);

    // Insert both connections into persons table
    const { error: insertError } = await supabase
      .from('persons')
      .insert(connections);

    if (insertError) {
      console.error('Error creating persons entries:', insertError);
      // Don't throw here as the bidirectional connection was already created
    }

    // Process any pending affirmations for this user
    try {
      await bidirectionalConnectionsService.processPendingAffirmationsForUser(inviteeId, inviteeEmail);
      console.log('Processed pending affirmations for user:', inviteeId);
    } catch (error) {
      console.error('Error processing pending affirmations:', error);
      // Don't throw here as the connection was already created
    }

    // Update invitation status to accepted
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('inviter_id', inviterId)
      .eq('invitee_email', inviteeEmail);

    if (updateError) {
      console.error('Error updating invitation status:', updateError);
      // Don't throw here as the connection was already created
    }

    console.log('Invitation accepted and bidirectional connections created successfully');
  },

  // Get pending invitations for a user
  async getPendingInvitations(userId: string): Promise<unknown[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('inviter_id', userId)
      .eq('status', 'shared')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending invitations:', error);
      throw new Error('Failed to fetch invitations');
    }

    return data || [];
  }
};
