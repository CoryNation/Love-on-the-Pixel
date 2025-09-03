'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { newInvitationService } from '@/lib/newInvitationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  hasPendingInvitations: boolean;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hasPendingInvitations, setHasPendingInvitations] = useState(false);

  const checkPendingInvitations = async () => {
    if (!user?.id) {
      setHasPendingInvitations(false);
      return;
    }

    try {
      const pendingInvitations = await newInvitationService.getPendingInvitations();
      setHasPendingInvitations(pendingInvitations.length > 0);
    } catch (error) {
      console.error('Error checking pending invitations:', error);
      setHasPendingInvitations(false);
    }
  };

  const refreshNotifications = async () => {
    await checkPendingInvitations();
  };

  useEffect(() => {
    checkPendingInvitations();
    
    // Set up an interval to check for new invitations every 30 seconds
    const interval = setInterval(checkPendingInvitations, 30000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <NotificationContext.Provider value={{
      hasPendingInvitations,
      refreshNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
