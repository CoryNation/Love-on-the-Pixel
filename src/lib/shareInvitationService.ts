import { supabase } from './supabase';

export interface ShareInvitationData {
  inviterName: string;
  inviterEmail: string;
  inviteeName?: string;
  customMessage?: string;
}

export const shareInvitationService = {
  // Generate a unique invitation link
  generateInvitationLink(inviterId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://love-on-the-pixel.vercel.app';
    return `${baseUrl}/invite/${inviterId}`;
  },

  // Create default invitation message
  createDefaultMessage(inviterName: string): string {
    return `Hi! ${inviterName} would love to share words of encouragement and appreciation with you through Love on the Pixel. Join us in spreading love and positivity! 💕`;
  },

  // Share invitation using native share API
  async shareInvitation(invitation: ShareInvitationData): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const invitationLink = this.generateInvitationLink(user.id);
    const message = invitation.customMessage || this.createDefaultMessage(invitation.inviterName);

    const shareData = {
      title: 'Join Love on the Pixel',
      text: message,
      url: invitationLink
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback: copy to clipboard
        await this.copyToClipboard(`${message}\n\n${invitationLink}`);
      }
    } else {
      // Fallback for browsers that don't support native sharing
      await this.copyToClipboard(`${message}\n\n${invitationLink}`);
    }
  },

  // Fallback: copy to clipboard
  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      // You could show a toast notification here
      console.log('Invitation copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Final fallback: alert
      alert(`Invitation message:\n\n${text}`);
    }
  },

  // Store invitation in database for tracking
  async storeInvitation(invitation: ShareInvitationData): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const invitationLink = this.generateInvitationLink(user.id);

    const { error } = await supabase
      .from('invitations')
      .insert([{
        inviter_id: user.id,
        inviter_name: invitation.inviterName,
        inviter_email: invitation.inviterEmail,
        invitee_name: invitation.inviteeName,
        status: 'shared',
        created_at: new Date().toISOString(),
        invitation_link: invitationLink,
        custom_message: invitation.customMessage
      }]);

    if (error) {
      console.error('Error storing invitation:', error);
      throw new Error('Failed to store invitation');
    }
  }
};
