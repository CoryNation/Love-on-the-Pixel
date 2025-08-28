'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { authService } from '@/lib/auth';
import { newInvitationService } from '@/lib/newInvitationService';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ user: User | null; session: unknown } | void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-accept pending invitations when user logs in
  const autoAcceptPendingInvitations = async () => {
    if (!user) return;
    
    try {
      const pendingInvitations = await newInvitationService.getPendingInvitations();
      
      for (const invitation of pendingInvitations) {
        try {
          console.log('Auto-accepting invitation:', invitation.id);
          await newInvitationService.acceptInvitation(invitation.id);
          console.log('Successfully auto-accepted invitation:', invitation.id);
        } catch (error) {
          console.error('Failed to auto-accept invitation', invitation.id, ':', error);
          // Continue with other invitations even if one fails
        }
      }
    } catch (error) {
      console.error('Error in autoAcceptPendingInvitations:', error);
    }
  };

  useEffect(() => {
    // Get initial user
    authService.getCurrentUser().then(setUser).finally(() => setLoading(false));

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user);
      // Auto-accept pending invitations when user logs in
      if (user) {
        // Delay to ensure user is fully loaded
        setTimeout(() => {
          autoAcceptPendingInvitations().catch(console.error);
        }, 1000);
      }
    });

    return () => subscription.unsubscribe();
  }, [user]);

  const handleSignIn = async (email: string, password: string) => {
    await authService.signIn(email, password);
  };

  const handleSignUp = async (email: string, password: string) => {
    return await authService.signUp(email, password);
  };

  const value = {
    user,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: authService.signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
