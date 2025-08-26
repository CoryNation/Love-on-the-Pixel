'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/sign-in');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Fade in={true} timeout={500}>
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
          <CircularProgress sx={{ color: 'white', marginBottom: 2 }} />
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'white', 
              textAlign: 'center',
              fontWeight: 300
            }}
          >
            Loading Love on the Pixel...
          </Typography>
        </Box>
      </Fade>
    );
  }

  return null;
}
