'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/lib/notificationService';

export default function NotificationInitializer() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize notifications when user is authenticated
      initializeNotifications();
    }
  }, [user]);

  const initializeNotifications = async () => {
    try {
      console.log('Initializing push notifications...');
      
      // Initialize the notification service
      await notificationService.initialize();
      
      console.log('Push notifications initialized successfully');
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  };

  // This component doesn't render anything
  return null;
}
