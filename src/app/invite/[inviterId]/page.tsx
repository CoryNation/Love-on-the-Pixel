'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Avatar
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { userProfileService, type UserProfile } from '@/lib/userProfile';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviterProfile, setInviterProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (params.inviterId) {
      loadInviterProfile();
    }
  }, [params.inviterId]);

  const loadInviterProfile = async () => {
    try {
      const inviterId = params.inviterId as string;
      
      // Get inviter's profile
      const profile = await userProfileService.getProfileById(inviterId);
      setInviterProfile(profile);
      
    } catch (err) {
      console.error('Error loading inviter profile:', err);
      setError('Unable to load invitation details. The link may be invalid.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinApp = () => {
    // Redirect to sign up page with inviter context
    router.push(`/sign-up?inviter=${params.inviterId}`);
  };

  const handleSignIn = () => {
    // Redirect to sign in page
    router.push('/sign-in');
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2
        }}
      >
        <CircularProgress sx={{ color: 'white' }} />
        <Typography sx={{ color: 'white', marginTop: 2 }}>
          Loading invitation...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400, marginBottom: 2 }}>
          {error}
        </Alert>
        <Button 
          onClick={() => router.push('/')} 
          variant="contained"
          sx={{ color: 'white' }}
        >
          Go Home
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
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
          borderRadius: 4,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        <CardContent sx={{ padding: 4, textAlign: 'center' }}>
          {/* Inviter Profile */}
          <Box sx={{ marginBottom: 3 }}>
            <Avatar
              src={inviterProfile?.photo_url}
              sx={{ 
                width: 80, 
                height: 80,
                margin: '0 auto 16px',
                border: '3px solid rgba(102, 126, 234, 0.3)'
              }}
            >
              {inviterProfile?.full_name?.charAt(0) || <Person />}
            </Avatar>
            <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 600, marginBottom: 1 }}>
              {inviterProfile?.full_name || 'Someone special'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
              has invited you to join Love on the Pixel
            </Typography>
          </Box>

                     {/* Invitation Message */}
           <Typography
             variant="body1"
             sx={{
               color: '#2c3e50',
               lineHeight: 1.6,
               marginBottom: 3,
               fontStyle: 'italic'
             }}
           >
             &ldquo;Join me in spreading love, encouragement, and appreciation through meaningful messages. 
             Let&apos;s create a world filled with positivity and connection! 💕&rdquo;
           </Typography>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleJoinApp}
              sx={{
                backgroundColor: '#667eea',
                color: 'white',
                padding: '12px 24px',
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#5a6fd8'
                }
              }}
            >
              Join Love on the Pixel
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleSignIn}
              sx={{
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#5a6fd8',
                  backgroundColor: 'rgba(102, 126, 234, 0.1)'
                }
              }}
            >
              Already have an account? Sign In
            </Button>
          </Box>

          {/* App Description */}
          <Typography
            variant="body2"
            sx={{
              color: '#7f8c8d',
              marginTop: 3,
              lineHeight: 1.5
            }}
          >
            Love on the Pixel is a beautiful app for sharing words of love, 
            encouragement, and appreciation with the people who matter most in your life.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
