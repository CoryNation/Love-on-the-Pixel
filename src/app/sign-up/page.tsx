'use client';

import { useState, Suspense } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Link,
  Alert,
  CircularProgress
} from '@mui/material';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { emailInvitationService } from '@/lib/emailInvitationService';
import { supabase } from '@/lib/supabase';

function SignUpForm() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useAuth();
  
  // Get inviter ID from URL if this is an invitation sign-up
  const inviterId = searchParams.get('inviter');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
  
      const signUpResult = await signUp(email, password);
      
      
      // If this was an invitation sign-up, accept the invitation
      if (inviterId && signUpResult?.user?.id) {
        try {
          // Find the invitation by inviter ID and invitee email
          const { data: invitations } = await supabase
            .from('invitations')
            .select('id')
            .eq('inviter_id', inviterId)
            .eq('invitee_email', email)
            .eq('status', 'pending')
            .limit(1);

          if (invitations && invitations.length > 0) {
            await emailInvitationService.acceptInvitation(invitations[0].id);
            console.log('Invitation accepted successfully during sign-up');
          } else {
            console.log('No pending invitation found for this email and inviter');
          }
          
        } catch (invitationError) {
          console.error('Error accepting invitation:', invitationError);
          // Don't fail the sign-up if invitation acceptance fails
        }
      }
      
      // After successful sign-up, redirect to dashboard
      // Note: In Supabase, users might need to confirm their email first
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Sign up error:', err);
      if (err instanceof Error) {
        setError(`Sign up failed: ${err.message}`);
      } else {
        setError('An unexpected error occurred during sign up');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        <CardContent sx={{ padding: 4 }}>
          {/* App Title and Icon */}
          <Box sx={{ textAlign: 'center', marginBottom: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: 1,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}>
              <Image
                src="/android-chrome-192x192.png"
                alt="Love on the Pixel"
                width={48}
                height={48}
                style={{ borderRadius: '8px' }}
              />
            </Box>
            <Typography 
              variant="h3" 
              sx={{ 
                marginBottom: 1, 
                color: '#2c3e50',
                fontWeight: 300,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              Love on the Pixel
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#7f8c8d',
                fontStyle: 'italic',
                marginBottom: 2
              }}
            >
              Spread love, one pixel at a time 💕
            </Typography>
          </Box>

          <Typography 
            variant="h5" 
            sx={{ 
              textAlign: 'center', 
              marginBottom: 3,
              color: '#2c3e50',
              fontWeight: 300
            }}
          >
            Create Account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSignUp} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                marginTop: 2,
                padding: 1.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                }
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', marginTop: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link 
                href="/sign-in" 
                sx={{ 
                  color: '#667eea',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
                 </CardContent>
       </Card>
     </Box>
   );
 }

export default function SignUp() {
  return (
    <Suspense fallback={
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2
        }}
      >
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    }>
      <SignUpForm />
    </Suspense>
  );
 }
