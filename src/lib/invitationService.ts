import { supabase } from './supabase';

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

    // Get inviter's profile
    const { data: inviterProfile, error: inviterError } = await supabase
      .from('user_profiles')
      .select('full_name, photo_url')
      .eq('id', inviterId)
      .single();

    if (inviterError) {
      console.error('Error fetching inviter profile:', inviterError);
      throw new Error('Failed to fetch inviter details');
    }

    // Get invitee's profile
    const { data: inviteeProfile, error: inviteeError } = await supabase
      .from('user_profiles')
      .select('full_name, photo_url')
      .eq('id', inviteeId)
      .single();

    if (inviteeError) {
      console.error('Error fetching invitee profile:', inviteeError);
      throw new Error('Failed to fetch invitee details');
    }

    // Create bidirectional connections
    const connections = [
      // Inviter adds invitee to their persons list
      {
        user_id: inviterId,
        name: inviteeName || inviteeProfile?.full_name || 'New User',
        email: inviteeEmail,
        relationship: 'Connection',
        avatar: inviteeProfile?.photo_url
      },
      // Invitee adds inviter to their persons list
      {
        user_id: inviteeId,
        name: inviterProfile?.full_name || 'Inviter',
        email: '', // We don't have inviter's email in this context
        relationship: 'Connection',
        avatar: inviterProfile?.photo_url
      }
    ];

    // Insert both connections
    const { error: insertError } = await supabase
      .from('persons')
      .insert(connections);

    if (insertError) {
      console.error('Error creating connections:', insertError);
      throw new Error('Failed to create connections');
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

    console.log('Invitation accepted and connections created successfully');
  },

  // Get pending invitations for a user
  async getPendingInvitations(userId: string): Promise<any[]> {
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
