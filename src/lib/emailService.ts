import { supabase } from './supabase';

export interface InvitationData {
  inviterName: string;
  inviterEmail: string;
  inviteeEmail: string;
  inviteeName?: string;
}

export const emailService = {
  // Send invitation email
  async sendInvitation(invitation: InvitationData): Promise<void> {
    // For now, we'll just log the invitation details
    // In production, you'd deploy the Edge Function and use a proper email service
    console.log('Invitation Details:', {
      inviterName: invitation.inviterName,
      inviterEmail: invitation.inviterEmail,
      inviteeEmail: invitation.inviteeEmail,
      inviteeName: invitation.inviteeName,
      appDownloadUrl: process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || 'https://play.google.com/store/apps/details?id=com.loveonthepixel.app'
    });

    // TODO: Uncomment this when Edge Function is deployed
    // const { data, error } = await supabase.functions.invoke('send-invitation', {
    //   body: {
    //     inviterName: invitation.inviterName,
    //     inviterEmail: invitation.inviterEmail,
    //     inviteeEmail: invitation.inviteeEmail,
    //     inviteeName: invitation.inviteeName,
    //     appDownloadUrl: process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || 'https://play.google.com/store/apps/details?id=com.loveonthepixel.app'
    //   }
    // });

    // if (error) {
    //   console.error('Error sending invitation:', error);
    //   throw new Error('Failed to send invitation email');
    // }

    // return data;
  },

  // Store invitation in database for tracking
  async storeInvitation(invitation: InvitationData): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('invitations')
      .insert([{
        inviter_id: user.id,
        inviter_name: invitation.inviterName,
        inviter_email: invitation.inviterEmail,
        invitee_email: invitation.inviteeEmail,
        invitee_name: invitation.inviteeName,
        status: 'pending',
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error storing invitation:', error);
      throw new Error('Failed to store invitation');
    }
  }
};
