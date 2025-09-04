import { messaging, getToken } from './firebase';
import { supabase } from './supabase';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class NotificationService {
  private vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  /**
   * Request notification permission and get FCM token
   */
  async requestPermissionAndGetToken(): Promise<string | null> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return null;
      }

      if (!messaging) {
        console.warn('Firebase messaging not available');
        return null;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return null;
      }

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: this.vapidKey
      });

      if (token) {
        // Store token in Supabase
        await this.storeFCMToken(token);
        return token;
      }

      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Store FCM token in Supabase
   */
  private async storeFCMToken(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          fcm_token: token,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error storing FCM token:', error);
    }
  }

  /**
   * Send notification to a specific user
   */
  async sendNotificationToUser(
    userId: string, 
    payload: NotificationPayload,
    options?: { 
      priority?: 'high' | 'normal';
      ttl?: number;
    }
  ) {
    try {
      // Get user's notification preferences
      const { data: preferences } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!preferences || !preferences.notifications_enabled) {
        return { success: false, reason: 'Notifications disabled' };
      }

      // Check frequency limits
      if (preferences.frequency === 'once_daily') {
        const lastNotification = await this.getLastNotificationTime(userId, payload.tag);
        if (lastNotification && this.isWithin24Hours(lastNotification)) {
          return { success: false, reason: 'Daily limit reached' };
        }
      }

      // Send via Supabase Edge Function (free tier)
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          payload,
          options
        }
      });

      if (error) throw error;

      // Store notification record for frequency limiting
      await this.storeNotificationRecord(userId, payload.tag);

      return { success: true, data };
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendNotificationToUsers(
    userIds: string[], 
    payload: NotificationPayload,
    options?: { 
      priority?: 'high' | 'normal';
      ttl?: number;
    }
  ) {
    const results = await Promise.all(
      userIds.map(userId => this.sendNotificationToUser(userId, payload, options))
    );

    return {
      total: userIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Get last notification time for frequency limiting
   */
  private async getLastNotificationTime(userId: string, tag?: string): Promise<Date | null> {
    try {
      const { data } = await supabase
        .from('notification_logs')
        .select('created_at')
        .eq('user_id', userId)
        .eq('tag', tag || 'default')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return data?.created_at ? new Date(data.created_at) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if timestamp is within 24 hours
   */
  private isWithin24Hours(timestamp: Date): boolean {
    const now = new Date();
    const diffInHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  }

  /**
   * Store notification record for frequency limiting
   */
  private async storeNotificationRecord(userId: string, tag?: string) {
    try {
      await supabase
        .from('notification_logs')
        .insert({
          user_id: userId,
          tag: tag || 'default',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error storing notification record:', error);
    }
  }

  /**
   * Initialize notification service
   */
  async initialize() {
    try {
      // Request permission and get token on app start
      const token = await this.requestPermissionAndGetToken();
      if (token) {
        console.log('FCM token obtained successfully');
      }
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
