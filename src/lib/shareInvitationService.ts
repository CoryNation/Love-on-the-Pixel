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

    console.log('Attempting to share:', shareData);
    console.log('navigator.share available:', !!navigator.share);

    // Check if we're on a mobile device or have share support
    if (navigator.share && (navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Android') || navigator.userAgent.includes('iPhone'))) {
      try {
        console.log('Using native share API...');
        await navigator.share(shareData);
        console.log('Share successful!');
      } catch (error) {
        console.error('Native share failed:', error);
        // If user cancelled, don't fall back to clipboard
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('User cancelled sharing');
          return;
        }
        // For other errors, fall back to clipboard
        await this.copyToClipboard(`${message}\n\n${invitationLink}`);
      }
    } else {
      console.log('Native share not available, using clipboard fallback');
      // Fallback for browsers that don't support native sharing
      await this.copyToClipboard(`${message}\n\n${invitationLink}`);
    }
  },

  // Fallback: copy to clipboard
  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Invitation copied to clipboard!');
      // Show a more user-friendly notification
      alert('Invitation copied to clipboard! You can now paste it in any app to share with your friend.');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Final fallback: show the text for manual copying
      alert(`Please copy this invitation message and share it with your friend:\n\n${text}`);
    }
  },

  // Store invitation in database for tracking
  async storeInvitation(invitation: ShareInvitationData): Promise<void> {
    console.log('storeInvitation called with:', invitation);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      throw new Error('User not authenticated');
    }
    
    console.log('Authenticated user:', user.id);

    const invitationLink = this.generateInvitationLink(user.id);
    console.log('Generated invitation link:', invitationLink);

    // First, let's test if we can connect to the database
    console.log('Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('invitations')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('Database connection test failed:', testError);
      throw new Error(`Database connection failed: ${testError.message}`);
    }
    
    console.log('Database connection test successful');

    const invitationData = {
      inviter_id: user.id,
      inviter_name: invitation.inviterName,
      inviter_email: invitation.inviterEmail,
      invitee_name: invitation.inviteeName,
      status: 'shared',
      created_at: new Date().toISOString(),
      invitation_link: invitationLink,
      custom_message: invitation.customMessage
    };
    
    console.log('Inserting invitation data:', invitationData);

    const { data, error } = await supabase
      .from('invitations')
      .insert([invitationData])
      .select();

    if (error) {
      console.error('Supabase error storing invitation:', error);
      throw new Error(`Failed to store invitation: ${error.message}`);
    }
    
    console.log('Invitation stored successfully:', data);
  }
};
